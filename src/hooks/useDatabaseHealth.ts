import { useState, useEffect } from "react";
import { SystemHealthReport } from "../../api/lib/supabase-health";

export interface SystemHealthData {
  status: "online" | "warning" | "critical" | "offline";
  uptimeSeconds: number;
  lastPing: string | null;
  report: SystemHealthReport | null;
  history: any[];
}

/**
 * React hook to poll and fetch database and services health statuses from server.
 */
export function useDatabaseHealth(refreshIntervalMs = 15000) {
  const [healthData, setHealthData] = useState<SystemHealthData>({
    status: "offline",
    uptimeSeconds: 0,
    lastPing: null,
    report: null,
    history: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      // Ping keepalive API endpoint to trigger database activity on client access
      fetch("/api/system/keepalive").catch(() => {});

      const res = await fetch("/api/system/health");
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
      setError(null);
    } catch (err: any) {
      console.error("[useDatabaseHealth] Failed to fetch system health status:", err);
      setError(err.message || String(err));
      // Mark system status as offline if API server is unresponsive
      setHealthData((prev) => ({
        ...prev,
        status: "offline"
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  const triggerManualPing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/ping", { method: "POST" });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      await fetchHealth();
    } catch (err: any) {
      console.error("[useDatabaseHealth] Failed to trigger manual health check ping:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    ...healthData,
    loading,
    error,
    refetch: fetchHealth,
    triggerManualPing
  };
}
