import React from "react";
import { GitBranch, X, User } from "lucide-react";
import { Household } from "../../types";

interface HouseholdFamilyTreeProps {
  household: Household | null;
  onClose: () => void;
  onSelectMember: (name: string, relation: string, cccd: string) => void;
}

export default function HouseholdFamilyTree({ household, onClose, onSelectMember }: HouseholdFamilyTreeProps) {
  if (!household) return null;

  const owner = household.members.find(m => m.relation === "Chủ hộ" || m.relation.toLowerCase().includes("chủ hộ"));
  const members = household.members.filter(m => m.relation !== "Chủ hộ" && !m.relation.toLowerCase().includes("chủ hộ"));

  // Relation card color helper
  const getRelationColor = (relation: string) => {
    const rel = relation.toLowerCase();
    if (rel.includes("vợ") || rel.includes("chồng")) {
      return {
        bg: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800",
        labelBg: "bg-rose-500",
        textColor: "text-rose-500"
      };
    }
    if (rel.includes("con")) {
      return {
        bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800",
        labelBg: "bg-indigo-500",
        textColor: "text-indigo-500"
      };
    }
    if (rel.includes("bố") || rel.includes("mẹ")) {
      return {
        bg: "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800",
        labelBg: "bg-teal-500",
        textColor: "text-teal-500"
      };
    }
    return {
      bg: "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800",
      labelBg: "bg-slate-500",
      textColor: "text-slate-500"
    };
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-white text-sm">Sơ đồ phả hệ thành viên Hộ tịch - {household.code}</h3>
              <p className="text-[10px] text-slate-400">Nhấp chọn thành viên để xem hồ sơ điện tử chi tiết</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tree Workspace Diagram */}
        <div className="p-10 flex flex-col items-center justify-center bg-slate-950/40 min-h-[400px] overflow-x-auto select-none">
          
          {/* Root Node: Owner (Chủ hộ) */}
          <div className="flex flex-col items-center shrink-0">
            <div 
              onClick={() => {
                if (owner) onSelectMember(owner.name, "Chủ hộ", owner.cccd);
              }}
              className="relative bg-emerald-600 border-2 border-emerald-400 hover:border-white transition-all rounded-2xl p-4 text-center shadow-lg w-52 text-white cursor-pointer transform hover:scale-105 duration-150"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 font-mono text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase text-white border border-emerald-400 tracking-wider">
                CHỦ HỘ
              </span>
              <div className="font-bold text-sm mt-1">{household.ownerName}</div>
              <div className="text-[10px] text-emerald-100 mt-0.5 font-mono">Sinh năm: {owner?.birthYear || "N/A"}</div>
            </div>

            {/* Connecting Vertical Trunk Down */}
            {members.length > 0 && (
              <>
                <div className="w-0.5 h-8 bg-slate-700"></div>
                <div className="h-0.5 bg-slate-700" style={{ width: `${Math.max(0, (members.length - 1) * 160)}px` }}></div>
              </>
            )}
          </div>

          {/* Child Nodes Block */}
          <div className="flex justify-center gap-6 mt-0 shrink-0">
            {members.map((m) => {
              const colors = getRelationColor(m.relation);
              return (
                <div key={m.cccd} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-700"></div>
                  <div 
                    onClick={() => onSelectMember(m.name, m.relation, m.cccd)}
                    className={`border hover:border-white transition-all rounded-xl p-3.5 text-center shadow-md w-38 cursor-pointer transform hover:-translate-y-1 duration-150 ${colors.bg}`}
                  >
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white inline-block mb-1.5 uppercase tracking-wide ${colors.labelBg}`}>
                      {m.relation}
                    </span>
                    <div className="font-bold text-slate-800 text-xs truncate leading-tight">{m.name}</div>
                    <div className="text-[9px] text-slate-400 mt-1 font-mono">CCCD: ...{m.cccd.slice(-4)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>Hệ thống cây phả hệ số tự động đồng bộ</span>
          <span>Phường An Phú, TP. Thủ Đức, TP. HCM</span>
        </div>
      </div>
    </div>
  );
}
