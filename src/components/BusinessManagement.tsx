import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Briefcase, 
  ShieldCheck, 
  ShieldAlert,
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Layers,
  Award,
  CheckCircle,
  Plus,
  AlertTriangle,
  FileCheck,
  X,
  LayoutGrid,
  List,
  Camera,
  Upload,
  Trash2,
  Pencil
} from "lucide-react";
import { Business } from "../types";
import Pagination from "./Pagination";
import { formatCoordinates, fixMojibake } from "../utils/addressEngine";

interface BusinessManagementProps {
  businesses: Business[];
  onToggleCertification: (id: string) => void;
  onUpdateStatus: (id: string, status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt") => void;
  onUpdateBusinesses?: (businesses: Business[]) => void;
}

export default function BusinessManagement({ 
  businesses, 
  onToggleCertification, 
  onUpdateStatus,
  onUpdateBusinesses
}: BusinessManagementProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(businesses[0] || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const itemsPerPage = 6;

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode("card");
    }
  }, []);

  useEffect(() => {
    if (selectedBusiness && !businesses.some(b => b.id === selectedBusiness.id)) {
      setSelectedBusiness(businesses[0] || null);
    } else if (!selectedBusiness && businesses.length > 0) {
      setSelectedBusiness(businesses[0]);
    }
  }, [businesses, selectedBusiness]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Coordinate and Business Creation states
  const [isEditingCoordinates, setIsEditingCoordinates] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for register business
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("42 Lương Định Của, Phường An Phú");
  const [newEmployeeCount, setNewEmployeeCount] = useState(3);
  const [newCoordinates, setNewCoordinates] = useState("10°56'07.5\"N 106°44'38.0\"E");

  // Advanced Image Upload and drag-and-drop States
  const [newImage, setNewImage] = useState<string>("");
  const [dragActiveDetail, setDragActiveDetail] = useState(false);
  const [dragActiveModal, setDragActiveModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Delete Business States & Handler
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  const executeDeleteBusiness = (id: string) => {
    if (onUpdateBusinesses) {
      const remaining = businesses.filter(b => b.id !== id);
      onUpdateBusinesses(remaining);
      showToast("Đã xóa hộ kinh doanh khỏi danh sách thành công!", "success");
      setBusinessToDelete(null);
      
      // Auto-select another business or null
      setSelectedBusiness(remaining[0] || null);
    } else {
      showToast("Lỗi hệ thống: Không thể kết nối với cơ sở dữ liệu!", "error");
    }
  };

  // Edit Business States & Handlers
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmployeeCount, setEditEmployeeCount] = useState(3);
  const [editImage, setEditImage] = useState("");
  const [editCoordinates, setEditCoordinates] = useState("");
  const [dragActiveEditModal, setDragActiveEditModal] = useState(false);

  const handleOpenEditModal = (business: Business) => {
    setEditName(business.name);
    setEditType(business.type);
    setEditOwner(business.owner);
    setEditPhone(business.phone);
    setEditAddress(business.address);
    setEditEmployeeCount(business.employeeCount);
    setEditImage(business.image || "");
    setEditCoordinates(business.coordinates || "");
    setShowEditModal(true);
  };

  const handleUpdateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    const updatedB: Business = {
      ...selectedBusiness,
      name: editName,
      type: editType,
      owner: editOwner,
      phone: editPhone,
      address: editAddress,
      employeeCount: editEmployeeCount,
      image: editImage,
      coordinates: editCoordinates
    };

    if (onUpdateBusinesses) {
      const updatedBusinesses = businesses.map(b => b.id === selectedBusiness.id ? updatedB : b);
      onUpdateBusinesses(updatedBusinesses);
      setSelectedBusiness(updatedB);
      showToast("Đã cập nhật thông tin hộ kinh doanh thành công!", "success");
      setShowEditModal(false);
    } else {
      showToast("Lỗi hệ thống: Không thể cập nhật thông tin!", "error");
    }
  };

  const handleDragEditModal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveEditModal(true);
    } else if (e.type === "dragleave") {
      setDragActiveEditModal(false);
    }
  };

  const handleDropEditModal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveEditModal(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0], (base64) => {
        setEditImage(base64);
        showToast("Đã nhận ảnh đại diện cơ sở mới!", "success");
      });
    }
  };

  const handleFileChangeEditModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0], (base64) => {
        setEditImage(base64);
        showToast("Đã nhận ảnh đại diện cơ sở mới!", "success");
      });
    }
  };

  const handleFileProcess = (file: File, callback: (base64: string) => void) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chỉ tải lên tệp hình ảnh (png, jpg, jpeg...)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragDetail = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveDetail(true);
    } else if (e.type === "dragleave") {
      setDragActiveDetail(false);
    }
  };

  const handleDropDetail = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveDetail(false);
    if (!selectedBusiness) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0], (base64) => {
        const updatedBusiness = {
          ...selectedBusiness,
          image: base64
        };
        const updatedBusinesses = businesses.map(b => b.id === selectedBusiness.id ? updatedBusiness : b);
        if (onUpdateBusinesses) {
          onUpdateBusinesses(updatedBusinesses);
        }
        setSelectedBusiness(updatedBusiness);
        showToast("Đã cập nhật hình ảnh đại diện cơ sở thành công!", "success");
      });
    }
  };

  const handleFileChangeDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBusiness) return;
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0], (base64) => {
        const updatedBusiness = {
          ...selectedBusiness,
          image: base64
        };
        const updatedBusinesses = businesses.map(b => b.id === selectedBusiness.id ? updatedBusiness : b);
        if (onUpdateBusinesses) {
          onUpdateBusinesses(updatedBusinesses);
        }
        setSelectedBusiness(updatedBusiness);
        showToast("Đã cập nhật hình ảnh đại diện cơ sở thành công!", "success");
      });
    }
  };

  const handleDragModal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveModal(true);
    } else if (e.type === "dragleave") {
      setDragActiveModal(false);
    }
  };

  const handleDropModal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveModal(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0], (base64) => {
        setNewImage(base64);
        showToast("Đã nhận ảnh đại diện cơ sở thành công!", "success");
      });
    }
  };

  const handleFileChangeModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0], (base64) => {
        setNewImage(base64);
        showToast("Đã nhận ảnh đại diện cơ sở thành công!", "success");
      });
    }
  };

  const handleSaveCoordinates = () => {
    if (!selectedBusiness) return;
    
    const updatedBusiness = {
      ...selectedBusiness,
      coordinates: tempCoordinates
    };

    const updatedBusinesses = businesses.map(b => b.id === selectedBusiness.id ? updatedBusiness : b);
    if (onUpdateBusinesses) {
      onUpdateBusinesses(updatedBusinesses);
    }
    setSelectedBusiness(updatedBusiness);
    setIsEditingCoordinates(false);
  };

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newOwner || !newPhone) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }

    const newLicense = "GP-" + Math.floor(100000 + Math.random() * 900000);

    const newB: Business = {
      id: "B" + (businesses.length + 1).toString().padStart(3, "0"),
      name: newName,
      type: newType || "Cửa hàng tiện lợi",
      owner: newOwner,
      phone: newPhone,
      address: newAddress,
      licenseNumber: newLicense,
      status: "Chờ duyệt",
      employeeCount: newEmployeeCount,
      safetyCertified: false,
      coordinates: newCoordinates,
      image: newImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
    };

    const updatedBusinesses = [newB, ...businesses];
    if (onUpdateBusinesses) {
      onUpdateBusinesses(updatedBusinesses);
    }
    setSelectedBusiness(newB);
    setShowAddModal(false);
    showToast("Đã đăng ký hộ kinh doanh mới thành công!", "success");

    // Reset Form
    setNewName("");
    setNewType("");
    setNewOwner("");
    setNewPhone("");
    setNewEmployeeCount(3);
    setNewCoordinates("10°56'07.5\"N 106°44'38.0\"E");
    setNewImage("");
  };

  const filteredBusinesses = (businesses || []).filter(b => {
    if (!b) return false;
    const matchesSearch = (b.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.owner || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.licenseNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Tất cả" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredBusinesses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, startIndex + itemsPerPage);

  // Mock Inspections/Verification Log
  const mockInspections = [
    { date: "05/06/2026", result: "Đạt chuẩn", inspector: "Đoàn liên ngành Phường An Phú", note: "Kiểm tra vệ sinh an toàn thực phẩm, cơ sở sạch sẽ, trang bị đủ bình chữa cháy." },
    { date: "15/04/2026", result: "Cảnh cáo", inspector: "Cảnh sát Phòng cháy Chữa cháy", note: "Bình phòng cháy hết hạn sử dụng. Yêu cầu nạp sạc lại trong vòng 7 ngày." },
    { date: "10/02/2026", result: "Đạt chuẩn", inspector: "Công an khu vực Phường", note: "Kiểm tra khai báo tạm trú cho nhân viên ở lại. Đầy đủ sổ sách." }
  ];

  return (
    <div id="business-management-view" className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý Hộ Kinh doanh Địa phương</h1>
          <p className="text-xs text-slate-500 mt-0.5">Giám sát hoạt động kinh doanh thương mại, giấy phép và an toàn phòng cháy chữa cháy</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Đăng ký Kinh doanh Mới
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên cửa hàng, chủ sở hữu, giấy phép..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter size={14} /> Trạng thái:</span>
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Business List Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBusinesses.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-8 text-center text-sm text-slate-400">
                Không tìm thấy cơ sở kinh doanh nào phù hợp
              </div>
            ) : (
              paginatedBusinesses.map((b) => {
                const statusColors: Record<string, string> = {
                  "Đang hoạt động": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                  "Tạm ngưng": "bg-rose-500/10 text-rose-600 border-rose-500/20",
                  "Chờ duyệt": "bg-amber-500/10 text-amber-600 border-amber-500/20"
                };
                const statusClass = statusColors[b.status] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
                const isSelected = selectedBusiness?.id === b.id;
                return (
                  <div 
                    key={b.id}
                    id={`business-card-${b.id}`}
                    onClick={() => setSelectedBusiness(b)}
                    className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3
                      ${isSelected ? "border-emerald-500 ring-2 ring-emerald-500/5 shadow-sm" : "border-slate-100"}
                    `}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono uppercase">{fixMojibake(b.type)}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusClass}`}>
                          {fixMojibake(b.status)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{fixMojibake(b.name)}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={12} className="shrink-0" /> <span className="truncate">{fixMojibake(b.address)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User size={12} /> {fixMojibake(b.owner)}</span>
                      {b.safetyCertified && (
                        <span className="flex items-center gap-0.5 text-emerald-600 font-semibold text-[10px]">
                          <ShieldCheck size={12} /> AN TOÀN PCCC
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Pagination
            id="business-pagination"
            currentPage={activePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right Side: Detailed Details Card with Regulatory Checks */}
        <div className="lg:col-span-1">
          {selectedBusiness ? (
            <div id="business-detail-panel" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden sticky top-6 space-y-5">
              
              {/* Image Banner */}
              <div 
                className={`relative h-40 bg-slate-100 group overflow-hidden transition-all duration-200 border-b
                  ${dragActiveDetail ? "border-emerald-500 ring-4 ring-emerald-500/20" : "border-slate-100"}
                `}
                onDragEnter={handleDragDetail}
                onDragOver={handleDragDetail}
                onDragLeave={handleDragDetail}
                onDrop={handleDropDetail}
              >
                <img 
                  src={selectedBusiness.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400"} 
                  alt={selectedBusiness.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual drag & drop/click overlay */}
                <div className={`absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer
                  ${dragActiveDetail ? "opacity-100 bg-emerald-950/60" : ""}
                `}>
                  <label className="cursor-pointer flex flex-col items-center text-white p-4 text-center w-full h-full justify-center">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChangeDetail}
                    />
                    <Camera size={22} className="text-emerald-400 animate-bounce" />
                    <span className="text-[11px] font-bold mt-1.5 text-white">Nhấp để chọn tệp</span>
                    <span className="text-[9px] text-slate-300 mt-0.5">hoặc Kéo & Thả ảnh cơ sở vào đây</span>
                  </label>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end pointer-events-none">
                  <div>
                    <h3 className="font-extrabold text-white text-sm leading-tight drop-shadow-md">{fixMojibake(selectedBusiness.name)}</h3>
                    <span className="text-[10px] text-emerald-300 font-mono font-bold drop-shadow-md">{selectedBusiness.licenseNumber}</span>
                  </div>
                  {/* Small floating indicator for change button */}
                  <div className="bg-slate-900/60 backdrop-blur-xs text-[10px] font-bold text-white px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 group-hover:hidden transition-all shadow-xs shrink-0">
                    <Camera size={11} className="text-emerald-400" /> Đổi ảnh
                  </div>
                </div>
              </div>

              {/* Core Details */}
              <div className="px-5 pb-5 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-50 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">Đại diện pháp luật</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1"><User size={13} className="text-slate-400" /> {fixMojibake(selectedBusiness.owner)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-medium block">Số điện thoại liên hệ</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1 font-mono"><Phone size={13} className="text-slate-400" /> {selectedBusiness.phone}</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400 shrink-0"><MapPin size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Địa chỉ đăng ký kinh doanh</span>
                      <span className="text-slate-800 font-semibold">{fixMojibake(selectedBusiness.address)}</span>
                    </div>
                  </div>

                  {/* Google Coordinates and Navigation */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/40">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 bg-indigo-100 text-indigo-700 rounded shrink-0"><MapPin size={13} /></div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-indigo-500 font-bold block uppercase tracking-wide">Tọa độ định vị Google</span>
                        {isEditingCoordinates ? (
                          <div className="flex gap-1 mt-1">
                            <input
                              type="text"
                              value={tempCoordinates}
                              onChange={(e) => setTempCoordinates(e.target.value)}
                              placeholder="10°56'07.5&quot;N 106°44'38.0&quot;E"
                              className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-indigo-500 bg-white font-mono min-w-0"
                            />
                            <button
                              type="button"
                              onClick={handleSaveCoordinates}
                              className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingCoordinates(false)}
                              className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] hover:bg-slate-300 transition-colors cursor-pointer shrink-0"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-slate-800 font-mono font-bold text-xs truncate">
                              {formatCoordinates(selectedBusiness.coordinates) || "Chưa thiết lập"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setTempCoordinates(formatCoordinates(selectedBusiness.coordinates));
                                setIsEditingCoordinates(true);
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold shrink-0 cursor-pointer"
                            >
                              {selectedBusiness.coordinates ? "Sửa" : "Thiết lập"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedBusiness.coordinates && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatCoordinates(selectedBusiness.coordinates))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all shadow-sm cursor-pointer"
                      >
                        <MapPin size={12} />
                        Chỉ đường trên Google Maps ➜
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Layers size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Số lượng nhân viên</span>
                      <span className="text-slate-800 font-semibold">{selectedBusiness.employeeCount} nhân viên làm việc</span>
                    </div>
                  </div>

                  {/* Certification Badge */}
                  <div className={`p-3 rounded-lg border flex items-center gap-3
                    ${selectedBusiness.safetyCertified 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-rose-50 border-rose-100 text-rose-800"
                    }
                  `} style={{
                    backgroundColor: selectedBusiness.safetyCertified ? "#ecfdf5" : "#fef2f2",
                    borderColor: selectedBusiness.safetyCertified ? "#d1fae5" : "#fee2e2"
                  }}>
                    {selectedBusiness.safetyCertified ? (
                      <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert size={20} className="text-rose-600 shrink-0" />
                    )}
                    <div className="flex-1 text-xs">
                      <span className="font-bold block" style={{ color: selectedBusiness.safetyCertified ? "#065f46" : "#991b1b" }}>
                        {selectedBusiness.safetyCertified ? "Chứng chỉ An toàn PCCC: Đạt" : "Không đạt / Chưa có chứng chỉ PCCC"}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {selectedBusiness.safetyCertified ? "Giá trị pháp lý đến 2028" : "Cơ sở chưa trình nộp hồ sơ thẩm định"}
                      </span>
                    </div>
                    <button 
                      onClick={() => onToggleCertification(selectedBusiness.id)}
                      className="px-2 py-1 rounded bg-white text-[10px] font-bold shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>

                {/* Verification/Inspection Logs */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Nhật ký Kiểm tra định kỳ</h4>
                  </div>
                  
                  <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                    {mockInspections.map((inspect, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-[11px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-700">{inspect.inspector}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${inspect.result === "Đạt chuẩn" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                            {inspect.result}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">{inspect.note}</p>
                        <span className="text-[9px] text-slate-400 block font-mono">Ngày kiểm tra: {inspect.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fast Admin Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateStatus(selectedBusiness.id, "Đang hoạt động")}
                      className="flex-1 text-[10px] font-bold py-1.5 px-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-center"
                    >
                      Hoạt động
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(selectedBusiness.id, "Tạm ngưng")}
                      className="flex-1 text-[10px] font-bold py-1.5 px-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer text-center"
                    >
                      Tạm ngưng
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(selectedBusiness.id, "Chờ duyệt")}
                      className="flex-1 text-[10px] font-bold py-1.5 px-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-center"
                    >
                      Chờ duyệt
                    </button>
                  </div>

                  <button 
                    onClick={() => handleOpenEditModal(selectedBusiness)}
                    className="w-full text-[10px] font-bold py-2 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm mt-1"
                  >
                    <Pencil size={13} /> Chỉnh sửa thông tin hộ kinh doanh
                  </button>

                  <button 
                    onClick={() => setBusinessToDelete(selectedBusiness)}
                    className="w-full text-[10px] font-bold py-2 px-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm mt-1"
                  >
                    <Trash2 size={13} /> Xóa hộ kinh doanh khỏi danh sách
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-xl p-8 text-center text-xs">
              Chọn một hộ kinh doanh ở danh sách để xem hồ sơ kiểm duyệt định kỳ
            </div>
          )}
        </div>

      </div>

      {/* Add New Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">Đăng ký Hộ Kinh doanh Mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBusiness} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Tên Hộ Kinh Doanh *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Cửa hàng tạp hóa An Bình"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Lĩnh vực / Loại hình *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ăn uống, Tạp hóa, Dịch vụ..."
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Chủ sở hữu *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn B"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="090xxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số nhân viên</label>
                  <input 
                    type="number" 
                    value={newEmployeeCount}
                    onChange={(e) => setNewEmployeeCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Địa chỉ cơ sở *</label>
                  <input 
                    type="text" 
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Drag-and-drop image upload field in Add Modal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Hình ảnh đại diện cơ sở kinh doanh</label>
                <div 
                  className={`border border-dashed rounded-xl p-4 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer relative
                    ${dragActiveModal ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-slate-350"}
                    ${newImage ? "bg-slate-50/50" : "bg-white"}
                  `}
                  onDragEnter={handleDragModal}
                  onDragOver={handleDragModal}
                  onDragLeave={handleDragModal}
                  onDrop={handleDropModal}
                >
                  {newImage ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100">
                        <img 
                          src={newImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewImage("")}
                          className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ Tải lên ảnh thành công! Sẵn sàng đăng ký.</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full py-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChangeModal}
                      />
                      <Upload size={20} className="text-slate-400 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Kéo thả ảnh tại đây, hoặc <span className="text-emerald-600 hover:underline font-bold">chọn từ thiết bị</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Định dạng JPG, PNG. Dung lượng dưới 5MB</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block flex items-center justify-between">
                  <span>Tọa độ định vị Google Maps</span>
                  <span className="text-[10px] text-slate-400 font-normal font-mono">Ví dụ: 10°56'07.5"N 106°44'38.0"E</span>
                </label>
                <input 
                  type="text" 
                  placeholder="10°56'07.5&quot;N 106°44'38.0&quot;E"
                  value={newCoordinates}
                  onChange={(e) => setNewCoordinates(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Đăng ký Kinh doanh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2
            ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse" : "bg-rose-50 border-rose-200 text-rose-800"}
          `}>
            <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}></span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Modern Custom Business Deletion Confirmation Dialog */}
      {businessToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Xác nhận xóa hộ kinh doanh</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa hộ kinh doanh <strong className="text-slate-800">{businessToDelete.name}</strong> (<span className="text-rose-700 font-semibold">{businessToDelete.licenseNumber}</span>) thuộc đại diện <strong className="text-slate-800">{businessToDelete.owner}</strong> ra khỏi danh sách quản lý địa phương không?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBusinessToDelete(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => executeDeleteBusiness(businessToDelete.id)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-indigo-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Pencil size={18} /> Chỉnh sửa Hộ Kinh doanh</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateBusiness} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Tên Hộ Kinh Doanh *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Cửa hàng tạp hóa An Bình"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Lĩnh vực / Loại hình *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ăn uống, Tạp hóa, Dịch vụ..."
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Chủ sở hữu *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn B"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="090xxxxxxx"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số nhân viên</label>
                  <input 
                    type="number" 
                    value={editEmployeeCount}
                    onChange={(e) => setEditEmployeeCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Địa chỉ cơ sở *</label>
                  <input 
                    type="text" 
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Drag-and-drop image upload field in Edit Modal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Hình ảnh đại diện cơ sở kinh doanh</label>
                <div 
                  className={`border border-dashed rounded-xl p-4 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer relative
                    ${dragActiveEditModal ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-slate-350"}
                    ${editImage ? "bg-slate-50/50" : "bg-white"}
                  `}
                  onDragEnter={handleDragEditModal}
                  onDragOver={handleDragEditModal}
                  onDragLeave={handleDragEditModal}
                  onDrop={handleDropEditModal}
                >
                  {editImage ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100">
                        <img 
                          src={editImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditImage("")}
                          className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold mt-1.5">✓ Tải lên ảnh thành công! Sẵn sàng cập nhật.</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full py-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChangeEditModal}
                      />
                      <Upload size={20} className="text-slate-400 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Kéo thả ảnh tại đây, hoặc <span className="text-indigo-600 hover:underline font-bold">chọn từ thiết bị</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Định dạng JPG, PNG. Dung lượng dưới 5MB</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block flex items-center justify-between">
                  <span>Tọa độ định vị Google Maps</span>
                  <span className="text-[10px] text-slate-400 font-normal font-mono">Ví dụ: 10°56'07.5"N 106°44'38.0"E</span>
                </label>
                <input 
                  type="text" 
                  placeholder="10°56'07.5&quot;N 106°44'38.0&quot;E"
                  value={editCoordinates}
                  onChange={(e) => setEditCoordinates(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
