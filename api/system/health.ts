import { getLocalLogs, getUptimeSeconds, getLastPingTime } from "../services/keepalive.service.js";
import { checkSupabaseHealth } from "../lib/supabase-health.js";
import { supabase } from "../../src/supabaseClient.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const liveStatus = await checkSupabaseHealth();
    
    // Attempt to fetch latest logs from DB
    let history: any[] = [];
    try {
      const { data, error } = await supabase
        .from("system_health_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);
      
      if (!error && data) {
        history = data.map(r => ({
          timestamp: r.timestamp,
          latency_ms: r.latency_ms,
          status: r.status,
          services: r.services,
          error_message: r.error_message
        }));
      } else {
        history = getLocalLogs();
      }
    } catch (e) {
      history = getLocalLogs();
    }

    res.status(200).json({
      status: liveStatus.overallStatus,
      uptimeSeconds: getUptimeSeconds(),
      lastPing: getLastPingTime() || liveStatus.timestamp,
      report: liveStatus,
      history
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
