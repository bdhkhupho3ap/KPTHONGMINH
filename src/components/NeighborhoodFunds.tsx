import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  User, 
  Home, 
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingDown,
  Activity,
  FileText,
  Calendar,
  X,
  Check,
  Building,
  ChevronRight,
  FileUp,
  LayoutGrid,
  List
} from "lucide-react";
import { FundContribution } from "../types";
import Pagination from "./Pagination";

// Kiểu dữ liệu cho Khoản Chi (Expenditure)
interface Expenditure {
  id: string;
  fundName: "Quỹ Khuyến học" | "Quỹ Vì người nghèo" | "Quỹ Quốc phòng an ninh" | "Quỹ Phòng chống thiên tai" | "Quỹ Bảo trì hẻm";
  title: string; // Nội dung chi rõ ràng
  amount: number;
  spentAt: string;
  receiver: string; // Đơn vị/Người nhận thụ hưởng
  evidence?: string; // Số hóa đơn/chứng từ kèm theo
  approvedBy: string; // Người phê duyệt (ví dụ: Bí thư kiêm Trưởng KP Nguyễn Văn Hùng)
}

interface NeighborhoodFundsProps {
  contributions: FundContribution[];
  onAddContribution: (newCont: FundContribution) => void;
  onUpdateContributionStatus: (id: string, status: "Đã nộp" | "Chưa nộp", paidAt?: string) => void;
  households?: any[];
}

// Hàm đọc số tiền thành chữ tiếng Việt cực kỳ chi tiết
function docSoTiengViet(number: number): string {
  if (number === 0) return "Không đồng";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const unitsTen = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  const readGroup3 = (num: number, showZeroUnit: boolean): string => {
    let s = "";
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    
    if (hundreds > 0 || showZeroUnit) {
      s += units[hundreds] + " trăm ";
    }
    
    if (tens > 0) {
      s += unitsTen[tens] + " ";
    } else if (hundreds > 0 && ones > 0) {
      s += "lẻ ";
    }
    
    if (tens > 1 && ones === 1) {
      s += "mốt";
    } else if (tens > 0 && ones === 5) {
      s += "lăm";
    } else if (ones > 0) {
      s += units[ones];
    }
    return s.trim();
  };

  let str = "";
  let temp = number;
  const groups = [];
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  
  const groupUnits = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const showZero = i < groups.length - 1;
      str += readGroup3(g, showZero) + " " + groupUnits[i] + " ";
    }
  }
  
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1) + " đồng chẵn";
}

export default function NeighborhoodFunds({ 
  contributions, 
  onAddContribution, 
  onUpdateContributionStatus,
  households = []
}: NeighborhoodFundsProps) {
  // Sub-tabs: "thu" (Phiếu thu), "chi" (Phiếu chi), "baocao" (Tổng hợp báo cáo)
  const [activeSubTab, setActiveSubTab] = useState<"thu" | "chi" | "baocao">("thu");

  // State quản lý danh sách các khoản chi (Expenditures)
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);

  // States for Adding Contribution (Thu)
  const [showAddThuModal, setShowAddThuModal] = useState(false);
  const [householdCode, setHouseholdCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [fundName, setFundName] = useState<FundContribution["fundName"]>("Quỹ Khuyến học");
  const [amount, setAmount] = useState(150000);
  const [payImmediately, setPayImmediately] = useState(true);

  // States for Adding Expenditure (Chi)
  const [showAddChiModal, setShowAddChiModal] = useState(false);
  const [chiFundName, setChiFundName] = useState<Expenditure["fundName"]>("Quỹ Khuyến học");
  const [chiTitle, setChiTitle] = useState("");
  const [chiAmount, setChiAmount] = useState(500000);
  const [chiSpentAt, setChiSpentAt] = useState("");
  const [chiReceiver, setChiReceiver] = useState("");
  const [chiEvidence, setChiEvidence] = useState("");
  const [chiApprovedBy, setChiApprovedBy] = useState("Nguyễn Văn Hùng");

  // States for Printing Receipt
  const [selectedReceipt, setSelectedReceipt] = useState<{
    type: "THU" | "CHI";
    id: string;
    date: string;
    amount: number;
    title: string;
    subject: string; // Tên người nộp hoặc nhận
    evidence?: string;
    subDetail?: string; // Ví dụ: Mã hộ khẩu
    fundName: string;
    approvedBy?: string;
  } | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [fundFilter, setFundFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const [currentContributionsPage, setCurrentContributionsPage] = useState(1);
  const [currentExpendituresPage, setCurrentExpendituresPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const itemsPerPage = 8;

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode("card");
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentContributionsPage(1);
    setCurrentExpendituresPage(1);
  };

  const handleFundFilterChange = (val: string) => {
    setFundFilter(val);
    setCurrentContributionsPage(1);
    setCurrentExpendituresPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentContributionsPage(1);
    setCurrentExpendituresPage(1);
  };

  // Xử lý thêm phiếu thu (Contribution)
  const handleAddThuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdCode || !ownerName || !amount) {
      alert("Vui lòng nhập đầy đủ mã hộ khẩu và tên chủ hộ!");
      return;
    }

    const todayStr = new Date().toLocaleDateString("vi-VN");

    const newCont: FundContribution = {
      id: "FD" + (contributions.length + 1).toString().padStart(3, "0"),
      householdCode,
      ownerName,
      fundName,
      amount: Number(amount),
      status: payImmediately ? "Đã nộp" : "Chưa nộp",
      paidAt: payImmediately ? todayStr : undefined
    };

    onAddContribution(newCont);
    setShowAddThuModal(false);

    // Reset Form
    setHouseholdCode("");
    setOwnerName("");
    setAmount(150000);
    setPayImmediately(true);
  };

  // Xử lý thêm phiếu chi (Expenditure)
  const handleAddChiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiTitle || !chiAmount || !chiReceiver || !chiSpentAt) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    const newExp: Expenditure = {
      id: "EXP" + (expenditures.length + 1).toString().padStart(3, "0"),
      fundName: chiFundName,
      title: chiTitle,
      amount: Number(chiAmount),
      spentAt: chiSpentAt,
      receiver: chiReceiver,
      evidence: chiEvidence || "Không có",
      approvedBy: chiApprovedBy
    };

    setExpenditures([newExp, ...expenditures]);
    setShowAddChiModal(false);

    // Reset Form
    setChiTitle("");
    setChiAmount(500000);
    setChiSpentAt("");
    setChiReceiver("");
    setChiEvidence("");
  };

  // Xử lý In Biên Lai nhanh
  const handleOpenReceipt = (type: "THU" | "CHI", item: any) => {
    if (type === "THU") {
      setSelectedReceipt({
        type: "THU",
        id: item.id,
        date: item.paidAt || new Date().toLocaleDateString("vi-VN"),
        amount: item.amount,
        title: `Đóng góp tự nguyện vào ${item.fundName} năm 2026`,
        subject: item.ownerName,
        subDetail: `Mã hộ khẩu: ${item.householdCode}`,
        evidence: "Biên lai thu quỹ tự quản",
        fundName: item.fundName,
        approvedBy: "Nguyễn Văn Hùng"
      });
    } else {
      setSelectedReceipt({
        type: "CHI",
        id: item.id,
        date: item.spentAt,
        amount: item.amount,
        title: item.title,
        subject: item.receiver,
        subDetail: `Người phê duyệt: ${item.approvedBy}`,
        evidence: item.evidence,
        fundName: item.fundName,
        approvedBy: item.approvedBy
      });
    }
  };

  // Xử lý Xuất file Excel (Dưới dạng CSV có hỗ trợ hiển thị Tiếng Việt UTF-8 chuẩn trên MS Excel)
  const handleExportToExcel = () => {
    let csvContent = "\uFEFF"; // Byte Order Mark để sửa lỗi font tiếng Việt trên MS Excel
    
    if (activeSubTab === "thu") {
      csvContent += "DANH SÁCH PHIẾU THU & ĐÓNG GÓP QUỸ KHU PHỐ 3\n";
      csvContent += "Mã Biên Lai,Mã Hộ Khẩu,Họ Tên Chủ Hộ,Quỹ Đóng Góp,Số Tiền (VNĐ),Ngày Nộp,Trạng Thái\n";
      contributions.forEach(c => {
        csvContent += `"${c.id}","${c.householdCode}","${c.ownerName}","${c.fundName}",${c.amount},"${c.paidAt || "Chưa nộp"}","${c.status}"\n`;
      });
    } else if (activeSubTab === "chi") {
      csvContent += "DANH SÁCH CHI TIÊU HOẠT ĐỘNG QUỸ KHU PHỐ 3\n";
      csvContent += "Mã Phiếu Chi,Quỹ Sử Dụng,Nội Dung Chi Tiêu,Số Tiền (VNĐ),Ngày Chi,Đơn Vị Thụ Hưởng,Chứng Từ,Người Duyệt\n";
      expenditures.forEach(e => {
        csvContent += `"${e.id}","${e.fundName}","${e.title}",${e.amount},"${e.spentAt}","${e.receiver}","${e.evidence || ""}","${e.approvedBy}"\n`;
      });
    } else {
      csvContent += "BÁO CÁO TỔNG HỢP THU CHI QUỸ TỰ QUẢN KHU PHỐ 3\n";
      csvContent += "Tên Quỹ,Tổng Thu (VNĐ),Tổng Chi (VNĐ),Tồn Quỹ Còn Lại (VNĐ)\n";
      const fundsList = ["Quỹ Khuyến học", "Quỹ Vì người nghèo", "Quỹ Quốc phòng an ninh", "Quỹ Phòng chống thiên tai", "Quỹ Bảo trì hẻm"] as const;
      fundsList.forEach(fund => {
        const tThu = contributions.filter(c => c.fundName === fund && c.status === "Đã nộp").reduce((sum, c) => sum + c.amount, 0);
        const tChi = expenditures.filter(e => e.fundName === fund).reduce((sum, e) => sum + e.amount, 0);
        csvContent += `"${fund}",${tThu},${tChi},${tThu - tChi}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BaoCao_TaiChinh_KP3_${activeSubTab}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tính toán thống kê tổng quan
  const totalRevenue = contributions
    .filter(c => c.status === "Đã nộp")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExpense = expenditures
    .reduce((sum, e) => sum + e.amount, 0);

  const balanceFund = totalRevenue - totalExpense;

  const collectionRate = contributions.length > 0
    ? Math.round((contributions.filter(c => c.status === "Đã nộp").length / contributions.length) * 100)
    : 0;

  // Lọc danh sách Thu
  const filteredContributions = contributions.filter(c => {
    const matchesSearch = c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.householdCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFund = fundFilter === "Tất cả" || c.fundName === fundFilter;
    const matchesStatus = statusFilter === "Tất cả" || c.status === statusFilter;
    return matchesSearch && matchesFund && matchesStatus;
  });

  // Contributions Pagination Logic
  const totalContributionsItems = filteredContributions.length;
  const totalContributionsPages = Math.ceil(totalContributionsItems / itemsPerPage) || 1;
  const activeContributionsPage = currentContributionsPage > totalContributionsPages ? totalContributionsPages : currentContributionsPage;
  const startContributionsIndex = (activeContributionsPage - 1) * itemsPerPage;
  const paginatedContributions = filteredContributions.slice(startContributionsIndex, startContributionsIndex + itemsPerPage);

  // Lọc danh sách Chi
  const filteredExpenditures = expenditures.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFund = fundFilter === "Tất cả" || e.fundName === fundFilter;
    return matchesSearch && matchesFund;
  });

  // Expenditures Pagination Logic
  const totalExpendituresItems = filteredExpenditures.length;
  const totalExpendituresPages = Math.ceil(totalExpendituresItems / itemsPerPage) || 1;
  const activeExpendituresPage = currentExpendituresPage > totalExpendituresPages ? totalExpendituresPages : currentExpendituresPage;
  const startExpendituresIndex = (activeExpendituresPage - 1) * itemsPerPage;
  const paginatedExpenditures = filteredExpenditures.slice(startExpendituresIndex, startExpendituresIndex + itemsPerPage);

  // Quỹ tự quản danh sách thống kê chi tiết từng loại quỹ
  const listFundsStats = [
    "Quỹ Khuyến học",
    "Quỹ Vì người nghèo",
    "Quỹ Quốc phòng an ninh",
    "Quỹ Phòng chống thiên tai",
    "Quỹ Bảo trì hẻm"
  ].map(fund => {
    const revenue = contributions
      .filter(c => c.fundName === fund && c.status === "Đã nộp")
      .reduce((sum, c) => sum + c.amount, 0);
    const expense = expenditures
      .filter(e => e.fundName === fund)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: fund,
      revenue,
      expense,
      balance: revenue - expense,
      percent: revenue > 0 ? Math.min(100, Math.round((expense / revenue) * 100)) : 0
    };
  });

  return (
    <div id="neighborhood-funds-view" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-indigo-500 font-bold px-2.5 py-0.5 rounded font-mono uppercase tracking-widest text-indigo-100">Kế toán & Tài chính công khai</span>
          <h1 className="text-xl font-bold tracking-tight">Hệ thống Quản lý Đóng góp & Thu Chi Quỹ Khu phố</h1>
          <p className="text-indigo-200 text-xs font-sans">Theo dõi minh bạch nguồn lực đóng góp xã hội, tự quản địa phương và kế hoạch chi tiêu hoạt động vì cộng đồng</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button 
            onClick={handleExportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" /> Xuất file Excel (CSV)
          </button>
          
          {activeSubTab === "thu" ? (
            <button 
              onClick={() => setShowAddThuModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer border border-indigo-400/20"
            >
              <Plus size={15} /> Ghi nhận Phiếu Thu
            </button>
          ) : activeSubTab === "chi" ? (
            <button 
              onClick={() => setShowAddChiModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer border border-rose-400/20"
            >
              <Plus size={15} /> Tạo Phiếu Chi quỹ
            </button>
          ) : null}
        </div>
      </div>

      {/* Financial Overview Statistics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tồn Quỹ (Balance) */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tồn quỹ hiện tại</span>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {balanceFund.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">An toàn ngân sách</span>
          </div>
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Coins size={22} /></span>
        </div>

        {/* Tổng Thu (Total Revenue) */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng thu nộp quỹ</span>
            <span className="text-lg font-extrabold text-indigo-700 mt-1 block">
              {totalRevenue.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[9px] text-slate-400 font-mono block mt-1">
              Từ {contributions.filter(c => c.status === "Đã nộp").length} hộ đã đóng
            </span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight size={22} /></span>
        </div>

        {/* Tổng Chi (Total Expenditure) */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng chi hoạt động</span>
            <span className="text-lg font-extrabold text-rose-600 mt-1 block">
              {totalExpense.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[9px] text-slate-400 font-mono block mt-1">
              Đã quyết toán {expenditures.length} mục
            </span>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight size={22} /></span>
        </div>

        {/* Collection Efficiency Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tỉ lệ hoàn thành thu</span>
            <span className="text-lg font-black text-slate-800 mt-1 block">
              {collectionRate}%
            </span>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${collectionRate}%` }}></div>
            </div>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={22} /></span>
        </div>
      </div>

      {/* Switch Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveSubTab("thu")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer
            ${activeSubTab === "thu" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}
          `}
        >
          <ArrowUpRight size={16} className="text-emerald-500" /> Quản lý các Khoản Thu (Hộ nộp)
          {activeSubTab === "thu" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("chi")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer
            ${activeSubTab === "chi" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}
          `}
        >
          <ArrowDownRight size={16} className="text-rose-500" /> Quản lý các Khoản Chi (Quyết toán)
          {activeSubTab === "chi" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("baocao")}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer
            ${activeSubTab === "baocao" ? "text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-600"}
          `}
        >
          <Activity size={16} className="text-indigo-500" /> Báo cáo cân đối thu chi theo Quỹ
          {activeSubTab === "baocao" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* SEARCH AND FILTERS (Only show on 'thu' and 'chi' tabs) */}
      {activeSubTab !== "baocao" && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeSubTab === "thu" ? "Tìm kiếm phiếu thu theo tên chủ hộ, mã hộ khẩu..." : "Tìm kiếm phiếu chi theo nội dung chi tiêu, người thụ hưởng..."}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Filter size={11} /> Loại quỹ:</span>
              <select 
                value={fundFilter}
                onChange={(e) => handleFundFilterChange(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Tất cả">Tất cả các Quỹ</option>
                <option value="Quỹ Khuyến học">Quỹ Khuyến học</option>
                <option value="Quỹ Vì người nghèo">Quỹ Vì người nghèo</option>
                <option value="Quỹ Quốc phòng an ninh">Quỹ Quốc phòng an ninh</option>
                <option value="Quỹ Phòng chống thiên tai">Quỹ Phòng chống thiên tai</option>
                <option value="Quỹ Bảo trì hẻm">Quỹ Bảo trì hẻm</option>
              </select>
            </div>

            {activeSubTab === "thu" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Filter size={11} /> Trạng thái:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Tất cả">Tất cả đóng nộp</option>
                  <option value="Đã nộp">Đã nộp tiền</option>
                  <option value="Chưa nộp">Chưa nộp tiền</option>
                </select>
              </div>
            )}

            {/* View switcher */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                title="Xem dạng Bảng"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "card" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                title="Xem dạng Thẻ"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN RENDER AREA */}

      {/* VIEW: PHIẾU THU */}
      {activeSubTab === "thu" && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Biên lai ID</th>
                    <th className="p-4">Hộ khẩu / Đại diện nộp</th>
                    <th className="p-4">Danh mục Quỹ đóng góp</th>
                    <th className="p-4">Số tiền thu</th>
                    <th className="p-4">Ngày hoàn thành</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredContributions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        Không tìm thấy biên lai nộp tiền quỹ đóng góp nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedContributions.map((cont) => {
                      const isPaid = cont.status === "Đã nộp";
                      return (
                        <tr key={cont.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500">{cont.id}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                                {cont.ownerName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">{cont.ownerName}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">Mã HK: {cont.householdCode}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-700 bg-indigo-50/50 text-indigo-800 px-2 py-0.5 rounded text-[10px]">
                              {cont.fundName}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-800 font-mono text-sm">
                            {cont.amount.toLocaleString("vi-VN")}đ
                          </td>
                          <td className="p-4 font-mono text-slate-500">
                            {cont.paidAt || "—"}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border text-[9px]
                              ${isPaid 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100"
                              }
                            `}>
                              {isPaid ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {cont.status}
                            </span>
                          </td>
                          <td className="p-4 flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenReceipt("THU", cont)}
                              className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-semibold cursor-pointer transition-colors"
                              title="Xem và in biên lai"
                            >
                              <Printer size={12} /> In Biên Lai
                            </button>

                            {isPaid ? (
                              <button
                                onClick={() => onUpdateContributionStatus(cont.id, "Chưa nộp")}
                                className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                Hủy thu
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const todayStr = new Date().toLocaleDateString("vi-VN");
                                  onUpdateContributionStatus(cont.id, "Đã nộp", todayStr);
                                }}
                                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                Thu tiền
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/20 max-h-[550px] overflow-y-auto">
              {filteredContributions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs col-span-full">
                  Không tìm thấy biên lai nộp tiền quỹ đóng góp nào phù hợp bộ lọc.
                </div>
              ) : (
                paginatedContributions.map((cont) => {
                  const isPaid = cont.status === "Đã nộp";
                  return (
                    <div 
                      key={cont.id}
                      className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-400">ID: {cont.id}</span>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5">{cont.ownerName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Mã HK: {cont.householdCode}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border text-[9px] shrink-0
                          ${isPaid 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-100"
                          }
                        `}>
                          {isPaid ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {cont.status}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-1 flex-wrap">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Nội dung Quỹ</span>
                          <span className="font-semibold text-indigo-700 text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                            {cont.fundName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Số tiền</span>
                          <span className="font-bold text-slate-800 text-sm font-mono">
                            {cont.amount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-50 flex justify-between items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">Ngày: {cont.paidAt || "—"}</span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenReceipt("THU", cont)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                            title="In biên lai"
                          >
                            <Printer size={12} />
                          </button>
                          {isPaid ? (
                            <button
                              onClick={() => onUpdateContributionStatus(cont.id, "Chưa nộp")}
                              className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              Hủy thu
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const todayStr = new Date().toLocaleDateString("vi-VN");
                                onUpdateContributionStatus(cont.id, "Đã nộp", todayStr);
                              }}
                              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              Thu tiền
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          <Pagination
            id="contributions-pagination"
            currentPage={activeContributionsPage}
            totalItems={totalContributionsItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentContributionsPage}
          />
        </div>
      )}

      {/* VIEW: PHIẾU CHI */}
      {activeSubTab === "chi" && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Phiếu Chi ID</th>
                    <th className="p-4">Nội Dung Chi Tiêu</th>
                    <th className="p-4">Quỹ Trích Chi</th>
                    <th className="p-4">Số Tiền Chi</th>
                    <th className="p-4">Ngày Chi</th>
                    <th className="p-4">Đơn Vị Thụ Hưởng</th>
                    <th className="p-4 text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenditures.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        Không tìm thấy khoản chi tiêu quyết toán nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenditures.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">{exp.id}</td>
                        <td className="p-4 font-medium text-slate-800 max-w-xs md:max-w-md">
                          <div className="space-y-1">
                            <p className="line-clamp-2 leading-relaxed">{exp.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>Người duyệt: <strong>{exp.approvedBy}</strong></span>
                              {exp.evidence && <span>• Chứng từ: <strong className="font-mono text-slate-500">{exp.evidence}</strong></span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-rose-800 bg-rose-50/50 px-2 py-0.5 rounded text-[10px]">
                            {exp.fundName}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-rose-600 font-mono text-sm">
                          -{exp.amount.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-4 font-mono text-slate-500">{exp.spentAt}</td>
                        <td className="p-4 text-slate-700 font-medium">{exp.receiver}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenReceipt("CHI", exp)}
                              className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-semibold cursor-pointer transition-colors"
                            >
                              <Printer size={12} /> In Phiếu Chi
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu chi "${exp.id}" không?`)) {
                                  setExpenditures(expenditures.filter(e => e.id !== exp.id));
                                }
                              }}
                              className="text-[10px] text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Xóa phiếu chi"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/20 max-h-[550px] overflow-y-auto">
              {filteredExpenditures.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs col-span-full">
                  Không tìm thấy khoản chi tiêu quyết toán nào phù hợp bộ lọc.
                </div>
              ) : (
                paginatedExpenditures.map((exp) => (
                  <div 
                    key={exp.id}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">ID: {exp.id}</span>
                        <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-[9px] shrink-0">
                          {exp.fundName}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-2 leading-snug h-8">{exp.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Người duyệt: <strong>{exp.approvedBy}</strong></p>
                      {exp.evidence && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Chứng từ: <strong>{exp.evidence}</strong></p>}
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Người thụ hưởng</span>
                        <span className="text-xs text-slate-700 font-bold truncate max-w-[120px] block">{exp.receiver}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-rose-500 font-medium block">Số tiền chi</span>
                        <span className="font-bold text-rose-600 text-sm font-mono">
                          -{exp.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Ngày: {exp.spentAt}</span>
                      <div className="flex gap-1.5 shrink-0 items-center">
                        <button
                          onClick={() => handleOpenReceipt("CHI", exp)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                          title="In phiếu chi"
                        >
                          <Printer size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu chi "${exp.id}" không?`)) {
                              setExpenditures(expenditures.filter(e => e.id !== exp.id));
                            }
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors cursor-pointer"
                          title="Xóa phiếu chi"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          <Pagination
            id="expenditures-pagination"
            currentPage={activeExpendituresPage}
            totalItems={totalExpendituresItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentExpendituresPage}
          />
        </div>
      )}

      {/* VIEW: BÁO CÁO CÂN ĐỐI TỔNG HỢP THEO QUỸ */}
      {activeSubTab === "baocao" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Bảng cân đối tài chính từng loại quỹ (Năm 2026)</h3>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Đã đối soát kế toán</span>
            </div>

            <div className="space-y-4">
              {listFundsStats.map(stat => (
                <div key={stat.name} className="p-4 rounded-xl border border-slate-50 bg-slate-50/20 space-y-3 hover:border-slate-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{stat.name}</span>
                    <div className="flex gap-4 text-xs font-mono">
                      <div className="text-left">
                        <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Tổng Thu</span>
                        <span className="font-bold text-emerald-600">+{stat.revenue.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="text-left border-l border-slate-200 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Tổng Chi</span>
                        <span className="font-bold text-rose-500">-{stat.expense.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="text-left border-l border-slate-200 pl-3">
                        <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Còn Tồn</span>
                        <span className={`font-bold ${stat.balance >= 0 ? "text-slate-800" : "text-red-500"}`}>
                          {stat.balance.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thanh biểu đồ lồng ghép */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Tỉ lệ giải ngân (Chi / Thu)</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stat.percent > 90 ? "bg-red-500" :
                          stat.percent > 60 ? "bg-amber-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${stat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: GHI NHẬN PHIẾU THU */}
      {showAddThuModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Ghi nhận biên lai nộp Quỹ tự quản mới</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Lưu ý: Các quỹ này thu trên tinh thần tự nguyện tự quản</p>
              </div>
              <button 
                onClick={() => setShowAddThuModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddThuSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Danh mục Quỹ thu nộp *</label>
                <select 
                  value={fundName}
                  onChange={(e: any) => setFundName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Quỹ Khuyến học">Quỹ Khuyến học</option>
                  <option value="Quỹ Vì người nghèo">Quỹ Vì người nghèo</option>
                  <option value="Quỹ Quốc phòng an ninh">Quỹ Quốc phòng an ninh</option>
                  <option value="Quỹ Phòng chống thiên tai">Quỹ Phòng chống thiên tai</option>
                  <option value="Quỹ Bảo trì hẻm">Quỹ Bảo trì hẻm</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Chọn nhanh từ danh sách Sổ Hộ Khẩu</label>
                <select
                  onChange={(e) => {
                    const code = e.target.value;
                    if (!code) return;
                    const hh = households.find(h => h.code === code);
                    if (hh) {
                      setHouseholdCode(hh.code);
                      setOwnerName(hh.ownerName);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">-- Chọn Sổ hộ khẩu để tự động điền --</option>
                  {households.map(hh => (
                    <option key={hh.code} value={hh.code}>
                      Hộ {hh.ownerName} ({hh.code}) - {hh.address}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tự động điền Mã hộ khẩu và tên chủ hộ đại diện đóng nộp</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Mã hộ khẩu (Ví dụ: HK-301) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="HK-30x"
                    value={householdCode}
                    onChange={(e) => setHouseholdCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Tên đại diện đóng nộp *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn A"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Số tiền đóng góp (đơn vị: VNĐ) *</label>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="payImmediately"
                  checked={payImmediately}
                  onChange={(e) => setPayImmediately(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="payImmediately" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Hộ dân đã đóng tiền trực tiếp tại Nhà văn hóa
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddThuModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Ghi biên nhận thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO PHIẾU CHI */}
      {showAddChiModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Lập phiếu Chi tiêu ngân sách Quỹ mới</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">Ghi chép chứng từ chi tiêu, quyết toán công khai công tác địa phương</p>
              </div>
              <button 
                onClick={() => setShowAddChiModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddChiSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nguồn Quỹ trích chi *</label>
                <select 
                  value={chiFundName}
                  onChange={(e: any) => setChiFundName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Quỹ Khuyến học">Quỹ Khuyến học</option>
                  <option value="Quỹ Vì người nghèo">Quỹ Vì người nghèo</option>
                  <option value="Quỹ Quốc phòng an ninh">Quỹ Quốc phòng an ninh</option>
                  <option value="Quỹ Phòng chống thiên tai">Quỹ Phòng chống thiên tai</option>
                  <option value="Quỹ Bảo trì hẻm">Quỹ Bảo trì hẻm</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nội dung chi tiêu chi tiết *</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="Ví dụ: Chi hỗ trợ mua quà khuyến học học sinh giỏi, chi bồi dưỡng ANCS tuần tra..."
                  value={chiTitle}
                  onChange={(e) => setChiTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Số tiền trích chi (VNĐ) *</label>
                  <input 
                    type="number" 
                    required
                    value={chiAmount}
                    onChange={(e) => setChiAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Ngày thực hiện chi *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: 12/07/2026"
                    value={chiSpentAt}
                    onChange={(e) => setChiSpentAt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Đơn vị / Người thụ hưởng *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhà sách, cá nhân, đơn vị..."
                    value={chiReceiver}
                    onChange={(e) => setChiReceiver(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Kèm theo chứng từ / Hóa đơn số</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: HĐ-045, PT-302"
                    value={chiEvidence}
                    onChange={(e) => setChiEvidence(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Người phê duyệt *</label>
                <input 
                  type="text" 
                  required
                  value={chiApprovedBy}
                  onChange={(e) => setChiApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddChiModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Lập phiếu chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IN BIÊN LAI (PRINT RECEIPT) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header Controls */}
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider">Xem trước hóa đơn biên lai chứng từ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                >
                  <Printer size={12} /> In máy in / Lưu PDF
                </button>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Area */}
            <div className="p-8 md:p-12 bg-white text-slate-800 font-sans border-8 border-slate-100 relative overflow-hidden print:border-0 print:p-0">
              
              {/* Giả lập dấu mộc đỏ ở biên lai tài chính địa phương */}
              <div className="absolute right-12 top-24 border-4 border-rose-500/30 text-rose-500/40 font-bold uppercase rounded-full w-24 h-24 flex items-center justify-center -rotate-12 text-[9px] pointer-events-none select-none text-center leading-none">
                ĐÃ THU TIỀN<br />KP 3 AN PHÚ
              </div>

              {/* Header của Biên Lai Việt Nam */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">UBND PHƯỜNG AN PHÚ</span>
                  <span className="text-xs font-black uppercase text-indigo-900 block flex items-center gap-1.5">
                    <Building size={14} /> BAN ĐIỀU HÀNH KHU PHỐ 3
                  </span>
                  <span className="text-[9px] text-slate-400 block font-serif">Địa chỉ: Đường An Phú, Phường An Phú, Quận 2, TP.HCM</span>
                </div>
                <div className="text-right sm:text-right text-xs">
                  <p className="font-mono text-slate-400 text-[10px]">Mẫu số: 01-TT/KP3</p>
                  <p className="font-mono font-bold text-slate-800 text-[11px] mt-1">SỐ: {selectedReceipt.id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ngày lập: {selectedReceipt.date}</p>
                </div>
              </div>

              {/* Title Phiếu */}
              <div className="text-center py-6 space-y-1">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {selectedReceipt.type === "THU" ? "PHIẾU THU TIỀN" : "PHIẾU CHI TIỀN"}
                </h2>
                <p className="text-[11px] font-medium text-indigo-700 italic">({selectedReceipt.fundName})</p>
              </div>

              {/* Thông tin nội dung chi tiết biên lai */}
              <div className="space-y-3.5 text-xs pb-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 border-b border-slate-100 pb-2">
                  <span className="md:col-span-3 text-slate-500 font-medium">
                    {selectedReceipt.type === "THU" ? "Họ tên người nộp:" : "Đơn vị/Người nhận tiền:"}
                  </span>
                  <strong className="md:col-span-9 text-slate-900 text-sm">{selectedReceipt.subject}</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 border-b border-slate-100 pb-2">
                  <span className="md:col-span-3 text-slate-500 font-medium">Chi tiết đối tượng:</span>
                  <span className="md:col-span-9 text-slate-800 font-mono font-bold">{selectedReceipt.subDetail}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 border-b border-slate-100 pb-2">
                  <span className="md:col-span-3 text-slate-500 font-medium">Nội dung thu/chi:</span>
                  <span className="md:col-span-9 text-slate-800 font-medium leading-relaxed">{selectedReceipt.title}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 border-b border-slate-100 pb-2">
                  <span className="md:col-span-3 text-slate-500 font-medium">Số tiền quy đổi:</span>
                  <strong className="md:col-span-9 text-slate-900 font-mono text-base">
                    {selectedReceipt.amount.toLocaleString("vi-VN")} VNĐ
                  </strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 border-b border-slate-100 pb-2 italic">
                  <span className="md:col-span-3 text-slate-500 font-medium">Bằng chữ:</span>
                  <span className="md:col-span-9 text-slate-900 font-bold">{docSoTiengViet(selectedReceipt.amount)}</span>
                </div>

                {selectedReceipt.evidence && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                    <span className="md:col-span-3 text-slate-500 font-medium">Kèm theo chứng từ:</span>
                    <span className="md:col-span-9 text-slate-600 font-mono font-semibold">{selectedReceipt.evidence}</span>
                  </div>
                )}
              </div>

              {/* Phần chữ ký chân biên lai */}
              <div className="grid grid-cols-3 gap-4 text-center text-[11px] pt-4 border-t-2 border-slate-200">
                <div className="space-y-12">
                  <span className="font-bold text-slate-800 uppercase block">NGƯỜI LẬP PHIẾU</span>
                  <p className="text-slate-400 font-mono text-[9px]">(Ký, ghi rõ họ tên)</p>
                  <strong className="block text-slate-800 pt-2">{selectedReceipt.approvedBy || "Đặng Thị Thảo"}</strong>
                </div>
                <div className="space-y-12">
                  <span className="font-bold text-slate-800 uppercase block">THỦ QUỸ</span>
                  <p className="text-slate-400 font-mono text-[9px]">(Ký, đóng dấu thu tiền)</p>
                  <strong className="block text-slate-800 pt-2">Lê Thị Mai</strong>
                </div>
                <div className="space-y-12">
                  <span className="font-bold text-slate-800 uppercase block">TRƯỞNG KHU PHỐ 3</span>
                  <p className="text-slate-400 font-mono text-[9px]">(Phê duyệt quyết toán)</p>
                  <strong className="block text-slate-800 pt-2">Nguyễn Văn Hùng</strong>
                </div>
              </div>

              <div className="mt-12 text-center text-[9px] text-slate-400 font-mono tracking-tight pt-4 border-t border-slate-100">
                Cảm ơn sự đóng góp tự quản và đồng lòng của cư dân để xây dựng Khu phố 3 văn minh, nghĩa tình!
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
