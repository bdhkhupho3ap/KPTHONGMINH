import { checkSupabaseHealth, SystemHealthReport } from "../lib/supabase-health.js";
import { supabase } from "../../src/supabaseClient.js";

export interface HealthLogRecord {
  id?: string;
  timestamp: string;
  latency_ms: number;
  status: string;
  services: any;
  error_message?: string | null;
}

// In-memory logs cache for offline/fallback query access
const localLogsCache: HealthLogRecord[] = [];
const MAX_LOCAL_LOGS = 100;

// Config state
const KEEPALIVE_ENABLED = typeof process !== "undefined" ? process.env.KEEPALIVE_ENABLED !== "false" : true;
const KEEPALIVE_RETRY = typeof process !== "undefined" ? parseInt(process.env.KEEPALIVE_RETRY || "3") : 3;
const KEEPALIVE_TIMEOUT = typeof process !== "undefined" ? parseInt(process.env.KEEPALIVE_TIMEOUT || "5000") : 5000;
const KEEPALIVE_LOG = typeof process !== "undefined" ? process.env.KEEPALIVE_LOG !== "false" : true;

let isPinging = false;
let lastPingTime: string | null = null;
let uptimeStart = Date.now();

export function getLocalLogs(): HealthLogRecord[] {
  return [...localLogsCache];
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - uptimeStart) / 1000);
}

export function getLastPingTime(): string | null {
  return lastPingTime;
}

/**
 * Perform a single health check run with retry logic.
 */
export async function runKeepAliveCheck(): Promise<SystemHealthReport> {
  if (isPinging) {
    throw new Error("Another KeepAlive ping is currently in progress");
  }

  isPinging = true;
  lastPingTime = new Date().toISOString();
  
  let attempt = 0;
  let report: SystemHealthReport | null = null;

  while (attempt < KEEPALIVE_RETRY) {
    attempt++;
    try {
      console.log(`[KeepAlive] Health check attempt ${attempt}/${KEEPALIVE_RETRY}...`);
      
      // Perform health check
      report = await checkSupabaseHealth();
      
      if (report.overallStatus === "online") {
        break; // Success!
      } else {
        console.warn(`[KeepAlive] Health check warning/critical at attempt ${attempt}: Overall status is ${report.overallStatus}`);
      }
    } catch (err: any) {
      console.error(`[KeepAlive] Error during check at attempt ${attempt}:`, err);
    }

    // Wait 2 seconds before retry
    if (attempt < KEEPALIVE_RETRY) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // If all attempts failed or returned warning/critical
  if (!report) {
    report = {
      overallStatus: "offline",
      timestamp: new Date().toISOString(),
      database: { status: "offline", message: "Failed to connect after retries" },
      api: { status: "offline" },
      auth: { status: "offline" },
      storage: { status: "offline" },
      realtime: { status: "offline" },
      rpc: { status: "offline" },
      overallLatencyMs: 0
    };
  }

  isPinging = false;

  // Process logging and notification
  await handleHealthReport(report);

  return report;
}

/**
 * Handle report logs and admin alerts
 */
async function handleHealthReport(report: SystemHealthReport) {
  const logRecord: HealthLogRecord = {
    timestamp: report.timestamp,
    latency_ms: report.overallLatencyMs,
    status: report.overallStatus,
    services: report,
    error_message: report.database.message || report.api.message || null
  };

  // 1. Log to local in-memory array (always works, even if Supabase is offline)
  localLogsCache.unshift(logRecord);
  if (localLogsCache.length > MAX_LOCAL_LOGS) {
    localLogsCache.pop();
  }

  // 2. Output to server console
  if (KEEPALIVE_LOG) {
    const timeStr = new Date(report.timestamp).toLocaleString();
    console.log(`[KeepAlive] [${timeStr}] Status: ${report.overallStatus.toUpperCase()} | Latency: ${report.overallLatencyMs}ms`);
  }

  // 3. Try to save log to Supabase system_health_logs table
  if (report.overallStatus !== "offline") {
    try {
      const { error } = await supabase.from("system_health_logs").insert({
        latency_ms: report.overallLatencyMs,
        status: report.overallStatus,
        services: report,
        error_message: logRecord.error_message
      });

      if (error) {
        console.warn("[KeepAlive] Could not insert log into CSDL table (possible schema/policy issue):", error.message);
      }
    } catch (dbErr) {
      // Offline/connection error - silent catch as we already have local logs
    }
  }

  // 4. Admin notifications if status is critical or offline
  if (report.overallStatus === "critical" || report.overallStatus === "offline") {
    triggerAdminAlert(report);
  }

  // 5. Run automatic db logs cleanup occasionally
  if (Math.random() < 0.1 && report.overallStatus === "online") {
    runLogsCleanup();
  }
}

/**
 * Alert Admin of critical connection state
 */
function triggerAdminAlert(report: SystemHealthReport) {
  const alertMsg = `[ADMIN_ALERT] [CRITICAL_SYSTEM_HEALTH] Supabase services are unresponsive!
- Overall Status: ${report.overallStatus.toUpperCase()}
- DB Message: ${report.database.message || "N/A"}
- API Message: ${report.api.message || "N/A"}
- Timestamp: ${report.timestamp}
Please inspect the Supabase project dashboard immediately!`;

  console.error(alertMsg);
}

/**
 * Clean up old database health logs (retention of 7 days)
 */
async function runLogsCleanup() {
  try {
    const { data, error } = await supabase.rpc("clean_old_health_logs", { retention_days: 7 });
    if (error) {
      console.warn("[KeepAlive] Old logs cleanup RPC error:", error.message);
    } else {
      console.log(`[KeepAlive] Cleaned up database logs. Rows removed: ${data}`);
    }
  } catch (err) {
    // Ignore db write failure during cleanup
  }
}
