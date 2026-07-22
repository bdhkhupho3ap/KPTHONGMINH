import React from "react";
import { 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Server, 
  Clock, 
  Network,
  Terminal,
  FileText
} from "lucide-react";
import { useDatabaseHealth } from "../hooks/useDatabaseHealth";
import DatabaseStatus from "./dashboard/database-status";

export default function SystemHealthDashboard() {
  const { 
    status, 
    uptimeSeconds, 
    lastPing, 
    report, 
    history, 
    loading, 
    error, 
    refetch, 
    triggerManualPing 
  } = useDatabaseHealth(15000); // Poll every 15s

  // Format uptime to human-readable string
  const formatUptime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "0s";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs} giờ`);
    if (mins > 0) parts.push(`${mins} phút`);
    parts.push(`${secs} giây`);
    return parts.join(" ");
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "online":
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            HOẠT ĐỘNG
          </span>
        );
      case "warning":
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            CẢNH BÁO
          </span>
        );
      case "critical":
      case "offline":
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
            NGOẠI TUYẾN
          </span>
        );
    }
  };

  const getStatusColor = (s: string) => {
    if (s === "online") return "border-emerald-500 bg-emerald-50/20";
    if (s === "warning") return "border-amber-500 bg-amber-50/20";
    return "border-rose-500 bg-rose-50/20";
  };

  const getStatusTextClass = (s: string) => {
    if (s === "online") return "text-emerald-600";
    if (s === "warning") return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-600">
      {/* Header Banner */}
      <div className={`p-6 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs ${getStatusColor(status)}`}>
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trạng thái hạ tầng</span>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 leading-none">
              {status === "online" && "Hệ thống hoạt động bình thường"}
              {status === "warning" && "Phát hiện cảnh báo hệ thống"}
              {(status === "critical" || status === "offline") && "Hệ thống mất kết nối CSDL"}
            </h2>
            {getStatusBadge(status)}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
            KeepAlive engine đang giám sát liên tục kết nối Supabase Database, API Gateway, Realtime Websocket, Auth, RPC, và Storage Bucket.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Làm mới trạng thái hiển thị"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={triggerManualPing}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Activity size={14} className={loading ? "animate-ping" : ""} />
            Kiểm tra ngay (Ping DB)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Lỗi đồng bộ giám sát:</span> {error}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Thời gian hoạt động (Uptime)</span>
            <p className="font-extrabold text-slate-800 text-sm truncate">{formatUptime(uptimeSeconds)}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Độ trễ trung bình (Avg Latency)</span>
            <p className="font-extrabold text-slate-800 text-sm">{report ? `${report.overallLatencyMs} ms` : "N/A"}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Server size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Lần Ping cuối cùng</span>
            <p className="font-extrabold text-slate-800 text-[11px] truncate">
              {lastPing ? new Date(lastPing).toLocaleTimeString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Cpu size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Môi trường thực thi</span>
            <p className="font-extrabold text-slate-800 text-sm uppercase">
              {typeof window !== "undefined" && (window as any).location?.hostname?.includes("localhost") ? "Localhost" : "Vercel / Cloud"}
            </p>
          </div>
        </div>
      </div>

      {/* Keep Alive Status Monitor Widget */}
      <DatabaseStatus />

      {/* Services Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Server size={14} className="text-slate-400" /> Trạng thái chi tiết dịch vụ Supabase
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-indigo-500" />
                <span className="font-bold text-slate-800 text-xs">CSDL Hộ Tịch (Database)</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.database.status || "offline")}`}>
                {report?.database.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ truy vấn:</span>
                <span className="font-semibold text-slate-700">{report?.database.latencyMs ? `${report.database.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.database.message && (
                <div className="text-[10px] text-rose-500 bg-rose-50 p-1.5 rounded border border-rose-100/50 mt-1 break-words font-mono">
                  {report.database.message}
                </div>
              )}
            </div>
          </div>

          {/* RPC Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-purple-500" />
                <span className="font-bold text-slate-800 text-xs">Bộ điều hướng (RPC ping_db)</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.rpc.status || "offline")}`}>
                {report?.rpc.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ RPC:</span>
                <span className="font-semibold text-slate-700">{report?.rpc.latencyMs ? `${report.rpc.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.rpc.message && (
                <div className="text-[10px] text-amber-500 bg-amber-50 p-1.5 rounded border border-amber-100/50 mt-1 break-words font-mono">
                  {report.rpc.message}
                </div>
              )}
            </div>
          </div>

          {/* API Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-emerald-500" />
                <span className="font-bold text-slate-800 text-xs">REST API Gateway</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.api.status || "offline")}`}>
                {report?.api.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ HTTP Gateway:</span>
                <span className="font-semibold text-slate-700">{report?.api.latencyMs ? `${report.api.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.api.message && (
                <div className="text-[10px] text-rose-500 bg-rose-50 p-1.5 rounded border border-rose-100/50 mt-1 break-words font-mono">
                  {report.api.message}
                </div>
              )}
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-500" />
                <span className="font-bold text-slate-800 text-xs">Xác thực hệ thống (Auth)</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.auth.status || "offline")}`}>
                {report?.auth.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ xác thực:</span>
                <span className="font-semibold text-slate-700">{report?.auth.latencyMs ? `${report.auth.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.auth.message && (
                <div className="text-[10px] text-rose-500 bg-rose-50 p-1.5 rounded border border-rose-100/50 mt-1 break-words font-mono">
                  {report.auth.message}
                </div>
              )}
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-orange-500" />
                <span className="font-bold text-slate-800 text-xs">Kho tệp đính kèm (Storage)</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.storage.status || "offline")}`}>
                {report?.storage.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ kho tệp:</span>
                <span className="font-semibold text-slate-700">{report?.storage.latencyMs ? `${report.storage.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.storage.message && (
                <div className="text-[10px] text-rose-500 bg-rose-50 p-1.5 rounded border border-rose-100/50 mt-1 break-words font-mono">
                  {report.storage.message}
                </div>
              )}
            </div>
          </div>

          {/* Realtime Card */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-rose-500" />
                <span className="font-bold text-slate-800 text-xs">Luồng đồng bộ Realtime</span>
              </div>
              <span className={`font-bold text-[9px] uppercase ${getStatusTextClass(report?.realtime.status || "offline")}`}>
                {report?.realtime.status || "offline"}
              </span>
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Độ trễ Websocket:</span>
                <span className="font-semibold text-slate-700">{report?.realtime.latencyMs ? `${report.realtime.latencyMs}ms` : "N/A"}</span>
              </div>
              {report?.realtime.message && (
                <div className="text-[10px] text-amber-500 bg-amber-50 p-1.5 rounded border border-amber-100/50 mt-1 break-words font-mono">
                  {report.realtime.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Ping History Logs */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <FileText size={14} className="text-slate-400" /> Nhật ký hoạt động gần nhất (Ping History Logs)
        </h3>

        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px]">
                  <th className="py-2.5 px-4">THỜI GIAN</th>
                  <th className="py-2.5 px-4">ĐỘ TRỄ (LATENCY)</th>
                  <th className="py-2.5 px-4">TRẠNG THÁI CHUNG</th>
                  <th className="py-2.5 px-4">CHI TIẾT LỖI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      Chưa ghi nhận dữ liệu nhật ký KeepAlive nào.
                    </td>
                  </tr>
                ) : (
                  history.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {log.latency_ms} ms
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${
                          log.status === "online" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : log.status === "warning"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] font-mono text-slate-500 truncate max-w-xs" title={log.error_message || ""}>
                        {log.error_message || <span className="text-slate-300 italic">None</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
