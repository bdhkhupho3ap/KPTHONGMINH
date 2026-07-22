import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  User, 
  Phone, 
  FileText, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Briefcase,
  Printer,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  Check,
  LayoutGrid,
  List,
  Home,
  Shield,
  Milestone,
  Sparkles
} from "lucide-react";
import { Resident, Household } from "../types";
import * as XLSX from "xlsx";
import Pagination from "./Pagination";
import { normalizeAddress, getSimilarity, getInitialsSvg } from "../utils/addressEngine";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

interface CitizenManagementProps {
  residents: Resident[];
  onAddResident: (newResident: Resident) => void;
  onDeleteResident: (id: string) => void;
  onUpdateResidents?: (residents: Resident[]) => void;
  onUpdateHouseholds?: (households: any[]) => void;
  households?: any[];
}

export default function CitizenManagement({ 
  residents, 
  onAddResident, 
  onDeleteResident,
  onUpdateResidents,
  onUpdateHouseholds,
  households = []
}: CitizenManagementProps) {
  const [selectedResident, setSelectedResident] = useState<Resident | null>(residents.find(r => r.fullName === "Nguyễn Hoàng Nam") || residents[0] || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [genderFilter, setGenderFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const itemsPerPage = 8;

  useEffect(() => {
    // Detect mobile and tablet screens
    if (window.innerWidth < 1024) {
      setViewMode("card");
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (val: string) => {
    setGenderFilter(val);
    setCurrentPage(1);
  };

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importTab, setImportTab] = useState<"file" | "paste">("file");
  const [pasteText, setPasteText] = useState("");

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);

  // Custom confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Helper to generate next household code
  const getNextHouseholdCode = (hhs: any[]) => {
    let maxNum = 300;
    (hhs || []).forEach(h => {
      const code = h.code || h.householdId || "";
      const match = code.match(/HK-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `HK-${maxNum + 1}`;
  };

  const [householdMode, setHouseholdMode] = useState<"existing" | "new">("existing");

  // New Resident Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Nam" as "Nam" | "Nữ",
    birthDate: "",
    cccd: "",
    phone: "",
    status: "Thường trú" as "Thường trú" | "Tạm trú" | "Tạm vắng",
    occupation: "",
    address: "42 Lương Định Của, Phường An Phú",
    householdId: "HK-301",
    relationToOwner: "Thành viên",
    ownerName: "",
    permanentAddress: "",
    registrationDate: "",
    healthInsuranceCard: "",
    gtDen: ""
  });

  const handleEditClick = (res: Resident) => {
    setIsEditMode(true);
    setEditingResidentId(res.id);
    setFormData({
      fullName: res.fullName,
      gender: res.gender,
      birthDate: res.birthDate,
      cccd: res.cccd,
      phone: res.phone === "N/A" ? "" : res.phone,
      status: res.status,
      occupation: res.occupation === "Tự do" ? "" : res.occupation,
      address: res.address,
      householdId: res.householdId,
      relationToOwner: res.relationToOwner,
      ownerName: res.ownerName || "",
      permanentAddress: res.permanentAddress || "",
      registrationDate: res.registrationDate || "",
      healthInsuranceCard: res.healthInsuranceCard || "",
      gtDen: res.gtDen || ""
    });
    setShowModal(true);
  };

  // Download Sample Excel Template
  const downloadTemplate = () => {
    const headers = [
      {
        "Họ và Tên": "Nguyễn Văn A",
        "Số CCCD": "079095012345",
        "Giới tính": "Nam",
        "Ngày sinh": "15/08/1995",
        "Số điện thoại": "0901234567",
        "Diện cư trú": "Thường trú",
        "Nghề nghiệp": "Kỹ sư",
        "Địa chỉ": "42 Lương Định Của, Phường An Phú",
        "Mã hộ khẩu": "HK-301",
        "Quan hệ với chủ hộ": "Con trai"
      },
      {
        "Họ và Tên": "Trần Thị B",
        "Số CCCD": "079198005432",
        "Giới tính": "Nữ",
        "Ngày sinh": "20/12/1998",
        "Số điện thoại": "0912345678",
        "Diện cư trú": "Tạm trú",
        "Nghề nghiệp": "Sinh viên",
        "Địa chỉ": "78 Đường 36, Phường An Phú",
        "Mã hộ khẩu": "HK-302",
        "Quan hệ với chủ hộ": "Chủ hộ"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach cu dan");
    XLSX.writeFile(workbook, "Mau_Danh_Sach_Cu_Dan_KP3.xlsx");
  };

  // Helper to parse Excel dates (handles serial numbers like 29229 and string dates)
  const parseExcelDate = (val: any): string => {
    if (!val) return "";
    const str = String(val).trim();
    
    // Check for Excel serial date (5-digit number)
    if (/^\d{5}$/.test(str)) {
      const serial = parseInt(str, 10);
      const date = new Date((serial - 25569) * 86400 * 1000);
      const d = date.getUTCDate().toString().padStart(2, '0');
      const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const y = date.getUTCFullYear();
      return `${d}/${m}/${y}`;
    }
    
    // Check for year-only date
    if (/^\d{4}$/.test(str)) {
      return `01/01/${str}`;
    }
    
    return str;
  };

  // Helper to clean up raw clipboard copy from Excel (removes quotes and replaces internal newlines in cells)
  const cleanPasteText = (text: string): string => {
    let result = "";
    let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }
      if (insideQuotes && (char === '\n' || char === '\r')) {
        if (char === '\n') {
          result += " ";
        }
        continue;
      }
      result += char;
    }
    return result;
  };

  // Excel Parser Logic
  const handleExcelParse = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          alert("Tệp tin Excel trống hoặc không đúng định dạng!");
          return;
        }

        // Map headers dynamically
        const mapped = jsonData.map((row, idx) => {
          const findVal = (keys: string[]) => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "");
            const foundKey = Object.keys(row).find(k => 
              keys.some(key => normalize(k) === normalize(key))
            );
            return foundKey ? String(row[foundKey]).trim() : "";
          };

          const fullName = findVal(["Họ và Tên", "Ho va Ten", "fullName", "Họ tên", "Ho ten", "Tên", "Ten"]);
          const cccd = findVal(["Số ĐDCN/CCCD/\r\nCMND", "Số ĐDCN/CCCD/CMND", "Số CCCD", "So CCCD", "cccd", "CMND", "Số định danh", "So dinh danh"]);
          const genderStr = findVal(["Giới tính", "Gioi tinh", "gender", "Phái", "Phai"]);
          
          const rawBirthDate = findVal(["Ngày sinh", "Ngay sinh", "birthDate", "Năm sinh", "Nam sinh", "ngày sinh"]);
          const birthDate = parseExcelDate(rawBirthDate) || "01/01/1990";
          
          const phone = findVal(["Số điện thoại", "So dien thoai", "phone", "SĐT", "SDT", "Điện thoại", "Dien thoai"]);
          const statusStr = findVal(["Trạng thái cư trú", "Diện cư trú", "Dien cu tru", "status", "Trạng thái", "Trang thai", "Cư trú", "Cu tru", "Đang thường trú"]);
          const occupation = findVal(["Nghề nghiệp", "Nghe nghiep", "occupation", "Công việc", "Cong viec"]);
          
          let address = findVal(["địa chỉ tạm trú", "nơi ở hiện tại", "địa chỉ hiện tại", "địa chỉ", "dia chi", "address", "nơi ở", "noi o"]);
          const householdId = findVal(["Mã hộ khẩu", "Ma ho khau", "householdId", "Mã hộ", "Ma ho", "Số hộ khẩu", "So ho khau"]);
          const relationToOwner = findVal(["Quan hệ với chủ hộ", "Quan he voi chu ho", "relationToOwner", "Quan hệ", "Quan he", "Quan hệ chủ hộ", "Quan hệ với chủ hộ"]);

          const ownerName = findVal(["Họ và tên chủ hộ", "Ho va ten chu ho", "ownerName", "Chủ hộ", "Chu ho"]);
          let permanentAddress = findVal(["địa chỉ thường trú", "nơi thường trú", "noi thuong tru", "permanentaddress"]);
          
          const rawRegDate = findVal(["Ngày ĐKTT", "Ngay DKTT", "registrationDate", "ngày đktt"]);
          const registrationDate = parseExcelDate(rawRegDate);
          
          const healthInsuranceCard = findVal(["Thẻ bhyt", "The bhyt", "healthInsuranceCard", "thẻ bhyt"]);
          
          const rawGtDen = findVal(["GT đến", "GT den", "gtDen", "gt đến", "giá trị đến", "hạn thẻ bhyt", "hạn dùng thẻ bhyt"]);
          const gtDen = parseExcelDate(rawGtDen);

          // Gender parser
          let gender: "Nam" | "Nữ" = "Nam";
          const lowerGender = genderStr.toLowerCase().trim();
          if (lowerGender === "nữ" || lowerGender === "nu" || lowerGender === "female" || lowerGender === "f" || lowerGender === "n") {
            gender = "Nữ";
          } else if (fullName.toLowerCase().includes(" thị ")) {
            gender = "Nữ";
          }

          // Status parser with smart fallbacks
          let status: "Thường trú" | "Tạm trú" | "Tạm vắng" = "Thường trú";
          const hasTemporaryHeader = Object.keys(row).some(k => k.toLowerCase().includes("tạm trú"));
          if (hasTemporaryHeader) {
            status = "Tạm trú";
          } else {
            const lowerStatus = statusStr.toLowerCase();
            if (lowerStatus.includes("tạm trú") || lowerStatus === "tam tru") {
              status = "Tạm trú";
            } else if (lowerStatus.includes("tạm vắng") || lowerStatus === "tam vang") {
              status = "Tạm vắng";
            } else {
              const allRowValues = Object.values(row).map(v => String(v).toLowerCase());
              if (allRowValues.some(v => v.includes("tạm trú"))) {
                status = "Tạm trú";
              } else if (allRowValues.some(v => v.includes("tạm vắng"))) {
                status = "Tạm vắng";
              }
            }
          }

          // Address fallbacks
          if (!address && permanentAddress) {
            address = permanentAddress;
          } else if (address && !permanentAddress) {
            permanentAddress = address;
          }
          if (!address) {
            address = "Khu phố 3, Phường An Phú";
          }
          if (!permanentAddress) {
            permanentAddress = address;
          }

          return {
            id: `TEMP-${idx}-${Date.now()}`,
            fullName: fullName || "",
            gender,
            birthDate,
            cccd: cccd || "",
            phone: phone || "N/A",
            status,
            occupation: occupation || "Tự do",
            address,
            householdId: householdId || "HK-301",
            relationToOwner: relationToOwner || "Thành viên",
            ownerName: ownerName || "",
            permanentAddress,
            registrationDate,
            healthInsuranceCard,
            gtDen,
            isValid: !!fullName && !!cccd
          };
        });

        setParsedData(mapped);
        setImportFileName(file.name);
      } catch (err) {
        alert("Có lỗi xảy ra khi xử lý file Excel. Vui lòng kiểm tra lại định dạng!");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // TSV raw data parser for paste feature
  const handlePasteParse = (text: string) => {
    if (!text.trim()) {
      setParsedData([]);
      return;
    }
    try {
      const cleanedText = cleanPasteText(text);
      const lines = cleanedText.split(/\r\n|\r|\n/).map(line => line.split("\t").map(cell => cell.trim()));
      if (lines.length === 0 || lines[0].length === 0) {
        return;
      }

      // Detect if first row is a header row
      const isHeaderRow = (rowCells: string[]): boolean => {
        const firstCell = rowCells[0]?.toLowerCase().trim() || "";
        if (firstCell === "stt") return true;
        
        const headerKeywords = ["họ và tên", "ngày sinh", "giới tính", "số đdcn/cccd/cmnd", "số cccd", "nơi thường trú", "nơi ở hiện tại", "địa chỉ tạm trú"];
        return rowCells.some(cell => 
          headerKeywords.some(keyword => cell.toLowerCase().trim() === keyword)
        );
      };

      let headers: string[];
      let dataRows: string[][];

      if (!isHeaderRow(lines[0])) {
        // First row is actual data
        dataRows = lines.filter(row => row.length > 1 && row.some(cell => cell !== ""));
        
        // Auto-assign virtual headers based on column count
        const colCount = lines[0].length;
        if (colCount >= 11) {
          // Thường trú layout (12 columns)
          headers = ["STT", "Họ và tên", "Ngày sinh", "Giới tính", "Số ĐDCN/CCCD/CMND", "Họ và tên chủ hộ", "Nơi thường trú", "Khu phố", "Ngày ĐKTT", "Nơi ở hiện tại", "Thẻ bhyt", "GT đến"];
        } else {
          // Tạm trú layout (10 columns)
          headers = ["STT", "Tên", "Ngày sinh", "Giới tính", "CCCD", "Địa chỉ tạm trú", "Khu phố", "Địa chỉ thường trú", "Thẻ bhyt", "GT đến"];
        }
      } else {
        // First row is header row
        headers = lines[0];
        dataRows = lines.slice(1).filter(row => row.length > 1 && row.some(cell => cell !== ""));
      }
      
      const mapped = dataRows.map((row, idx) => {
        const findVal = (keys: string[]) => {
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "");
          const colIdx = headers.findIndex(h => 
            keys.some(key => normalize(h) === normalize(key))
          );
          return colIdx !== -1 ? row[colIdx] || "" : "";
        };

        const fullName = findVal(["Họ và Tên", "Ho va Ten", "fullName", "Họ tên", "Ho ten", "Tên", "Ten"]);
        const cccd = findVal(["Số ĐDCN/CCCD/\r\nCMND", "Số ĐDCN/CCCD/CMND", "Số CCCD", "So CCCD", "cccd", "CMND", "Số định danh", "So dinh danh"]);
        const genderStr = findVal(["Giới tính", "Gioi tinh", "gender", "Phái", "Phai"]);
        
        const rawBirthDate = findVal(["Ngày sinh", "Ngay sinh", "birthDate", "Năm sinh", "Nam sinh", "ngày sinh"]);
        const birthDate = parseExcelDate(rawBirthDate) || "01/01/1990";
        
        const phone = findVal(["Số điện thoại", "So dien thoai", "phone", "SĐT", "SDT", "Điện thoại", "Dien thoai"]);
        const statusStr = findVal(["Trạng thái cư trú", "Diện cư trú", "Dien cu tru", "status", "Trạng thái", "Trang thai", "Cư trú", "Cu tru", "Đang thường trú"]);
        const occupation = findVal(["Nghề nghiệp", "Nghe nghiep", "occupation", "Công việc", "Cong viec"]);
        
        let address = findVal(["địa chỉ tạm trú", "nơi ở hiện tại", "địa chỉ hiện tại", "địa chỉ", "dia chi", "address", "nơi ở", "noi o"]);
        const householdId = findVal(["Mã hộ khẩu", "Ma ho khau", "householdId", "Mã hộ", "Ma ho", "Số hộ khẩu", "So ho khau"]);
        const relationToOwner = findVal(["Quan hệ với chủ hộ", "Quan he voi chu ho", "relationToOwner", "Quan hệ", "Quan he", "Quan hệ chủ hộ", "Quan hệ với chủ hộ"]);

        const ownerName = findVal(["Họ và tên chủ hộ", "Ho va ten chu ho", "ownerName", "Chủ hộ", "Chu ho"]);
        let permanentAddress = findVal(["địa chỉ thường trú", "nơi thường trú", "noi thuong tru", "permanentaddress"]);
        
        const rawRegDate = findVal(["Ngày ĐKTT", "Ngay DKTT", "registrationDate", "ngày đktt"]);
        const registrationDate = parseExcelDate(rawRegDate);
        
        const healthInsuranceCard = findVal(["Thẻ bhyt", "The bhyt", "healthInsuranceCard", "thẻ bhyt"]);
        
        const rawGtDen = findVal(["GT đến", "GT den", "gtDen", "gt đến", "giá trị đến", "hạn thẻ bhyt", "hạn dùng thẻ bhyt"]);
        const gtDen = parseExcelDate(rawGtDen);

        // Gender parser
        let gender: "Nam" | "Nữ" = "Nam";
        const lowerGender = genderStr.toLowerCase().trim();
        if (lowerGender === "nữ" || lowerGender === "nu" || lowerGender === "female" || lowerGender === "f" || lowerGender === "n") {
          gender = "Nữ";
        } else if (fullName.toLowerCase().includes(" thị ")) {
          gender = "Nữ";
        }

        // Status parser with smart fallbacks
        let status: "Thường trú" | "Tạm trú" | "Tạm vắng" = "Thường trú";
        const hasTemporaryHeader = headers.some(h => h.toLowerCase().includes("tạm trú"));
        if (hasTemporaryHeader) {
          status = "Tạm trú";
        } else {
          const lowerStatus = statusStr.toLowerCase();
          if (lowerStatus.includes("tạm trú") || lowerStatus === "tam tru") {
            status = "Tạm trú";
          } else if (lowerStatus.includes("tạm vắng") || lowerStatus === "tam vang") {
            status = "Tạm vắng";
          } else {
            // Check row contents
            if (row.some(cell => cell.toLowerCase().includes("tạm trú"))) {
              status = "Tạm trú";
            } else if (row.some(cell => cell.toLowerCase().includes("tạm vắng"))) {
              status = "Tạm vắng";
            }
          }
        }

        // Address fallbacks
        if (!address && permanentAddress) {
          address = permanentAddress;
        } else if (address && !permanentAddress) {
          permanentAddress = address;
        }
        if (!address) {
          address = "Khu phố 3, Phường An Phú";
        }
        if (!permanentAddress) {
          permanentAddress = address;
        }

        return {
          id: `TEMP-${idx}-${Date.now()}`,
          fullName: fullName || "",
          gender,
          birthDate,
          cccd: cccd || "",
          phone: phone || "N/A",
          status,
          occupation: occupation || "Tự do",
          address,
          householdId: householdId || "HK-301",
          relationToOwner: relationToOwner || "Thành viên",
          ownerName: ownerName || "",
          permanentAddress,
          registrationDate,
          healthInsuranceCard,
          gtDen,
          isValid: !!fullName && !!cccd
        };
      });

      setParsedData(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete all residents handler
  const handleDeleteAll = () => {
    if (confirm("CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa TOÀN BỘ cư dân khỏi hệ thống? Hành động này sẽ dọn sạch toàn bộ nhân khẩu và danh sách thành viên hộ khẩu.")) {
      if (onUpdateResidents) {
        onUpdateResidents([]);
      }
      if (onUpdateHouseholds) {
        onUpdateHouseholds(households.map(hh => ({
          ...hh,
          memberCount: 0,
          members: []
        })));
      }
      setSelectedResident(null);
      alert("Đã xóa toàn bộ cư dân và dọn sạch sổ hộ khẩu thành công!");
    }
  };

  // Drag & Drop Helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      handleExcelParse(file);
    } else {
      alert("Chỉ chấp nhận tệp tin Excel (.xlsx, .xls) hoặc CSV!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExcelParse(file);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("Không có dữ liệu cư dân hợp lệ nào để nhập!");
      return;
    }

    const updatedHouseholds = [...households];
    const newResidentsToAdd: Resident[] = [];
    const newHouseholdsToSync: Household[] = [];

    validRows.forEach((row, i) => {
      const normAddr = normalizeAddress(row.address);

      // 1. Look for exact match (similarity === 1.0)
      let matchedHh = updatedHouseholds.find(h => normalizeAddress(h.address) === normAddr);

      // 2. Look for fuzzy conflict (similarity >= 0.95 and < 1.0)
      let isFuzzyConflict = false;
      let conflictHh: Household | undefined = undefined;

      if (!matchedHh) {
        conflictHh = updatedHouseholds.find(h => {
          const sim = getSimilarity(h.address, row.address);
          return sim >= 0.95 && sim < 1.0;
        });
        if (conflictHh) {
          isFuzzyConflict = true;
        }
      }

      let hhCode = "";
      let hhId = "";

      if (matchedHh) {
        // Auto-merge to existing household
        hhCode = matchedHh.code;
        hhId = matchedHh.id;

        const newMember = {
          name: row.fullName,
          relation: row.relationToOwner || "Thành viên",
          cccd: row.cccd,
          phone: row.phone,
          birthYear: (() => {
            const parts = (row.birthDate || "").split("/");
            if (parts.length >= 3) return parseInt(parts[2], 10) || 1990;
            return 1990;
          })()
        };

        matchedHh.members = matchedHh.members || [];
        if (!matchedHh.members.some(m => m.cccd === row.cccd)) {
          matchedHh.members.push(newMember);
          matchedHh.memberCount = matchedHh.members.length;
        }
      } else {
        // Create a new household (either fuzzy conflict or new address)
        const nextIndex = updatedHouseholds.length + 1;
        hhCode = "HK-" + nextIndex.toString().padStart(6, "0");
        hhId = crypto.randomUUID();

        const newHh: Household = {
          id: hhId,
          code: hhCode,
          ownerName: row.fullName,
          address: row.address,
          memberCount: 1,
          type: (row.status === "Tạm trú" ? "Tạm trú" : "Thường trú"),
          coordinates: "10°56'08.0\"N 106°44'38.0\"E", // default GPS coordinates
          members: [
            {
              name: row.fullName,
              relation: "Chủ hộ",
              cccd: row.cccd,
              phone: row.phone,
              birthYear: (() => {
                const parts = (row.birthDate || "").split("/");
                if (parts.length >= 3) return parseInt(parts[2], 10) || 1990;
                return 1990;
              })()
            }
          ],
          normalizedAddress: normAddr,
          headPersonId: "R" + (residents.length + 1 + i).toString().padStart(3, "0")
        };

        if (isFuzzyConflict && conflictHh) {
          // Flag conflict
          (newHh as any).conflictWithCode = conflictHh.code;
          (newHh as any).conflictStatus = "Cần xác minh";
        }

        updatedHouseholds.push(newHh);
        newHouseholdsToSync.push(newHh);
      }

      newResidentsToAdd.push({
        id: "R" + (residents.length + 1 + i).toString().padStart(3, "0"),
        fullName: row.fullName,
        gender: row.gender,
        birthDate: row.birthDate,
        cccd: row.cccd,
        phone: row.phone,
        status: row.status,
        occupation: row.occupation,
        address: row.address,
        householdId: hhCode,
        relationToOwner: matchedHh ? (row.relationToOwner || "Thành viên") : "Chủ hộ",
        avatar: row.gender === "Nữ" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        joinDate: new Date().toLocaleDateString("vi-VN"),
        ownerName: matchedHh ? matchedHh.ownerName : row.fullName,
        permanentAddress: row.permanentAddress,
        registrationDate: row.registrationDate,
        healthInsuranceCard: row.healthInsuranceCard,
        gtDen: row.gtDen,
        normalizedAddress: normAddr,
        householdUuid: hhId
      });
    });

    // 1. Bulk update residents
    if (onUpdateResidents) {
      onUpdateResidents([...newResidentsToAdd, ...residents]);
    }

    // 2. Bulk update households
    if (onUpdateHouseholds) {
      onUpdateHouseholds(updatedHouseholds);
    }

    // 3. Supabase Database sync
    if (isSupabaseConfigured) {
      try {
        // Sync households
        if (newHouseholdsToSync.length > 0) {
          const dbHhs = newHouseholdsToSync.map(hh => ({
            id: hh.id,
            household_code: hh.code,
            normalized_address: hh.normalizedAddress || normalizeAddress(hh.address),
            display_address: hh.address,
            gps: hh.coordinates || null,
            status: hh.type || 'Thường trú'
          }));
          await supabase.from('Household').upsert(dbHhs);
        }

        // Sync residents
        const dbPersons = newResidentsToAdd.map(r => {
          const noteData = {
            relationToOwner: r.relationToOwner || 'Thành viên',
            permanentAddress: r.permanentAddress || '',
            healthInsuranceCard: r.healthInsuranceCard || '',
            gtDen: r.gtDen || ''
          };
          return {
            id: r.id,
            name: r.fullName,
            dob: r.birthDate,
            gender: r.gender,
            "idCard": r.cccd,
            address: r.address,
            status: r.status,
            phone: r.phone,
            occupation: r.occupation,
            note: JSON.stringify(noteData),
            household_id: r.householdUuid,
            normalized_address: r.normalizedAddress
          };
        });
        await supabase.from('Person').upsert(dbPersons);

        // Update head_person_id for new households
        for (const hh of newHouseholdsToSync) {
          const headPerson = newResidentsToAdd.find(r => r.householdUuid === hh.id && r.relationToOwner === "Chủ hộ");
          if (headPerson) {
            await supabase.from('Household').update({ head_person_id: headPerson.id }).eq('id', hh.id);
          }
        }
      } catch (dbErr) {
        console.error("Error syncing imported data to Supabase:", dbErr);
      }
    }

    alert(`Đã nhập thành công ${validRows.length} cư dân mới vào hệ thống!`);
    setShowImportModal(false);
    setParsedData([]);
    setImportFileName("");
    setPasteText("");
    setImportTab("file");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.cccd) {
      alert("Vui lòng điền đầy đủ Họ tên và số CCCD!");
      return;
    }

    if (isEditMode && editingResidentId) {
      const oldRes = residents.find(r => r.id === editingResidentId);
      if (!oldRes) return;
      
      const updatedRes: Resident = {
        ...oldRes,
        fullName: formData.fullName,
        gender: formData.gender,
        birthDate: formData.birthDate || "01/01/1990",
        cccd: formData.cccd,
        phone: formData.phone || "N/A",
        status: formData.status,
        occupation: formData.occupation || "Tự do",
        address: formData.address,
        householdId: formData.householdId,
        relationToOwner: formData.relationToOwner,
        ownerName: formData.ownerName,
        permanentAddress: formData.permanentAddress,
        registrationDate: formData.registrationDate,
        healthInsuranceCard: formData.healthInsuranceCard,
        gtDen: formData.gtDen
      };

      // 1. Update residents state
      const updatedResidents = residents.map(r => r.id === editingResidentId ? updatedRes : r);
      if (onUpdateResidents) {
        onUpdateResidents(updatedResidents);
      }

      // 2. Synchronize to households
      if (onUpdateHouseholds && households) {
        let updatedHouseholds = [...households];

        // If household changed
        if (oldRes.householdId !== formData.householdId) {
          // Remove from old household
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === oldRes.householdId) {
              const remainingMembers = hh.members.filter((m: any) => m.cccd !== oldRes.cccd);
              return {
                ...hh,
                memberCount: remainingMembers.length,
                members: remainingMembers
              };
            }
            return hh;
          });

          // Add to new household
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === formData.householdId) {
              const newMember = {
                name: formData.fullName,
                relation: formData.relationToOwner,
                cccd: formData.cccd,
                phone: formData.phone || "N/A",
                birthYear: parseInt(formData.birthDate.split("/")[2]) || 1990
              };
              return {
                ...hh,
                memberCount: hh.memberCount + 1,
                members: [...hh.members, newMember]
              };
            }
            return hh;
          });
        } else {
          // Household didn't change, just update member details inside the household
          updatedHouseholds = updatedHouseholds.map(hh => {
            if (hh.code === formData.householdId) {
              const updatedMembers = hh.members.map((m: any) => {
                if (m.cccd === oldRes.cccd) {
                  return {
                    ...m,
                    name: formData.fullName,
                    relation: formData.relationToOwner,
                    cccd: formData.cccd,
                    phone: formData.phone || "N/A",
                    birthYear: parseInt(formData.birthDate.split("/")[2]) || 1990
                  };
                }
                return m;
              });
              return {
                ...hh,
                members: updatedMembers
              };
            }
            return hh;
          });
        }
        onUpdateHouseholds(updatedHouseholds);
      }

      setSelectedResident(updatedRes);
      setShowModal(false);
      setIsEditMode(false);
      setEditingResidentId(null);
      
      // Reset Form
      setFormData({
        fullName: "",
        gender: "Nam",
        birthDate: "",
        cccd: "",
        phone: "",
        status: "Thường trú",
        occupation: "",
        address: "42 Lương Định Của, Phường An Phú",
        householdId: "HK-301",
        relationToOwner: "Thành viên",
        ownerName: "",
        permanentAddress: "",
        registrationDate: "",
        healthInsuranceCard: "",
        gtDen: ""
      });
      return;
    }

    const newRes: Resident = {
      id: "R" + (residents.length + 1).toString().padStart(3, "0"),
      fullName: formData.fullName,
      gender: formData.gender,
      birthDate: formData.birthDate || "01/01/1990",
      cccd: formData.cccd,
      phone: formData.phone || "N/A",
      status: formData.status,
      occupation: formData.occupation || "Tự do",
      address: formData.address,
      householdId: formData.householdId,
      relationToOwner: formData.relationToOwner,
      ownerName: formData.ownerName,
      permanentAddress: formData.permanentAddress,
      registrationDate: formData.registrationDate,
      healthInsuranceCard: formData.healthInsuranceCard,
      gtDen: formData.gtDen,
      avatar: formData.gender === "Nữ" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      joinDate: new Date().toLocaleDateString("vi-VN")
    };
    onAddResident(newRes);

    if (onUpdateHouseholds && households) {
      let updatedHouseholds = [...households];
      const existingHh = updatedHouseholds.find(hh => hh.code === formData.householdId);

      if (existingHh) {
        updatedHouseholds = updatedHouseholds.map(hh => {
          if (hh.code === formData.householdId) {
            return {
              ...hh,
              memberCount: (hh.memberCount || 0) + 1,
              members: [...(hh.members || []), {
                name: formData.fullName,
                relation: formData.relationToOwner,
                cccd: formData.cccd,
                phone: formData.phone || "N/A",
                birthYear: parseInt((formData.birthDate || "").split("/")[2]) || 1990
              }]
            };
          }
          return hh;
        });
      } else {
        const newHh: Household = {
          id: "H" + (updatedHouseholds.length + 1).toString().padStart(3, "0"),
          code: formData.householdId,
          ownerName: formData.fullName,
          address: formData.address,
          memberCount: 1,
          type: formData.status as "Thường trú" | "Tạm trú",
          members: [{
            name: formData.fullName,
            relation: formData.relationToOwner || "Chủ hộ",
            cccd: formData.cccd,
            phone: formData.phone || "N/A",
            birthYear: parseInt((formData.birthDate || "").split("/")[2]) || 1990
          }]
        };
        updatedHouseholds = [newHh, ...updatedHouseholds];
      }
      onUpdateHouseholds(updatedHouseholds);
    }

    setSelectedResident(newRes);
    setShowModal(false);
    // Reset Form
    setFormData({
      fullName: "",
      gender: "Nam",
      birthDate: "",
      cccd: "",
      phone: "",
      status: "Thường trú",
      occupation: "",
      address: "42 Lương Định Của, Phường An Phú",
      householdId: "HK-301",
      relationToOwner: "Thành viên",
      ownerName: "",
      permanentAddress: "",
      registrationDate: "",
      healthInsuranceCard: "",
      gtDen: ""
    });
  };

  // Filter Logic
  const filteredResidents = residents.filter(res => {
    const matchesSearch = res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.cccd.includes(searchTerm) || 
                          (res.phone && res.phone.includes(searchTerm));
    const matchesStatus = statusFilter === "Tất cả" || res.status === statusFilter;
    const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
    return matchesSearch && matchesStatus && matchesGender;
  });

  // Calculate segment tab counts dynamically based on search & gender filters
  const tabCounts = {
    all: residents.filter(res => {
      const matchesSearch = res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            res.cccd.includes(searchTerm) || 
                            (res.phone && res.phone.includes(searchTerm));
      const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
      return matchesSearch && matchesGender;
    }).length,
    thuongTru: residents.filter(res => {
      const matchesSearch = res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            res.cccd.includes(searchTerm) || 
                            (res.phone && res.phone.includes(searchTerm));
      const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
      return matchesSearch && matchesGender && res.status === "Thường trú";
    }).length,
    tamTru: residents.filter(res => {
      const matchesSearch = res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            res.cccd.includes(searchTerm) || 
                            (res.phone && res.phone.includes(searchTerm));
      const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
      return matchesSearch && matchesGender && res.status === "Tạm trú";
    }).length,
    tamVang: residents.filter(res => {
      const matchesSearch = res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            res.cccd.includes(searchTerm) || 
                            (res.phone && res.phone.includes(searchTerm));
      const matchesGender = genderFilter === "Tất cả" || res.gender === genderFilter;
      return matchesSearch && matchesGender && res.status === "Tạm vắng";
    }).length
  };

  // Pagination Logic
  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedResidents = filteredResidents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div id="citizen-management-view" className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh sách Quản lý Dân cư</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý, khai báo thông tin thường trú, tạm trú, tạm vắng khu phố</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="btn-delete-all-residents"
            onClick={() => setShowDeleteAllConfirm(true)}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <Trash2 size={16} /> Xóa toàn bộ cư dân
          </button>
          <button 
            id="btn-import-excel"
            onClick={() => {
              setImportTab("file");
              setParsedData([]);
              setImportFileName("");
              setPasteText("");
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" /> Nhập từ Excel
          </button>
          <button 
            id="btn-add-resident"
            onClick={() => {
              setIsEditMode(false);
              setEditingResidentId(null);
              setFormData({
                fullName: "",
                gender: "Nam",
                birthDate: "",
                cccd: "",
                phone: "",
                status: "Thường trú",
                occupation: "",
                address: "42 Lương Định Của, Phường An Phú",
                householdId: "HK-301",
                relationToOwner: "Thành viên",
                ownerName: "",
                permanentAddress: "",
                registrationDate: "",
                healthInsuranceCard: "",
                gtDen: ""
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <Plus size={16} /> Thêm Cư dân Mới
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo họ tên, CCCD, số điện thoại..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>
        <div className="flex gap-3 flex-wrap md:flex-nowrap items-center">
          {/* Tab bar for Residency Types as requested in the mockup */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tất cả")}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Tất cả"
                  ? "bg-white text-slate-850 shadow-sm border border-slate-200/30"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              Tất cả <span className={statusFilter === "Tất cả" ? "text-slate-850 font-bold" : "text-slate-400 font-medium"}>({tabCounts.all})</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Thường trú")}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Thường trú"
                  ? "bg-white text-slate-850 shadow-sm border border-slate-200/30"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              Thường trú <span className={statusFilter === "Thường trú" ? "text-slate-850 font-bold" : "text-slate-400 font-medium"}>({tabCounts.thuongTru})</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tạm trú")}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Tạm trú"
                  ? "bg-white text-slate-850 shadow-sm border border-slate-200/30"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              Tạm trú <span className={statusFilter === "Tạm trú" ? "text-slate-850 font-bold" : "text-slate-400 font-medium"}>({tabCounts.tamTru})</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("Tạm vắng")}
              className={`px-4.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "Tạm vắng"
                  ? "bg-white text-slate-850 shadow-sm border border-slate-200/30"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              Tạm vắng <span className={statusFilter === "Tạm vắng" ? "text-slate-850 font-bold" : "text-slate-400 font-medium"}>({tabCounts.tamVang})</span>
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">Giới tính:</span>
            <select 
              value={genderFilter}
              onChange={(e) => handleGenderFilterChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* View switcher */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Xem dạng Bảng"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "card" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
              title="Xem dạng Thẻ"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Table/Card, Right is Detailed Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table/Card List Container */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Cư dân</th>
                    <th className="py-3 px-4">CCCD</th>
                    <th className="py-3 px-4">Địa chỉ cư trú</th>
                    <th className="py-3 px-4">Diện cư trú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-sm text-slate-400">Không tìm thấy cư dân nào phù hợp</td>
                    </tr>
                  ) : (
                    paginatedResidents.map((res) => {
                      const statusColors = {
                        "Thường trú": "bg-emerald-50 text-emerald-600 border-emerald-100",
                        "Tạm trú": "bg-amber-50 text-amber-600 border-amber-100",
                        "Tạm vắng": "bg-slate-50 text-slate-600 border-slate-200"
                      };
                      const isSelected = selectedResident?.id === res.id;
                      return (
                        <tr 
                          key={res.id}
                          id={`resident-row-${res.id}`}
                          onClick={() => setSelectedResident(res)}
                          className={`hover:bg-slate-50/60 cursor-pointer transition-colors text-sm
                            ${isSelected ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""}
                          `}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={res.avatar || getInitialsSvg(res.fullName, res.gender)} 
                                alt="Avatar" 
                                className="w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getInitialsSvg(res.fullName, res.gender);
                                }}
                              />
                              <div>
                                <div className="font-semibold text-slate-800">{res.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{res.gender} • {res.birthDate}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{res.cccd}</td>
                          <td className="py-3.5 px-4 text-slate-500 truncate max-w-[200px]">{res.address}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${statusColors[res.status]}`}>
                              {res.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 max-h-[550px] overflow-y-auto bg-slate-50/20">
              {filteredResidents.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400 col-span-full">
                  Không tìm thấy cư dân nào phù hợp
                </div>
              ) : (
                paginatedResidents.map((res) => {
                  const statusColors = {
                    "Thường trú": "bg-emerald-50 text-emerald-600 border-emerald-100",
                    "Tạm trú": "bg-amber-50 text-amber-600 border-amber-100",
                    "Tạm vắng": "bg-slate-50 text-slate-600 border-slate-200"
                  };
                  const isSelected = selectedResident?.id === res.id;
                  return (
                    <div 
                      key={res.id}
                      id={`resident-card-${res.id}`}
                      onClick={() => setSelectedResident(res)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 bg-white hover:shadow-md
                        ${isSelected 
                          ? "border-emerald-500 ring-2 ring-emerald-500/5 bg-emerald-50/40 shadow-xs" 
                          : "border-slate-100 hover:border-slate-200"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={res.avatar || getInitialsSvg(res.fullName, res.gender)} 
                          alt="Avatar" 
                          className="w-11 h-11 rounded-full object-cover border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getInitialsSvg(res.fullName, res.gender);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{res.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{res.gender} • {res.birthDate}</p>
                          <p className="text-[11px] text-slate-600 mt-1 font-mono">
                            CCCD: {res.cccd}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-none">
                          {res.address}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[res.status]}`}>
                          {res.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          <Pagination
            id="citizen-pagination"
            currentPage={activePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Selected Resident detail card */}
        <div className="lg:col-span-1">
          {selectedResident ? (
            <div id="resident-detail-card" className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
              {/* Profile Card Header */}
              <div className="bg-slate-900 text-white p-5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <img 
                  id="detail-resident-avatar"
                  src={selectedResident.avatar || getInitialsSvg(selectedResident.fullName, selectedResident.gender)} 
                  alt={selectedResident.fullName}
                  className="w-20 h-20 rounded-full border-4 border-slate-800 mx-auto object-cover shadow-md"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getInitialsSvg(selectedResident.fullName, selectedResident.gender);
                  }}
                />
                <h3 className="font-bold text-lg mt-3">{selectedResident.fullName}</h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 rounded px-2 py-0.5 mt-1 inline-block">
                  Mã hộ: {selectedResident.householdId || "Chưa rõ"}
                </span>
              </div>

              {/* Detail Items */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Số CCCD</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedResident.cccd}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Điện thoại</span>
                    <span className="font-mono text-slate-800 font-semibold flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {selectedResident.phone}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Calendar size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Ngày sinh & Giới tính</span>
                      <span className="text-slate-800 font-medium">{selectedResident.birthDate} ({selectedResident.gender})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Briefcase size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Nghề nghiệp</span>
                      <span className="text-slate-800 font-medium">{selectedResident.occupation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Home size={14} className="text-emerald-500" /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Địa chỉ thường trú</span>
                      <span className="text-slate-800 font-medium">
                        {selectedResident.permanentAddress || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><MapPin size={14} className="text-amber-500" /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Nơi ở hiện tại / Tạm trú</span>
                      <span className="text-slate-800 font-medium">
                        {selectedResident.address || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><FileText size={14} /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Quan hệ với chủ hộ</span>
                      <span className="text-slate-800 font-medium">
                        {selectedResident.relationToOwner} ({selectedResident.householdId})
                      </span>
                    </div>
                  </div>

                  {selectedResident.ownerName && (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-50 rounded text-slate-400"><User size={14} /></div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 block">Họ và tên chủ hộ</span>
                        <span className="text-slate-800 font-medium">{selectedResident.ownerName}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Shield size={14} className="text-indigo-500" /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Thẻ BHYT</span>
                      <span className="text-slate-800 font-mono font-semibold">
                        {selectedResident.healthInsuranceCard || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Milestone size={14} className="text-blue-500" /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Giấy giới thiệu đến (GT đến)</span>
                      <span className="text-slate-800 font-medium">
                        {selectedResident.gtDen || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Calendar size={14} className="text-slate-500" /></div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Ngày đăng ký thường trú (ĐKTT)</span>
                      <span className="text-slate-800 font-medium">
                        {selectedResident.registrationDate || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print certificate actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button 
                    onClick={() => alert(`Đang chuẩn bị in Giấy Xác Nhận Cư Trú cho cư dân ${selectedResident.fullName}...`)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer size={13} /> In giấy xác nhận cư trú (CT07)
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(selectedResident)}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <Edit2 size={12} /> Sửa
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-1 flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-xl p-8 text-center text-xs">
              Chọn một cư dân ở danh sách bên cạnh để xem hồ sơ quản lý chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Add New Resident Dialog/Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">{isEditMode ? "Cập nhật thông tin cư dân" : "Đăng ký thông tin cư dân mới"}</h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIsEditMode(false);
                  setEditingResidentId(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Họ và Tên *</label>
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số CCCD *</label>
                  <input 
                    type="text" 
                    name="cccd"
                    required
                    placeholder="0790xxxxxxxx"
                    value={formData.cccd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Giới tính</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Ngày sinh</label>
                  <input 
                    type="text" 
                    name="birthDate"
                    placeholder="DD/MM/YYYY"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Diện cư trú</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Thường trú">Thường trú</option>
                    <option value="Tạm trú">Tạm trú</option>
                    <option value="Tạm vắng">Tạm vắng</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Số điện thoại</label>
                  <input 
                    type="text" 
                    name="phone"
                    placeholder="09xxxxxxxx"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Nghề nghiệp</label>
                <input 
                  type="text" 
                  name="occupation"
                  placeholder="Lập trình viên, Buôn bán, Học sinh..."
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Nơi ở hiện tại</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Đăng ký Hộ khẩu *
                  </label>
                  <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setHouseholdMode("existing");
                        if (households && households.length > 0) {
                          setFormData(prev => ({ ...prev, householdId: households[0].code || "HK-301", relationToOwner: "Thành viên" }));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        householdMode === "existing"
                          ? "bg-white text-indigo-900 font-bold shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Nhập hộ có sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHouseholdMode("new");
                        const nextCode = getNextHouseholdCode(households);
                        setFormData(prev => ({ ...prev, householdId: nextCode, relationToOwner: "Chủ hộ" }));
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        householdMode === "new"
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Sparkles size={12} /> Tự sinh Hộ mới
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {householdMode === "existing" ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">Mã Hộ sẵn có</label>
                      <select
                        name="householdId"
                        value={formData.householdId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-emerald-500 bg-white"
                      >
                        {households && households.length > 0 ? (
                          households.map((h: any) => (
                            <option key={h.code} value={h.code}>
                              {h.code} ({h.ownerName})
                            </option>
                          ))
                        ) : (
                          <option value="HK-301">HK-301</option>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-600 block flex items-center gap-1">
                          <Sparkles size={11} /> Mã Hộ tự sinh
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextCode = getNextHouseholdCode(households);
                            setFormData(prev => ({ ...prev, householdId: nextCode }));
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                        >
                          Tạo mã khác
                        </button>
                      </div>
                      <input
                        type="text"
                        readOnly
                        name="householdId"
                        value={formData.householdId}
                        className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg font-bold font-mono text-emerald-700 text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">Quan hệ với chủ hộ</label>
                    <input 
                      type="text" 
                      name="relationToOwner"
                      placeholder="Chủ hộ, Con, Vợ, v.v."
                      value={formData.relationToOwner}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Họ và tên chủ hộ</label>
                  <input 
                    type="text" 
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Nơi thường trú</label>
                  <input 
                    type="text" 
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Ngày ĐKTT</label>
                  <input 
                    type="text" 
                    name="registrationDate"
                    placeholder="DD/MM/YYYY"
                    value={formData.registrationDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Thẻ BHYT</label>
                  <input 
                    type="text" 
                    name="healthInsuranceCard"
                    value={formData.healthInsuranceCard}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">GT đến</label>
                  <input 
                    type="text" 
                    name="gtDen"
                    value={formData.gtDen}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setEditingResidentId(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Dialog/Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} />
                <h3 className="font-bold">Nhập danh sách cư dân từ file Excel</h3>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setParsedData([]);
                  setImportFileName("");
                  setPasteText("");
                  setImportTab("file");
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Instructions and Download Template */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">Hướng dẫn tải lên dữ liệu:</p>
                  <p className="text-[11px] text-slate-500">Tải tệp mẫu Excel về máy, điền đầy đủ các thông tin bắt buộc (* gồm Họ tên & CCCD), sau đó kéo thả hoặc chọn tệp tin tải lên.</p>
                </div>
                <button 
                  onClick={downloadTemplate}
                  type="button"
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Download size={13} /> Tải file mẫu (.xlsx)
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold text-slate-500 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setImportTab("file");
                    setParsedData([]);
                    setImportFileName("");
                    setPasteText("");
                  }}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${importTab === "file" ? "border-emerald-600 text-slate-900 font-bold" : "border-transparent"}`}
                >
                  Tải tệp tin Excel/CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportTab("paste");
                    setParsedData([]);
                    setImportFileName("");
                    setPasteText("");
                  }}
                  className={`pb-2 border-b-2 transition-all cursor-pointer ${importTab === "paste" ? "border-emerald-600 text-slate-900 font-bold" : "border-transparent"}`}
                >
                  Dán dữ liệu thô từ Excel
                </button>
              </div>

              {importTab === "file" ? (
                /* Drag and Drop Zone */
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center
                    ${isDragging ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]" : "border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50/50"}
                  `}
                >
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud size={40} className={`mb-3 transition-colors ${isDragging ? "text-emerald-500" : "text-slate-400"}`} />
                  {importFileName ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                        <CheckCircle size={15} /> Đã nhận: {importFileName}
                      </p>
                      <p className="text-xs text-slate-400">Kéo thả tệp tin khác vào đây hoặc nhấp để thay thế</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Kéo và thả tệp tin Excel tại đây</p>
                      <p className="text-xs text-slate-400">hoặc click để chọn file từ máy tính (Hỗ trợ .xlsx, .xls, .csv)</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Paste Textarea Zone */
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block">Dán dữ liệu Excel của bạn vào đây (bao gồm cả dòng tiêu đề):</label>
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={(e) => {
                      setPasteText(e.target.value);
                      handlePasteParse(e.target.value);
                    }}
                    placeholder="Ví dụ:&#10;STT&#9;Họ và tên&#9;Ngày sinh&#9;Giới tính&#9;Số ĐDCN/CCCD&#10;1&#9;NGUYỄN VĂN A&#9;15/08/1995&#9;Nam&#9;079095012345"
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500 bg-slate-50/30"
                  />
                </div>
              )}

              {/* Parsed Data Preview Table */}
              {parsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600" />
                      Xem trước dữ liệu phân tích ({parsedData.length} dòng):
                    </h4>
                    <span className="text-[10px] text-slate-400">Dòng màu đỏ/vàng có thông tin không hợp lệ</span>
                  </div>

                  <div className="border border-slate-150 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2 px-3">Họ và Tên</th>
                          <th className="py-2 px-3">CCCD</th>
                          <th className="py-2 px-3">Ngày sinh</th>
                          <th className="py-2 px-3">Giới tính</th>
                          <th className="py-2 px-3">Diện cư trú</th>
                          <th className="py-2 px-3">Mã hộ</th>
                          <th className="py-2 px-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.map((row, idx) => (
                          <tr key={row.id} className={`${row.isValid ? "hover:bg-slate-50" : "bg-rose-50/40 hover:bg-rose-50/60"}`}>
                            <td className="py-2 px-3 font-medium text-slate-800">{row.fullName || <span className="text-rose-500 italic">Thiếu họ tên *</span>}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{row.cccd || <span className="text-rose-500 italic">Thiếu CCCD *</span>}</td>
                            <td className="py-2 px-3 text-slate-500">{row.birthDate}</td>
                            <td className="py-2 px-3 text-slate-500">{row.gender}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                ${row.status === "Thường trú" ? "bg-emerald-50 text-emerald-600" : row.status === "Tạm trú" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"}
                              `}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 font-mono">{row.householdId}</td>
                            <td className="py-2 px-3 text-right">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold flex items-center justify-end gap-1"><Check size={12} /> Hợp lệ</span>
                              ) : (
                                <span className="text-rose-500 font-bold flex items-center justify-end gap-1" title="Yêu cầu có Tên, CCCD tối thiểu 9 ký tự"><AlertCircle size={12} /> Lỗi dòng</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={() => {
                  setShowImportModal(false);
                  setParsedData([]);
                  setImportFileName("");
                  setPasteText("");
                  setImportTab("file");
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-sm font-semibold"
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                disabled={parsedData.filter(r => r.isValid).length === 0}
                onClick={handleConfirmImport}
                className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors cursor-pointer text-sm flex items-center gap-1.5
                  ${parsedData.filter(r => r.isValid).length === 0 
                    ? "bg-slate-300 cursor-not-allowed text-slate-500" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                  }
                `}
              >
                <CheckCircle size={16} /> Xác nhận nhập ({parsedData.filter(r => r.isValid).length} dòng hợp lệ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && selectedResident && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Xác nhận xóa cư dân</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa cư dân <strong className="text-slate-800">{selectedResident.fullName}</strong> (CCCD: {selectedResident.cccd}) khỏi danh sách? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex gap-2 justify-end border-t border-slate-100">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteResident(selectedResident.id);
                  setSelectedResident(null);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm hover:shadow"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Cảnh báo nguy hiểm</h3>
              <p className="text-xs text-rose-600 leading-relaxed font-medium">
                Bạn có chắc chắn muốn xóa TOÀN BỘ cư dân khỏi hệ thống? Hành động này sẽ dọn sạch toàn bộ nhân khẩu và danh sách thành viên trong tất cả sổ hộ khẩu.
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex gap-2 justify-end border-t border-slate-100">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleDeleteAll();
                  setShowDeleteAllConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm hover:shadow"
              >
                Xác nhận xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
