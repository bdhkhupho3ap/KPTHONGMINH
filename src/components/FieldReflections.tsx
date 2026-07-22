import React, { useState } from "react";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  ArrowRight,
  Plus,
  X,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  TrendingUp,
  Upload,
  Pencil,
  Trash2
} from "lucide-react";
import { FieldReport } from "../types";
import Pagination from "./Pagination";

interface FieldReflectionsProps {
  reports: FieldReport[];
  onAddReport: (newReport: FieldReport) => void;
  onUpdateReportStatus: (id: string, status: "Đã tiếp nhận" | "Đang xử lý" | "Đã giải quyết", actorName?: string, actionDetail?: string) => void;
  onUpdateReports?: (reports: FieldReport[]) => void;
}

export default function FieldReflections({ reports, onAddReport, onUpdateReportStatus, onUpdateReports }: FieldReflectionsProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const selectedReport = reports.find(r => r.id === selectedReportId) || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // New Report Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Rác thải" | "Lấn chiếm lòng đường" | "Tiếng ồn" | "An ninh trật tự" | "Hạ tầng đô thị">("Rác thải");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [location, setLocation] = useState("42/ Lương Định Của");
  const [description, setDescription] = useState("");

  // Deletion States
  const [reportToDelete, setReportToDelete] = useState<FieldReport | null>(null);

  // Edit States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<"Rác thải" | "Lấn chiếm lòng đường" | "Tiếng ồn" | "An ninh trật tự" | "Hạ tầng đô thị">("Rác thải");
  const [editLocation, setEditLocation] = useState("");
  const [editReporterName, setEditReporterName] = useState("");
  const [editReporterPhone, setEditReporterPhone] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBeforeImage, setEditBeforeImage] = useState("");
  const [dragActiveEdit, setDragActiveEdit] = useState(false);

  // Custom Resolve States
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveImage, setResolveImage] = useState("");
  const [resolveDescription, setResolveDescription] = useState("Xử lý dọn dẹp hiện trạng thành công, trả lại mỹ quan cho vỉa hè / khu dân cư.");
  const [dragActiveResolve, setDragActiveResolve] = useState(false);

  // Image Upload and Drag & Drop states
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chỉ chọn tệp hình ảnh (jpg, png, jpeg...)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBeforeImage(reader.result as string);
      showToast("Đã đính kèm ảnh hiện trường thành công!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Execute Deletion
  const executeDeleteReport = (id: string) => {
    if (onUpdateReports) {
      const remaining = reports.filter(r => r.id !== id);
      onUpdateReports(remaining);
      showToast("Đã xóa phản ánh khỏi hệ thống thành công!", "success");
      setReportToDelete(null);
      setSelectedReportId(remaining[0]?.id || null);
    } else {
      showToast("Không tìm thấy hàm cập nhật danh sách!", "error");
    }
  };

  // Open Edit Modal with Pre-populated details
  const handleOpenEditModal = (report: FieldReport) => {
    setEditTitle(report.title);
    setEditCategory(report.category);
    setEditLocation(report.location);
    setEditReporterName(report.reporterName);
    setEditReporterPhone(report.reporterPhone);
    setEditDescription(report.description);
    setEditBeforeImage(report.beforeImage || "");
    setShowEditModal(true);
  };

  // Execute Update of Report Details
  const handleUpdateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    const updated: FieldReport = {
      ...selectedReport,
      title: editTitle,
      category: editCategory,
      location: editLocation,
      reporterName: editReporterName,
      reporterPhone: editReporterPhone,
      description: editDescription,
      beforeImage: editBeforeImage
    };

    if (onUpdateReports) {
      const updatedList = reports.map(r => r.id === selectedReport.id ? updated : r);
      onUpdateReports(updatedList);
      showToast("Đã cập nhật thông tin phản ánh thành công!", "success");
      setShowEditModal(false);
    } else {
      showToast("Không tìm thấy hàm cập nhật danh sách!", "error");
    }
  };

  // Image Upload and drag handlers for Edit Modal
  const handleFileProcessEdit = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chỉ chọn tệp hình ảnh (jpg, png, jpeg...)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditBeforeImage(reader.result as string);
      showToast("Đã tải lên ảnh hiện trường mới!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleDragEdit = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveEdit(true);
    } else if (e.type === "dragleave") {
      setDragActiveEdit(false);
    }
  };

  const handleDropEdit = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveEdit(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcessEdit(e.dataTransfer.files[0]);
    }
  };

  const handleFileChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcessEdit(e.target.files[0]);
    }
  };

  // Open Resolve (Complete) Dialog
  const handleOpenResolveModal = () => {
    setResolveImage("");
    setResolveDescription("Đã cử lực lượng chức năng đến xử lý hiện trạng sạch sẽ, trả lại cảnh quan đô thị thông thoáng.");
    setShowResolveModal(true);
  };

  // Execute Resolve (Complete) with optional photo
  const executeResolveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    // Call standard App.tsx update to set general progress log
    onUpdateReportStatus(
      selectedReport.id,
      "Đã giải quyết",
      "Ủy ban Nhân dân Phường",
      resolveDescription
    );

    // Save customized details into memory
    if (onUpdateReports) {
      setTimeout(() => {
        onUpdateReports(reports.map(r => {
          if (r.id === selectedReport.id) {
            const timeStr = new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour12: false });
            return {
              ...r,
              status: "Đã giải quyết",
              afterImage: resolveImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300",
              timeline: [
                ...r.timeline.filter(item => item.title !== "Đã xử lý hoàn thành"), // remove the generic one if added
                {
                  time: timeStr,
                  title: "Đã xử lý hoàn thành",
                  description: resolveDescription,
                  actor: "Ủy ban Nhân dân Phường"
                }
              ]
            };
          }
          return r;
        }));
      }, 50);
    }

    setShowResolveModal(false);
    showToast("Đã xử lý và lưu kết quả giải quyết phản ánh thành công!", "success");
  };

  // Image Upload and drag handlers for Resolve Modal
  const handleFileProcessResolve = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chỉ chọn tệp hình ảnh (jpg, png, jpeg...)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setResolveImage(reader.result as string);
      showToast("Đã tải lên ảnh kết quả hoàn thành!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleDragResolve = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveResolve(true);
    } else if (e.type === "dragleave") {
      setDragActiveResolve(false);
    }
  };

  const handleDropResolve = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveResolve(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcessResolve(e.dataTransfer.files[0]);
    }
  };

  const handleFileChangeResolve = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcessResolve(e.target.files[0]);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !reporterName || !reporterPhone) {
      showToast("Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)", "error");
      return;
    }

    const newReport: FieldReport = {
      id: "REP" + (reports.length + 1).toString().padStart(3, "0"),
      title,
      category,
      reporterName,
      reporterPhone,
      reportedAt: new Date().toLocaleString("vi-VN", { hour12: false }).replace(/\//g, "-"),
      location,
      coordinates: { x: Math.floor(20 + Math.random() * 60), y: Math.floor(20 + Math.random() * 60) },
      description,
      status: "Đã tiếp nhận",
      timeline: [
        { 
          time: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour12: false }),
          title: "Gửi phản ánh",
          description: "Hệ thống ghi nhận ý kiến phản ánh từ công dân kèm ảnh hiện trường đính kèm.",
          actor: `${reporterName} (Công dân)`
        }
      ],
      beforeImage: beforeImage || "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=300" // default mock issue image
    };

    onAddReport(newReport);
    setSelectedReportId(newReport.id);
    setShowModal(false);
    showToast("Đã gửi phản ánh hiện trường 1022 mới thành công!", "success");

    // Reset Form
    setTitle("");
    setReporterName("");
    setReporterPhone("");
    setDescription("");
    setBeforeImage("");
  };

  // Filter Reports logic
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredReports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div id="field-reflections-view" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tiếp nhận Phản ánh Hiện trường (1022)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Xử lý kịp thời các ý kiến, khiếu nại của cư dân về môi trường, trật tự đô thị, hạ tầng và an ninh</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Gửi Phản Ánh Mới
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo nội dung phản ánh, người báo, địa chỉ..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter size={14} /> Lọc trạng thái:</span>
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Đã tiếp nhận">Đã tiếp nhận</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đã giải quyết">Đã giải quyết</option>
          </select>
        </div>
      </div>

      {/* Main Splits Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Tickets List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách phản ánh ({filteredReports.length})</span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Không có phản ánh nào phù hợp</div>
            ) : (
              paginatedReports.map((report) => {
                const statusColors = {
                  "Đã tiếp nhận": "bg-blue-50 text-blue-600 border-blue-100",
                  "Đang xử lý": "bg-amber-50 text-amber-600 border-amber-100",
                  "Đã giải quyết": "bg-emerald-50 text-emerald-600 border-emerald-100"
                };
                const isSelected = selectedReportId === report.id;
                return (
                  <div
                    key={report.id}
                    id={`report-item-${report.id}`}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-4 flex flex-col gap-2 cursor-pointer transition-colors text-left
                      ${isSelected ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-emerald-500" : "hover:bg-slate-50/50"}
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{report.category}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[report.status]}`}>
                        {report.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-xs leading-normal line-clamp-2">{report.title}</h3>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span className="truncate">{report.location}</span>
                      <span className="shrink-0">{report.reportedAt.split(" ")[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Pagination
            id="reflection-pagination"
            currentPage={activePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right Side: Detailed timeline view */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div id="reflection-detail-panel" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1 flex-1 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 px-2.5 py-0.5 bg-indigo-50 rounded font-mono">{selectedReport.id}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> {selectedReport.reportedAt}</span>
                    </div>
                    {/* Edit / Delete report quick action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(selectedReport)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil size={13} />
                        Sửa
                      </button>
                      <button
                        onClick={() => setReportToDelete(selectedReport)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                        title="Xóa phản ánh"
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>
                  <h2 className="font-extrabold text-slate-800 text-base">{selectedReport.title}</h2>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" /> {selectedReport.location}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 self-stretch sm:self-auto min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Người báo phản ánh:</span>
                  <div className="font-semibold text-slate-700 flex items-center gap-1"><User size={12} /> {selectedReport.reporterName}</div>
                  <div className="font-mono text-slate-500 flex items-center gap-1"><Phone size={12} /> {selectedReport.reporterPhone}</div>
                </div>
              </div>

              {/* Description body */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nội dung chi tiết</span>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">{selectedReport.description}</p>
              </div>

              {/* Before/After Images Panel (side-by-side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><ImageIcon size={14} /> Hình ảnh hiện trạng (Trước)</span>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    {selectedReport.beforeImage ? (
                      <img 
                        src={selectedReport.beforeImage} 
                        alt="Before reflection status"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Camera size={24} className="mb-1 text-slate-300" /> Không có hình ảnh đính kèm
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><CheckCircle size={14} className="text-emerald-500" /> Kết quả hoàn thành (Sau)</span>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                    {selectedReport.afterImage ? (
                      <img 
                        src={selectedReport.afterImage} 
                        alt="After reflection completion status"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-xs text-center p-4">
                        <Clock size={24} className="mb-1 text-slate-300" /> 
                        <span>Chưa xử lý xong</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Tiến độ công việc sẽ được cập nhật sau khi hoàn thành</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline route logs */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lộ trình xử lý phản ánh</span>
                
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedReport.timeline.map((item, idx) => (
                    <div key={idx} className="relative text-xs space-y-0.5">
                      {/* Timeline dot */}
                      <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                      </div>
                      <p className="text-slate-500">{item.description}</p>
                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Thực hiện bởi: {item.actor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons to update status */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                {selectedReport.status !== "Đã giải quyết" ? (
                  <>
                    <button
                      onClick={() => onUpdateReportStatus(
                        selectedReport.id, 
                        "Đang xử lý", 
                        "Cán bộ trật tự đô thị",
                        "Xuống thực địa xác minh phản ánh và lập biên bản xử lý vi phạm."
                      )}
                      disabled={selectedReport.status === "Đang xử lý"}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Phê duyệt & Chuyển sang: ĐANG XỬ LÝ
                    </button>
                    <button
                      onClick={handleOpenResolveModal}
                      className="flex-1 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white hover:from-emerald-700 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      Báo cáo Hoàn Thành: ĐÃ GIẢI QUYẾT
                    </button>
                  </>
                ) : (
                  <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg text-center font-bold text-xs">
                    ✓ Phản ánh này đã được giải quyết hoàn tất thành công. Ý kiến công dân được ghi nhận tích cực.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-xl p-8 text-center text-xs">
              Chọn một phản ánh ở danh sách bên để kiểm tra lộ trình và cập nhật tiến độ
            </div>
          )}
        </div>

      </div>

      {/* Add New Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Gửi phản ánh hiện trường mới (Phản hồi 1022)</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Tiêu đề phản ánh ngắn gọn *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Đống rác tự phát chắn lối hẻm 42"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Danh mục sự việc</label>
                  <select 
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Rác thải">Rác thải</option>
                    <option value="Lấn chiếm lòng đường">Lấn chiếm lòng đường</option>
                    <option value="Tiếng ồn">Tiếng ồn</option>
                    <option value="An ninh trật tự">An ninh trật tự</option>
                    <option value="Hạ tầng đô thị">Hạ tầng đô thị</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Vị trí hiện trường *</label>
                  <input 
                    type="text" 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Họ tên người báo tin *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn B"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại liên lạc *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="09xxxxxxxx"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Mô tả tình huống hiện trạng</label>
                <textarea 
                  rows={3}
                  placeholder="Ghi rõ chi tiết sự việc để ban tự quản và đội đô thị phường dễ dàng xác minh..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Drag-and-drop image upload field in Add Report Modal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Hình ảnh đính kèm hiện trạng</label>
                <div 
                  className={`border border-dashed rounded-xl p-4 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer relative
                    ${dragActive ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-slate-350"}
                    ${beforeImage ? "bg-slate-50/50" : "bg-white"}
                  `}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  {beforeImage ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100">
                        <img 
                          src={beforeImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setBeforeImage("")}
                          className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ Đã đính kèm ảnh hiện trạng! Sẵn sàng gửi.</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full py-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      <Upload size={20} className="text-slate-400 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Kéo thả ảnh tại đây, hoặc <span className="text-emerald-600 hover:underline font-bold">chọn từ thiết bị</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Định dạng JPG, PNG. Dung lượng dưới 5MB</p>
                    </label>
                  )}
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Gửi Phản Ánh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-4 text-xs">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Xác nhận xóa phản ánh</h3>
                <p className="text-xs text-slate-500">Bạn có chắc chắn muốn xóa phản ánh <span className="font-mono text-indigo-600 font-bold">{reportToDelete.id}</span> không? Hành động này không thể hoàn tác.</p>
              </div>
              <div className="flex gap-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteReport(reportToDelete.id)}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Xác nhận Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Chỉnh sửa thông tin phản ánh</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateReport} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Tiêu đề phản ánh *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Tiêu đề sự việc"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Danh mục sự việc</label>
                  <select 
                    value={editCategory}
                    onChange={(e: any) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Rác thải">Rác thải</option>
                    <option value="Lấn chiếm lòng đường">Lấn chiếm lòng đường</option>
                    <option value="Tiếng ồn">Tiếng ồn</option>
                    <option value="An ninh trật tự">An ninh trật tự</option>
                    <option value="Hạ tầng đô thị">Hạ tầng đô thị</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Vị trí hiện trường *</label>
                  <input 
                    type="text" 
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Họ tên người báo tin *</label>
                  <input 
                    type="text" 
                    required
                    value={editReporterName}
                    onChange={(e) => setEditReporterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại liên lạc *</label>
                  <input 
                    type="text" 
                    required
                    value={editReporterPhone}
                    onChange={(e) => setEditReporterPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Mô tả tình huống hiện trạng</label>
                <textarea 
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Drag-and-drop image upload field in Edit Report Modal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Hình ảnh đính kèm hiện trạng mới</label>
                <div 
                  className={`border border-dashed rounded-xl p-4 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer relative
                    ${dragActiveEdit ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-slate-350"}
                    ${editBeforeImage ? "bg-slate-50/50" : "bg-white"}
                  `}
                  onDragEnter={handleDragEdit}
                  onDragOver={handleDragEdit}
                  onDragLeave={handleDragEdit}
                  onDrop={handleDropEdit}
                >
                  {editBeforeImage ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-100">
                        <img 
                          src={editBeforeImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditBeforeImage("")}
                          className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ Đã đính kèm ảnh hiện trạng!</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full py-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChangeEdit}
                      />
                      <Upload size={20} className="text-slate-400 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Kéo thả ảnh tại đây, hoặc <span className="text-emerald-600 hover:underline font-bold">chọn từ thiết bị</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Định dạng JPG, PNG. Dung lượng dưới 5MB</p>
                    </label>
                  )}
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Report Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Báo cáo Hoàn Thành: ĐÃ GIẢI QUYẾT</h3>
                <p className="text-[10px] text-emerald-100 mt-0.5">Cập nhật ảnh thực địa sau xử lý và mô tả kết quả xử lý thực địa</p>
              </div>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="text-emerald-100 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={executeResolveReport} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Nội dung giải quyết thực tế *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Ghi rõ chi tiết kết quả xử lý..."
                  value={resolveDescription}
                  onChange={(e) => setResolveDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              {/* Drag-and-drop image upload field in Resolve Modal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Hình ảnh kết quả sau xử lý (Sau) *</label>
                <div 
                  className={`border border-dashed rounded-xl p-4 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer relative
                    ${dragActiveResolve ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-slate-350"}
                    ${resolveImage ? "bg-slate-50/50" : "bg-white"}
                  `}
                  onDragEnter={handleDragResolve}
                  onDragOver={handleDragResolve}
                  onDragLeave={handleDragResolve}
                  onDrop={handleDropResolve}
                >
                  {resolveImage ? (
                    <div className="relative w-full flex flex-col items-center">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-100">
                        <img 
                          src={resolveImage} 
                          alt="Resolve Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setResolveImage("")}
                          className="absolute top-1.5 right-1.5 bg-slate-900/75 hover:bg-slate-900 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ Đã tải ảnh thực địa hoàn thành! Sẵn sàng hoàn thành.</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full py-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChangeResolve}
                      />
                      <Camera size={24} className="text-slate-400 mb-1.5 animate-bounce" />
                      <p className="text-xs font-semibold text-slate-700">Kéo thả ảnh thực địa hoàn thành, hoặc <span className="text-emerald-600 hover:underline font-bold">chọn từ thiết bị</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Bắt buộc tải ảnh minh chứng trước khi giải quyết hoàn tất</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <CheckCircle size={16} /> Xác nhận Hoàn Thành
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
    </div>
  );
}
