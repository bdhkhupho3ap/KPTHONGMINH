import React, { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Search, 
  GitBranch, 
  UserPlus, 
  MapPin, 
  BookOpen, 
  ChevronRight,
  Plus,
  X,
  Trash2,
  AlertCircle,
  LayoutGrid,
  List,
  Edit3,
  Undo2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  History
} from "lucide-react";
import { Household, Resident } from "../types";
import Pagination from "./Pagination";

// Sub-component imports
import HouseholdDashboard from "./household/HouseholdDashboard";
import HouseholdDuplicates from "./household/HouseholdDuplicates";
import HouseholdMemberProfile from "./household/HouseholdMemberProfile";
import HouseholdFamilyTree from "./household/HouseholdFamilyTree";
import HouseholdBusinesses from "./household/HouseholdBusinesses";
import { normalizeAddress, formatCoordinates } from "../utils/addressEngine";

interface HouseholdManagementProps {
  households: Household[];
  onAddHousehold: (newH: Household) => void;
  residents: Resident[];
  onUpdateHouseholds: (households: Household[]) => void;
  onUpdateResidents: (residents: Resident[]) => void;
}

export default function HouseholdManagement({ 
  households, 
  onAddHousehold,
  residents = [],
  onUpdateHouseholds,
  onUpdateResidents
}: HouseholdManagementProps) {
  // Navigation & Sub-views tabs
  const [activeTab, setActiveTab] = useState<"list" | "dashboard" | "audit">("list");
  
  // Selected Household details tab
  const [detailTab, setDetailTab] = useState<"members" | "businesses" | "history">("members");
  
  // Basic states
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(households[0] || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Tất cả" | "Thường trú" | "Tạm trú">("Tất cả");
  const [showSoftDeleted, setShowSoftDeleted] = useState(false); // Recycle bin toggle
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const itemsPerPage = 8;

  // Modal displays
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  
  // Profile View modal
  const [profileViewMember, setProfileViewMember] = useState<{ name: string; relation: string; cccd: string } | null>(null);

  // Custom confirmation modal states
  const [householdToDelete, setHouseholdToDelete] = useState<Household | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ cccd: string; name: string } | null>(null);

  // Live GPS coordinate parser state
  const [coordInput, setCoordInput] = useState("");
  const [parsedGPS, setParsedGPS] = useState<{ lat: number; lng: number; formatted: string } | null>(null);

  // Form states for creating new Household
  const [newHCode, setNewHCode] = useState("");
  const [newHType, setNewHType] = useState<"Thường trú" | "Tạm trú">("Thường trú");
  const [newOwner, setNewOwner] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [tempMembers, setTempMembers] = useState<{ name: string; relation: string; cccd: string; birthYear: number; phone?: string }[]>([]);
  
  // Member registration inside creation modal
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberCccd, setNewMemberCccd] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("Vợ");
  const [newMemberBirthYear, setNewMemberBirthYear] = useState<number | "">("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // Edit Household form states
  const [editAddress, setEditAddress] = useState("");
  const [editType, setEditType] = useState<"Thường trú" | "Tạm trú">("Thường trú");
  const [editOwner, setEditOwner] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Move member states
  const [moveTargetMember, setMoveTargetMember] = useState<{ name: string; cccd: string } | null>(null);
  const [moveTargetHCode, setMoveTargetHCode] = useState("");

  // Split household states
  const [splitSelectedCccds, setSplitSelectedCccds] = useState<string[]>([]);
  const [splitNewHCode, setSplitNewHCode] = useState("");
  const [splitNewOwner, setSplitNewOwner] = useState("");
  const [splitNewAddress, setSplitNewAddress] = useState("");
  const [splitNewCoordinates, setSplitNewCoordinates] = useState("");

  // Responsive default layout
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode("card");
    }
  }, []);

  // Sync selected household if globally updated
  useEffect(() => {
    if (selectedHousehold) {
      const match = households.find(h => h.id === selectedHousehold.id);
      if (match) {
        setSelectedHousehold(match);
      }
    }
  }, [households]);

  // Combined GPS parsing logic live
  const parseCoordinates = (input: string) => {
    if (!input) return null;
    const parts = input.split(",");
    if (parts.length === 2) {
      const p1 = parseFloat(parts[0].trim());
      const p2 = parseFloat(parts[1].trim());
      if (!isNaN(p1) && !isNaN(p2)) {
        let lat = p1;
        let lng = p2;
        // Normal Vietnam coordinate bounds
        if (p1 > 100 && p2 < 30) {
          lat = p2;
          lng = p1;
        }
        return { lat, lng, formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
      }
    }
    return null;
  };

  const handleCoordInputChange = (val: string) => {
    setCoordInput(val);
    const parsed = parseCoordinates(val);
    setParsedGPS(parsed);
  };

  // Filter households by search, type, and soft-delete status
  const filteredHouseholds = households.filter((h) => {
    const isDeleted = !!(h as any).deletedAt;
    if (showSoftDeleted !== isDeleted) return false;

    const matchesSearch = 
      h.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.cccd.includes(searchTerm));
    
    const matchesType = typeFilter === "Tất cả" || (h.type || "Thường trú") === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Paginated selection
  const paginatedHouseholds = filteredHouseholds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalItems = filteredHouseholds.length;

  // Handle Create Household
  const handleCreateHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHCode || !newOwner || !newAddress) {
      alert("Vui lòng điền đầy đủ các thông mục có dấu sao (*)");
      return;
    }

    const primaryOwnerCccd = newMemberCccd || `079${Math.floor(100000000 + Math.random() * 900000000)}`;
    const finalCoordinates = parsedGPS ? parsedGPS.formatted : coordInput;

    const hhId = crypto.randomUUID();
    const newH: Household = {
      id: hhId,
      code: newHCode,
      ownerName: newOwner,
      address: newAddress,
      type: newHType,
      memberCount: tempMembers.length + 1,
      coordinates: finalCoordinates || undefined,
      members: [
        {
          name: newOwner,
          relation: "Chủ hộ",
          cccd: primaryOwnerCccd,
          birthYear: 1980, // default placeholder
          phone: "09XXXXXXXX"
        },
        ...tempMembers
      ]
    };

    onAddHousehold(newH);

    // Synchronize into residents roster
    const newResidents: Resident[] = [
      {
        id: "R" + Math.floor(1000 + Math.random() * 9000),
        fullName: newOwner,
        gender: "Nam",
        birthDate: "15/05/1980",
        cccd: primaryOwnerCccd,
        phone: "09XXXXXXXX",
        status: newHType,
        occupation: "Kinh doanh tự do",
        address: newAddress,
        householdId: newHCode,
        householdUuid: hhId,
        relationToOwner: "Chủ hộ",
        joinDate: new Date().toLocaleDateString("vi-VN")
      },
      ...tempMembers.map(m => ({
        id: "R" + Math.floor(1000 + Math.random() * 9000),
        fullName: m.name,
        gender: m.relation === "Vợ" || m.relation === "Con gái" ? "Nữ" : "Nam",
        birthDate: `01/01/${m.birthYear}`,
        cccd: m.cccd,
        phone: m.phone || "N/A",
        status: newHType,
        occupation: "Học sinh / Thành viên",
        address: newAddress,
        householdId: newHCode,
        householdUuid: hhId,
        relationToOwner: m.relation,
        joinDate: new Date().toLocaleDateString("vi-VN")
      }))
    ];

    onUpdateResidents([...residents, ...newResidents]);

    // Reset Creation form states
    setShowAddModal(false);
    setNewHCode("");
    setNewOwner("");
    setNewAddress("");
    setCoordInput("");
    setParsedGPS(null);
    setTempMembers([]);
  };

  const handleAddTempMember = () => {
    if (!newMemberName || !newMemberCccd || !newMemberBirthYear) {
      alert("Vui lòng điền tên, CCCD và năm sinh thành viên tạm thời!");
      return;
    }
    setTempMembers([
      ...tempMembers,
      {
        name: newMemberName,
        relation: newMemberRelation,
        cccd: newMemberCccd,
        birthYear: Number(newMemberBirthYear),
        phone: newMemberPhone || undefined
      }
    ]);
    setNewMemberName("");
    setNewMemberCccd("");
    setNewMemberPhone("");
    setNewMemberBirthYear("");
  };

  // Soft Delete Household Book
  const handleSoftDeleteHousehold = (id: string) => {
    const target = households.find(h => h.id === id);
    if (!target) return;

    if (target.members.length > 0) {
      alert("Cảnh báo: Không thể xóa sổ hộ khẩu khi vẫn còn thành viên cư ngụ! Vui lòng thực hiện tách hộ hoặc chuyển thành viên trước.");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa (Soft Delete) Sổ hộ khẩu ${target.code}? Sổ sẽ được chuyển vào mục lưu trữ.`)) return;

    const updated = households.map(h => {
      if (h.id === id) {
        return {
          ...h,
          deletedAt: new Date().toISOString(),
          deletedBy: "Cán bộ Hành chính Phường"
        };
      }
      return h;
    });

    onUpdateHouseholds(updated);
    if (selectedHousehold?.id === id) {
      setSelectedHousehold(updated.find(h => !(h as any).deletedAt) || null);
    }
  };

  // Restore Soft Deleted Household Book
  const handleRestoreHousehold = (id: string) => {
    const updated = households.map(h => {
      if (h.id === id) {
        const copy = { ...h };
        delete (copy as any).deletedAt;
        delete (copy as any).deletedBy;
        return copy;
      }
      return h;
    });

    onUpdateHouseholds(updated);
    alert("Khôi phục sổ hộ khẩu thành công!");
    setShowSoftDeleted(false);
  };

  // Edit Sổ Hộ Khẩu details
  const startEditHousehold = () => {
    if (!selectedHousehold) return;
    setEditAddress(selectedHousehold.address);
    setEditType(selectedHousehold.type || "Thường trú");
    setEditOwner(selectedHousehold.ownerName);
    setEditNotes((selectedHousehold as any).notes || "");
    setCoordInput(selectedHousehold.coordinates || "");
    setParsedGPS(parseCoordinates(selectedHousehold.coordinates || ""));
    setShowEditModal(true);
  };

  const handleSaveEditHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    const finalCoordinates = parsedGPS ? parsedGPS.formatted : coordInput;

    const updated = households.map(h => {
      if (h.id === selectedHousehold.id) {
        // Build audit log entry
        const logs = (h as any).auditHistory || [];
        const newLog = {
          date: new Date().toLocaleString("vi-VN"),
          action: "Cập nhật thông tin sổ hộ khẩu",
          actor: "Cán bộ Tư pháp"
        };

        return {
          ...h,
          address: editAddress,
          type: editType,
          ownerName: editOwner,
          coordinates: finalCoordinates,
          notes: editNotes,
          auditHistory: [newLog, ...logs]
        };
      }
      return h;
    });

    onUpdateHouseholds(updated);
    setShowEditModal(false);
  };

  // Remove individual member from current household book
  const handleRemoveMemberClick = (cccd: string) => {
    if (!selectedHousehold) return;
    const member = selectedHousehold.members.find(m => m.cccd === cccd);
    if (!member) return;

    if (member.relation === "Chủ hộ") {
      alert("Không thể xóa chủ hộ khỏi sổ! Hãy chỉ định một chủ hộ mới bằng cách Sửa sổ trước.");
      return;
    }

    setMemberToRemove({ cccd, name: member.name });
  };

  const executeRemoveMember = (cccd: string) => {
    if (!selectedHousehold) return;
    
    // Update Household Members
    const updatedMembers = selectedHousehold.members.filter(m => m.cccd !== cccd);
    const updatedHouseholds = households.map(h => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedMembers,
          memberCount: updatedMembers.length
        };
      }
      return h;
    });

    // Update Residents to NA household
    const updatedResidents = residents.map(r => {
      if (r.cccd === cccd) {
        return {
          ...r,
          householdId: "N/A",
          relationToOwner: "Tự do"
        };
      }
      return r;
    });

    onUpdateHouseholds(updatedHouseholds);
    onUpdateResidents(updatedResidents);
    
    // Update selected household in view state to show removed member is gone
    const targetHh = updatedHouseholds.find(h => h.id === selectedHousehold.id);
    if (targetHh) {
      setSelectedHousehold(targetHh);
    }
  };

  // Add Member into selected household
  const [addMemName, setAddMemName] = useState("");
  const [addMemCccd, setAddMemCccd] = useState("");
  const [addMemRelation, setAddMemRelation] = useState("Con trai");
  const [addMemBirthYear, setAddMemBirthYear] = useState<number | "">("");
  const [addMemPhone, setAddMemPhone] = useState("");

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold || !addMemName || !addMemCccd || !addMemBirthYear) {
      alert("Vui lòng nhập tên, CCCD và năm sinh!");
      return;
    }

    const newM = {
      name: addMemName,
      relation: addMemRelation,
      cccd: addMemCccd,
      birthYear: Number(addMemBirthYear),
      phone: addMemPhone || undefined
    };

    const updatedHouseholds = households.map(h => {
      if (h.id === selectedHousehold.id) {
        const audit = (h as any).auditHistory || [];
        const newLog = {
          date: new Date().toLocaleString("vi-VN"),
          action: `Nhập khẩu thêm thành viên: ${addMemName}`,
          actor: "Cán bộ Tư pháp"
        };

        return {
          ...h,
          members: [...h.members, newM],
          memberCount: h.members.length + 1,
          auditHistory: [newLog, ...audit]
        };
      }
      return h;
    });

    // Point resident profile
    const newR: Resident = {
      id: "R" + Math.floor(1000 + Math.random() * 9000),
      fullName: addMemName,
      gender: addMemRelation === "Vợ" || addMemRelation === "Con gái" ? "Nữ" : "Nam",
      birthDate: `01/01/${addMemBirthYear}`,
      cccd: addMemCccd,
      phone: addMemPhone || "N/A",
      status: selectedHousehold.type || "Thường trú",
      occupation: "Thành viên",
      address: selectedHousehold.address,
      householdId: selectedHousehold.code,
      householdUuid: selectedHousehold.id,
      relationToOwner: addMemRelation,
      joinDate: new Date().toLocaleDateString("vi-VN")
    };

    onUpdateHouseholds(updatedHouseholds);
    onUpdateResidents([...residents, newR]);

    // Reset
    setShowAddMemberModal(false);
    setAddMemName("");
    setAddMemCccd("");
    setAddMemBirthYear("");
    setAddMemPhone("");
  };

  // Move member (Chuyển hộ)
  const startMoveMember = (name: string, cccd: string) => {
    setMoveTargetMember({ name, cccd });
    setMoveTargetHCode(households.find(h => h.id !== selectedHousehold?.id)?.code || "");
    setShowMoveModal(true);
  };

  const handlePerformMoveMember = () => {
    if (!selectedHousehold || !moveTargetMember || !moveTargetHCode) return;

    const targetH = households.find(h => h.code === moveTargetHCode);
    if (!targetH) {
      alert("Hộ tịch đích không tồn tại!");
      return;
    }

    const memberToMove = selectedHousehold.members.find(m => m.cccd === moveTargetMember.cccd);
    if (!memberToMove) return;

    // 1. Remove from source household
    const updatedSourceMembers = selectedHousehold.members.filter(m => m.cccd !== moveTargetMember.cccd);
    
    // 2. Add to target household
    const updatedTargetMembers = [
      ...targetH.members,
      {
        ...memberToMove,
        relation: "Thành viên mới chuyển đến"
      }
    ];

    const updatedHouseholds = households.map(h => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedSourceMembers,
          memberCount: updatedSourceMembers.length
        };
      }
      if (h.id === targetH.id) {
        return {
          ...h,
          members: updatedTargetMembers,
          memberCount: updatedTargetMembers.length
        };
      }
      return h;
    });

    // 3. Update resident profile pointers
    const updatedResidents = residents.map(r => {
      if (r.cccd === moveTargetMember.cccd) {
        return {
          ...r,
          householdId: targetH.code,
          householdUuid: targetH.id,
          address: targetH.address,
          relationToOwner: "Thành viên mới chuyển đến"
        };
      }
      return r;
    });

    onUpdateHouseholds(updatedHouseholds);
    onUpdateResidents(updatedResidents);
    setShowMoveModal(false);
    alert(`Đã chuyển nhân khẩu ${moveTargetMember.name} cư trú sang sổ ${targetH.code} thành công.`);
  };

  // Split household (Tách hộ)
  const startSplitHousehold = () => {
    setSplitSelectedCccds([]);
    setSplitNewHCode(`HK-${Math.floor(300 + Math.random() * 100)}`);
    setSplitNewAddress(selectedHousehold?.address || "");
    setSplitNewCoordinates(selectedHousehold?.coordinates || "");
    setShowSplitModal(true);
  };

  const handlePerformSplitHousehold = () => {
    if (!selectedHousehold || splitSelectedCccds.length === 0 || !splitNewHCode || !splitNewOwner) {
      alert("Vui lòng tích chọn thành viên tách và nhập mã sổ mới + chủ hộ mới!");
      return;
    }

    const membersToSplit = selectedHousehold.members.filter(m => splitSelectedCccds.includes(m.cccd));
    
    // 1. Create split household book
    const newHMembers = membersToSplit.map(m => ({
      ...m,
      relation: m.cccd === splitNewOwner ? "Chủ hộ" : "Thành viên tách hộ"
    }));

    const newHhId = crypto.randomUUID();
    const newH: Household = {
      id: newHhId,
      code: splitNewHCode,
      ownerName: selectedHousehold.members.find(m => m.cccd === splitNewOwner)?.name || "Chưa xác định",
      address: splitNewAddress,
      type: selectedHousehold.type || "Thường trú",
      memberCount: newHMembers.length,
      coordinates: splitNewCoordinates || undefined,
      members: newHMembers
    };

    // 2. Remove those split members from original household
    const updatedOriginalMembers = selectedHousehold.members.filter(m => !splitSelectedCccds.includes(m.cccd));

    const updatedHouseholds = households.map(h => {
      if (h.id === selectedHousehold.id) {
        return {
          ...h,
          members: updatedOriginalMembers,
          memberCount: updatedOriginalMembers.length
        };
      }
      return h;
    });

    // Add split household book
    onUpdateHouseholds([...updatedHouseholds, newH]);

    // 3. Update Residents profile pointer
    const updatedResidents = residents.map(r => {
      if (splitSelectedCccds.includes(r.cccd)) {
        return {
          ...r,
          householdId: splitNewHCode,
          householdUuid: newHhId,
          address: splitNewAddress,
          relationToOwner: r.cccd === splitNewOwner ? "Chủ hộ" : "Thành viên tách hộ"
        };
      }
      return r;
    });

    onUpdateResidents(updatedResidents);
    setShowSplitModal(false);
    alert(`Tách hộ tịch thành công! Sổ mới ${splitNewHCode} đã được khởi tạo.`);
  };

  const toggleSelectSplitMember = (cccd: string) => {
    if (splitSelectedCccds.includes(cccd)) {
      setSplitSelectedCccds(splitSelectedCccds.filter(c => c !== cccd));
      if (splitNewOwner === cccd) setSplitNewOwner("");
    } else {
      setSplitSelectedCccds([...splitSelectedCccds, cccd]);
      if (!splitNewOwner) setSplitNewOwner(cccd); // default select owner
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
      
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="text-emerald-600 animate-pulse" size={20} />
            <h1 className="font-black text-slate-800 text-lg tracking-tight">Hệ thống Quản lý Hộ tịch thông minh</h1>
          </div>
          <p className="text-xs text-slate-400">Đồng bộ cơ sở dữ liệu quốc gia, rà soát địa chỉ GPS & kiểm duyệt liên ngành tự quản</p>
        </div>

        {/* Action and view tabs bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Module Selection */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100 gap-0.5 text-xs">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeTab === "list" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Hộ Gia Đình
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-white text-indigo-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Thống Kê Thẻ
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeTab === "audit" ? "bg-white text-amber-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Trùng Lặp & Gộp
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus size={14} /> Lập Sổ Mới
          </button>
        </div>
      </div>

      {/* RENDER BY ACTIVE MODULE TAB */}
      {activeTab === "dashboard" && (
        <HouseholdDashboard households={households} residents={residents} />
      )}

      {activeTab === "audit" && (
        <HouseholdDuplicates 
          households={households} 
          residents={residents} 
          onUpdateHouseholds={onUpdateHouseholds}
          onUpdateResidents={onUpdateResidents}
        />
      )}

      {activeTab === "list" && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Tìm kiếm theo chủ hộ, mã số sổ, địa chỉ, CCCD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-white"
              />
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5">
                <button
                  onClick={() => setTypeFilter("Tất cả")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${typeFilter === "Tất cả" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  Tất cả ({households.filter(h => !(h as any).deletedAt).length})
                </button>
                <button
                  onClick={() => setTypeFilter("Thường trú")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${typeFilter === "Thường trú" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  Thường trú ({households.filter(h => !(h as any).deletedAt && (h.type || "Thường trú") === "Thường trú").length})
                </button>
                <button
                  onClick={() => setTypeFilter("Tạm trú")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${typeFilter === "Tạm trú" ? "bg-white text-amber-800 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
                >
                  Tạm trú ({households.filter(h => !(h as any).deletedAt && h.type === "Tạm trú").length})
                </button>
              </div>

              {/* Recycle bin trash toggle */}
              <button
                onClick={() => {
                  setShowSoftDeleted(!showSoftDeleted);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-2 border rounded-xl font-bold transition-all cursor-pointer ${
                  showSoftDeleted 
                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                    : "bg-white text-slate-500 hover:bg-slate-50 border-slate-200"
                }`}
              >
                <Trash2 size={13} />
                {showSoftDeleted ? "Thùng rác Sổ" : "Xem hộ đã xóa"}
              </button>

              {/* View switches */}
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                  title="Xem dạng Danh sách"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "card" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                  title="Xem dạng Thẻ Grid"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* List and Grid display with Details panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: List representation */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {showSoftDeleted ? "Lưu trữ thùng rác sổ hộ khẩu" : "Danh sách sổ chính thống"} ({filteredHouseholds.length})
                </span>
              </div>

              {viewMode === "list" ? (
                <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                  {filteredHouseholds.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                      Không tìm thấy sổ hộ khẩu phù hợp bộ lọc
                    </div>
                  ) : (
                    paginatedHouseholds.map((h) => {
                      const isSelected = selectedHousehold?.id === h.id;
                      const hType = h.type || "Thường trú";
                      return (
                        <div 
                          key={h.id}
                          onClick={() => setSelectedHousehold(h)}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors
                            ${isSelected ? "bg-emerald-50/30 border-l-4 border-emerald-500" : "hover:bg-slate-50/50"}
                          `}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{h.code}</span>
                              <h3 className="font-bold text-slate-800 text-sm">{h.ownerName}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${hType === "Tạm trú" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                {hType}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={12} /> {h.address}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                              <Users size={12} /> {h.memberCount} nhân khẩu
                            </span>
                            <ChevronRight size={14} className="text-slate-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 max-h-[550px] overflow-y-auto bg-slate-50/10">
                  {filteredHouseholds.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 col-span-full">
                      <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                      Không tìm thấy sổ hộ khẩu nào
                    </div>
                  ) : (
                    paginatedHouseholds.map((h) => {
                      const isSelected = selectedHousehold?.id === h.id;
                      const hType = h.type || "Thường trú";
                      return (
                        <div 
                          key={h.id}
                          onClick={() => setSelectedHousehold(h)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 bg-white hover:shadow-md
                            ${isSelected 
                              ? "border-emerald-500 ring-2 ring-emerald-500/5 bg-emerald-50/20" 
                              : "border-slate-100 hover:border-slate-200"
                            }
                          `}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">{h.code}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${hType === "Tạm trú" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                {hType}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-xs line-clamp-1">Chủ hộ: {h.ownerName}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={12} className="shrink-0" /> <span className="truncate">{h.address}</span>
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
                              <Users size={12} /> {h.memberCount} nhân khẩu
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold hover:underline">Chi tiết ➜</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-auto border-t border-slate-100 p-3 bg-slate-50/50">
                <Pagination
                  id="household-pagination"
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>

            {/* Right Column: Detailed Pane of selected household */}
            <div className="lg:col-span-1">
              {selectedHousehold ? (
                <div className="space-y-5">
                  {/* Ledger Header Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">SỔ HỘ KHẨU ĐIỆN TỬ</span>
                        <h2 className="font-bold text-slate-800 text-base mt-0.5">Hộ: {selectedHousehold.ownerName}</h2>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-slate-200 rounded-lg">
                          {selectedHousehold.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${selectedHousehold.type === "Tạm trú" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {selectedHousehold.type || "Thường trú"}
                        </span>
                      </div>
                    </div>

                    {/* Metadata details list */}
                    <div className="space-y-3 text-xs text-slate-600">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-slate-50 rounded text-slate-400 mt-0.5"><MapPin size={14} /></div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Địa chỉ thường trú</span>
                          <span className="text-slate-800 font-bold leading-relaxed">{selectedHousehold.address}</span>
                        </div>
                      </div>

                      {/* GPS combined parsed display */}
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100/40 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-indigo-600" />
                          <div>
                            <span className="text-[9px] uppercase font-bold text-indigo-500">Tọa độ định vị GPS</span>
                            <p className="text-slate-800 font-mono font-bold leading-none mt-0.5">{formatCoordinates(selectedHousehold.coordinates) || "Chưa định vị"}</p>
                          </div>
                        </div>
                        {selectedHousehold.coordinates && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatCoordinates(selectedHousehold.coordinates))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                          >
                            Chỉ đường trên Google Maps ➜
                          </a>
                        )}
                      </div>

                      {/* Notes indicator if present */}
                      {(selectedHousehold as any).notes && (
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500">
                          <strong>Ghi chú:</strong> {(selectedHousehold as any).notes}
                        </div>
                      )}
                    </div>

                    {/* Interactive Tree launcher */}
                    <button 
                      onClick={() => setShowTreeModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                    >
                      <GitBranch size={13} /> Sơ đồ cây Phả Hệ Hộ Tịch
                    </button>
                    
                    {/* Sửa thông tin & Soft Delete buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={startEditHousehold}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit3 size={12} /> Sửa Sổ
                      </button>
                      
                      {showSoftDeleted ? (
                        <button
                          onClick={() => handleRestoreHousehold(selectedHousehold.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Undo2 size={12} /> Khôi phục
                        </button>
                      ) : (
                        <button
                          onClick={() => setHouseholdToDelete(selectedHousehold)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 size={12} /> Xóa Sổ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-tabs Inside Ledger Details */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 space-y-4">
                    <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-400">
                      <button 
                        onClick={() => setDetailTab("members")}
                        className={`pb-2 transition-all relative cursor-pointer ${detailTab === "members" ? "text-emerald-600" : "hover:text-slate-700"}`}
                      >
                        Nhân khẩu ({selectedHousehold.members.length})
                        {detailTab === "members" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                      </button>
                      <button 
                        onClick={() => setDetailTab("businesses")}
                        className={`pb-2 transition-all relative cursor-pointer ${detailTab === "businesses" ? "text-indigo-600" : "hover:text-slate-700"}`}
                      >
                        Hộ kinh doanh
                        {detailTab === "businesses" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
                      </button>
                      <button 
                        onClick={() => setDetailTab("history")}
                        className={`pb-2 transition-all relative cursor-pointer ${detailTab === "history" ? "text-slate-800" : "hover:text-slate-700"}`}
                      >
                        Nhật ký
                        {detailTab === "history" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800"></div>}
                      </button>
                    </div>

                    {/* Rendering Sub-tab contents */}
                    {detailTab === "members" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Thành viên cư ngụ</span>
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            <UserPlus size={11} /> Thêm nhân khẩu
                          </button>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {selectedHousehold.members.map((m, idx) => (
                            <div key={`${m.cccd}-${idx}`} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl space-y-2 transition-colors relative group">
                              <div className="flex justify-between items-start">
                                <div 
                                  onClick={() => setProfileViewMember({ name: m.name, relation: m.relation, cccd: m.cccd })}
                                  className="cursor-pointer hover:underline"
                                >
                                  <strong className="text-slate-800 font-bold">{m.name}</strong>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">Sinh: {m.birthYear} • CCCD: {m.cccd}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${m.relation === "Chủ hộ" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                                  {m.relation}
                                </span>
                              </div>

                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startMoveMember(m.name, m.cccd)}
                                  className="text-[9px] bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                                >
                                  Chuyển hộ
                                </button>
                                {m.relation !== "Chủ hộ" && (
                                  <>
                                    <button
                                      onClick={startSplitHousehold}
                                      className="text-[9px] bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                                    >
                                      Tách hộ
                                    </button>
                                    <button
                                      onClick={() => handleRemoveMemberClick(m.cccd)}
                                      className="text-[9px] bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                                    >
                                      Xóa
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailTab === "businesses" && (
                      <HouseholdBusinesses 
                        household={selectedHousehold} 
                        residents={residents}
                      />
                    )}

                    {detailTab === "history" && (
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nhật ký biến động và sửa đổi</span>
                        {((selectedHousehold as any).auditHistory || []).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Chưa ghi nhận biến động chính thức nào kể từ ngày lập sổ.</p>
                        ) : (
                          <div className="space-y-2">
                            {((selectedHousehold as any).auditHistory || []).map((log: any, idx: number) => (
                              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2 text-[11px]">
                                <History size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-slate-800 font-semibold">{log.action}</p>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{log.date} • Tác nhân: {log.actor}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-200 text-slate-400 text-center rounded-2xl text-xs bg-slate-50">
                  Chọn một sổ hộ khẩu để quản lý chi tiết thành viên và hộ kinh doanh
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lập Sổ Hộ Khẩu Mới Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Lập Sổ Hộ Khẩu Điện Tử Mới</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Phân khoa số hóa Tư pháp cơ sở</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateHousehold} className="p-6 space-y-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Mã số Sổ Hộ Khẩu *</label>
                  <input 
                    type="text"
                    required
                    placeholder="HK-XXX"
                    value={newHCode}
                    onChange={(e) => setNewHCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Loại cư trú *</label>
                  <select
                    value={newHType}
                    onChange={(e) => setNewHType(e.target.value as "Thường trú" | "Tạm trú")}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Thường trú">Thường trú (KT1, KT2)</option>
                    <option value="Tạm trú">Tạm trú (KT3, KT4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Tên Chủ hộ mới *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Địa chỉ Đăng ký Thường trú *</label>
                <input 
                  type="text"
                  required
                  placeholder="Số..., đường Lương Định Của, Phường An Phú"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              {/* LIVE COORDINATE INPUT & FEEDBACK */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block flex justify-between">
                  <span>Tọa độ GPS WGS84 (Kết hợp Vĩ độ, Kinh độ)</span>
                  <span className="font-normal text-slate-400 font-mono">Ví dụ: 10.936828, 106.743392</span>
                </label>
                <input 
                  type="text"
                  placeholder="Dán hoặc điền tọa độ GPS có sẵn..."
                  value={coordInput}
                  onChange={(e) => handleCoordInputChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 bg-white"
                />
                {parsedGPS && (
                  <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-mono">
                    ✓ Phát hiện hệ WGS84: Vĩ độ <strong>{parsedGPS.lat}</strong>, Kinh độ <strong>{parsedGPS.lng}</strong>
                  </div>
                )}
              </div>

              {/* Sub-members registration */}
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 space-y-3">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Đăng ký thêm thành viên hộ</span>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text"
                    placeholder="Tên thành viên"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg bg-white"
                  />
                  <input 
                    type="text"
                    placeholder="Số CCCD"
                    value={newMemberCccd}
                    onChange={(e) => setNewMemberCccd(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    className="col-span-1 p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Vợ">Vợ</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Anh/Em trai">Anh/Em trai</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <input 
                    type="number"
                    placeholder="Năm sinh"
                    value={newMemberBirthYear}
                    onChange={(e) => setNewMemberBirthYear(e.target.value ? Number(e.target.value) : "")}
                    className="col-span-1 p-2 border border-slate-200 rounded-lg bg-white"
                  />
                  <input 
                    type="text"
                    placeholder="Số ĐT"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="col-span-1 p-2 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddTempMember}
                  className="w-full py-1.5 bg-slate-850 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer flex justify-center items-center gap-1"
                >
                  <Plus size={12} /> Thêm thành viên vào danh sách tạm
                </button>

                {tempMembers.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-200 pt-2 text-[11px]">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Danh sách đăng ký tạm ({tempMembers.length})</span>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {tempMembers.map((m, idx) => (
                        <div key={idx} className="p-1.5 bg-white border border-slate-100 rounded-lg flex justify-between items-center font-mono">
                          <span>{m.name} ({m.relation})</span>
                          <button
                            type="button"
                            onClick={() => setTempMembers(tempMembers.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Lập Sổ Hộ Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sửa Thông tin Sổ Hộ Khẩu Modal */}
      {showEditModal && selectedHousehold && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Chỉnh sửa thông tin Sổ</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Sổ ID: {selectedHousehold.code}</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditHousehold} className="p-5 space-y-4 text-xs text-slate-600">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Địa chỉ cư trú</label>
                <input 
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Chủ hộ đại diện</label>
                  <select
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {selectedHousehold.members.map(m => (
                      <option key={m.cccd} value={m.name}>{m.name} ({m.relation})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Phân hệ cư trú</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "Thường trú" | "Tạm trú")}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Thường trú">Thường trú</option>
                    <option value="Tạm trú">Tạm trú</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block flex justify-between">
                  <span>GPS vệ tinh WGS84</span>
                  <span className="font-normal text-slate-400 font-mono">Ví dụ: 10.936828, 106.743392</span>
                </label>
                <input 
                  type="text"
                  placeholder="Dán hoặc chỉnh sửa tọa độ..."
                  value={coordInput}
                  onChange={(e) => handleCoordInputChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 bg-white"
                />
                {parsedGPS && (
                  <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg font-mono">
                    ✓ Phát hiện WGS84: {parsedGPS.lat}, {parsedGPS.lng}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Ghi chú biến động / Nguyên nhân thay đổi</label>
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Nhập ghi chú biến động lưu trữ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg h-20 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thêm nhân khẩu vào Hộ tịch Modal */}
      {showAddMemberModal && selectedHousehold && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Thêm Nhân khẩu vào Hộ tịch</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Sổ HK: {selectedHousehold.code}</p>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddNewMember} className="p-5 space-y-4 text-xs text-slate-600">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Họ và tên thành viên *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nguyễn Văn B"
                  value={addMemName}
                  onChange={(e) => setAddMemName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Số CCCD gắn chip *</label>
                  <input 
                    type="text"
                    required
                    placeholder="079XXXXXXXXX"
                    value={addMemCccd}
                    onChange={(e) => setAddMemCccd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Năm sinh *</label>
                  <input 
                    type="number"
                    required
                    placeholder="1995"
                    value={addMemBirthYear}
                    onChange={(e) => setAddMemBirthYear(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Quan hệ với chủ hộ *</label>
                  <select
                    value={addMemRelation}
                    onChange={(e) => setAddMemRelation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white animate-none"
                  >
                    <option value="Vợ">Vợ</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Bố">Bố</option>
                    <option value="Mẹ">Mẹ</option>
                    <option value="Anh/Em trai">Anh/Em trai</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Số điện thoại di động</label>
                  <input 
                    type="text"
                    placeholder="09XXXXXXXX"
                    value={addMemPhone}
                    onChange={(e) => setAddMemPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Xác nhận Nhập khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chuyển hộ tịch Modal */}
      {showMoveModal && selectedHousehold && moveTargetMember && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Chuyển hộ tịch Nhân khẩu</h3>
              <button 
                onClick={() => setShowMoveModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                Đang thực hiện chuyển nhân khẩu <strong>{moveTargetMember.name}</strong> (CCCD: {moveTargetMember.cccd}) từ Sổ hộ khẩu hiện tại ({selectedHousehold.code}) sang một Sổ hộ khẩu điện tử đích khác.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Lựa chọn Sổ hộ khẩu đích</label>
                <select
                  value={moveTargetHCode}
                  onChange={(e) => setMoveTargetHCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {households.filter(h => h.id !== selectedHousehold.id && !(h as any).deletedAt).map(h => (
                    <option key={h.id} value={h.code}>{h.code} - Hộ {h.ownerName} ({h.address})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handlePerformMoveMember}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Xác nhận chuyển hộ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tách hộ tịch Modal */}
      {showSplitModal && selectedHousehold && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Tách hộ tịch (Chia tách gia đình)</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Sổ nguồn: {selectedHousehold.code}</p>
              </div>
              <button 
                onClick={() => setShowSplitModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {/* Step 1: select members to split */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 block">Tích chọn các thành viên muốn tách sổ *</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                  {selectedHousehold.members.filter(m => m.relation !== "Chủ hộ").map((m, idx) => (
                    <div key={`${m.cccd}-${idx}`} className="flex items-center gap-2 select-none">
                      <input 
                        type="checkbox"
                        id={`split-${m.cccd}`}
                        checked={splitSelectedCccds.includes(m.cccd)}
                        onChange={() => toggleSelectSplitMember(m.cccd)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor={`split-${m.cccd}`} className="text-slate-700 cursor-pointer font-semibold">
                        {m.name} ({m.relation})
                      </label>
                    </div>
                  ))}
                  {selectedHousehold.members.filter(m => m.relation !== "Chủ hộ").length === 0 && (
                    <p className="text-xs text-slate-400 italic">Sổ này không có thành viên phụ để tách!</p>
                  )}
                </div>
              </div>

              {splitSelectedCccds.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Mã số Sổ mới *</label>
                      <input 
                        type="text"
                        value={splitNewHCode}
                        onChange={(e) => setSplitNewHCode(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Chỉ định Chủ hộ mới *</label>
                      <select
                        value={splitNewOwner}
                        onChange={(e) => setSplitNewOwner(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="">-- Lựa chọn --</option>
                        {selectedHousehold.members.filter(m => splitSelectedCccds.includes(m.cccd)).map((m, idx) => (
                          <option key={`${m.cccd}-${idx}`} value={m.cccd}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Địa chỉ sổ mới đăng ký *</label>
                    <input 
                      type="text"
                      value={splitNewAddress}
                      onChange={(e) => setSplitNewAddress(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handlePerformSplitHousehold}
                  disabled={splitSelectedCccds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Xác nhận tách hộ tịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sơ đồ Cây gia đình phả hệ Modal */}
      {showTreeModal && selectedHousehold && (
        <HouseholdFamilyTree 
          household={selectedHousehold}
          onClose={() => setShowTreeModal(false)}
          onSelectMember={(name, relation, cccd) => {
            setProfileViewMember({ name, relation, cccd });
          }}
        />
      )}

      {/* Chi tiết Profile thành viên Modal */}
      {profileViewMember && (
        <HouseholdMemberProfile 
          resident={residents.find(r => r.cccd === profileViewMember.cccd) || null}
          relation={profileViewMember.relation}
          onClose={() => setProfileViewMember(null)}
        />
      )}

      {/* Custom Delete Household Modal */}
      {householdToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Xác nhận xóa sổ hộ khẩu</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa (Soft Delete) Sổ hộ khẩu <strong className="text-slate-800">{householdToDelete.code}</strong> của chủ hộ <strong className="text-slate-800">{householdToDelete.ownerName}</strong>? Sổ hộ khẩu này sẽ được chuyển vào mục lưu trữ (Thùng rác).
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex gap-2 justify-end border-t border-slate-100">
              <button
                onClick={() => setHouseholdToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  const updated = households.map(h => {
                    if (h.id === householdToDelete.id) {
                      return {
                        ...h,
                        deletedAt: new Date().toISOString(),
                        deletedBy: "Cán bộ Hành chính Phường"
                      };
                    }
                    return h;
                  });
                  if (onUpdateHouseholds) {
                    onUpdateHouseholds(updated);
                    setSelectedHousehold(updated.find(h => !(h as any).deletedAt) || null);
                  }
                  setHouseholdToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm hover:shadow"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Member Removal Modal */}
      {memberToRemove && selectedHousehold && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Xác nhận xóa thành viên</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn chắc chắn muốn xóa thành viên <strong className="text-slate-800">{memberToRemove.name}</strong> khỏi sổ hộ tịch <strong className="text-slate-800">{selectedHousehold.code}</strong>? Nhân khẩu này sẽ chuyển về trạng thái tự do (không thuộc hộ tịch nào).
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex gap-2 justify-end border-t border-slate-100">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  executeRemoveMember(memberToRemove.cccd);
                  setMemberToRemove(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm hover:shadow"
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
