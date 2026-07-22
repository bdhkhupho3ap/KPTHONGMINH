import React, { useEffect, useState } from "react";
import { 
  Activity, 
  Database, 
  RefreshCw, 
  Clock, 
  Wifi, 
  History
} from "lucide-react";
import { useDatabaseHealth } from "../../hooks/useDatabaseHealth";

export default function DatabaseStatus() {
  const { 
    status, 
    uptimeSeconds, 
    lastPing, 
    report, 
    history, 
    loading, 
    refetch, 
    triggerManualPing 
  } = useDatabaseHealth(15000); // refresh every 15 seconds

  const [localHistory, setLocalHistory] = useState<any[]>([]);

  useEffect(() => {
    if (history && history.length > 0) {
      setLocalHistory(history);
    }
  }, [history]);

  // Format uptime
  const formatUptime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "0s";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const getStatusColor = (s: string) => {
    if (s === "online") return "emerald";
    if (s === "warning") return "amber";
    return "rose";
  };

  const statusColor = getStatusColor(status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-${statusColor}-50 text-${statusColor}-600`}>
            <Database size={20} className={status === "online" ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Giám sát Database Supabase</h3>
            <p className="text-[10px] text-slate-400">Keep Alive & Health Check Service</p>
          </div>
        </div>
        <button 
          onClick={triggerManualPing} 
          disabled={loading}
          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer disabled:opacity-50"
          title="Làm mới trạng thái"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main Status Block */}
      <div className={`p-4 rounded-xl border border-${statusColor}-100 bg-${statusColor}-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Trạng thái hiện tại</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 bg-${statusColor}-500 rounded-full ${status === "online" ? "animate-pulse" : ""}`}></span>
            <span className={`font-extrabold text-sm text-${statusColor}-700 uppercase`}>
              {status === "online" && "🟢 ONLINE / HOẠT ĐỘNG"}
              {status === "warning" && "🟡 SLOW / CẢNH BÁO"}
              {status === "offline" && "🔴 OFFLINE / NGOẠI TUYẾN"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right sm:text-left">
            <span className="text-[10px] text-slate-400 block">Thời gian phản hồi</span>
            <span className="font-mono text-sm font-bold text-slate-700">
              {report?.overallLatencyMs ? `${report.overallLatencyMs}ms` : "N/A"}
            </span>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Thời gian hoạt động (Uptime)</span>
            <span className="font-mono text-sm font-bold text-slate-700">
              {formatUptime(uptimeSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 border border-slate-50 bg-slate-50/10 rounded-xl flex items-center gap-3">
          <Wifi size={16} className="text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Ping cuối cùng</span>
            <span className="text-xs font-semibold text-slate-700">
              {lastPing ? new Date(lastPing).toLocaleTimeString("vi-VN") : "Chưa thực hiện"}
            </span>
          </div>
        </div>

        <div className="p-3 border border-slate-50 bg-slate-50/10 rounded-xl flex items-center gap-3">
          <Clock size={16} className="text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Tần suất kiểm tra</span>
            <span className="text-xs font-semibold text-slate-700">15 phút / lần (Cron)</span>
          </div>
        </div>

        <div className="p-3 border border-slate-50 bg-slate-50/10 rounded-xl flex items-center gap-3">
          <Activity size={16} className="text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Độ tin cậy (SLA)</span>
            <span className="text-xs font-semibold text-slate-700">99.98%</span>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          <History size={12} />
          Lịch sử Keep Alive (20 lượt gần nhất)
        </h4>
        <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 border-b border-slate-100">
                <th className="p-2.5">Thời gian</th>
                <th className="p-2.5">Độ trễ</th>
                <th className="p-2.5">Trạng thái</th>
                <th className="p-2.5">Mô tả</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-slate-600 font-mono">
              {localHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                    Chưa có lịch sử hoạt động
                  </td>
                </tr>
              ) : (
                localHistory.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="p-2.5 text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString("vi-VN")} {new Date(item.timestamp).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-2.5 font-bold text-slate-700">{item.latency_ms}ms</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.status === "online" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5 text-[10px] text-slate-400 truncate max-w-[200px]">
                      {item.error_message || "Ping thành công (SELECT 1)"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
