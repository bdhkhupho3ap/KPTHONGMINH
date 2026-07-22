import React from "react";
import { Users, UserCheck, ShieldAlert, Award, FileText, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { Household, Resident } from "../../types";

interface HouseholdDashboardProps {
  households: Household[];
  residents: Resident[];
}

export default function HouseholdDashboard({ households, residents }: HouseholdDashboardProps) {
  // Filter out deleted households
  const activeHouseholds = households.filter(h => !(h as any).deletedAt);

  const totalHouseholds = activeHouseholds.length;
  const thuongTruCount = activeHouseholds.filter(h => (h.type || "Thường trú") === "Thường trú").length;
  const tamTruCount = activeHouseholds.filter(h => h.type === "Tạm trú").length;
  const totalResidents = residents.length;

  // Calculate Family Size metrics
  const sizes = activeHouseholds.map(h => h.members.length);
  const singleMemberHouseholds = sizes.filter(s => s === 1).length;
  const smallFamilyHouseholds = sizes.filter(s => s === 2).length;
  const mediumFamilyHouseholds = sizes.filter(s => s === 3 || s === 4).length;
  const largeFamilyHouseholds = sizes.filter(s => s >= 5).length;

  // Calculations for percentage bars
  const getPercent = (value: number) => {
    if (totalHouseholds === 0) return 0;
    return Math.round((value / totalHouseholds) * 100);
  };

  // Mock fluctuation logs for recent administrative additions
  const fluctuationLogs = [
    { date: "18/07/2026", type: "Nhập khẩu", resident: "Nguyễn Minh Hòa", household: "HK-301", note: "Đồng bộ từ CSDL Quốc gia" },
    { date: "16/07/2026", type: "Tách hộ", resident: "Lê Văn Hải", household: "HK-304", note: "Tách mới lập Sổ điện tử" },
    { date: "14/07/2026", type: "Khai báo tạm trú", resident: "Trần Anh Thư", household: "HK-302", note: "Khai báo tạm trú trực tuyến" },
    { date: "10/07/2026", type: "Xóa đăng ký", resident: "Phạm Minh Tuấn", household: "HK-303", note: "Đăng ký tạm vắng đi du học" }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">TỔNG SỔ HỘ KHẨU</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={14} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalHouseholds}</div>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp size={11} /> 100% Đồng bộ pháp lý
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">THƯỜNG TRÚ (KT1-KT2)</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><UserCheck size={14} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{thuongTruCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Chiếm {getPercent(thuongTruCount)}% tổng dân số</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">TẠM TRÚ (KT3-KT4)</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><ShieldAlert size={14} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{tamTruCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Chiếm {getPercent(tamTruCount)}% tổng dân số</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 rounded-l-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">TỔNG NHÂN KHẨU SỐ</span>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Users size={14} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalResidents}</div>
            <p className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <CheckCircle size={11} /> Bình quân {totalHouseholds > 0 ? (totalResidents / totalHouseholds).toFixed(1) : 0} người/hộ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Family Size Analytics Dashboard */}
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 text-[12px] uppercase">Phân bổ theo Quy mô Hộ gia đình</h4>
            <p className="text-[10px] text-slate-400">Tỷ lệ số lượng thành viên trong mỗi sổ hộ khẩu điện tử</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Row 1: Single */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Hộ đơn thân (1 nhân khẩu)</span>
                <span>{singleMemberHouseholds} hộ ({getPercent(singleMemberHouseholds)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${getPercent(singleMemberHouseholds)}%` }}></div>
              </div>
            </div>

            {/* Row 2: 2 members */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Hộ hai người (Vợ chồng / Độc thân có con)</span>
                <span>{smallFamilyHouseholds} hộ ({getPercent(smallFamilyHouseholds)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${getPercent(smallFamilyHouseholds)}%` }}></div>
              </div>
            </div>

            {/* Row 3: 3-4 members */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Hộ gia đình hạt nhân (3-4 nhân khẩu)</span>
                <span>{mediumFamilyHouseholds} hộ ({getPercent(mediumFamilyHouseholds)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${getPercent(mediumFamilyHouseholds)}%` }}></div>
              </div>
            </div>

            {/* Row 4: 5+ members */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Hộ đa thế hệ (5+ nhân khẩu)</span>
                <span>{largeFamilyHouseholds} hộ ({getPercent(largeFamilyHouseholds)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${getPercent(largeFamilyHouseholds)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Fluctuation activity logs */}
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-800 text-[12px] uppercase">Lịch sử Biến động Dân cư vừa qua</h4>
              <p className="text-[10px] text-slate-400">Các ghi chép biến động nhân khẩu học trực tuyến</p>
            </div>
            <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Calendar size={13} /></div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
            {fluctuationLogs.map((log, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full ${
                      log.type === "Nhập khẩu" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : log.type === "Tách hộ"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {log.type}
                    </span>
                    <strong className="text-slate-800 font-bold">{log.resident}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400">Hộ cư trú: Sổ {log.household} • {log.note}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-medium">{log.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
