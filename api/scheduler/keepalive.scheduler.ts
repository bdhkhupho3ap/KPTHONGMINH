import { runKeepAliveCheck } from "../services/keepalive.service.js";

let schedulerIntervalId: any = null;

/**
 * Initializes and starts the KeepAlive background task.
 */
export function startKeepAliveScheduler() {
  const KEEPALIVE_ENABLED = typeof process !== "undefined" ? process.env.KEEPALIVE_ENABLED !== "false" : true;
  const intervalMinutes = typeof process !== "undefined" ? parseInt(process.env.KEEPALIVE_INTERVAL_MINUTES || "10") : 10;

  if (!KEEPALIVE_ENABLED) {
    console.log("[KeepAlive Scheduler] Disabled (KEEPALIVE_ENABLED is false).");
    return;
  }

  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
  }

  console.log(`[KeepAlive Scheduler] Starting... Interval configured to run every ${intervalMinutes} minutes.`);

  // Run immediately on startup
  runKeepAliveCheck().catch((err) => {
    console.error("[KeepAlive Scheduler] Initial health check failed:", err.message || err);
  });

  // Start periodic timer
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerIntervalId = setInterval(() => {
    runKeepAliveCheck().catch((err) => {
      console.error("[KeepAlive Scheduler] Periodic health check failed:", err.message || err);
    });
  }, intervalMs);
}

/**
 * Stops the KeepAlive background task scheduler.
 */
export function stopKeepAliveScheduler() {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    console.log("[KeepAlive Scheduler] Stopped.");
  }
}
