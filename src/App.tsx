import React, { useState } from "react";
import { 
  initialResidents, 
  initialHouseholds, 
  initialBusinesses, 
  initialReports, 
  initialPartyMembers,
  initialWelfareRecipients,
  initialCommunityEvents,
  initialFundContributions
} from "./mockData";
import { 
  Resident, 
  Household, 
  Business, 
  FieldReport, 
  PartyMember, 
  ActiveTab,
  WelfareRecipient,
  CommunityEvent,
  FundContribution
} from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CitizenManagement from "./components/CitizenManagement";
import HouseholdManagement from "./components/HouseholdManagement";
import BusinessManagement from "./components/BusinessManagement";
import GisMap from "./components/GisMap";
import AiAssistant from "./components/AiAssistant";
import FieldReflections from "./components/FieldReflections";
import PartyBranch from "./components/PartyBranch";
import SocialWelfare from "./components/SocialWelfare";
import CommunityEvents from "./components/CommunityEvents";
import NeighborhoodFunds from "./components/NeighborhoodFunds";
import PlanArchitecture from "./components/PlanArchitecture";
import LoginAndRegister from "./components/LoginAndRegister";
import SettingsAndPermissions, { PendingRegistration, UserAccount } from "./components/SettingsAndPermissions";
import SystemHealthDashboard from "./components/SystemHealthDashboard";
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  ShieldAlert,
  ChevronDown,
  Info,
  Database as DbIcon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { normalizeAddress, getSimilarity, fixMojibake } from "./utils/addressEngine";

// Supabase Mappers
const mapIdToUuid = (id: string): string => {
  if (!id || id.includes("-")) return id;
  
  let prefix = "";
  let numStr = "";
  
  if (id.startsWith("REP")) {
    prefix = "1";
    numStr = id.substring(3);
  } else if (id.startsWith("H")) {
    prefix = "2";
    numStr = id.substring(1);
  } else if (id.startsWith("B")) {
    prefix = "3";
    numStr = id.substring(1);
  } else if (id.startsWith("R")) {
    prefix = "4";
    numStr = id.substring(1);
  }
  
  if (prefix && numStr) {
    const num = parseInt(numStr, 10) || 0;
    return `00000000-0000-0000-0000-${prefix}${num.toString().padStart(11, '0')}`;
  }
  
  return id;
};

interface NoteFields {
  relationToOwner: string;
  permanentAddress: string;
  healthInsuranceCard: string;
  gtDen: string;
}

export const sanitizeResidentInsurance = (healthCardRaw: string, gtDenRaw: string) => {
  let healthInsuranceCard = (healthCardRaw || "").trim();
  let gtDen = (gtDenRaw || "").trim();

  const isBHYTCode = (str: string) => {
    if (!str) return false;
    const clean = str.toUpperCase().trim();
    return /^[A-Z]{2}\d{8,}/.test(clean) || (clean.length >= 9 && !clean.includes("THƯỜNG TRÚ") && !clean.includes("TẠM TRÚ") && !clean.includes("TẠM VẮNG") && /^[A-Z0-9]+$/i.test(clean));
  };

  const isResidencyStatus = (str: string) => {
    if (!str) return false;
    const clean = str.toLowerCase().trim();
    return clean.includes("thường trú") || clean.includes("tạm trú") || clean.includes("tạm vắng");
  };

  if (isResidencyStatus(healthInsuranceCard)) {
    if (isBHYTCode(gtDen)) {
      healthInsuranceCard = gtDen;
      gtDen = "";
    } else {
      healthInsuranceCard = "";
    }
  } else if (!healthInsuranceCard && isBHYTCode(gtDen)) {
    healthInsuranceCard = gtDen;
    gtDen = "";
  }

  return { healthInsuranceCard, gtDen };
};

const parseResidentNote = (noteStr: string, name: string = ''): NoteFields => {
  const result: NoteFields = {
    relationToOwner: 'Thành viên',
    permanentAddress: '',
    healthInsuranceCard: '',
    gtDen: ''
  };

  if (!noteStr) return result;

  const trimmed = noteStr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      result.relationToOwner = parsed.relationToOwner || 'Thành viên';
      result.permanentAddress = parsed.permanentAddress || '';
      result.healthInsuranceCard = parsed.healthInsuranceCard || '';
      result.gtDen = parsed.gtDen || '';
      
      // Double check if relationToOwner inside JSON contains legacy raw format
      const innerLower = result.relationToOwner.trim().toLowerCase();
      if (innerLower.startsWith('bhyt:')) {
        result.healthInsuranceCard = result.relationToOwner.trim().substring(5).trim();
        result.relationToOwner = 'Thành viên';
      } else if (innerLower.startsWith('bhyt')) {
        result.healthInsuranceCard = result.relationToOwner.trim().substring(4).trim();
        result.relationToOwner = 'Thành viên';
      } else if (innerLower.startsWith('chủ hộ:') || innerLower.startsWith('chu ho:')) {
        const owner = result.relationToOwner.trim().substring(7).trim();
        if (name && name.toLowerCase().trim() === owner.toLowerCase()) {
          result.relationToOwner = 'Chủ hộ';
        } else {
          result.relationToOwner = 'Thành viên';
        }
      } else if (innerLower.startsWith('chủ hộ') || innerLower.startsWith('chu ho')) {
        result.relationToOwner = 'Chủ hộ';
      } else if (innerLower.startsWith('quan hệ:') || innerLower.startsWith('quan he:')) {
        result.relationToOwner = result.relationToOwner.trim().split(':')[1].trim();
      }

      // Sanitize BHYT and GT đến swap
      const sanitized = sanitizeResidentInsurance(result.healthInsuranceCard, result.gtDen);
      result.healthInsuranceCard = sanitized.healthInsuranceCard;
      result.gtDen = sanitized.gtDen;

      return result;
    } catch (e) {
      // Fallback
    }
  }

  // Parse legacy raw formats
  // Handle comma-separated or space-separated multiple values, e.g. "Chủ hộ, BHYT: GD438..."
  const parts = trimmed.split(/,|\n/).map(p => p.trim()).filter(Boolean);
  
  parts.forEach(part => {
    const partLower = part.toLowerCase();
    if (partLower.startsWith('bhyt:')) {
      result.healthInsuranceCard = part.substring(5).trim();
    } else if (partLower.startsWith('bhyt')) {
      result.healthInsuranceCard = part.substring(4).trim();
    } else if (partLower.startsWith('chủ hộ:') || partLower.startsWith('chu ho:')) {
      const owner = part.substring(7).trim();
      if (name && name.toLowerCase().trim() === owner.toLowerCase()) {
        result.relationToOwner = 'Chủ hộ';
      } else {
        result.relationToOwner = 'Thành viên';
      }
    } else if (partLower.startsWith('chủ hộ') || partLower.startsWith('chu ho')) {
      result.relationToOwner = 'Chủ hộ';
    } else if (partLower.startsWith('quan hệ:') || partLower.startsWith('quan he:')) {
      result.relationToOwner = part.split(':')[1].trim();
    } else if (partLower.startsWith('quan hệ') || partLower.startsWith('quan he')) {
      result.relationToOwner = part.substring(7).trim();
    } else {
      if (partLower === 'chủ hộ' || partLower === 'chu ho') {
        result.relationToOwner = 'Chủ hộ';
      } else if (!partLower.includes('thường trú') && !partLower.includes('tạm trú')) {
        result.relationToOwner = part;
      }
    }
  });

  const sanitized = sanitizeResidentInsurance(result.healthInsuranceCard, result.gtDen);
  result.healthInsuranceCard = sanitized.healthInsuranceCard;
  result.gtDen = sanitized.gtDen;

  return result;
};

const mapDbToResident = (row: any, allHouseholds: Household[]): Resident => {
  const hh = allHouseholds.find(h => h.id === row.household_id);
  const hhCode = hh ? hh.code : (row.householdId || '');
  const gender = (row.gender === 'Nữ' ? 'Nữ' : 'Nam') as "Nam" | "Nữ";
  const noteInfo = parseResidentNote(row.note || '', row.name);

  // Additional safety check for BHYT & gtDen
  const sanitizedInsurance = sanitizeResidentInsurance(noteInfo.healthInsuranceCard, noteInfo.gtDen);

  return {
    id: row.id,
    fullName: row.name,
    gender,
    birthDate: row.dob || '',
    cccd: row.idCard || '',
    phone: row.phone || '',
    status: (row.status === 'Tạm vắng' ? 'Tạm vắng' : (row.status === 'Tạm trú' ? 'Tạm trú' : 'Thường trú')) as any,
    occupation: row.occupation || '',
    address: row.address || '',
    householdId: hhCode,
    relationToOwner: noteInfo.relationToOwner,
    permanentAddress: noteInfo.permanentAddress || row.address || '',
    healthInsuranceCard: sanitizedInsurance.healthInsuranceCard,
    gtDen: sanitizedInsurance.gtDen,
    avatar: gender === 'Nữ' 
      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' 
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    joinDate: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
    normalizedAddress: row.normalized_address || '',
    householdUuid: row.household_id || null
  };
};

const mapResidentToDb = (res: Resident, allHouseholds: Household[]): any => {
  const hh = allHouseholds.find(h => h.code === res.householdId);
  const rawId = hh ? hh.id : (res.householdUuid || null);
  const noteData = {
    relationToOwner: res.relationToOwner || 'Thành viên',
    permanentAddress: res.permanentAddress || '',
    healthInsuranceCard: res.healthInsuranceCard || '',
    gtDen: res.gtDen || ''
  };
  return {
    id: res.id,
    name: res.fullName,
    dob: res.birthDate,
    gender: res.gender,
    "idCard": res.cccd,
    address: res.address,
    status: res.status,
    phone: res.phone,
    occupation: res.occupation,
    note: JSON.stringify(noteData),
    household_id: rawId ? mapIdToUuid(rawId) : null,
    normalized_address: res.normalizedAddress || normalizeAddress(res.address)
  };
};

const mapDbToHousehold = (row: any, allResidents: Resident[]): Household => {
  const membersOfHousehold = allResidents.filter(r => r.householdUuid === row.id || r.householdId === row.household_code);
  const mappedMembers = membersOfHousehold.map(r => ({
    name: r.fullName,
    relation: r.relationToOwner || 'Thành viên',
    cccd: r.cccd,
    phone: r.phone,
    birthYear: (() => {
      const parts = (r.birthDate || "").split("/");
      if (parts.length >= 3) return parseInt(parts[2], 10) || 1990;
      const dashParts = (r.birthDate || "").split("-");
      if (dashParts.length >= 3) return parseInt(dashParts[0], 10) || 1990;
      return 1990;
    })()
  }));

  let ownerName = '';
  const head = allResidents.find(r => r.id === row.head_person_id);
  if (head) {
    ownerName = head.fullName;
  } else {
    const ownerMem = mappedMembers.find(m => m.relation === 'Chủ hộ') || mappedMembers[0];
    ownerName = ownerMem ? ownerMem.name : 'Chủ hộ';
  }

  return {
    id: row.id,
    code: row.household_code,
    ownerName: ownerName,
    address: row.display_address || row.address,
    memberCount: mappedMembers.length || row.member_count || 0,
    type: (row.status === 'Tạm trú' ? 'Tạm trú' : 'Thường trú') as any,
    members: mappedMembers,
    coordinates: row.gps || '',
    normalizedAddress: row.normalized_address || '',
    headPersonId: row.head_person_id || null,
    deletedAt: row.deleted_at || undefined,
    deletedBy: row.deleted_by || undefined
  };
};

const mapHouseholdToDb = (hh: Household): any => ({
  id: mapIdToUuid(hh.id),
  household_code: hh.code,
  normalized_address: hh.normalizedAddress || normalizeAddress(hh.address),
  display_address: hh.address,
  gps: hh.coordinates || null,
  head_person_id: hh.headPersonId || null,
  member_count: hh.members?.length || hh.memberCount || 0,
  status: hh.type || 'Thường trú',
  deleted_at: hh.deletedAt || null,
  deleted_by: hh.deletedBy || null
});

const mapDbToBusiness = (row: any): Business => {
  const isUuid = (str?: string) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  let typeStr = fixMojibake(row.type || row.type_id || 'Hộ kinh doanh');
  if (isUuid(typeStr)) {
    typeStr = 'Hộ kinh doanh';
  }

  let ownerStr = fixMojibake(row.owner || row.owner_name || row.owner_citizen_id || 'Chủ hộ kinh doanh');
  if (isUuid(ownerStr)) {
    ownerStr = 'Nguyễn Văn Hùng';
  }

  return {
    id: row.id,
    name: fixMojibake(row.name || 'Hộ kinh doanh'),
    type: typeStr,
    owner: ownerStr,
    phone: row.phone || '0912000001',
    address: fixMojibake(row.address || 'Khu phố 3, Phường An Phú'),
    licenseNumber: row.tax_code || row.license_number || row.id,
    status: (row.status === 'Đang hoạt động' || row.status === 'Tạm ngưng' || row.status === 'Chờ duyệt'
      ? row.status
      : 'Đang hoạt động') as any,
    employeeCount: row.employee_count || 1,
    safetyCertified: !!row.safety_certified,
    coordinates: row.location || '10.93615, 106.74415',
    image: row.image || row.image_url || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400'
  };
};

const mapBusinessToDb = (b: Business): any => ({
  id: mapIdToUuid(b.id),
  name: b.name,
  status: b.status,
  employee_count: b.employeeCount,
  safety_certified: b.safetyCertified,
  tax_code: b.licenseNumber || null
});

const mapDbToReport = (row: any): FieldReport => {
  let beforeImage = row.before_image_url || "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500";
  let afterImage = row.after_image_url || undefined;
  let timeline = [];

  if (row.timeline) {
    try {
      const parsed = typeof row.timeline === 'string' ? JSON.parse(row.timeline) : row.timeline;
      if (parsed && typeof parsed === 'object') {
        timeline = Array.isArray(parsed.entries) ? parsed.entries : (Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Error parsing timeline JSON:", e);
    }
  }

  const defaultCoords = { x: 10.9354, y: 106.7438 };
  let coords = defaultCoords;
  if (row.latitude && row.longitude) {
    coords = { x: row.latitude, y: row.longitude };
  }

  return {
    id: row.id,
    title: row.title,
    category: (row.category || 'Khác') as any,
    reporterName: row.reporter_name || 'Cư dân ẩn danh',
    reporterPhone: row.reporter_phone || '',
    description: row.description,
    status: (row.status_id === 'Đang xử lý' || row.status_id === 'Đã giải quyết' ? row.status_id : 'Đã tiếp nhận') as any,
    location: row.location || 'Khu phố 3',
    coordinates: coords,
    beforeImage,
    afterImage,
    reportedAt: row.created_at || new Date().toISOString(),
    timeline
  };
};

const mapReportToDb = (r: FieldReport): any => ({
  id: mapIdToUuid(r.id),
  title: r.title,
  reporter_name: r.reporterName,
  reporter_phone: r.reporterPhone,
  description: r.description,
  status_id: r.status,
  latitude: r.coordinates?.x || null,
  longitude: r.coordinates?.y || null,
  before_image_url: r.beforeImage || null,
  after_image_url: r.afterImage || null
});

// Helper to fetch all rows from Supabase, bypassing the 1000 rows limit by using page range looping
const fetchAllFromSupabase = async (tableName: string): Promise<{ data: any[] | null; error: any }> => {
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      return { data: null, error };
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      page++;
      if (data.length < pageSize) {
        keepFetching = false;
      }
    } else {
      keepFetching = false;
    }
  }
  return { data: allData, error: null };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    fullName: string;
    role: "canbo" | "nguoidan";
    cccd?: string;
    householdCode?: string;
    phone?: string;
  } | null>({
    username: "canbo",
    fullName: "Nguyễn Văn Hùng",
    role: "canbo",
    phone: "0901234567"
  });

  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>(() => {
    const saved = localStorage.getItem("kp_pending_registrations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const defaultUserAccounts: UserAccount[] = [
    {
      id: "U001",
      username: "canbo",
      password: "admin123",
      fullName: "Nguyễn Văn Hùng",
      role: "canbo",
      phone: "0901234567",
      createdAt: "01/01/2026",
      status: "Hoạt động"
    },
    {
      id: "U002",
      username: "nguoidan",
      password: "user123",
      fullName: "Nguyễn Thị Mai",
      role: "nguoidan",
      cccd: "079195000456",
      householdCode: "HK-301",
      phone: "0918765432",
      createdAt: "15/01/2026",
      status: "Hoạt động"
    }
  ];

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("kp_user_accounts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return defaultUserAccounts;
  });

  const [residentPermissions, setResidentPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    residents: false,
    households: false,
    businesses: true,
    gis: true,
    ai: true,
    reports: true,
    party: false,
    welfare: true,
    cultural: true,
    finance: true,
    plan: true,
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const isMockData = (id?: string) => {
    if (!id) return false;
    return ["R001","R002","R003","R004","R005","R006","R007","H001","H002","H003","H004","HK-301","HK-302","HK-303","HK-304","REP001","REP002","REP003","REP004","WF001","WF002","WF003","WF004","P001","P002","P003","P004","EV001","EV002","EV003","FD001","FD002","FD003","FD004","FD005","FD006","FD007"].includes(id);
  };

  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem("kp_residents");
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as Resident[]).filter(r => !isMockData(r.id) && !isMockData(r.householdId));
        return parsed.map(r => {
          if (r.relationToOwner && r.relationToOwner.trim().toLowerCase().startsWith('bhyt:')) {
            const code = r.relationToOwner.trim().substring(5).trim();
            r.healthInsuranceCard = code;
            r.relationToOwner = 'Thành viên';
          }
          return r;
        });
      } catch (e) {
        // Fallback
      }
    }
    return initialResidents;
  });
  const [households, setHouseholds] = useState<Household[]>(() => {
    const saved = localStorage.getItem("kp_households");
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as Household[]).filter(hh => !isMockData(hh.id) && !isMockData(hh.code));
        return parsed.map(hh => {
          if (hh.members) {
            hh.members = hh.members.map(m => {
              if (m.relation && m.relation.trim().toLowerCase().startsWith('bhyt:')) {
                m.relation = 'Thành viên';
              }
              return m;
            });
          }
          return hh;
        });
      } catch (e) {
        // Fallback
      }
    }
    return initialHouseholds;
  });
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem("kp_businesses");
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as Business[]).filter(b => !isMockData(b.id));
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return initialBusinesses;
  });
  const [reports, setReports] = useState<FieldReport[]>(() => {
    const saved = localStorage.getItem("kp_reports");
    if (saved) {
      try {
        return (JSON.parse(saved) as FieldReport[]).filter(r => !isMockData(r.id));
      } catch (e) {
        // Fallback
      }
    }
    return initialReports;
  });

  const [partyMembers] = useState<PartyMember[]>(initialPartyMembers);
  
  // State variables for the additional views
  const [welfareRecipients, setWelfareRecipients] = useState<WelfareRecipient[]>(initialWelfareRecipients);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(initialCommunityEvents);
  const [fundContributions, setFundContributions] = useState<FundContribution[]>(initialFundContributions);

  // Sync state to localStorage with try-catch safety against QuotaExceededError
  React.useEffect(() => {
    try {
      localStorage.setItem("kp_residents", JSON.stringify(residents));
    } catch (e) {
      console.warn("Could not sync residents to localStorage:", e);
    }
  }, [residents]);

  React.useEffect(() => {
    try {
      localStorage.setItem("kp_households", JSON.stringify(households));
    } catch (e) {
      console.warn("Could not sync households to localStorage:", e);
    }
  }, [households]);

  React.useEffect(() => {
    try {
      localStorage.setItem("kp_businesses", JSON.stringify(businesses));
    } catch (e) {
      console.warn("Could not sync businesses to localStorage:", e);
    }
  }, [businesses]);

  React.useEffect(() => {
    try {
      localStorage.setItem("kp_reports", JSON.stringify(reports));
    } catch (e) {
      console.warn("Could not sync reports to localStorage:", e);
    }
  }, [reports]);

  React.useEffect(() => {
    try {
      localStorage.setItem("kp_pending_registrations", JSON.stringify(pendingRegistrations));
    } catch (e) {
      console.warn("Could not sync pendingRegistrations to localStorage:", e);
    }
  }, [pendingRegistrations]);

  React.useEffect(() => {
    try {
      localStorage.setItem("kp_user_accounts", JSON.stringify(userAccounts));
    } catch (e) {
      console.warn("Could not sync userAccounts to localStorage:", e);
    }
  }, [userAccounts]);

  // Supabase Database Connection States
  const [dbStatus, setDbStatus] = useState<"connected" | "fallback" | "connecting">("connecting");
  const [isDbEmpty, setIsDbEmpty] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);

  // Check Supabase connection and load tables on mount
  React.useEffect(() => {
    async function checkConnectionAndLoad() {
      if (!isSupabaseConfigured) {
        setDbStatus("fallback");
        return;
      }
      try {
        const { error } = await supabase.from('Person').select('id').limit(1);
        if (error) {
          console.warn("Supabase connection check failed:", error);
          setDbStatus("fallback");
        } else {
          setDbStatus("connected");
          try {
            // Load households first using custom range paginator to support > 1000 records
            const { data: hhData, error: hhErr } = await fetchAllFromSupabase('Household');
            // Load residents (Person) using custom range paginator to support > 1000 records
            const { data: resData, error: resErr } = await fetchAllFromSupabase('Person');
            
            let mappedHouseholds: Household[] = [];
            let mappedResidents: Resident[] = [];
            
            if (hhErr || resErr) {
              console.warn("Supabase tables load failed:", hhErr || resErr);
              setDbStatus("fallback");
            } else if (hhData && resData) {
              const tempResidents = resData.map(row => {
                const hh = hhData.find(h => h.id === row.household_id);
                const noteInfo = parseResidentNote(row.note || '', row.name);
                return {
                  id: row.id,
                  fullName: row.name,
                  gender: (row.gender === 'Nữ' ? 'Nữ' : 'Nam') as "Nam" | "Nữ",
                  birthDate: row.dob || '',
                  cccd: row.idCard || '',
                  phone: row.phone || '',
                  status: (row.status === 'Tạm vắng' ? 'Tạm vắng' : (row.status === 'Tạm trú' ? 'Tạm trú' : 'Thường trú')) as any,
                  occupation: row.occupation || '',
                  address: row.address || '',
                  householdId: hh ? hh.household_code : '',
                  relationToOwner: noteInfo.relationToOwner,
                  permanentAddress: noteInfo.permanentAddress || row.address || '',
                  healthInsuranceCard: noteInfo.healthInsuranceCard,
                  gtDen: noteInfo.gtDen,
                  normalizedAddress: row.normalized_address || '',
                  householdUuid: row.household_id || null
                };
              });
              
              mappedHouseholds = hhData.map(row => mapDbToHousehold(row, tempResidents));
              mappedResidents = resData.map(row => mapDbToResident(row, mappedHouseholds));
              
              if (mappedResidents.length > 0) setResidents(mappedResidents);
              if (mappedHouseholds.length > 0) setHouseholds(mappedHouseholds);
              setIsDbEmpty(mappedResidents.length === 0);
            }

            // Load businesses
            const { data: busData, error: busErr } = await fetchAllFromSupabase('businesses');
            if (!busErr && busData && busData.length > 0) {
              setBusinesses(busData.map(mapDbToBusiness));
            }

            // Load incidents
            const { data: repData, error: repErr } = await fetchAllFromSupabase('incidents');
            if (!repErr && repData && repData.length > 0) {
              setReports(repData.map(mapDbToReport));
            }
          } catch (loadErr) {
            console.error("Error loading Supabase tables:", loadErr);
            setDbStatus("fallback");
          }
        }
      } catch (e) {
        console.warn("Supabase connection exception:", e);
        setDbStatus("fallback");
      }
    }
    checkConnectionAndLoad();
  }, []);

  // Seeding function to upload mock data to Supabase
  const handleSeedMockData = async () => {
    if (!isSupabaseConfigured || dbStatus !== "connected") return;
    setIsSeeding(true);
    try {
      // Seed households first
      const dbHh = initialHouseholds.map(mapHouseholdToDb);
      await supabase.from('Household').upsert(dbHh);

      // Seed residents (Person)
      const dbRes = initialResidents.map(r => mapResidentToDb(r, initialHouseholds));
      await supabase.from('Person').upsert(dbRes);

      // Seed businesses
      const dbBus = initialBusinesses.map(mapBusinessToDb);
      await supabase.from('businesses').upsert(dbBus);

      // Seed incidents
      const dbRep = initialReports.map(mapReportToDb);
      await supabase.from('incidents').upsert(dbRep);

      alert("Đồng bộ dữ liệu mẫu lên Supabase thành công!");
      setIsDbEmpty(false);
      
      // Reload using range paginator
      const { data: hhData } = await fetchAllFromSupabase('Household');
      const { data: resData } = await fetchAllFromSupabase('Person');
      let mapped: Resident[] = [];
      if (hhData && resData) {
        const tempRes = resData.map(row => {
          const hh = hhData.find(h => h.id === row.household_id);
          const noteInfo = parseResidentNote(row.note || '', row.name);
          return {
            id: row.id,
            fullName: row.name,
            gender: row.gender as any,
            birthDate: row.dob || '',
            cccd: row.idCard || '',
            phone: row.phone || '',
            status: row.status as any,
            occupation: row.occupation || '',
            address: row.address || '',
            householdId: hh ? hh.household_code : '',
            relationToOwner: noteInfo.relationToOwner,
            permanentAddress: noteInfo.permanentAddress || row.address || '',
            healthInsuranceCard: noteInfo.healthInsuranceCard,
            gtDen: noteInfo.gtDen,
            normalizedAddress: row.normalized_address || '',
            householdUuid: row.household_id || null
          };
        });
        const mappedHouseholds = hhData.map(row => mapDbToHousehold(row, tempRes));
        mapped = resData.map(row => mapDbToResident(row, mappedHouseholds));
        setHouseholds(mappedHouseholds);
        setResidents(mapped);
      }

      const { data: busData } = await fetchAllFromSupabase('businesses');
      if (busData) setBusinesses(busData.map(mapDbToBusiness));

      const { data: repData } = await fetchAllFromSupabase('incidents');
      if (repData) setReports(repData.map(mapDbToReport));

    } catch (err: any) {
      console.error("Error seeding Supabase:", err);
      alert("Lỗi đồng bộ dữ liệu mẫu: " + (err.message || String(err)));
    } finally {
      setIsSeeding(false);
    }
  };

  const [isSyncingLocal, setIsSyncingLocal] = useState<boolean>(false);

  const handleSyncLocalStorageToSupabase = async () => {
    if (!isSupabaseConfigured || dbStatus !== "connected") {
      alert("Chưa kết nối cơ sở dữ liệu Supabase!");
      return;
    }
    const confirmSync = window.confirm(`Bạn có chắc chắn muốn đồng bộ ${residents.length} Dân cư và ${households.length} Hộ khẩu từ Local Storage lên Cloud Supabase không?`);
    if (!confirmSync) return;

    setIsSyncingLocal(true);
    try {
      console.log("Syncing Households...");
      const dbHh = households.map(mapHouseholdToDb);
      const chunkSize = 200;
      
      for (let i = 0; i < dbHh.length; i += chunkSize) {
        const chunk = dbHh.slice(i, i + chunkSize);
        const { error } = await supabase.from('Household').upsert(chunk);
        if (error) throw new Error(`Household upload error at chunk ${i}: ${error.message}`);
      }

      console.log("Syncing Persons...");
      const dbRes = residents.map(r => mapResidentToDb(r, households));
      for (let i = 0; i < dbRes.length; i += chunkSize) {
        const chunk = dbRes.slice(i, i + chunkSize);
        const { error } = await supabase.from('Person').upsert(chunk);
        if (error) throw new Error(`Person upload error at chunk ${i}: ${error.message}`);
      }

      // Sync businesses
      console.log("Syncing Businesses...");
      const dbBus = businesses.map(mapBusinessToDb);
      for (let i = 0; i < dbBus.length; i += chunkSize) {
        const chunk = dbBus.slice(i, i + chunkSize);
        await supabase.from('businesses').upsert(chunk);
      }

      // Sync incidents
      console.log("Syncing Incidents...");
      const dbRep = reports.map(mapReportToDb);
      for (let i = 0; i < dbRep.length; i += chunkSize) {
        const chunk = dbRep.slice(i, i + chunkSize);
        await supabase.from('incidents').upsert(chunk);
      }

      alert("Đồng bộ toàn bộ dữ liệu đang có từ local storage lên Supabase cloud thành công!");
      setIsDbEmpty(false);

      // Reload
      const { data: hhData } = await fetchAllFromSupabase('Household');
      const { data: resData } = await fetchAllFromSupabase('Person');
      let mapped: Resident[] = [];
      if (hhData && resData) {
        const tempRes = resData.map(row => {
          const hh = hhData.find(h => h.id === row.household_id);
          const noteInfo = parseResidentNote(row.note || '', row.name);
          return {
            id: row.id,
            fullName: row.name,
            gender: row.gender as any,
            birthDate: row.dob || '',
            cccd: row.idCard || '',
            phone: row.phone || '',
            status: row.status as any,
            occupation: row.occupation || '',
            address: row.address || '',
            householdId: hh ? hh.household_code : '',
            relationToOwner: noteInfo.relationToOwner,
            permanentAddress: noteInfo.permanentAddress || row.address || '',
            healthInsuranceCard: noteInfo.healthInsuranceCard,
            gtDen: noteInfo.gtDen,
            normalizedAddress: row.normalized_address || '',
            householdUuid: row.household_id || null
          };
        });
        const mappedHouseholds = hhData.map(row => mapDbToHousehold(row, tempRes));
        mapped = resData.map(row => mapDbToResident(row, mappedHouseholds));
        setHouseholds(mappedHouseholds);
        setResidents(mapped);
      }
    } catch (err: any) {
      console.error("Local sync to Supabase failed:", err);
      alert("Lỗi đồng bộ dữ liệu: " + (err.message || String(err)));
    } finally {
      setIsSyncingLocal(false);
    }
  };

  // Handlers for State Management using functional state updates to prevent async batching errors
  const handleAddResident = async (newResident: Resident) => {
    setResidents(prev => [newResident, ...prev]);
    
    // Auto-update household members if matched
    const hhId = newResident.householdId;
    setHouseholds(prev => prev.map(hh => {
      if (hh.code === hhId) {
        return {
          ...hh,
          memberCount: (hh.memberCount || 0) + 1,
          members: [
            ...(hh.members || []),
            {
              name: newResident.fullName,
              relation: newResident.relationToOwner,
              cccd: newResident.cccd,
              phone: newResident.phone,
              birthYear: (() => {
                const parts = (newResident.birthDate || "").split("/");
                if (parts.length >= 3) {
                  return parseInt(parts[2], 10) || 1990;
                }
                const dashParts = (newResident.birthDate || "").split("-");
                if (dashParts.length >= 3) {
                  return parseInt(dashParts[0], 10) || 1990;
                }
                return 1990;
              })()
            }
          ]
        };
      }
      return hh;
    }));

    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('Person').insert([mapResidentToDb(newResident, households)]);
      } catch (e) {
        console.error("Error adding resident to Supabase:", e);
      }
    }
  };

  const handleDeleteResident = async (id: string) => {
    const resToDelete = residents.find(r => r.id === id || (r.cccd && r.cccd === id));
    if (!resToDelete) return;

    const targetId = resToDelete.id;
    const hhCode = resToDelete.householdId;
    let nextHeadResToUpdate: Resident | null = null;
    let householdToSync: Household | null = null;

    // 1. Calculate updated households
    const updatedHouseholds = households.map(hh => {
      if (hh.code === hhCode) {
        const updatedMembers = (hh.members || []).filter(m => m.cccd !== resToDelete.cccd);
        const wasHead = hh.headPersonId === targetId || resToDelete.relationToOwner === "Chủ hộ";
        
        let newHeadId: string | null = null;
        let newOwnerName = "Chưa xác định";
        
        if (wasHead && updatedMembers.length > 0) {
          const headCandidate = residents.find(r => r.cccd === updatedMembers[0].cccd && r.id !== targetId);
          if (headCandidate) {
            newHeadId = headCandidate.id;
            newOwnerName = headCandidate.fullName;
            nextHeadResToUpdate = { ...headCandidate, relationToOwner: "Chủ hộ" };
          }
        } else if (!wasHead) {
          newHeadId = hh.headPersonId || null;
          newOwnerName = hh.ownerName;
        }

        const updatedHh = {
          ...hh,
          memberCount: updatedMembers.length,
          members: updatedMembers.map(m => {
            if (newHeadId && m.cccd === nextHeadResToUpdate?.cccd) {
              return { ...m, relation: "Chủ hộ" };
            }
            return m;
          }),
          headPersonId: newHeadId,
          ownerName: newOwnerName
        };
        householdToSync = updatedHh;
        return updatedHh;
      }
      return hh;
    });

    // 2. Calculate updated residents
    let updatedResidents = residents.filter(r => r.id !== targetId && r.cccd !== resToDelete.cccd);
    if (nextHeadResToUpdate) {
      const updatedHead = nextHeadResToUpdate;
      updatedResidents = updatedResidents.map(r => r.id === updatedHead.id ? updatedHead : r);
    }

    // 3. Update React state immediately & store in LocalStorage for cross-session reactivity
    setResidents(updatedResidents);
    setHouseholds(updatedHouseholds);
    try {
      localStorage.setItem("kp_residents", JSON.stringify(updatedResidents));
      localStorage.setItem("kp_households", JSON.stringify(updatedHouseholds));
    } catch (e) {
      console.error("LocalStorage write error:", e);
    }

    // 4. Update Supabase
    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        const targetUuid = mapIdToUuid(targetId);

        // Clear head_person_id in Household if referencing this person to prevent foreign key errors
        await supabase
          .from('Household')
          .update({ head_person_id: null })
          .or(`head_person_id.eq.${targetUuid},head_person_id.eq.${targetId}`);

        if (nextHeadResToUpdate) {
          await supabase.from('Person').upsert([mapResidentToDb(nextHeadResToUpdate, households)]);
        }

        // Delete from Person table in Supabase
        const { error: delErr } = await supabase
          .from('Person')
          .delete()
          .or(`id.eq.${targetUuid},id.eq.${targetId}`);

        if (delErr) {
          console.warn("Notice deleting resident from Supabase:", delErr.message);
          if (resToDelete.cccd) {
            await supabase.from('Person').delete().eq('idCard', resToDelete.cccd);
          }
        }
        
        if (householdToSync) {
          await supabase.from('Household').upsert(mapHouseholdToDb(householdToSync));
        }
      } catch (e) {
        console.error("Error deleting resident from Supabase:", e);
      }
    }
  };

  const handleAddHousehold = async (newH: Household) => {
    setHouseholds([newH, ...households]);
    
    // Add owner to residents roster
    const ownerRes: Resident = {
      id: "R" + (residents.length + 1).toString().padStart(3, "0"),
      fullName: newH.ownerName,
      gender: "Nam",
      birthDate: "01/01/1975",
      cccd: newH.members[0]?.cccd || "N/A",
      phone: newH.members[0]?.phone || "N/A",
      status: (newH.type === "Tạm trú" ? "Tạm trú" : "Thường trú") as "Thường trú" | "Tạm trú",
      occupation: "Kinh doanh",
      address: newH.address,
      householdId: newH.code,
      relationToOwner: "Chủ hộ",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      joinDate: new Date().toLocaleDateString("vi-VN")
    };
    setResidents([ownerRes, ...residents]);

    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('Household').insert([mapHouseholdToDb(newH)]);
        await supabase.from('Person').insert([mapResidentToDb(ownerRes, [newH, ...households])]);
      } catch (e) {
        console.error("Error adding household to Supabase:", e);
      }
    }
  };

  const handleUpdateHouseholds = async (updatedHouseholds: Household[]) => {
    setHouseholds(updatedHouseholds);
    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        const dbHhs = updatedHouseholds.map(mapHouseholdToDb);
        const { error } = await supabase.from('Household').upsert(dbHhs);
        if (error) {
          console.error("Error updating households in Supabase:", error);
        }
      } catch (e) {
        console.error("Error updating households in Supabase:", e);
      }
    }
  };

  const handleUpdateResidents = async (updatedResidents: Resident[]) => {
    setResidents(updatedResidents);
    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        const dbPersons = updatedResidents.map(r => mapResidentToDb(r, households));
        const { error } = await supabase.from('Person').upsert(dbPersons);
        if (error) {
          console.error("Error updating residents in Supabase:", error);
        }
      } catch (e) {
        console.error("Error updating residents in Supabase:", e);
      }
    }
  };

  const handleToggleBusinessCertification = async (id: string) => {
    const updated = businesses.map(b => {
      if (b.id === id) {
        return { ...b, safetyCertified: !b.safetyCertified };
      }
      return b;
    });
    setBusinesses(updated);

    const target = updated.find(b => b.id === id);
    if (target && isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('businesses').update({ safety_certified: target.safetyCertified }).eq('id', id);
      } catch (e) {
        console.error("Error updating business safety in Supabase:", e);
      }
    }
  };

  const handleUpdateBusinessStatus = async (id: string, status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt") => {
    setBusinesses(businesses.map(b => {
      if (b.id === id) {
        return { ...b, status };
      }
      return b;
    }));

    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('businesses').update({ status }).eq('id', id);
      } catch (e) {
        console.error("Error updating business status in Supabase:", e);
      }
    }
  };

  const handleAddReport = async (newReport: FieldReport) => {
    setReports([newReport, ...reports]);
    setNotifications([
      { id: Date.now(), text: `Phản ánh mới: "${newReport.title}"`, unread: true },
      ...notifications
    ]);

    if (isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('incidents').insert([mapReportToDb(newReport)]);
      } catch (e) {
        console.error("Error adding incident to Supabase:", e);
      }
    }
  };

  const handleUpdateReportStatus = async (
    id: string, 
    status: "Đã tiếp nhận" | "Đang xử lý" | "Đã giải quyết", 
    actorName: string = "Cán bộ quản lý",
    actionDetail: string = "Cập nhật tiến độ xử lý phản ánh."
  ) => {
    const updatedReports = reports.map(r => {
      if (r.id === id) {
        const timeStr = new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour12: false });
        const afterImg = status === "Đã giải quyết" 
          ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300" 
          : r.afterImage;

        return {
          ...r,
          status,
          afterImage: afterImg,
          timeline: [
            ...r.timeline,
            {
              time: timeStr,
              title: status === "Đang xử lý" ? "Xác minh & Đang giải quyết" : "Đã xử lý hoàn thành",
              description: actionDetail,
              actor: actorName
            }
          ]
        };
      }
      return r;
    });
    setReports(updatedReports);

    const target = updatedReports.find(r => r.id === id);
    if (target && isSupabaseConfigured && dbStatus === 'connected') {
      try {
        await supabase.from('incidents').update({ 
          status_id: status,
          timeline: {
            beforeImage: target.beforeImage,
            afterImage: target.afterImage || null,
            entries: target.timeline
          }
        }).eq('id', id);
      } catch (e) {
        console.error("Error updating incident status in Supabase:", e);
      }
    }
  };


  const handleAddWelfareRecipient = (newRec: WelfareRecipient) => {
    setWelfareRecipients([newRec, ...welfareRecipients]);
  };

  const handleUpdateWelfareStatus = (id: string, status: WelfareRecipient["status"]) => {
    setWelfareRecipients(welfareRecipients.map(w => w.id === id ? { ...w, status } : w));
  };

  const handleDeleteWelfareRecipient = (id: string) => {
    setWelfareRecipients(welfareRecipients.filter(w => w.id !== id));
  };

  const handleAddCommunityEvent = (newEvent: CommunityEvent) => {
    setCommunityEvents([newEvent, ...communityEvents]);
  };

  const handleUpdateEventStatus = (id: string, status: CommunityEvent["status"]) => {
    setCommunityEvents(communityEvents.map(e => e.id === id ? { ...e, status } : e));
  };

  const handleDeleteCommunityEvent = (id: string) => {
    setCommunityEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateCommunityEvent = (updated: CommunityEvent) => {
    setCommunityEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleAddFundContribution = (newCont: FundContribution) => {
    setFundContributions([newCont, ...fundContributions]);
  };

  const handleUpdateContributionStatus = (id: string, status: FundContribution["status"], paidAt?: string) => {
    setFundContributions(fundContributions.map(c => c.id === id ? { ...c, status, paidAt } : c));
  };

  const handleDeleteFundContribution = (id: string) => {
    setFundContributions(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateFundContribution = (updated: FundContribution) => {
    setFundContributions(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  // Tab Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Bảng Điều Hành Tổng Quan";
      case "residents": return "Quản lý Nhân Khẩu & Dân cư";
      case "households": return "Hệ thống Quản lý Sổ Hộ khẩu";
      case "businesses": return "Hộ kinh doanh & Giấy phép";
      case "gis": return "Bản đồ số không gian GIS";
      case "ai": return "Hỏi đáp tự động Trợ lý AI";
      case "reports": return "Tiếp nhận Phản ánh Hiện trường 1022";
      case "party": return "Công tác Đảng & Dân vận mặt trận";
      case "welfare": return "An sinh Xã hội & Trợ cấp";
      case "cultural": return "Tin tức & Sự kiện";
      case "finance": return "Quỹ Tự quản & Đóng góp Khu phố";
      case "plan": return "Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu";
      case "settings": return "Cấu hình Hệ thống & Duyệt hồ sơ";
      case "health": return "Trạng thái Hạ tầng & Giám sát KeepAlive";
      default: return "Hệ thống Quản lý";
    }
  };

  if (!currentUser) {
    return (
      <LoginAndRegister
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab("dashboard");
        }}
        onRegisterSubmit={(newReg) => {
          setPendingRegistrations(prev => [newReg, ...prev.filter(r => r.id !== newReg.id)]);
          setNotifications(prev => [
            { id: Date.now(), text: `Yêu cầu đăng ký nhân khẩu mới từ ${newReg.fullName} (${newReg.phone || newReg.cccd}) đang chờ duyệt`, unread: true },
            ...prev
          ]);
        }}
        householdCodes={households.map(h => h.code)}
        userAccounts={userAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        residentPermissions={residentPermissions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 min-w-0 transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight truncate">
              {getTabTitle()}
            </h2>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            
            {/* Database connection status badge */}
            <button
              onClick={() => setShowDbModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                dbStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : dbStatus === "connecting"
                  ? "bg-sky-50 text-sky-700 border-sky-200 animate-pulse"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
              title="Xem thông tin kết nối Cơ sở dữ liệu Supabase"
            >
              <DbIcon size={14} className={dbStatus === "connected" ? "text-emerald-600" : dbStatus === "connecting" ? "text-sky-600" : "text-amber-600"} />
              <span className="hidden sm:inline">
                {dbStatus === "connected" 
                  ? "DB Supabase: Kết nối" 
                  : dbStatus === "connecting" 
                  ? "Đang kết nối DB..." 
                  : "DB Local (Mock)"}
              </span>
              {dbStatus === "connected" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </button>

            {/* Info button for Plan & Database design */}
            <button
              id="header-info-plan"
              onClick={() => setActiveTab("plan")}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer relative group ${
                activeTab === "plan" 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu"
            >
              <Info size={20} />
              {/* Tooltip */}
              <span className="absolute top-10 right-0 bg-slate-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                Đề án & Thiết kế Kiến trúc Cơ sở dữ liệu
              </span>
            </button>

            {/* Notifications panel toggle button */}
            <div className="relative group">
              <button 
                id="header-notifications"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
              >
                <Bell size={20} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown on hover */}
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-3 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
                  <span className="font-bold text-xs text-slate-700">Thông báo mới nhận</span>
                  <button 
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="py-1 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${n.unread ? "bg-rose-500" : "bg-slate-300"}`}></span>
                      <span>{n.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin identity display */}
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {currentUser.role === "canbo" ? "Bàn làm việc Cán bộ" : "Cổng Cư dân số"}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600">
                <User size={16} />
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic view routing based on tab state */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <Dashboard 
              residents={residents} 
              households={households} 
              businesses={businesses} 
              reports={reports} 
              partyMembers={partyMembers}
              welfareRecipients={welfareRecipients}
              communityEvents={communityEvents}
              fundContributions={fundContributions}
              setActiveTab={setActiveTab} 
              currentUser={currentUser}
            />
          )}

          {activeTab === "residents" && (
            <CitizenManagement 
              residents={residents} 
              onAddResident={handleAddResident} 
              onDeleteResident={handleDeleteResident} 
              onUpdateResidents={handleUpdateResidents}
              onUpdateHouseholds={handleUpdateHouseholds}
              households={households}
            />
          )}

          {activeTab === "households" && (
            <HouseholdManagement 
              households={households} 
              onAddHousehold={handleAddHousehold} 
              residents={residents}
              onUpdateHouseholds={handleUpdateHouseholds}
              onUpdateResidents={handleUpdateResidents}
            />
          )}

          {activeTab === "businesses" && (
            <BusinessManagement 
              businesses={businesses} 
              onToggleCertification={handleToggleBusinessCertification} 
              onUpdateStatus={handleUpdateBusinessStatus} 
              onUpdateBusinesses={setBusinesses}
            />
          )}

          {activeTab === "gis" && (
            <GisMap 
              households={households}
              onUpdateHouseholds={handleUpdateHouseholds}
              residents={residents}
              onUpdateResidents={handleUpdateResidents}
              businesses={businesses}
              onUpdateBusinesses={setBusinesses}
            />
          )}

          {activeTab === "ai" && (
            <AiAssistant />
          )}

          {activeTab === "reports" && (
            <FieldReflections 
              reports={reports} 
              onAddReport={handleAddReport} 
              onUpdateReportStatus={handleUpdateReportStatus} 
              onUpdateReports={setReports}
            />
          )}

          {activeTab === "party" && (
            <PartyBranch 
              partyMembers={partyMembers} 
              residents={residents}
            />
          )}

          {activeTab === "welfare" && (
            <SocialWelfare 
              recipients={welfareRecipients}
              onUpdateStatus={handleUpdateWelfareStatus}
              onAddRecipient={handleAddWelfareRecipient}
              onDeleteRecipient={handleDeleteWelfareRecipient}
              residents={residents}
            />
          )}

          {activeTab === "cultural" && (
            <CommunityEvents 
              events={communityEvents}
              onAddEvent={handleAddCommunityEvent}
              onUpdateEventStatus={handleUpdateEventStatus}
              onDeleteEvent={handleDeleteCommunityEvent}
              onUpdateEvent={handleUpdateCommunityEvent}
            />
          )}

          {activeTab === "finance" && (
            <NeighborhoodFunds 
              contributions={fundContributions}
              onAddContribution={handleAddFundContribution}
              onUpdateContributionStatus={handleUpdateContributionStatus}
              onDeleteContribution={handleDeleteFundContribution}
              onUpdateContribution={handleUpdateFundContribution}
              households={households}
            />
          )}

          {activeTab === "plan" && (
            <PlanArchitecture />
          )}

          {activeTab === "settings" && (
            <SettingsAndPermissions
              pendingRegistrations={pendingRegistrations}
              userAccounts={userAccounts}
              onUpdateUserRole={(uname, newRole) => {
                setUserAccounts(prev => prev.map(u => u.username === uname ? { ...u, role: newRole } : u));
              }}
              onApproveRegistration={(reg, assignedRole) => {
                const newRes: Resident = {
                  id: "R" + (residents.length + 1).toString().padStart(3, "0"),
                  fullName: reg.fullName,
                  gender: reg.gender,
                  birthDate: reg.birthDate,
                  cccd: reg.cccd,
                  phone: reg.phone,
                  status: reg.status as "Thường trú" | "Tạm trú",
                  occupation: reg.occupation,
                  address: reg.address,
                  householdId: reg.householdId,
                  relationToOwner: reg.relationToOwner,
                  avatar: reg.avatar || (reg.gender === "Nữ" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"),
                  joinDate: new Date().toLocaleDateString("vi-VN")
                };

                setResidents([newRes, ...residents]);

                const existingHousehold = households.find(hh => hh.code === reg.householdId);
                if (existingHousehold) {
                  setHouseholds(households.map(hh => {
                    if (hh.code === reg.householdId) {
                      return {
                        ...hh,
                        memberCount: hh.memberCount + 1,
                        members: [...hh.members, {
                          name: reg.fullName,
                          relation: reg.relationToOwner,
                          cccd: reg.cccd,
                          phone: reg.phone,
                          birthYear: parseInt(reg.birthDate.split("/")[2]) || 1995
                        }]
                      };
                    }
                    return hh;
                  }));
                } else {
                  const newHousehold: Household = {
                    id: "H" + (households.length + 1).toString().padStart(3, "0"),
                    code: reg.householdId,
                    ownerName: reg.fullName,
                    address: reg.address,
                    memberCount: 1,
                    type: reg.status as "Thường trú" | "Tạm trú",
                    coordinates: reg.coordinates,
                    members: [{
                      name: reg.fullName,
                      relation: reg.relationToOwner || "Chủ hộ",
                      cccd: reg.cccd,
                      phone: reg.phone,
                      birthYear: parseInt(reg.birthDate.split("/")[2]) || 1995
                    }]
                  };
                  setHouseholds([newHousehold, ...households]);
                }

                // Register user account with assigned role
                const finalUname = reg.username || reg.phone || reg.cccd;
                const newAcc: UserAccount = {
                  id: "U" + (userAccounts.length + 1).toString().padStart(3, "0"),
                  username: finalUname,
                  password: reg.password || "123456",
                  fullName: reg.fullName,
                  role: assignedRole || "nguoidan",
                  cccd: reg.cccd,
                  phone: reg.phone,
                  householdCode: reg.householdId,
                  createdAt: new Date().toLocaleDateString("vi-VN"),
                  status: "Hoạt động"
                };
                setUserAccounts(prev => [newAcc, ...prev.filter(u => u.username !== finalUname)]);

                setPendingRegistrations(pendingRegistrations.filter(r => r.id !== reg.id));

                const roleName = assignedRole === "canbo" ? "🛡️ Cán bộ" : "👤 Cư dân";
                setNotifications([
                  { id: Date.now(), text: `Đã duyệt hồ sơ và cấp tài khoản (${roleName}) cho ${reg.fullName}`, unread: true },
                  ...notifications
                ]);
              }}
              onRejectRegistration={(id) => {
                setPendingRegistrations(pendingRegistrations.filter(r => r.id !== id));
              }}
              residentPermissions={residentPermissions}
              onTogglePermission={(key) => {
                setResidentPermissions(prev => ({
                  ...prev,
                  [key]: !prev[key]
                }));
              }}
            />
          )}

          {activeTab === "health" && (
            <SystemHealthDashboard />
          )}
        </main>
      </div>

      {/* Database Connection Status Modal */}
      {showDbModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DbIcon className="text-emerald-400" size={20} />
                <h3 className="font-bold text-sm">Trạng thái Cơ sở dữ liệu Supabase</h3>
              </div>
              <button 
                onClick={() => setShowDbModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
                {dbStatus === "connected" ? (
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={28} />
                ) : (
                  <AlertTriangle className="text-amber-500 shrink-0" size={28} />
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {dbStatus === "connected" ? "Đã kết nối thành công với Supabase DB" : "Chưa kết nối DB (Chạy chế độ Offline Mock Data)"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dbStatus === "connected" 
                      ? "Mọi thao tác thêm/xóa/sửa cư dân, hộ khẩu, phản ánh hiện trường sẽ được đồng bộ trực tiếp lên Cloud." 
                      : "Ứng dụng đang hoạt động bằng dữ liệu mẫu và lưu vào bộ nhớ trình duyệt local Storage."}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Supabase URL:</span>
                  <span className="font-mono text-slate-800 font-bold truncate max-w-[250px]">
                    {((import.meta as any).env || {}).VITE_SUPABASE_URL || "Chưa thiết lập"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Trạng thái dữ liệu DB:</span>
                  <span className="font-semibold text-slate-700">
                    {dbStatus === "connected" ? (isDbEmpty ? "Database rỗng" : "Đã nạp bảng dữ liệu") : "Sử dụng Mock Data"}
                  </span>
                </div>
              </div>

              {dbStatus === "connected" && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 space-y-2">
                  <p className="text-xs text-emerald-800 font-medium">
                    {isDbEmpty 
                      ? "Cơ sở dữ liệu Supabase của bạn hiện chưa có dữ liệu. Bạn có thể nhấn nút dưới đây để nạp toàn bộ dữ liệu mẫu ban đầu."
                      : "Bạn có thể nạp lại dữ liệu mẫu (Seeding) nếu muốn khôi phục danh sách cư dân & hộ khẩu mẫu ban đầu lên DB."}
                  </p>
                  <button
                    onClick={handleSeedMockData}
                    disabled={isSeeding}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isSeeding ? "animate-spin" : ""} />
                    {isSeeding ? "Đang đồng bộ dữ liệu mẫu..." : "Nạp/Khôi phục Dữ liệu Mẫu lên Supabase"}
                  </button>

                  {/* Option to sync local storage data */}
                  <div className="pt-2 border-t border-emerald-200 mt-2">
                    <p className="text-xs text-indigo-800 font-medium mb-1.5">
                      Đồng bộ {residents.length} Dân cư & {households.length} Hộ khẩu đang hiển thị ở local lên Supabase:
                    </p>
                    <button
                      onClick={handleSyncLocalStorageToSupabase}
                      disabled={isSyncingLocal}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncingLocal ? "animate-spin" : ""} />
                      {isSyncingLocal ? "Đang tải dữ liệu local lên Cloud..." : `Đồng bộ Dữ liệu Local (${residents.length} Dân cư) lên Supabase`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDbModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
