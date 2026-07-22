import { Resident, Household, Business, FieldReport, PartyMember, WelfareRecipient, CommunityEvent, FundContribution } from "./types";

export const initialResidents: Resident[] = [];
export const initialHouseholds: Household[] = [];
export const initialBusinesses: Business[] = [
  {
    id: "B001",
    name: "Phở Bò Gia Truyền Hà Nội",
    type: "DỊCH VỤ ĂN UỐNG",
    owner: "Trần Văn Bình",
    phone: "0989123456",
    address: "78 Lương Định Của, Phường An Phú",
    licenseNumber: "GP-12345/AP",
    status: "Đang hoạt động",
    employeeCount: 4,
    safetyCertified: true,
    coordinates: '10°56\'06.3"N 106°44\'39.4"E',
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500"
  },
  {
    id: "B002",
    name: "Tiệm Giặt Ủi An Phú",
    type: "DỊCH VỤ ĐỜI SỐNG",
    owner: "Lê Thị Vân",
    phone: "0912345678",
    address: "42/12 Lương Định Của, Phường An Phú",
    licenseNumber: "GP-12346/AP",
    status: "Đang hoạt động",
    employeeCount: 2,
    safetyCertified: true,
    coordinates: '10°56\'07.2"N 106°44\'40.1"E',
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=500"
  },
  {
    id: "B003",
    name: "Cửa hàng Tiện lợi 247",
    type: "BÁN LẺ THƯƠNG MẠI",
    owner: "Hoàng Minh Tuấn",
    phone: "0908765432",
    address: "90 Lương Định Của, Phường An Phú",
    licenseNumber: "GP-12347/AP",
    status: "Chờ duyệt",
    employeeCount: 5,
    safetyCertified: false,
    coordinates: '10°56\'05.1"N 106°44\'38.9"E',
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500"
  },
  {
    id: "B004",
    name: "Quán Cà Phê Vy",
    type: "DỊCH VỤ ĐỒ UỐNG",
    owner: "Nguyễn Thị Vy",
    phone: "0933445566",
    address: "52 Lương Định Của, Phường An Phú",
    licenseNumber: "GP-12348/AP",
    status: "Đang hoạt động",
    employeeCount: 3,
    safetyCertified: true,
    coordinates: '10°56\'08.0"N 106°44\'41.2"E',
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500"
  },
  {
    id: "B005",
    name: "Nha Khoa Thẩm Mỹ An Phú",
    type: "Y TẾ / CHĂM SÓC SỨC KHỎE",
    owner: "Bác sĩ Ngô Quốc Bảo",
    phone: "0977889900",
    address: "64 Lương Định Của, Phường An Phú",
    licenseNumber: "GP-12349/AP",
    status: "Đang hoạt động",
    employeeCount: 6,
    safetyCertified: true,
    coordinates: '10°56\'06.8"N 106°44\'39.8"E',
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500"
  }
];
export const initialReports: FieldReport[] = [];
export const initialPartyMembers: PartyMember[] = [];
export const initialWelfareRecipients: WelfareRecipient[] = [];
export const initialCommunityEvents: CommunityEvent[] = [];
export const initialFundContributions: FundContribution[] = [];
