import { supabase, isSupabaseConfigured } from "../../src/supabaseClient.js";

export interface ServiceHealth {
  status: "online" | "warning" | "offline";
  latencyMs?: number;
  message?: string;
}

export interface SystemHealthReport {
  overallStatus: "online" | "warning" | "critical" | "offline";
  timestamp: string;
  database: ServiceHealth;
  api: ServiceHealth;
  auth: ServiceHealth;
  storage: ServiceHealth;
  realtime: ServiceHealth;
  rpc: ServiceHealth;
  overallLatencyMs: number;
}

// Custom fetch implementation with timeout support
const fetchPing = async (url: string, timeoutMs = 5000): Promise<{ ok: boolean; latency: number; status: number }> => {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(id);
    return {
      // 401/404/403/400 are responsive API endpoints, which means the server is up
      ok: res.ok || res.status === 401 || res.status === 404 || res.status === 400 || res.status === 403,
      latency: Date.now() - start,
      status: res.status
    };
  } catch (err) {
    clearTimeout(id);
    return { ok: false, latency: Date.now() - start, status: 0 };
  }
};

export async function checkSupabaseHealth(): Promise<SystemHealthReport> {
  const report: SystemHealthReport = {
    overallStatus: "online",
    timestamp: new Date().toISOString(),
    database: { status: "offline" },
    api: { status: "offline" },
    auth: { status: "offline" },
    storage: { status: "offline" },
    realtime: { status: "offline" },
    rpc: { status: "offline" },
    overallLatencyMs: 0
  };

  if (!isSupabaseConfigured) {
    const msg = "Supabase environment variables not configured";
    report.overallStatus = "offline";
    report.database = { status: "offline", message: msg };
    report.api = { status: "offline", message: msg };
    report.auth = { status: "offline", message: msg };
    report.storage = { status: "offline", message: msg };
    report.realtime = { status: "offline", message: msg };
    report.rpc = { status: "offline", message: msg };
    return report;
  }

  // Retrieve project URL from client instance property
  const projectUrl = (supabase as any).supabaseUrl || "";

  const startTotal = Date.now();

  // 1. Check Database connection via direct query
  const startDb = Date.now();
  try {
    const { error } = await supabase.from("Household").select("id").limit(1);
    const lat = Date.now() - startDb;
    if (error) {
      report.database = { status: "warning", latencyMs: lat, message: error.message };
    } else {
      report.database = { status: "online", latencyMs: lat };
    }
  } catch (e: any) {
    report.database = { status: "offline", message: e.message || String(e) };
  }

  // 2. Check RPC
  const startRpc = Date.now();
  try {
    const { error } = await supabase.rpc("ping_db");
    const lat = Date.now() - startRpc;
    if (error) {
      report.rpc = { status: "warning", latencyMs: lat, message: `RPC ping_db failed or missing: ${error.message}` };
    } else {
      report.rpc = { status: "online", latencyMs: lat };
    }
  } catch (e: any) {
    report.rpc = { status: "warning", message: e.message || String(e) };
  }

  // 3. Check REST API status
  if (projectUrl) {
    const apiResult = await fetchPing(`${projectUrl}/rest/v1/`, 5000);
    report.api = apiResult.ok 
      ? { status: "online", latencyMs: apiResult.latency }
      : { status: "offline", message: `HTTP status ${apiResult.status}` };
  } else {
    report.api = { status: "offline", message: "Supabase URL is empty" };
  }

  // 4. Check Auth status
  if (projectUrl) {
    const authResult = await fetchPing(`${projectUrl}/auth/v1/health`, 5000);
    report.auth = authResult.ok
      ? { status: "online", latencyMs: authResult.latency }
      : { status: "offline", message: `HTTP health check failed with status ${authResult.status}` };
  } else {
    report.auth = { status: "offline", message: "Supabase URL is empty" };
  }

  // 5. Check Storage status
  const startStorage = Date.now();
  try {
    const { error } = await supabase.storage.listBuckets();
    const lat = Date.now() - startStorage;
    if (error) {
      report.storage = { status: "warning", latencyMs: lat, message: error.message };
    } else {
      report.storage = { status: "online", latencyMs: lat };
    }
  } catch (e: any) {
    report.storage = { status: "offline", message: e.message || String(e) };
  }

  // 6. Check Realtime status (simulate or verify channel subscription)
  const startRealtime = Date.now();
  try {
    const channel = supabase.channel("health-check-channel");
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        reject(new Error("Websocket subscription timeout"));
      }, 3000);

      channel.subscribe((status) => {
        clearTimeout(timeout);
        channel.unsubscribe();
        if (status === "SUBSCRIBED") {
          resolve();
        } else {
          reject(new Error(`Subscription status: ${status}`));
        }
      });
    });
    report.realtime = { status: "online", latencyMs: Date.now() - startRealtime };
  } catch (e: any) {
    report.realtime = { status: "warning", message: e.message || String(e) };
  }

  // Calculate overall metrics
  const totalDuration = Date.now() - startTotal;
  report.overallLatencyMs = totalDuration;

  // Decide overall status
  const statuses = [
    report.database.status,
    report.api.status,
    report.auth.status,
    report.storage.status,
    report.realtime.status,
    report.rpc.status
  ];

  if (statuses.every(s => s === "online")) {
    report.overallStatus = "online";
  } else if (report.database.status === "offline" || report.api.status === "offline") {
    report.overallStatus = "critical";
  } else {
    report.overallStatus = "warning";
  }

  return report;
}
