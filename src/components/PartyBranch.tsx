import React, { useState } from "react";
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Plus, 
  X, 
  Search, 
  Trash2, 
  Edit2,
  Award, 
  Flame, 
  Calendar, 
  Heart, 
  MapPin, 
  PlusCircle, 
  UserCheck, 
  CheckCircle,
  FolderPlus,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Resident, PartyMember } from "../types";
import Pagination from "./Pagination";

interface AssociationMember {
  id: string;
  fullName: string;
  role: string; // Chức vụ: Chi hội trưởng, Chi hội phó, Hội viên, Đoàn viên, Chiến sĩ, Bí thư...
  cccd: string;
  phone?: string;
  birthDate?: string;
}

interface Association {
  id: string;
  name: string;
  category: "Chính trị - Xã hội" | "An ninh - Quốc phòng" | "Đoàn thể nhân dân" | "Hội quần chúng";
  description: string;
  leaderName: string;
  leaderCccd: string;
  members: AssociationMember[];
}

interface PartyBranchProps {
  partyMembers: PartyMember[];
  residents?: Resident[];
}

export default function PartyBranch({ partyMembers, residents = [] }: PartyBranchProps) {
  // Pre-populated default associations (Chi hội) matching the user requirements
  const [associations, setAssociations] = useState<Association[]>([
    {
      id: "ASC001",
      name: "Chi bộ Đảng (Đảng viên)",
      category: "Chính trị - Xã hội",
      description: "Tổ chức hạt nhân lãnh đạo chính trị tại cơ sở, đề ra chủ trương chỉ đạo các mặt đời sống xã hội.",
      leaderName: "",
      leaderCccd: "",
      members: []
    },
    {
      id: "ASC002",
      name: "Lực lượng ANCS (An ninh cơ sở)",
      category: "An ninh - Quốc phòng",
      description: "Lực lượng nòng cốt bảo vệ an ninh trật tự, tuần tra, giữ gìn bình yên các tuyến hẻm nội khu.",
      leaderName: "",
      leaderCccd: "",
      members: []
    },
    {
      id: "ASC003",
      name: "Lực lượng dân quân tự vệ",
      category: "An ninh - Quốc phòng",
      description: "Thực hiện nhiệm vụ sẵn sàng chiến đấu, khắc phục thiên tai, cứu hộ cứu nạn và bảo vệ chính quyền.",
      leaderName: "",
      leaderCccd: "",
      members: []
    },
    {
      id: "ASC004",
      name: "Đoàn viên thanh niên (Chi đoàn KP3)",
      category: "Đoàn thể nhân dân",
      description: "Chi đoàn Thanh niên Cộng sản Hồ Chí Minh Khu phố 3, dẫn đầu các hoạt động văn hóa, chuyển đổi số.",
      leaderName: "",
      leaderCccd: "",
      members: []
    },
    {
      id: "ASC005",
      name: "Chi hội Cựu chiến binh (CCB)",
      category: "Đoàn thể nhân dân",
      description: "Hội cựu chiến binh gương mẫu bảo vệ Đảng, chính quyền, giáo dục truyền thống cách mạng cho thế hệ trẻ.",
      leaderName: "",
      leaderCccd: "",
      members: []
    },
    {
      id: "ASC006",
      name: "Chi hội Phụ nữ",
      category: "Đoàn thể nhân dân",
      description: "Vận động phụ nữ tham gia phát triển kinh tế xã hội, bảo vệ quyền lợi hợp pháp và hạnh phúc gia đình.",
      leaderName: "",
      leaderCccd: "",
      members: []
    }
  ]);

  const [selectedAssociationId, setSelectedAssociationId] = useState<string>("ASC001");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Selected association derived from ID for single source of truth and instant reactivity
  const selectedAssociation = associations.find(a => a.id === selectedAssociationId) || associations[0];

  // Modern Toast alert system for cross-origin iframe compliance (replaces window.alert)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Custom modal state for member deletion (replaces window.confirm)
  const [memberToDelete, setMemberToDelete] = useState<{ cccd: string; name: string } | null>(null);

  // Custom modal state for editing member role
  const [editingMember, setEditingMember] = useState<AssociationMember | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<string>("");

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  // State for creating new Association
  const [showAddAssocModal, setShowAddAssocModal] = useState(false);
  const [newAssocName, setNewAssocName] = useState("");
  const [newAssocCategory, setNewAssocCategory] = useState<"Chính trị - Xã hội" | "An ninh - Quốc phòng" | "Đoàn thể nhân dân" | "Hội quần chúng">("Đoàn thể nhân dân");
  const [newAssocDesc, setNewAssocDesc] = useState("");
  const [newAssocLeaderCccd, setNewAssocLeaderCccd] = useState("");
  const [newAssocLeaderRole, setNewAssocLeaderRole] = useState("Chi hội trưởng");

  // State for adding a member from Residents database
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedResidentCccd, setSelectedResidentCccd] = useState("");
  const [memberRole, setMemberRole] = useState("Hội viên");
  const [residentSearchTerm, setResidentSearchTerm] = useState("");

  // Create new Association
  const handleCreateAssociation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssocName.trim()) {
      showToast("Vui lòng nhập tên chi hội!", "error");
      return;
    }

    // Try to find the leader in residents database
    const leaderResident = residents.find(r => r.cccd === newAssocLeaderCccd);
    const leaderName = leaderResident ? leaderResident.fullName : "Chưa xác định";

    const newAssoc: Association = {
      id: "ASC" + (associations.length + 1).toString().padStart(3, "0"),
      name: newAssocName,
      category: newAssocCategory,
      description: newAssocDesc || "Không có mô tả chi tiết.",
      leaderName: leaderName,
      leaderCccd: newAssocLeaderCccd || "N/A",
      members: leaderResident ? [
        {
          id: "M" + Date.now(),
          fullName: leaderResident.fullName,
          role: newAssocLeaderRole || "Chi hội trưởng",
          cccd: leaderResident.cccd,
          phone: leaderResident.phone,
          birthDate: leaderResident.birthDate
        }
      ] : []
    };

    const updated = [...associations, newAssoc];
    setAssociations(updated);
    setSelectedAssociationId(newAssoc.id);
    setShowAddAssocModal(false);
    showToast("Đã tạo Chi hội mới thành công", "success");

    // Reset Form
    setNewAssocName("");
    setNewAssocDesc("");
    setNewAssocLeaderCccd("");
    setNewAssocLeaderRole("Chi hội trưởng");
  };

  // Add a member from the existing Residents database
  const handleAddMemberFromResidents = () => {
    if (!selectedResidentCccd) {
      showToast("Vui lòng chọn một cư dân từ danh sách!", "error");
      return;
    }

    // Check if the resident is already a member of this Association
    const alreadyMember = selectedAssociation.members.some(m => m.cccd === selectedResidentCccd);
    if (alreadyMember) {
      showToast("Cư dân này đã là thành viên của chi hội này!", "error");
      return;
    }

    const residentObj = residents.find(r => r.cccd === selectedResidentCccd);
    if (!residentObj) return;

    const newMember: AssociationMember = {
      id: "M" + Date.now(),
      fullName: residentObj.fullName,
      role: memberRole,
      cccd: residentObj.cccd,
      phone: residentObj.phone || "N/A",
      birthDate: residentObj.birthDate
    };

    const updatedMembers = [...selectedAssociation.members, newMember];
    
    // Check if the role is a main leader role and we want to auto-assign leadership
    let updatedLeaderName = selectedAssociation.leaderName;
    let updatedLeaderCccd = selectedAssociation.leaderCccd;
    if (["Bí thư", "Chi hội trưởng", "Tổ trưởng", "Chỉ huy trưởng"].includes(memberRole)) {
      updatedLeaderName = residentObj.fullName;
      updatedLeaderCccd = residentObj.cccd;
    }

    const updatedAssociation: Association = {
      ...selectedAssociation,
      leaderName: updatedLeaderName,
      leaderCccd: updatedLeaderCccd,
      members: updatedMembers
    };

    const updatedAssociations = associations.map(a => a.id === selectedAssociation.id ? updatedAssociation : a);
    setAssociations(updatedAssociations);
    showToast("Đã ghi danh thành viên mới thành công!", "success");
    setShowAddMemberModal(false);

    // Reset Form
    setSelectedResidentCccd("");
    setMemberRole("Hội viên");
    setResidentSearchTerm("");
  };

  // Remove a member from the selected association
  const handleRemoveMember = (memberCccd: string, name: string) => {
    setMemberToDelete({ cccd: memberCccd, name });
  };

  const performRemoveMember = (memberCccd: string) => {
    const updatedMembers = selectedAssociation.members.filter(m => m.cccd !== memberCccd);
    
    // If the leader is deleted, update leader details
    let updatedLeaderName = selectedAssociation.leaderName;
    let updatedLeaderCccd = selectedAssociation.leaderCccd;
    if (selectedAssociation.leaderCccd === memberCccd) {
      const nextLeader = updatedMembers[0];
      updatedLeaderName = nextLeader ? nextLeader.fullName : "Chưa phân công";
      updatedLeaderCccd = nextLeader ? nextLeader.cccd : "N/A";
    }

    const updatedAssociation: Association = {
      ...selectedAssociation,
      leaderName: updatedLeaderName,
      leaderCccd: updatedLeaderCccd,
      members: updatedMembers
    };

    const updatedAssociations = associations.map(a => a.id === selectedAssociation.id ? updatedAssociation : a);
    setAssociations(updatedAssociations);
    showToast("Đã xóa thành viên khỏi Chi hội thành công!", "success");
  };

  const handleEditMemberRole = (member: AssociationMember) => {
    setEditingMember(member);
    setEditingMemberRole(member.role);
  };

  const handleSaveMemberRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editingMemberRole.trim()) {
      showToast("Vui lòng nhập chức vụ / chức danh!", "error");
      return;
    }

    const updatedMembers = selectedAssociation.members.map(m => {
      if (m.cccd === editingMember.cccd) {
        return { ...m, role: editingMemberRole.trim() };
      }
      return m;
    });

    // Check if we need to update association leadership
    let updatedLeaderName = selectedAssociation.leaderName;
    let updatedLeaderCccd = selectedAssociation.leaderCccd;

    const leaderRoles = ["Bí thư Chi bộ", "Chi hội trưởng", "Tổ trưởng", "Chỉ huy trưởng DQTV", "Phó Bí thư", "Chi hội phó"];
    const isNewRoleLeader = leaderRoles.includes(editingMemberRole.trim());

    if (isNewRoleLeader) {
      // Promptly promote them as the current leader
      updatedLeaderName = editingMember.fullName;
      updatedLeaderCccd = editingMember.cccd;
    } else if (selectedAssociation.leaderCccd === editingMember.cccd) {
      // If this member was the leader and we demoted them, we can find a new leader from remaining leader-role members or keep it as is
      const alternativeLeader = updatedMembers.find(m => leaderRoles.includes(m.role));
      updatedLeaderName = alternativeLeader ? alternativeLeader.fullName : "Chưa phân công";
      updatedLeaderCccd = alternativeLeader ? alternativeLeader.cccd : "N/A";
    }

    const updatedAssociation: Association = {
      ...selectedAssociation,
      leaderName: updatedLeaderName,
      leaderCccd: updatedLeaderCccd,
      members: updatedMembers
    };

    const updatedAssociations = associations.map(a => a.id === selectedAssociation.id ? updatedAssociation : a);
    setAssociations(updatedAssociations);
    showToast("Đã cập nhật chức danh thành viên thành công!", "success");
    setEditingMember(null);
  };

  // Filter Associations
  const filteredAssociations = associations.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Tất cả" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalItems = filteredAssociations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedAssociations = filteredAssociations.slice(startIndex, startIndex + itemsPerPage);

  // Eligible residents search
  const searchedResidents = residents.filter(r => {
    const search = residentSearchTerm.toLowerCase();
    const matchesNameOrCccd = r.fullName.toLowerCase().includes(search) || r.cccd.includes(search);
    // Exclude those already in the selected association
    const isAlreadyMember = selectedAssociation.members.some(m => m.cccd === r.cccd);
    return matchesNameOrCccd && !isAlreadyMember;
  });

  // Calculate some analytics
  const totalAssociationsCount = associations.length;
  const totalUniqueMembersCount = new Set(
    associations.flatMap(a => a.members.map(m => m.cccd))
  ).size;

  // Excel Export functions
  const handleExportToExcel = () => {
    if (!selectedAssociation) return;
    const headers = [
      "Mã Chi hội",
      "Tên Chi hội/Tổ chức",
      "Phân nhóm",
      "STT Thành viên",
      "Họ và tên",
      "Chức vụ/Vai trò",
      "Số CCCD",
      "Số điện thoại",
      "Năm sinh"
    ];

    const rows = selectedAssociation.members.map((member, index) => {
      const birthYear = member.birthDate ? member.birthDate.split("/").pop() : "N/A";
      return [
        selectedAssociation.id,
        selectedAssociation.name,
        selectedAssociation.category,
        index + 1,
        member.fullName,
        member.role,
        `="${member.cccd}"`,
        `="${member.phone || "N/A"}"`,
        birthYear
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const safeName = selectedAssociation.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9]/g, "_");
      
    link.setAttribute("href", url);
    link.setAttribute("download", `Danh_sach_thanh_vien_${safeName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllToExcel = () => {
    const headers = [
      "Mã Chi hội",
      "Tên Chi hội/Tổ chức",
      "Phân loại nhóm",
      "Mô tả hoạt động",
      "Người đứng đầu",
      "CCCD Người đứng đầu",
      "STT Thành viên",
      "Họ tên Thành viên",
      "Chức vụ/Vai trò",
      "CCCD Thành viên",
      "SĐT Thành viên",
      "Năm sinh"
    ];

    const rows: any[] = [];
    
    associations.forEach(assoc => {
      if (assoc.members.length === 0) {
        rows.push([
          assoc.id,
          assoc.name,
          assoc.category,
          assoc.description,
          assoc.leaderName,
          `="${assoc.leaderCccd}"`,
          "",
          "(Chưa có thành viên)",
          "",
          "",
          "",
          ""
        ]);
      } else {
        assoc.members.forEach((member, idx) => {
          const birthYear = member.birthDate ? member.birthDate.split("/").pop() : "N/A";
          rows.push([
            assoc.id,
            assoc.name,
            assoc.category,
            assoc.description,
            assoc.leaderName,
            `="${assoc.leaderCccd}"`,
            idx + 1,
            member.fullName,
            member.role,
            `="${member.cccd}"`,
            `="${member.phone || "N/A"}"`,
            birthYear
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => {
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Danh_sach_tong_hop_tat_ca_Chi_hoi_Khu_pho_3.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="association-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-emerald-500 font-bold px-2.5 py-0.5 rounded font-mono uppercase tracking-widest text-emerald-100">Chi hội & Đoàn thể cơ sở</span>
          <h1 className="text-xl font-bold tracking-tight">Hệ thống quản lý các Chi hội & Tổ chức liên kết</h1>
          <p className="text-emerald-200 text-xs">Quản lý cơ cấu nhân sự chi bộ, tổ tự quản, lực lượng nòng cốt và hội viên phong trào tại Khu phố 3</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleExportAllToExcel}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all border border-white/15 cursor-pointer shadow-sm"
            title="Xuất toàn bộ danh sách tổng hợp tất cả chi hội ra file Excel"
          >
            <FileSpreadsheet size={15} className="text-emerald-300" /> Xuất tất cả Chi hội
          </button>
          <button 
            onClick={() => setShowAddAssocModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md shrink-0 cursor-pointer border border-emerald-400/20"
          >
            <FolderPlus size={16} /> Tạo Chi hội / Tổ chức mới
          </button>
        </div>
      </div>

      {/* Quick Analytics Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng số Chi hội</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {totalAssociationsCount} chi hội
            </span>
          </div>
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Award size={18} /></span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhân sự liên kết</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {totalUniqueMembersCount} cá nhân
            </span>
          </div>
          <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Users size={18} /></span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trực chiến ANCS & Dân quân</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {(associations.find(a => a.id === "ASC002")?.members.length || 0) + (associations.find(a => a.id === "ASC003")?.members.length || 0)} đồng chí
            </span>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700">Trực ban</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hội viên Phụ nữ & Đoàn viên</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">
              {(associations.find(a => a.id === "ASC004")?.members.length || 0) + (associations.find(a => a.id === "ASC006")?.members.length || 0)} hội viên
            </span>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700">Quần chúng</span>
        </div>
      </div>

      {/* Filter and Search Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm chi hội theo tên hoặc mô tả chính trị xã hội..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        {/* Tab Filters for Category */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
          {["Tất cả", "Chính trị - Xã hội", "An ninh - Quốc phòng", "Đoàn thể nhân dân", "Hội quần chúng"].map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryFilterChange(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${categoryFilter === cat ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Chi hội list */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Danh sách Chi hội ({filteredAssociations.length})</span>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredAssociations.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-400">
                Không tìm thấy chi hội phù hợp bộ lọc
              </div>
            ) : (
              paginatedAssociations.map((assoc) => {
                const isSelected = selectedAssociation.id === assoc.id;
                return (
                  <div 
                    key={assoc.id}
                    onClick={() => setSelectedAssociationId(assoc.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden group
                      ${isSelected 
                        ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/10" 
                        : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                    )}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      assoc.category === "Chính trị - Xã hội" ? "bg-rose-50 text-rose-700" :
                      assoc.category === "An ninh - Quốc phòng" ? "bg-red-50 text-red-700" :
                      assoc.category === "Đoàn thể nhân dân" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {assoc.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-2 leading-tight group-hover:text-emerald-700 transition-colors">{assoc.name}</h3>
                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-normal font-sans">{assoc.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-50">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        Trưởng: <strong className="text-slate-700 font-bold">{assoc.leaderName}</strong>
                      </span>
                      <span className="font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-sans text-[10px]">
                        {assoc.members.length} thành viên
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Pagination
            id="association-pagination"
            currentPage={activePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right column: Selected Chi hội members list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            
            {/* Header detail info of selected organization */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-4 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 uppercase tracking-wider">{selectedAssociation.category}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">MÃ: {selectedAssociation.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedAssociation.name}</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{selectedAssociation.description}</p>
              </div>

              {/* Action Buttons inside detail */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                <button 
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Xuất file danh sách thành viên chi hội này ra Excel"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Xuất Excel
                </button>
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <UserPlus size={14} /> Thêm từ dữ liệu Dân cư
                </button>
              </div>
            </div>

            {/* Representative Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/70">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lãnh đạo phụ trách (Người đứng đầu)</span>
                <div className="flex items-center gap-2.5 mt-1">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg"><ShieldCheck size={16} /></div>
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">{selectedAssociation.leaderName}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">CCCD: {selectedAssociation.leaderCccd}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200/50 pt-2.5 md:pt-0 md:pl-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Thống kê nội bộ</span>
                <div className="flex items-center gap-4 mt-1.5">
                  <div>
                    <span className="text-xs text-slate-500 block">Thành viên tích cực</span>
                    <span className="text-sm font-extrabold text-slate-800">{selectedAssociation.members.length} người</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tỉ lệ tham gia</span>
                    <span className="text-sm font-extrabold text-emerald-600">100% Trực chiến</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Members cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Danh sách thành viên chi hội ({selectedAssociation.members.length})</span>
              
              {selectedAssociation.members.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-xl text-center text-slate-400 text-xs">
                  Chưa có thành viên nào tham gia chi hội này. Click "Thêm từ dữ liệu Dân cư" để ghi danh thành viên mới.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAssociation.members.map((member) => {
                    const isLeader = ["Bí thư Chi bộ", "Chi hội trưởng", "Tổ trưởng", "Chỉ huy trưởng DQTV", "Phó Bí thư", "Chi hội phó"].includes(member.role);
                    return (
                      <div 
                        key={member.cccd} 
                        className={`p-4 rounded-xl border relative transition-all bg-white hover:shadow-sm
                          ${isLeader 
                            ? "border-emerald-100 bg-gradient-to-br from-emerald-50/20 to-white" 
                            : "border-slate-100"
                          }
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-sm">{member.fullName}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                                ["Bí thư Chi bộ", "Chi hội trưởng", "Tổ trưởng", "Chỉ huy trưởng DQTV"].includes(member.role) 
                                  ? "bg-rose-100 text-rose-800 font-bold" 
                                  : isLeader 
                                  ? "bg-amber-100 text-amber-800 font-bold"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-1.5 pt-2 text-[11px] text-slate-500 font-sans">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">CCCD:</span>
                                <span className="font-mono text-slate-700 font-medium">{member.cccd}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Điện thoại:</span>
                                <span className="font-mono text-slate-700 font-medium">{member.phone || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Năm sinh:</span>
                                <span className="font-medium text-slate-700">{member.birthDate ? member.birthDate.split("/").pop() : "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditMemberRole(member)}
                              className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Sửa chức danh"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.cccd, member.fullName)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Xóa khỏi Chi hội"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Add New Association (Chi hội) Modal */}
      {showAddAssocModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Tạo Chi hội / Tổ chức phong trào mới</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Thêm chi hội tự quản thuộc mặt trận ban dân vận địa phương</p>
              </div>
              <button 
                onClick={() => setShowAddAssocModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAssociation} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Tên Chi hội / Tổ chức *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Chi hội Khuyến học, Câu lạc bộ dưỡng sinh..."
                  value={newAssocName}
                  onChange={(e) => setNewAssocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Phân nhóm / Thể loại *</label>
                <select
                  value={newAssocCategory}
                  onChange={(e) => setNewAssocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Đoàn thể nhân dân">Đoàn thể nhân dân</option>
                  <option value="Chính trị - Xã hội">Chính trị - Xã hội</option>
                  <option value="An ninh - Quốc phòng">An ninh - Quốc phòng</option>
                  <option value="Hội quần chúng">Hội quần chúng</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Người đứng đầu (Chọn từ danh sách Cư dân có sẵn) *</label>
                <select
                  value={newAssocLeaderCccd}
                  onChange={(e) => setNewAssocLeaderCccd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Chọn đại diện đứng đầu --</option>
                  {residents.map(r => (
                    <option key={r.cccd} value={r.cccd}>
                      {r.fullName} - CCCD: {r.cccd} ({r.occupation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Chức danh của người đứng đầu</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Chi hội trưởng, Chủ nhiệm CLB, Bí thư..."
                  value={newAssocLeaderRole}
                  onChange={(e) => setNewAssocLeaderRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Mô tả mục tiêu & nhiệm vụ</label>
                <textarea 
                  rows={3}
                  placeholder="Mô tả tóm tắt tôn chỉ mục đích hoạt động..."
                  value={newAssocDesc}
                  onChange={(e) => setNewAssocDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowAddAssocModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Tạo chi hội mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Association Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Ghi danh cư dân vào Chi hội</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Chi hội: {selectedAssociation.name}</p>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Tìm kiếm cư dân từ dữ liệu Dân cư</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Nhập tên hoặc CCCD để tìm kiếm..."
                    value={residentSearchTerm}
                    onChange={(e) => setResidentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Chọn cư dân ghi danh *</label>
                <select
                  value={selectedResidentCccd}
                  onChange={(e) => setSelectedResidentCccd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Chọn thành viên dân cư ({searchedResidents.length}) --</option>
                  {searchedResidents.map(r => (
                    <option key={r.cccd} value={r.cccd}>
                      {r.fullName} - CCCD: {r.cccd} ({r.occupation})
                    </option>
                  ))}
                </select>
                {searchedResidents.length === 0 && (
                  <span className="text-[10px] text-rose-500 block">Không tìm thấy cư dân nào hợp lệ chưa tham gia.</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Vai trò / Chức vụ trong Chi hội</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="Hội viên">Hội viên</option>
                  <option value="Hội viên tích cực">Hội viên tích cực</option>
                  <option value="Ủy viên ban chấp hành">Ủy viên ban chấp hành</option>
                  <option value="Phó Bí thư">Phó Bí thư</option>
                  <option value="Chi hội phó">Chi hội phó</option>
                  <option value="Chi hội trưởng">Chi hội trưởng</option>
                  <option value="Đội viên ANCS">Đội viên ANCS</option>
                  <option value="Chiến sĩ dân quân">Chiến sĩ dân quân</option>
                  <option value="Đoàn viên">Đoàn viên</option>
                  <option value="Khác">Khác</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  * Nếu chọn chức vụ đứng đầu (Chi hội trưởng, Tổ trưởng...), chức danh Trưởng chi hội sẽ được tự động cập nhật.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleAddMemberFromResidents}
                  disabled={!selectedResidentCccd}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Ghi danh thành viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Notification Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Modern Custom Member Deletion Confirmation Dialog */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Xác nhận xóa thành viên</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa thành viên <strong className="text-slate-800">{memberToDelete.name}</strong> khỏi chi hội <strong className="text-emerald-800">{selectedAssociation.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  performRemoveMember(memberToDelete.cccd);
                  setMemberToDelete(null);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Custom Member Edit Role Dialog */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Sửa chức danh thành viên</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{editingMember.fullName}</p>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMemberRole} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Chức vụ hiện tại</label>
                <input 
                  type="text" 
                  disabled
                  value={editingMember.role}
                  className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Chức danh / Vai trò mới *</label>
                <select 
                  value={editingMemberRole}
                  onChange={(e) => setEditingMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 mb-2 bg-white"
                >
                  <option value="Hội viên">Hội viên</option>
                  <option value="Đoàn viên">Đoàn viên</option>
                  <option value="Chi hội trưởng">Chi hội trưởng</option>
                  <option value="Chi hội phó">Chi hội phó</option>
                  <option value="Bí thư Chi bộ">Bí thư Chi bộ</option>
                  <option value="Phó Bí thư">Phó Bí thư</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Tổ phó">Tổ phó</option>
                  <option value="Thư ký">Thư ký</option>
                  <option value="Chiến sĩ dân quân">Chiến sĩ dân quân</option>
                  <option value="Chỉ huy trưởng DQTV">Chỉ huy trưởng DQTV</option>
                  <option value="Đội viên ANCS">Đội viên ANCS</option>
                  <option value="Thành viên nòng cốt">Thành viên nòng cốt</option>
                </select>
                <div className="text-[10px] text-slate-400 font-medium">Hoặc tự nhập chức danh khác:</div>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Đội phó, Ủy viên ban chấp hành..."
                  value={editingMemberRole}
                  onChange={(e) => setEditingMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer animate-pulse"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
