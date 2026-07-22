import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables for the test context
dotenv.config();

import { checkSupabaseHealth } from "../../api/lib/supabase-health";
import { runKeepAliveCheck, getLocalLogs, getUptimeSeconds } from "../../api/services/keepalive.service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log("=== RUNNING KEEP-ALIVE ENGINE UNIT TESTS ===");

  try {
    // 1. Test health check utility structure
    console.log("1. Testing checkSupabaseHealth...");
    const report = await checkSupabaseHealth();
    
    assert(report !== null, "Report should not be null");
    assert(typeof report.overallStatus === "string", "overallStatus should be a string");
    assert(typeof report.overallLatencyMs === "number", "overallLatencyMs should be a number");
    assert(report.database !== undefined, "Report should contain database health status");
    assert(report.api !== undefined, "Report should contain api health status");
    assert(report.auth !== undefined, "Report should contain auth health status");
    assert(report.storage !== undefined, "Report should contain storage health status");
    assert(report.realtime !== undefined, "Report should contain realtime health status");
    assert(report.rpc !== undefined, "Report should contain rpc health status");

    // 2. Test runKeepAliveCheck wrapper and retry caching
    console.log("2. Testing runKeepAliveCheck & caching...");
    const initialLogsCount = getLocalLogs().length;
    const runReport = await runKeepAliveCheck();

    assert(runReport.timestamp !== undefined, "Run report should have a timestamp");
    const updatedLogs = getLocalLogs();
    assert(updatedLogs.length === initialLogsCount + 1, "Local logs cache should increase by 1");
    assert(updatedLogs[0].status === runReport.overallStatus, "Cached status should match report status");
    assert(updatedLogs[0].latency_ms === runReport.overallLatencyMs, "Cached latency should match report latency");

    // 3. Test uptime and config values
    console.log("3. Testing Uptime...");
    const uptime = getUptimeSeconds();
    assert(typeof uptime === "number" && uptime >= 0, "Uptime should be a valid non-negative number");

    console.log("\n=== ALL KEEP-ALIVE UNIT TESTS PASSED SUCCESSFULLY! ===");
  } catch (err: any) {
    console.error("\nTEST SUITE FAILED:", err.message || err);
    process.exit(1);
  }
}

runTests();
