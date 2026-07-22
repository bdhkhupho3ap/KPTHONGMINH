import { runKeepAliveCheck } from "../services/keepalive.service.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const report = await runKeepAliveCheck();
    res.status(200).json({
      success: report.overallStatus !== "offline",
      report
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
}
