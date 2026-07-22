import { performKeepAlive } from "../../src/lib/database/keepalive.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const intervalEnv = process.env.DATABASE_KEEPALIVE_INTERVAL || "15";
    const result = await performKeepAlive();
    
    return res.status(200).json({
      success: result.success,
      database: result.database,
      timestamp: result.timestamp,
      interval_configured: parseInt(intervalEnv, 10),
      latency_ms: result.latencyMs
    });
  } catch (err: any) {
    console.error("[KeepAlive API] Fatal error:", err);
    return res.status(500).json({
      success: false,
      database: "offline",
      timestamp: new Date().toISOString(),
      error: err.message || String(err)
    });
  }
}
