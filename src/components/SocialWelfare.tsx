import React, { useState } from "react";
import { 
  Heart, 
  Search, 
  Filter, 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  Sparkles, 
  FileCheck, 
  AlertCircle,
  Clock,
  Gift,
  Trash2
} from "lucide-react";
import { WelfareRecipient, Resident } from "../types";
import Pagination from "./Pagination";

interface SocialWelfareProps {
  recipients: WelfareRecipient[];
  onUpdateStatus: (id: string, status: "Đang nhận trợ cấp" | "Chờ duyệt hồ sơ" | "Đã tạm ngưng") => void;
  onAddRecipient: (newRec: WelfareRecipient) => void;
  onDeleteRecipient: (id: string) => void;
  residents?: Resident[];
}

export default function SocialWelfare({ recipients, onUpdateStatus, onAddRecipient, onDeleteRecipient, residents = [] }: SocialWelfareProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<WelfareRecipient | null>(recipients[0] || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  // Confirmation state for deleting a welfare recipient
  const [recipientToDelete, setRecipientToDelete] = useState<WelfareRecipient | null>(null);

  // Modern Toast system
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const executeDeleteRecipient = (id: string) => {
    onDeleteRecipient(id);
    showToast("Đã xóa đối tượng khỏi danh sách trợ cấp thành công!", "success");
    setRecipientToDelete(null);
    
    // Auto-select another recipient
    const remaining = recipients.filter(r => r.id !== id);
    setSelectedRecipient(remaining[0] || null);
  };

  const standardCategories = ["Gia đình chính sách", "Hộ nghèo/Cận nghèo", "Người có công", "Người cao tuổi", "Trẻ em mồ côi"];
  const uniqueCategories = Array.from(new Set(recipients.map(r => r.category)));
  const customCategories = uniqueCategories.filter(cat => !standardCategories.includes(cat));

  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState<string>("Người có công");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryValue, setCustomCategoryValue] = useState("");
  const [address, setAddress] = useState("42/ Lương Định Của, Phường An Phú");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [supportLevel, setSupportLevel] = useState("1.500.000đ / tháng");
  const [notes, setNotes] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !cccd) {
      alert("Vui lòng nhập họ tên và số CCCD");
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryValue.trim() : category;
    if (!finalCategory) {
      alert("Vui lòng nhập hoặc chọn diện chính sách!");
      return;
    }

    const newRec: WelfareRecipient = {
      id: "WF" + (recipients.length + 1).toString().padStart(3, "0"),
      fullName,
      category: finalCategory,
      address,
      cccd,
      phone: phone || undefined,
      supportLevel,
      status: "Chờ duyệt hồ sơ",
      notes
    };
    onAddRecipient(newRec);
    setSelectedRecipient(newRec);
    setShowModal(false);

    // Reset fields
    setFullName("");
    setCccd("");
    setPhone("");
    setNotes("");
    setIsCustomCategory(false);
    setCustomCategoryValue("");
    setCategory("Người có công");
  };

  const filteredRecipients = recipients.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.cccd.includes(searchTerm) || 
                          r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Tất cả" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalItems = filteredRecipients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedRecipients = filteredRecipients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div id="social-welfare-view" className="space-y-6">
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans">An sinh Xã hội & Trợ giúp Cộng đồng</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý và theo dõi diện chính sách, người có công, bảo trợ xã hội và hộ gia đình khó khăn</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Đề xuất Diện Trợ cấp mới
        </button>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600"><Heart size={20} /></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Người có công & Gia đình LS</span>
            <span className="text-base font-bold text-slate-800">
              {recipients.filter(r => r.category.includes("Người có công") || r.category.includes("chính sách") || r.category.includes("Liệt sĩ")).length} đối tượng
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600"><Gift size={20} /></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hộ nghèo & Cận nghèo</span>
            <span className="text-base font-bold text-slate-800">
              {recipients.filter(r => r.category.includes("nghèo") || r.category.includes("Cận nghèo")).length} hộ gia đình
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600"><FileCheck size={20} /></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngân sách chi trả tháng này</span>
            <span className="text-base font-extrabold text-indigo-600">
              {(() => {
                const total = recipients
                  .filter(r => r.status === "Đang nhận trợ cấp")
                  .reduce((sum, r) => sum + (parseInt((r.supportLevel || "").replace(/\D/g, ""), 10) || 0), 0);
                return total > 0 ? total.toLocaleString("vi-VN") + "đ" : "0đ";
              })()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><Sparkles size={20} /></div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hồ sơ mới chờ duyệt</span>
            <span className="text-base font-bold text-amber-600">{recipients.filter(r => r.status === "Chờ duyệt hồ sơ").length} hồ sơ</span>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên công dân, số CCCD hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter size={14} /> Phân loại diện chính sách:</span>
          <select 
            value={categoryFilter}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-500"
          >
            <option value="Tất cả">Tất cả danh mục</option>
            <option value="Gia đình chính sách">Gia đình chính sách</option>
            <option value="Hộ nghèo/Cận nghèo">Hộ nghèo/Cận nghèo</option>
            <option value="Người có công">Người có công</option>
            <option value="Người cao tuổi">Người cao tuổi</option>
            <option value="Trẻ em mồ côi">Trẻ em mồ côi</option>
            {customCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recipients list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedRecipients.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-8 text-center text-sm text-slate-400">
                Không tìm thấy thông tin đối tượng chính sách phù hợp
              </div>
            ) : (
              paginatedRecipients.map((rec) => {
                const statusColors = {
                  "Đang nhận trợ cấp": "bg-emerald-50 text-emerald-700 border-emerald-100",
                  "Chờ duyệt hồ sơ": "bg-amber-50 text-amber-700 border-amber-100",
                  "Đã tạm ngưng": "bg-slate-50 text-slate-500 border-slate-100"
                };
                const isSelected = selectedRecipient?.id === rec.id;
                return (
                  <div 
                    key={rec.id}
                    id={`welfare-card-${rec.id}`}
                    onClick={() => setSelectedRecipient(rec)}
                    className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3
                      ${isSelected ? "border-rose-500 ring-2 ring-rose-500/5 shadow-sm" : "border-slate-100"}
                    `}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-sans">{rec.category}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[rec.status]}`}>
                          {rec.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{rec.fullName}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={12} className="shrink-0" /> <span className="truncate">{rec.address}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500">
                      <span className="font-mono font-medium">CCCD: {rec.cccd.substring(0, 6)}***</span>
                      <span className="font-extrabold text-rose-600">{rec.supportLevel}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <Pagination
            id="social-welfare-pagination"
            currentPage={activePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right Side: Detailed Profiler */}
        <div className="lg:col-span-1">
          {selectedRecipient ? (
            <div id="welfare-detail-panel" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden sticky top-6 space-y-5">
              
              <div className="bg-gradient-to-r from-rose-700 to-rose-900 p-4 text-white">
                <span className="text-[10px] bg-rose-500/30 text-rose-100 font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">{selectedRecipient.id}</span>
                <h3 className="font-extrabold text-base mt-1.5">{selectedRecipient.fullName}</h3>
                <span className="text-[11px] text-rose-100/90 block mt-0.5">{selectedRecipient.category}</span>
              </div>

              <div className="px-5 pb-5 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-50 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">Số CCCD</span>
                    <span className="text-slate-800 font-bold font-mono">{selectedRecipient.cccd}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">Số điện thoại liên hệ</span>
                    <span className="text-slate-800 font-bold font-mono flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" /> {selectedRecipient.phone || "Không đăng ký"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400 shrink-0"><MapPin size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Địa chỉ cư ngụ hiện tại</span>
                      <span className="text-slate-800 font-semibold">{selectedRecipient.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400 shrink-0"><Gift size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Mức trợ cấp được duyệt chi</span>
                      <span className="text-rose-600 font-bold text-sm">{selectedRecipient.supportLevel}</span>
                    </div>
                  </div>

                  {selectedRecipient.notes && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ghi chú & Lịch sử thẩm định</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{selectedRecipient.notes}</p>
                    </div>
                  )}
                </div>

                {/* Verification/Compliance notification info */}
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 flex gap-2.5 text-xs text-rose-900">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-950">Chế độ kiểm duyệt định kỳ</span>
                    <span>Hàng quý, Ban xóa đói giảm nghèo phường phối hợp với Trưởng khu phố tổ chức khảo sát trực tiếp hiện trạng thu nhập và đời sống.</span>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateStatus(selectedRecipient.id, "Đang nhận trợ cấp")}
                      className="flex-1 text-[10px] font-bold py-2 px-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-center"
                    >
                      Duyệt chi
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(selectedRecipient.id, "Đã tạm ngưng")}
                      className="flex-1 text-[10px] font-bold py-2 px-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer text-center"
                    >
                      Tạm ngưng trợ cấp
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(selectedRecipient.id, "Chờ duyệt hồ sơ")}
                      className="flex-1 text-[10px] font-bold py-2 px-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-center"
                    >
                      Yêu cầu bổ túc HS
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setRecipientToDelete(selectedRecipient)}
                    className="w-full text-[10px] font-bold py-2 px-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm mt-1"
                  >
                    <Trash2 size={13} /> Xóa đối tượng khỏi danh sách trợ cấp
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-xl p-8 text-center text-xs">
              Chọn một diện chính sách ở danh sách để xem hồ sơ trợ cấp
            </div>
          )}
        </div>

      </div>

      {/* Add Recipient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Đề xuất diện chính sách nhận hỗ trợ xã hội mới</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
             <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Chọn nhanh từ danh sách cư dân khu phố</label>
                <select
                  onChange={(e) => {
                    const selectedCccd = e.target.value;
                    if (!selectedCccd) return;
                    const res = residents.find(r => r.cccd === selectedCccd);
                    if (res) {
                      setFullName(res.fullName);
                      setCccd(res.cccd);
                      setPhone(res.phone === "N/A" ? "" : res.phone);
                      setAddress(res.address);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="">-- Chọn cư dân có sẵn trong hệ thống --</option>
                  {residents.map(r => (
                    <option key={r.cccd} value={r.cccd}>
                      {r.fullName} - CCCD: {r.cccd}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">Hệ thống tự động liên kết điền dữ liệu của cư dân được chọn</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Họ và Tên đối tượng thụ hưởng *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Trần Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Diện chính sách đề xuất *</label>
                  <select 
                    value={isCustomCategory ? "Khác" : category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Khác") {
                        setIsCustomCategory(true);
                        setCustomCategoryValue("");
                      } else {
                        setIsCustomCategory(false);
                        setCategory(val);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white"
                  >
                    <option value="Gia đình chính sách">Gia đình chính sách</option>
                    <option value="Hộ nghèo/Cận nghèo">Hộ nghèo/Cận nghèo</option>
                    <option value="Người có công">Người có công</option>
                    <option value="Người cao tuổi">Người cao tuổi</option>
                    <option value="Trẻ em mồ côi">Trẻ em mồ côi</option>
                    <option value="Khác">-- Diện khác (Nhập thủ công) --</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Mức hỗ trợ đề xuất (tháng) *</label>
                  <input 
                    type="text" 
                    required
                    value={supportLevel}
                    onChange={(e) => setSupportLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Input block for manual custom category input */}
              {isCustomCategory && (
                <div className="space-y-1.5 p-3 bg-rose-50/50 rounded-xl border border-rose-100/60 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-rose-800 block">Tự nhập diện chính sách mới *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Người khuyết tật, Gia đình neo đơn..."
                    value={customCategoryValue}
                    onChange={(e) => setCustomCategoryValue(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:outline-none focus:border-rose-500 bg-white"
                  />
                  <span className="text-[10px] text-rose-600 block">Diện chính sách này sẽ được ghi nhận vào danh sách phân loại</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số CCCD / Số Định danh cá nhân *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="079xxxxxxxxxx"
                    value={cccd}
                    onChange={(e) => setCccd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại liên lạc</label>
                  <input 
                    type="text" 
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Địa chỉ thường trú / tạm trú của gia đình *</label>
                <input 
                  type="text" 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Mô tả hoàn cảnh / Lý do đề xuất</label>
                <textarea 
                  rows={3}
                  placeholder="Nêu rõ hoàn cảnh khó khăn thực tế, bệnh tật, thu nhập hay công lao cách mạng để có cơ sở thẩm định nhanh hơn..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tạo Đề xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Toast Notification Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 bg-rose-50 border-rose-200 text-rose-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Modern Custom Recipient Deletion Confirmation Dialog */}
      {recipientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Xác nhận xóa đối tượng trợ cấp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa đối tượng <strong className="text-slate-800">{recipientToDelete.fullName}</strong> (<span className="text-rose-700 font-semibold">{recipientToDelete.category}</span>) khỏi danh sách trợ giúp an sinh xã hội không?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecipientToDelete(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => executeDeleteRecipient(recipientToDelete.id)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
