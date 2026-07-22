export interface Resident {
  id: string;
  fullName: string;
  gender: "Nam" | "Nữ";
  birthDate: string;
  cccd: string;
  phone: string;
  status: "Thường trú" | "Tạm trú" | "Tạm vắng";
  occupation: string;
  address: string;
  householdId: string; // Keeps the household_code (HK-xxxx) for frontend compatibility
  relationToOwner: string;
  avatar?: string;
  joinDate?: string;
  ownerName?: string;
  permanentAddress?: string;
  registrationDate?: string;
  healthInsuranceCard?: string;
  gtDen?: string;
  normalizedAddress?: string;
  householdUuid?: string | null;
}

export interface Household {
  id: string; // Household UUID in database
  code: string; // Household code (HK-xxxx)
  ownerName: string; // Head of household name
  address: string;
  memberCount: number;
  type?: "Thường trú" | "Tạm trú";
  coordinates?: string; // GPS coords
  members: {
    name: string;
    relation: string;
    cccd: string;
    phone?: string;
    birthYear: number;
  }[];
  normalizedAddress?: string;
  headPersonId?: string | null;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  owner: string;
  phone: string;
  address: string;
  licenseNumber: string;
  status: "Đang hoạt động" | "Tạm ngưng" | "Chờ duyệt";
  employeeCount: number;
  safetyCertified: boolean;
  image?: string;
  coordinates?: string;
}

export interface FieldReport {
  id: string;
  title: string;
  category: "Rác thải" | "Lấn chiếm lòng đường" | "Tiếng ồn" | "An ninh trật tự" | "Hạ tầng đô thị";
  reporterName: string;
  reporterPhone: string;
  reportedAt: string;
  location: string;
  coordinates: { x: number; y: number };
  description: string;
  status: "Đã tiếp nhận" | "Đang xử lý" | "Đã giải quyết";
  timeline: {
    time: string;
    title: string;
    description: string;
    actor: string;
  }[];
  beforeImage?: string;
  afterImage?: string;
}

export interface PartyMember {
  id: string;
  fullName: string;
  partyCardNumber: string;
  position: string; // e.g. Bí thư, Đảng viên, Phó bí thư
  joinDate: string;
  cellGroup: string; // Tổ Đảng
  birthDate: string;
  status: "Đang sinh hoạt" | "Miễn sinh hoạt" | "Chuyển sinh hoạt";
}

export interface WelfareRecipient {
  id: string;
  fullName: string;
  category: string;
  address: string;
  cccd: string;
  phone?: string;
  supportLevel: string;
  status: "Đang nhận trợ cấp" | "Chờ duyệt hồ sơ" | "Đã tạm ngưng";
  notes?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  organizer: string;
  dateTime: string;
  location: string;
  status: "Sắp diễn ra" | "Đang diễn ra" | "Đã kết thúc" | "Đã hủy";
  expectedAttendees: number;
  description: string;
}

export interface FundContribution {
  id: string;
  householdCode: string;
  ownerName: string;
  fundName: "Quỹ Khuyến học" | "Quỹ Vì người nghèo" | "Quỹ Quốc phòng an ninh" | "Quỹ Phòng chống thiên tai" | "Quỹ Bảo trì hẻm";
  amount: number;
  status: "Đã nộp" | "Chưa nộp";
  paidAt?: string;
}

export type ActiveTab = 
  | "dashboard"
  | "residents"
  | "households"
  | "businesses"
  | "gis"
  | "ai"
  | "reports"
  | "party"
  | "welfare"
  | "cultural"
  | "finance"
  | "plan"
  | "settings"
  | "health";
