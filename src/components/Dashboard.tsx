import React from "react";
import { 
  Users, 
  Home, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  PlusCircle, 
  ShieldAlert, 
  Activity,
  ArrowUpRight,
  Bell,
  Clock,
  User,
  Heart,
  Bot,
  Map,
  Coins
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Resident, Household, Business, FieldReport, PartyMember, WelfareRecipient, CommunityEvent, FundContribution } from "../types";

interface DashboardProps {
  residents: Resident[];
  households: Household[];
  businesses: Business[];
  reports: FieldReport[];
  partyMembers: PartyMember[];
  welfareRecipients: WelfareRecipient[];
  communityEvents: CommunityEvent[];
  fundContributions: FundContribution[];
  setActiveTab: (tab: any) => void;
  currentUser?: {
    username: string;
    fullName: string;
    role: "canbo" | "nguoidan";
    cccd?: string;
    householdCode?: string;
    phone?: string;
  } | null;
}

export default function Dashboard({ 
  residents, 
  households, 
  businesses, 
  reports, 
  partyMembers,
  welfareRecipients,
  communityEvents,
  fundContributions,
  setActiveTab,
  currentUser 
}: DashboardProps) {
  // Compute Stats
  const totalResidentsCount = residents.length;
  const totalHouseholdsCount = households.length;
  const totalBusinessesCount = businesses.length;
  const pendingReportsCount = reports.filter(r => r.status !== "Đã giải quyết").length;

  const maleCount = residents.filter(r => r.gender === "Nam").length;
  const femaleCount = residents.filter(r => r.gender === "Nữ").length;
  const malePercent = residents.length > 0 ? ((maleCount / residents.length) * 100).toFixed(1) : "0";
  const femalePercent = residents.length > 0 ? ((femaleCount / residents.length) * 100).toFixed(1) : "0";

  // New subsystems stats
  const totalPartyMembers = partyMembers.length;
  const activePartyMembers = partyMembers.filter(m => m.status === "Đang sinh hoạt").length;
  
  const totalWelfare = welfareRecipients.length;
  const activeWelfare = welfareRecipients.filter(w => w.status === "Đang nhận trợ cấp").length;

  const upcomingEventsCount = communityEvents.filter(e => e.status === "Sắp diễn ra" || e.status === "Đang diễn ra").length;

  const totalFundsCollected = fundContributions
    .filter(c => c.status === "Đã nộp")
    .reduce((sum, c) => sum + c.amount, 0);
  const formattedFunds = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalFundsCollected);

  // Filter household members if resident
  const familyMembers = currentUser?.role === "nguoidan" && currentUser.householdCode
    ? residents.filter(r => r.householdId === currentUser.householdCode)
    : [];

  const myReports = currentUser?.role === "nguoidan"
    ? reports.filter(r => r.reporterName === currentUser.fullName || r.reporterPhone === currentUser.phone)
    : [];

  const myFunds = currentUser?.role === "nguoidan" && currentUser.householdCode
    ? fundContributions.filter(c => c.householdCode === currentUser.householdCode)
    : [];

  const upcomingEvents = communityEvents.filter(e => e.status === "Sắp diễn ra" || e.status === "Đang diễn ra");

  // Demographics chart data (Residency status)
  const statusCounts = residents.reduce((acc, resident) => {
    acc[resident.status] = (acc[resident.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const residencyChartData = [
    { name: "Thường trú", Số_lượng: statusCounts["Thường trú"] || 0, color: "#10b981" },
    { name: "Tạm trú", Số_lượng: statusCounts["Tạm trú"] || 0, color: "#f59e0b" },
    { name: "Tạm vắng", Số_lượng: statusCounts["Tạm vắng"] || 0, color: "#64748b" }
  ];

  // Business type chart data
  const businessTypeCounts = businesses.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const businessChartData = Object.entries(businessTypeCounts).map(([name, value]) => ({
    name,
    "Cơ sở": value
  }));

  // Report Categories distribution
  const reportCategoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"];
  const reportPieData = Object.keys(reportCategoryCounts).length > 0 
    ? Object.entries(reportCategoryCounts).map(([name, value]) => ({ name, value }))
    : [{ name: "Chưa có phản ánh", value: 0 }];

  // Fund contribution by Fund Name
  const fundGroupCounts = fundContributions.reduce((acc, c) => {
    if (c.status === "Đã nộp") {
      acc[c.fundName] = (acc[c.fundName] || 0) + c.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const fundChartData = Object.entries(fundGroupCounts).map(([name, value]) => ({
    name,
    "Số tiền thu (VNĐ)": value
  }));

  const handleAdminCardClick = (targetTab: string) => {
    setActiveTab(targetTab);
  };

  if (currentUser?.role === "nguoidan") {
    return (
      <div id="dashboard-view" className="space-y-6">
        {/* Resident Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-800 to-slate-900 p-6 rounded-2xl text-white shadow-md">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cổng Cư Dân Khu Phố 3</h1>
            <p className="text-slate-300 text-xs mt-1">Xin chào cư dân, chúc bạn một ngày tốt lành!</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl text-xs font-mono font-medium backdrop-blur-sm">
            <Clock size={15} className="text-emerald-400" />
            <span>Hôm nay: {new Date().toLocaleDateString("vi-VN")}</span>
          </div>
        </div>

        {/* Personalized Welcome Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-lg">
                M
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{currentUser.fullName}</h3>
                <p className="text-xs text-slate-400">CCCD: {currentUser.cccd} | SĐT: {currentUser.phone}</p>
                <span className="inline-block mt-1.5 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Cư dân Đã xác minh
                </span>
              </div>
            </div>

            {/* Quick action buttons for residents */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tiện ích cư dân nhanh</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab("reports")}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
                >
                  <MessageSquare size={18} className="text-emerald-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Gửi phản ánh</span>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
                >
                  <Bot size={18} className="text-indigo-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Hỏi Trợ lý AI</span>
                </button>
                <button
                  onClick={() => setActiveTab("finance")}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
                >
                  <Coins size={18} className="text-amber-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Đóng góp Quỹ</span>
                </button>
                <button
                  onClick={() => setActiveTab("gis")}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
                >
                  <Map size={18} className="text-teal-600 mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-700">Xem Bản đồ GIS</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">SỔ HỘ KHẨU ĐIỆN TỬ</span>
              <h4 className="text-2xl font-black font-mono tracking-wider">{currentUser.householdCode}</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed">Sổ hộ khẩu số của bạn đã được số hóa trên nền tảng Cơ sở dữ liệu Quốc gia dân cư Khu phố 3.</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Thành viên gia đình:</span>
              <span className="font-extrabold text-white text-sm">{familyMembers.length} thành viên</span>
            </div>
          </div>
        </div>

        {/* Digital Household Book Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Nhân khẩu thuộc hộ khẩu của tôi</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Danh sách các thành viên đăng ký thường trú/tạm trú chung hộ khẩu</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {currentUser.householdCode}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px] bg-slate-50/20">
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Quan hệ với chủ hộ</th>
                  <th className="py-3 px-4">Ngày sinh</th>
                  <th className="py-3 px-4">Số CCCD</th>
                  <th className="py-3 px-4">Nghề nghiệp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {familyMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{member.fullName}</td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{member.relationToOwner}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{member.birthDate}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{member.cccd}</td>
                    <td className="py-3 px-4 text-slate-600">{member.occupation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resident reflections */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Lịch sử phản ánh của tôi</span>
            <button
              onClick={() => setActiveTab("reports")}
              className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              Gửi phản ánh mới +
            </button>
          </div>

          {myReports.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs space-y-2">
              <p>Bạn chưa gửi phản ánh hiện trường nào.</p>
              <p className="text-[10px] text-slate-300">Phản ánh về rác thải, ngập nước, lấn chiếm hẻm sẽ được Cán bộ xử lý trong vòng 24h.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((r) => (
                <div key={r.id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/40 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{r.category}</span>
                    <h5 className="font-bold text-slate-800 text-xs mt-1.5">{r.title}</h5>
                    <p className="text-[11px] text-slate-500 leading-tight">{r.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Ngày gửi: {r.reportedAt}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0
                    ${r.status === "Đã giải quyết" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : r.status === "Đang xử lý" 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-slate-100 text-slate-700"
                    }
                  `}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two column layout for Funds & Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Funds */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Đóng góp Quỹ hộ gia đình ({currentUser.householdCode})</span>
              <button
                onClick={() => setActiveTab("finance")}
                className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
              >
                Chi tiết đóng góp
              </button>
            </div>
            {myFunds.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có dữ liệu đóng góp quỹ cho hộ gia đình này.
              </div>
            ) : (
              <div className="space-y-3">
                {myFunds.map((f) => (
                  <div key={f.id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/40 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 text-xs">{f.fundName}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Số tiền: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(f.amount)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      f.status === "Đã nộp" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Events */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">Sự kiện & Tin tức Khu phố</span>
              <button
                onClick={() => setActiveTab("cultural")}
                className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Hiện chưa có sự kiện nào sắp diễn ra.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((e) => (
                  <div key={e.id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/40 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-xs line-clamp-1">{e.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        e.status === "Đang diễn ra" ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-blue-100 text-blue-800"
                      }`}>
                        {e.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Thời gian: {e.dateTime}</p>
                    <p className="text-[10px] text-slate-400">Địa điểm: {e.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-800 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khu phố 3, Phường An Phú</h1>
          <p className="text-slate-300 text-sm mt-1">Trang điều hành Trung tâm Quản lý Khu phố Thông minh - Cập nhật tự động</p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl text-xs font-mono font-medium backdrop-blur-sm">
          <Clock size={16} className="text-emerald-400" />
          <span>Hôm nay: {new Date().toLocaleDateString("vi-VN")}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div 
          onClick={() => handleAdminCardClick("residents")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Tổng số Dân cư</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalResidentsCount}</span>
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                  +1.2% <TrendingUp size={12} />
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Nam: {maleCount} ({malePercent}%)</span>
            <span>Nữ: {femaleCount} ({femalePercent}%)</span>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => handleAdminCardClick("households")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Số Hộ khẩu</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalHouseholdsCount}</span>
                <span className="text-slate-400 text-xs">Cố định</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
              <Home size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>TB: {(residents.length / (households.length || 1)).toFixed(1)} người/hộ</span>
            <span>Tổ dân tự quản: 4</span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => handleAdminCardClick("businesses")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Cơ sở Kinh doanh</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalBusinessesCount}</span>
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                  +{businesses.filter(b => b.status === "Chờ duyệt").length} mới <TrendingUp size={12} />
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Hoạt động: {businesses.filter(b => b.status === "Đang hoạt động").length}</span>
            <span>Chờ duyệt: {businesses.filter(b => b.status === "Chờ duyệt").length}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => handleAdminCardClick("reports")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Phản ánh chưa xử lý</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-rose-600">{pendingReportsCount}</span>
                <span className="text-rose-500 text-xs font-semibold animate-pulse">Cần xử lý</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <MessageSquare size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Tiếp nhận: {reports.filter(r => r.status === "Đã tiếp nhận").length}</span>
            <span>Đang xử lý: {reports.filter(r => r.status === "Đang xử lý").length}</span>
          </div>
        </div>
      </div>
      {/* Secondary Metric Cards (New Subsystems) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 5: Party Branch */}
        <div 
          onClick={() => handleAdminCardClick("party")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Đảng viên Chi bộ</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalPartyMembers}</span>
                <span className="text-slate-400 text-xs">Đảng viên</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
              <Heart size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Đang sinh hoạt: {activePartyMembers}</span>
            <span>Tổ Đảng: 3</span>
          </div>
        </div>

        {/* Card 6: Social Welfare */}
        <div 
          onClick={() => handleAdminCardClick("welfare")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Hộ An sinh xã hội</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{totalWelfare}</span>
                <span className="text-slate-400 text-xs">Hồ sơ</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
              <ShieldAlert size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Đang nhận: {activeWelfare}</span>
            <span>Chờ duyệt: {welfareRecipients.filter(w => w.status === "Chờ duyệt hồ sơ").length}</span>
          </div>
        </div>

        {/* Card 7: Community Events */}
        <div 
          onClick={() => handleAdminCardClick("cultural")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Sự kiện Sắp diễn ra</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{upcomingEventsCount}</span>
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                  Sắp diễn ra
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Bell size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Đang diễn ra: {communityEvents.filter(e => e.status === "Đang diễn ra").length}</span>
            <span>Tổng số: {communityEvents.length}</span>
          </div>
        </div>

        {/* Card 8: Funds */}
        <div 
          onClick={() => handleAdminCardClick("finance")}
          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer shadow-sm group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Tổng Quỹ đã thu</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-600 tracking-tight">{formattedFunds}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Coins size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>Đã nộp: {fundContributions.filter(c => c.status === "Đã nộp").length} hộ</span>
            <span>Chưa nộp: {fundContributions.filter(c => c.status === "Chưa nộp").length} hộ</span>
          </div>
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Demographics Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900">Phân bố Cư trú Khu phố</h2>
              <p className="text-xs text-slate-400 mt-0.5">Số liệu nhân khẩu theo trạng thái cư trú</p>
            </div>
            <span className="p-1.5 bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <Activity size={16} />
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={residencyChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                />
                <Bar dataKey="Số_lượng" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {residencyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: Fund Contribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900">Tình hình đóng góp Quỹ</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tổng số tiền thu được theo từng loại quỹ</p>
            </div>
            <span className="p-1.5 bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <Coins size={16} />
            </span>
          </div>

          <div className="h-56">
            {fundChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu đóng góp quỹ.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fundChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }}
                    formatter={(value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value))}
                  />
                  <Bar dataKey="Số tiền thu (VNĐ)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Category Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">Danh mục Phản ánh</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ các phản ánh hiện trường đã nhận</p>
          </div>

          <div className="h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {reportPieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-500 truncate" title={item.name}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Reflections and Bento Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reflections List (2/3 width) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h2 className="font-bold text-slate-900">Báo cáo Phản ánh Mới nhận</h2>
              <p className="text-xs text-slate-400 mt-0.5">Theo dõi thời gian thực phản hồi từ công dân</p>
            </div>
            <button 
              onClick={() => setActiveTab("reports")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 3).map((report) => {
              const statusColors = {
                "Đã tiếp nhận": "bg-blue-50 text-blue-600 border-blue-100",
                "Đang xử lý": "bg-amber-50 text-amber-600 border-amber-100",
                "Đã giải quyết": "bg-emerald-50 text-emerald-600 border-emerald-100"
              };
              return (
                <div 
                  key={report.id} 
                  onClick={() => setActiveTab("reports")}
                  className="p-4 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">{report.category}</span>
                      <span className="text-slate-400 text-[10px]">{report.reportedAt}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{report.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{report.location}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium ${statusColors[report.status]}`}>
                    {report.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Quick Actions (1/3 width) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">Liên kết Nhanh</h2>
            <p className="text-xs text-slate-400 mt-0.5">Các chức năng khẩn cấp và thường dùng</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button 
              onClick={() => setActiveTab("residents")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 text-emerald-900 hover:from-emerald-500/15 border border-emerald-500/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm shrink-0">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <span className="text-sm font-semibold block">Đăng ký Cư dân</span>
                  <span className="text-[10px] text-slate-500">Khai báo tạm trú/tạm vắng mới</span>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button 
              onClick={() => setActiveTab("ai")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 text-indigo-900 hover:from-indigo-500/15 border border-indigo-500/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="text-sm font-semibold block">Trợ lý Hỏi đáp</span>
                  <span className="text-[10px] text-slate-500">Đặt câu hỏi quy trình và văn bản</span>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-indigo-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button 
              onClick={() => setActiveTab("gis")}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-slate-500/10 to-slate-600/5 text-slate-900 hover:from-slate-500/15 border border-slate-300/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-sm font-semibold block">Camera Giám sát</span>
                  <span className="text-[10px] text-slate-500">Giám sát các mắt camera an ninh LIVE</span>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
