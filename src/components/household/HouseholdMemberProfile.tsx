import React from "react";
import { X, User, ShieldCheck, MapPin, Phone, Briefcase, Calendar, Info, QrCode } from "lucide-react";
import { Resident } from "../../types";
import { getInitialsSvg } from "../../utils/addressEngine";

interface HouseholdMemberProfileProps {
  resident: Resident | null;
  relation: string;
  onClose: () => void;
}

export default function HouseholdMemberProfile({ resident, relation, onClose }: HouseholdMemberProfileProps) {
  if (!resident) return null;

  // Render a mock beautiful pixelated digital QR code
  const renderMockQr = (cccd: string) => {
    return (
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-1.5 shadow-sm">
        <div className="w-32 h-32 bg-slate-900 rounded-lg p-2 flex flex-wrap items-center justify-center relative">
          <QrCode size={100} className="text-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-md border-2 border-slate-900 flex items-center justify-center shadow-xs">
              <User size={14} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded tracking-widest">
          {cccd || "0790XXXXXXXX"}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm">Hồ sơ điện tử Cư dân</h3>
              <p className="text-[10px] text-emerald-100 font-mono tracking-wide">Xác thực bởi Chính phủ số</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & QR */}
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative">
              <img 
                src={resident.avatar || getInitialsSvg(resident.fullName, resident.gender)} 
                alt={resident.fullName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getInitialsSvg(resident.fullName, resident.gender);
                }}
              />
              <span className="absolute bottom-0 right-0 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-500 text-white border-2 border-white shadow-xs">
                {relation}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-base">{resident.fullName}</h4>
              <p className="text-[11px] text-slate-400 font-medium font-mono">{resident.id}</p>
            </div>

            {renderMockQr(resident.cccd)}
          </div>

          {/* Right Columns: Detailed Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1">
              <Info size={12} /> Thông tin cá nhân cơ bản
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Số CCCD (Gắn chip)</span>
                <span className="text-slate-800 font-semibold font-mono tracking-wide">{resident.cccd}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Ngày/Năm sinh</span>
                <span className="text-slate-800 font-semibold">{resident.birthDate}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Giới tính</span>
                <span className="text-slate-800 font-semibold">{resident.gender}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Số điện thoại</span>
                <span className="text-slate-800 font-semibold font-mono">{resident.phone || "Chưa đăng ký"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Trạng thái cư trú</span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                  resident.status === "Thường trú" 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                    : resident.status === "Tạm trú"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {resident.status}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Nghề nghiệp</span>
                <span className="text-slate-800 font-semibold">{resident.occupation || "Tự do"}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 pb-1 flex items-center gap-1">
                <MapPin size={12} /> Nơi đăng ký cư trú & Lịch sử
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Địa chỉ đăng ký</span>
                    <span className="text-slate-700 font-semibold leading-relaxed">{resident.address}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100/60 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 block">Ngày nhập khẩu</span>
                      <span className="text-slate-700 font-semibold font-mono">{resident.joinDate || "15/01/2021"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 block">Mã Sổ hộ tịch</span>
                      <span className="text-slate-700 font-semibold font-mono">{resident.householdId || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100 text-[10px] text-slate-400 font-mono">
          <span>Khóa định danh UUID: {resident.id}</span>
          <button 
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg font-sans font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
