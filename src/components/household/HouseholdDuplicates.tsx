import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Trash2, Users, MapPin, Sparkles, HelpCircle, ArrowRight, X } from "lucide-react";
import { Household, Resident } from "../../types";
import { normalizeAddress, getSimilarity } from "../../utils/addressEngine";

interface HouseholdDuplicatesProps {
  households: Household[];
  residents: Resident[];
  onUpdateHouseholds: (households: Household[]) => void;
  onUpdateResidents: (residents: Resident[]) => void;
}

export default function HouseholdDuplicates({
  households,
  residents,
  onUpdateHouseholds,
  onUpdateResidents
}: HouseholdDuplicatesProps) {
  const [selectedMergePair, setSelectedMergePair] = useState<{ h1: Household; h2: Household } | null>(null);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [mergeSuccess, setMergeSuccess] = useState(false);

  // Filter out soft-deleted households for scanning
  const activeHouseholds = households.filter(h => !(h as any).deletedAt);

  // Scan all pairs of households to find duplicates and conflicts (similarity >= 95%)
  const duplicateAddressPairs: Household[][] = [];
  const scanned = new Set<string>();

  for (let i = 0; i < activeHouseholds.length; i++) {
    const h1 = activeHouseholds[i];
    if (scanned.has(h1.id)) continue;
    
    const group: Household[] = [h1];
    for (let j = i + 1; j < activeHouseholds.length; j++) {
      const h2 = activeHouseholds[j];
      if (scanned.has(h2.id)) continue;
      
      const sim = getSimilarity(h1.address, h2.address);
      if (sim >= 0.95) {
        group.push(h2);
        scanned.add(h2.id);
      }
    }
    if (group.length > 1) {
      duplicateAddressPairs.push(group);
      scanned.add(h1.id);
    }
  }

  // 2. Find citizens with duplicated CCCD in multiple households
  const cccdGroups: { [cccd: string]: { name: string; householdCodes: string[] } } = {};
  activeHouseholds.forEach(h => {
    h.members.forEach(m => {
      if (m.cccd) {
        if (!cccdGroups[m.cccd]) {
          cccdGroups[m.cccd] = { name: m.name, householdCodes: [] };
        }
        cccdGroups[m.cccd].householdCodes.push(h.code);
      }
    });
  });

  const duplicateCitizens = Object.entries(cccdGroups)
    .filter(([_, data]) => data.householdCodes.length > 1)
    .map(([cccd, data]) => ({ cccd, ...data }));

  // Initialize Merge Wizard
  const startMerge = (h1: Household, h2: Household) => {
    setSelectedMergePair({ h1, h2 });
    setPrimaryId(h1.id); // Default primary is h1
    setMergeSuccess(false);
  };

  // Perform Household Merge
  const handlePerformMerge = () => {
    if (!selectedMergePair) return;
    const { h1, h2 } = selectedMergePair;
    const primary = primaryId === h1.id ? h1 : h2;
    const secondary = primaryId === h1.id ? h2 : h1;

    // Merge members, making sure we don't duplicate by CCCD
    const mergedMembers = [...primary.members];
    secondary.members.forEach(secMem => {
      // If member is owner of secondary, we change their relation to "Thành viên gộp" unless they are the same person as primary owner
      let relation = secMem.relation;
      if (relation === "Chủ hộ") {
        relation = "Thành viên (Cựu chủ hộ)";
      }

      if (!mergedMembers.some(primMem => primMem.cccd === secMem.cccd)) {
        mergedMembers.push({
          ...secMem,
          relation: relation
        });
      }
    });

    // Update Households: update primary, soft-delete secondary
    const updatedHouseholds = households.map(h => {
      if (h.id === primary.id) {
        return {
          ...h,
          members: mergedMembers,
          memberCount: mergedMembers.length,
          notes: (h as any).notes 
            ? (h as any).notes + ` | Đã tự động gộp dữ liệu từ sổ ${secondary.code}`
            : `Đã tự động gộp dữ liệu từ sổ ${secondary.code}`
        };
      }
      if (h.id === secondary.id) {
        // Soft delete secondary
        return {
          ...h,
          deletedAt: new Date().toISOString(),
          deletedBy: "Hệ thống tự động (Trực ban)",
          notes: `Đã bị gộp vào sổ ${primary.code}`
        };
      }
      return h;
    });

    // Update Residents: point secondary members' householdId to primary code
    const updatedResidents = residents.map(r => {
      if (r.householdId === secondary.code) {
        return {
          ...r,
          householdId: primary.code,
          relationToOwner: r.relationToOwner === "Chủ hộ" ? "Thành viên (Hộ đã gộp)" : r.relationToOwner
        };
      }
      return r;
    });

    // Save states
    onUpdateHouseholds(updatedHouseholds);
    onUpdateResidents(updatedResidents);

    setMergeSuccess(true);
    setTimeout(() => {
      setSelectedMergePair(null);
      setMergeSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Overview Block */}
      <div className="bg-gradient-to-r from-emerald-900 to-indigo-950 p-5 rounded-2xl text-white flex items-start gap-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Sparkles size={160} />
        </div>
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
          <Sparkles size={24} className="text-emerald-400" />
        </div>
        <div className="space-y-1 z-10">
          <h3 className="font-bold text-sm">Rà soát dữ liệu & Đồng bộ Gộp Hộ</h3>
          <p className="text-slate-300 leading-relaxed max-w-xl text-[11px]">
            Hệ thống tự động phân tích cơ sở dữ liệu dân cư, chuẩn hóa địa chỉ (Address Normalization) và rà soát trùng lặp thông tin CCCD/Chủ hộ để đảm bảo tính đồng bộ pháp lý cao nhất cho cơ sở hành chính địa phương.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Duplicate Addresses (Hộ Cần Xác Minh) */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[12px] uppercase">Hộ cần xác minh trùng địa chỉ ({duplicateAddressPairs.length})</h4>
              <p className="text-[10px] text-slate-400">Các sổ hộ khẩu có địa chỉ thực tế trùng khớp sau chuẩn hóa</p>
            </div>
          </div>

          {duplicateAddressPairs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
              Tất cả sổ hộ khẩu đều có địa chỉ duy nhất, chuẩn hóa hoàn tất!
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {duplicateAddressPairs.map((group, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-1.5">
                    <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Địa chỉ trùng khớp</span>
                      <p className="text-slate-800 font-bold leading-tight">{group[0].address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.map(h => (
                      <div key={h.id} className="p-2 bg-white rounded-lg border border-slate-150 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[9px] text-slate-500">{h.code}</span>
                          <span className="px-1.5 py-0.5 text-[8px] bg-indigo-50 text-indigo-600 rounded-full font-extrabold">{h.type}</span>
                        </div>
                        <p className="font-bold text-slate-700 truncate">{h.ownerName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Users size={10} /> {h.memberCount} nhân khẩu
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => startMerge(group[0], group[1])}
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Sparkles size={11} /> Thực hiện đồng bộ / Gộp Sổ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Duplicate Citizens (Double Registered) */}
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[12px] uppercase">Cảnh báo trùng lặp nhân khẩu ({duplicateCitizens.length})</h4>
              <p className="text-[10px] text-slate-400">Cá nhân đăng ký thành viên trên nhiều sổ hộ khẩu cùng lúc</p>
            </div>
          </div>

          {duplicateCitizens.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
              Không phát hiện nhân khẩu trùng lặp CCCD trên toàn khu phố!
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {duplicateCitizens.map((dc, idx) => (
                <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100/40 rounded-xl flex justify-between items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-800 text-xs">{dc.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">CCCD: {dc.cccd}</p>
                    <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                      <span className="text-[9px] text-slate-400">Hộ khẩu liên đới:</span>
                      {dc.householdCodes.map((code, cidx) => (
                        <span key={cidx} className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-white text-slate-600 rounded border border-slate-200">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px] shrink-0">
                    Bất hợp lệ
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merge Wizard Modal */}
      {selectedMergePair && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">Trình Gộp sổ hộ khẩu chuẩn hóa địa phương</h3>
              </div>
              <button 
                onClick={() => setSelectedMergePair(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {mergeSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2.5">
                <CheckCircle size={44} className="text-emerald-500 animate-bounce" />
                <h4 className="font-bold text-slate-800 text-sm">Đã gộp dữ liệu thành công!</h4>
                <p className="text-slate-500 text-xs">Cơ sở dữ liệu hộ tịch đã được cấu trúc lại, đang tải lại...</p>
              </div>
            ) : (
              <div className="p-6 space-y-5 text-xs text-slate-600">
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Hai hộ tịch sau đây có địa chỉ trùng khớp tuyệt đối. Hãy lựa chọn <strong>Sổ hộ khẩu chính (Primary Book)</strong> để lưu giữ. Toàn bộ thành viên của sổ còn lại sẽ được chuyển sang sổ chính một cách an toàn. Sổ thứ hai sẽ tự động được <strong>Soft Delete (Đánh dấu lưu trữ)</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1 */}
                  <div 
                    onClick={() => setPrimaryId(selectedMergePair.h1.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                      primaryId === selectedMergePair.h1.id 
                        ? "border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20" 
                        : "border-slate-150 hover:border-slate-200"
                    }`}
                  >
                    {primaryId === selectedMergePair.h1.id && (
                      <span className="absolute top-0 right-0 bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-bl-xl text-[8px] uppercase tracking-wider">
                        Sổ Hộ Khẩu Chính
                      </span>
                    )}
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-slate-500">{selectedMergePair.h1.code}</span>
                      <span className="font-bold text-indigo-600">{selectedMergePair.h1.type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Chủ hộ</span>
                      <p className="font-bold text-slate-800 text-sm">{selectedMergePair.h1.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Thành viên ({selectedMergePair.h1.members.length})</span>
                      <p className="text-slate-500 truncate">{selectedMergePair.h1.members.map(m => m.name).join(", ")}</p>
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div 
                    onClick={() => setPrimaryId(selectedMergePair.h2.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                      primaryId === selectedMergePair.h2.id 
                        ? "border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20" 
                        : "border-slate-150 hover:border-slate-200"
                    }`}
                  >
                    {primaryId === selectedMergePair.h2.id && (
                      <span className="absolute top-0 right-0 bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-bl-xl text-[8px] uppercase tracking-wider">
                        Sổ Hộ Khẩu Chính
                      </span>
                    )}
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-slate-500">{selectedMergePair.h2.code}</span>
                      <span className="font-bold text-indigo-600">{selectedMergePair.h2.type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Chủ hộ</span>
                      <p className="font-bold text-slate-800 text-sm">{selectedMergePair.h2.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Thành viên ({selectedMergePair.h2.members.length})</span>
                      <p className="text-slate-500 truncate">{selectedMergePair.h2.members.map(m => m.name).join(", ")}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 font-bold block">Địa chỉ chuẩn hóa</span>
                    <strong className="text-slate-700">{selectedMergePair.h1.address}</strong>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </div>

                {/* Confirm merge actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    onClick={() => setSelectedMergePair(null)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handlePerformMerge}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Xác nhận Gộp hộ & Đồng bộ CSDL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
