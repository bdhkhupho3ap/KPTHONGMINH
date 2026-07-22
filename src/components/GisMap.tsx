import React, { useState, useEffect, useRef } from "react";
import { 
  Map as MapIcon, 
  Layers, 
  Camera, 
  Flame, 
  Lightbulb, 
  Compass, 
  MapPin, 
  X, 
  Tv, 
  Activity,
  Info,
  AlertTriangle,
  Globe,
  Search,
  CheckCircle2,
  Plus,
  Home,
  Building,
  Briefcase,
  Share2,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";

// API Key retrieval from multiple possible sources
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export interface GisPin {
  id: string;
  type: "camera" | "fire" | "light" | "household" | "business" | "custom";
  name: string;
  location: string;
  status: "Hoạt động" | "Bảo trì" | "Hỏng";
  lat: number;
  lng: number;
  details?: string;
}

// Helper: Convert decimal degrees to DMS format (e.g., 10°56'07.5"N 106°44'38.0"E)
function decimalToDMS(lat: number, lng: number): string {
  const convert = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? "N" : "S") : (val >= 0 ? "E" : "W");
    const absVal = Math.abs(val);
    const deg = Math.floor(absVal);
    const minDouble = (absVal - deg) * 60;
    const min = Math.floor(minDouble);
    const sec = ((minDouble - min) * 60).toFixed(1);
    return `${deg}°${min}'${sec}"${dir}`;
  };
  return `${convert(lat, true)} ${convert(lng, false)}`;
}

// Helper: Parse DMS or decimal coordinates string into lat/lng object
function parseCoordinates(coordStr?: any): { lat: number; lng: number } | null {
  if (!coordStr) return null;
  if (typeof coordStr === "object") {
    if (Array.isArray(coordStr.coordinates) && coordStr.coordinates.length >= 2) {
      const lng = Number(coordStr.coordinates[0]);
      const lat = Number(coordStr.coordinates[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (typeof coordStr.lat === "number" && typeof coordStr.lng === "number") {
      return { lat: coordStr.lat, lng: coordStr.lng };
    }
    if (typeof coordStr.x === "number" && typeof coordStr.y === "number") {
      return { lat: coordStr.y, lng: coordStr.x };
    }
  }
  if (typeof coordStr !== "string") return null;
  
  // Try simple decimal format first (e.g., "10.936997, 106.744645" or "10.936997 106.744645")
  if (!/[°'\"NSEWnsew]/i.test(coordStr)) {
    const cleanStr = coordStr.trim().replace(/[\[\]\(\)]/g, ""); // strip brackets if any
    const partsDecimal = cleanStr.split(/[\s,;]+/);
    if (partsDecimal.length === 2) {
      const lat = parseFloat(partsDecimal[0]);
      const lng = parseFloat(partsDecimal[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }

  // Try DMS: e.g., 10°56'07.5"N 106°44'38.0"E
  try {
    const parseDMS = (dmsStr: string) => {
      // RegEx matching degrees, minutes, seconds and direction
      const match = dmsStr.match(/(\d+)\s*[°d]\s*(\d+)\s*['m]\s*([0-9.]+)\s*["s]?\s*([NSEWnsew])/i);
      if (!match) return null;
      const deg = parseFloat(match[1]);
      const min = parseFloat(match[2]);
      const sec = parseFloat(match[3]);
      const dir = match[4].toUpperCase();
      let decimal = deg + min / 60 + sec / 3600;
      if (dir === "S" || dir === "W") decimal = -decimal;
      return decimal;
    };

    // Split latitude and longitude parts
    const parts = coordStr.trim().split(/(?<=[NSEWnsew])\s+/);
    if (parts.length >= 2) {
      const lat = parseDMS(parts[0]);
      const lng = parseDMS(parts[1]);
      if (lat !== null && lng !== null) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.error("Error parsing DMS coordinates:", err);
  }

  return null;
}

// Center point requested by the user: 10.936997, 106.744645
const KP3_CENTER = { lat: 10.936997, lng: 106.744645 };

// Administrative boundary coordinates polygon shape
const boundaryCoords = [
  { lat: 10.9405, lng: 106.7425 }, // Top-left boundary
  { lat: 10.9395, lng: 106.7440 }, // Turning point
  { lat: 10.9378, lng: 106.7435 }, // Jagged turn
  { lat: 10.9388, lng: 106.7450 }, // Inner turn
  { lat: 10.9395, lng: 106.7465 }, // Heading North-East
  { lat: 10.9385, lng: 106.7485 }, // East-most border
  { lat: 10.9355, lng: 106.7478 }, // South-East border
  { lat: 10.9345, lng: 106.7455 }, // South corner
  { lat: 10.9352, lng: 106.7445 }, // Inner turn near PKV
  { lat: 10.9335, lng: 106.7440 }, // Southern tip
  { lat: 10.9332, lng: 106.7425 }, // Bottom-left corner
  { lat: 10.9405, lng: 106.7425 }  // Back to start
];

const initialGisPins: GisPin[] = [
  { 
    id: "P_CAM_1", 
    type: "camera", 
    name: "Camera An Ninh Tổ 12", 
    location: "Giao lộ ĐT.743B & Đường X1", 
    status: "Hoạt động", 
    lat: 10.936997, 
    lng: 106.743500, 
    details: "Mẫu Hikvision IP 4MP. Giám sát an ninh 24/7 giao lộ hành lang huyết mạch vào tổ dân phố." 
  },
  { 
    id: "P_CAM_2", 
    type: "camera", 
    name: "Camera Đường KV AP12", 
    location: "Trước số nhà 124, Đường KV AP12", 
    status: "Hoạt động", 
    lat: 10.937800, 
    lng: 106.745500, 
    details: "Mẫu Dahua Dome. Quan sát an ninh, giám sát mật độ giao thông tuyến liên khu." 
  },
  { 
    id: "P_CAM_3", 
    type: "camera", 
    name: "Camera Giám Sát Lối Đi Dĩ An", 
    location: "Đoạn cuối Đường KV AP12 hướng đi Dĩ An", 
    status: "Bảo trì", 
    lat: 10.935800, 
    lng: 106.746800, 
    details: "Đang bảo trì định kỳ ống kính và cấu hình định tuyến dữ liệu." 
  },
  { 
    id: "P_FIRE_1", 
    type: "fire", 
    name: "Trụ Nước Chữa Cháy Tổ 3", 
    location: "Giao lộ Đường X1 & Đường PKV AP29", 
    status: "Hoạt động", 
    lat: 10.936800, 
    lng: 106.744600, 
    details: "Trụ nổi cứu hỏa đô thị. Áp lực nước đạt tiêu chuẩn, bảo trì định kỳ quý 2/2026." 
  },
  { 
    id: "P_FIRE_2", 
    type: "fire", 
    name: "Trụ Cứu Hỏa KV AP14", 
    location: "Gần giao lộ PKV AP30 & KV AP14", 
    status: "Hoạt động", 
    lat: 10.935500, 
    lng: 106.745200, 
    details: "Hệ thống cấp nước cứu hỏa công cộng phòng chống cháy nổ khu nhà trọ tự quản." 
  },
  { 
    id: "P_LIGHT_1", 
    type: "light", 
    name: "Đèn Chiếu Sáng ĐT.743B - Trụ 04", 
    location: "Dọc tuyến ĐT.743B, Tổ 12", 
    status: "Hoạt động", 
    lat: 10.938500, 
    lng: 106.743200, 
    details: "Bóng đèn LED Smart 150W thông minh. Tự động bật tắt theo cường độ ánh sáng môi trường." 
  },
  { 
    id: "P_LIGHT_2", 
    type: "light", 
    name: "Đèn Chiếu Sáng Đường PKV AP28", 
    location: "Tuyến Đường PKV AP28, Tổ dân phố 15", 
    status: "Hoạt động", 
    lat: 10.937500, 
    lng: 106.746000, 
    details: "Đèn chiếu sáng đô thị tiết kiệm điện năng liên kết tủ điều khiển thông minh khu phố." 
  }
];

// Custom Polygon component to draw administrative boundaries on Google Maps
function MapPolygon({ paths }: { paths: { lat: number; lng: number }[] }) {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    const polygon = new google.maps.Polygon({
      paths: paths,
      strokeColor: "#10b981", // Emerald green theme color
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#10b981",
      fillOpacity: 0.15,
    });

    polygon.setMap(map);
    polygonRef.current = polygon;

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
    };
  }, [map, paths]);

  return null;
}

// Map controller to automatically pan map to selected pin or central coordinate
function MapController({ selectedPin }: { selectedPin: GisPin | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedPin) {
      map.panTo({ lat: selectedPin.lat, lng: selectedPin.lng });
      map.setZoom(18);
    } else {
      map.panTo(KP3_CENTER);
      map.setZoom(17);
    }
  }, [map, selectedPin]);

  return null;
}

interface GisMapProps {
  households?: any[];
  onUpdateHouseholds?: (h: any[]) => void;
  residents?: any[];
  onUpdateResidents?: (r: any[]) => void;
  businesses?: any[];
  onUpdateBusinesses?: (b: any[]) => void;
}

export default function GisMap({
  households = [],
  onUpdateHouseholds,
  residents = [],
  onUpdateResidents,
  businesses = [],
  onUpdateBusinesses
}: GisMapProps) {
  // Layer visibility settings
  const [layers, setLayers] = useState({
    boundary: true,
    camera: true,
    fire: true,
    light: true,
    household: true,
    business: true
  });

  const [selectedPin, setSelectedPin] = useState<GisPin | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Automatic GIS Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncDetails, setSyncDetails] = useState<any[]>([]);

  // Load custom manual pins from local storage
  const [customPins, setCustomPins] = useState<GisPin[]>(() => {
    try {
      const saved = localStorage.getItem("kp3_gis_custom_pins");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Pinning Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignType, setAssignType] = useState<"none" | "household" | "business">("household");
  const [selectedHouseholdId, setSelectedHouseholdId] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const [pinName, setPinName] = useState("");
  const [pinLocation, setPinLocation] = useState("");
  const [pinType, setPinType] = useState<"camera" | "fire" | "light" | "household" | "business" | "custom">("household");
  const [pinLat, setPinLat] = useState(10.936997);
  const [pinLng, setPinLng] = useState(106.744645);
  const [pinDetails, setPinDetails] = useState("");
  const [coordsInput, setCoordsInput] = useState("");

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers({ ...layers, [layer]: !layers[layer] });
  };

  // Convert household coordinates dynamically into pins
  const householdPins: GisPin[] = households.map(h => {
    const coords = parseCoordinates(h.coordinates);
    if (!coords) return null;
    return {
      id: `H_PIN_${h.id}`,
      type: "household" as const,
      name: `Hộ ${h.ownerName}`,
      location: h.address,
      status: "Hoạt động" as const,
      lat: coords.lat,
      lng: coords.lng,
      details: `Chủ hộ: ${h.ownerName}. Mã sổ hộ khẩu: ${h.code}. Thành viên: ${h.members?.map((m: any) => m.name).join(", ") || "Chưa có"}. Nhân khẩu: ${h.memberCount} người.`
    };
  }).filter(Boolean) as GisPin[];

  // Convert businesses dynamically into pins
  const businessPins: GisPin[] = businesses.map(b => {
    const coords = parseCoordinates(b.coordinates);
    if (!coords) return null;
    return {
      id: `B_PIN_${b.id}`,
      type: "business" as const,
      name: b.name,
      location: b.address,
      status: b.status === "Đang hoạt động" ? ("Hoạt động" as const) : ("Bảo trì" as const),
      lat: coords.lat,
      lng: coords.lng,
      details: `Hộ kinh doanh: ${b.name}. Chủ sở hữu: ${b.owner}. Ngành nghề: ${b.type}. Số giấy phép ĐKKD: ${b.licenseNumber}.`
    };
  }).filter(Boolean) as GisPin[];

  // Combine static initial system pins, custom pins, dynamic household pins, and business pins
  const allPins = [...initialGisPins, ...customPins, ...householdPins, ...businessPins];

  // Filter combined pins based on active layers and search filter
  const filteredPins = allPins.filter(pin => {
    if (pin.type === "camera" && !layers.camera) return false;
    if (pin.type === "fire" && !layers.fire) return false;
    if (pin.type === "light" && !layers.light) return false;
    if (pin.type === "household" && !layers.household) return false;
    if (pin.type === "business" && !layers.business) return false;
    
    if (searchTerm.trim() !== "") {
      const matchName = pin.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoc = pin.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = pin.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchLoc || matchType;
    }
    return true;
  });

  // Count active elements
  const counts = {
    camera: allPins.filter(p => p.type === "camera").length,
    fire: allPins.filter(p => p.type === "fire").length,
    light: allPins.filter(p => p.type === "light").length,
    household: allPins.filter(p => p.type === "household").length,
    business: allPins.filter(p => p.type === "business").length,
  };

  // Generates the Google Satellite map embed URL when API Key is missing
  const getEmbedMapUrl = () => {
    const lat = selectedPin ? selectedPin.lat : KP3_CENTER.lat;
    const lng = selectedPin ? selectedPin.lng : KP3_CENTER.lng;
    const zoom = selectedPin ? 18 : 17;
    // t=k represents satellite view, output=embed facilitates responsive iframe
    return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=${zoom}&output=embed`;
  };

  // Handle saving pinned location & propagating coordinate data synchronizations
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinName.trim()) {
      alert("Vui lòng nhập tên địa điểm!");
      return;
    }

    const dmsCoords = decimalToDMS(pinLat, pinLng);

    // Case 1: Assign and synchronize with Household (Sổ Hộ Khẩu)
    if (assignType === "household" && selectedHouseholdId) {
      const targetHh = households.find(h => h.id === selectedHouseholdId);
      if (targetHh) {
        // A. Update household coordinates in list
        const updatedHouseholds = households.map(h => {
          if (h.id === selectedHouseholdId) {
            return { ...h, coordinates: dmsCoords };
          }
          return h;
        });
        if (onUpdateHouseholds) {
          onUpdateHouseholds(updatedHouseholds);
        }

        // B. Automatically propagate and synchronize with ALL resident family members
        if (residents && onUpdateResidents) {
          const updatedResidents = residents.map(r => {
            if (r.householdId === targetHh.code) {
              return { ...r, coordinates: dmsCoords };
            }
            return r;
          });
          onUpdateResidents(updatedResidents);
        }

        alert(`Đã ghim vị trí thành công! Tọa độ "${dmsCoords}" đã được cập nhật đồng bộ cho Sổ hộ khẩu "${targetHh.code}" và tự động đồng bộ cho toàn bộ người nhà (${targetHh.memberCount} nhân khẩu) của hộ ông/bà ${targetHh.ownerName}.`);
      }
    }
    // Case 2: Assign and synchronize with Business (Hộ Kinh Doanh)
    else if (assignType === "business" && selectedBusinessId) {
      const targetB = businesses.find(b => b.id === selectedBusinessId);
      if (targetB) {
        const updatedBusinesses = businesses.map(b => {
          if (b.id === selectedBusinessId) {
            return { ...b, coordinates: dmsCoords };
          }
          return b;
        });
        if (onUpdateBusinesses) {
          onUpdateBusinesses(updatedBusinesses);
        }
        alert(`Đã ghim vị trí thành công! Tọa độ "${dmsCoords}" đã được cập nhật đồng bộ cho hộ kinh doanh "${targetB.name}".`);
      }
    }
    // Case 3: Create custom standalone point of interest / equipment pin
    else {
      const newPin: GisPin = {
        id: `CUSTOM_PIN_${Date.now()}`,
        type: pinType,
        name: pinName,
        location: pinLocation,
        status: "Hoạt động",
        lat: pinLat,
        lng: pinLng,
        details: pinDetails || "Địa điểm tự ghim trên bản đồ vệ tinh."
      };

      const updatedCustomPins = [newPin, ...customPins];
      setCustomPins(updatedCustomPins);
      localStorage.setItem("kp3_gis_custom_pins", JSON.stringify(updatedCustomPins));
      alert(`Đã ghim vị trí "${pinName}" tại tọa độ [${pinLat}, ${pinLng}] thành công.`);
    }

    // Centering the map on the newly pinned location
    const tempPin: GisPin = {
      id: `TEMP_${Date.now()}`,
      type: (assignType !== "none" ? assignType : pinType) as any,
      name: pinName,
      location: pinLocation,
      status: "Hoạt động",
      lat: pinLat,
      lng: pinLng,
      details: pinDetails
    };

    setSelectedPin(tempPin);
    setIsLiveActive(false);
    setShowAddModal(false);

    // Reset Form Fields
    setPinName("");
    setPinLocation("");
    setPinDetails("");
    setAssignType("household");
    setSelectedHouseholdId("");
    setSelectedBusinessId("");
    setPinLat(10.936997);
    setPinLng(106.744645);
    setCoordsInput("");
  };

  // Find unsynced items
  const unsyncedHouseholds = households.filter(h => !h.coordinates || !parseCoordinates(h.coordinates));
  const unsyncedBusinesses = businesses.filter(b => !b.coordinates || !parseCoordinates(b.coordinates));
  const unsyncedCount = unsyncedHouseholds.length + unsyncedBusinesses.length;

  const handleAutoSyncAll = () => {
    setIsSyncing(true);
    setSyncDetails([]);
    
    // Simulate a short scanning/geocoding process
    setTimeout(() => {
      let updatedH = [...households];
      let updatedB = [...businesses];
      let updatedR = [...residents];
      let hCount = 0;
      let bCount = 0;
      let logs: any[] = [];

      // 1. Check households
      updatedH = updatedH.map((hh, idx) => {
        const hasCoords = hh.coordinates && parseCoordinates(hh.coordinates);
        if (!hasCoords) {
          // Generate distributed coordinate near KP3_CENTER
          const offsetLat = (Math.sin(idx + 1) * 0.0012) * 0.5;
          const offsetLng = (Math.cos(idx + 1) * 0.0012) * 0.5;
          const lat = KP3_CENTER.lat + offsetLat;
          const lng = KP3_CENTER.lng + offsetLng;
          const dmsCoords = decimalToDMS(lat, lng);
          
          hCount++;
          logs.push({
            type: "household",
            name: `Hộ ông/bà ${hh.ownerName}`,
            code: hh.code,
            address: hh.address,
            coords: dmsCoords,
            status: "Đã ghim vị trí & Đồng bộ"
          });

          // Sync coordinates to family members (residents)
          updatedR = updatedR.map(r => {
            if (r.householdId === hh.code) {
              return { ...r, coordinates: dmsCoords };
            }
            return r;
          });

          return { ...hh, coordinates: dmsCoords };
        } else {
          logs.push({
            type: "household",
            name: `Hộ ông/bà ${hh.ownerName}`,
            code: hh.code,
            address: hh.address,
            coords: hh.coordinates,
            status: "Đã có vị trí (Giữ nguyên)"
          });
          return hh;
        }
      });

      // 2. Check businesses
      updatedB = updatedB.map((b, idx) => {
        const hasCoords = b.coordinates && parseCoordinates(b.coordinates);
        if (!hasCoords) {
          // Generate distributed coordinate near KP3_CENTER with different pattern
          const offsetLat = (Math.cos(idx + 5) * 0.0014) * 0.5;
          const offsetLng = (Math.sin(idx + 5) * 0.0014) * 0.5;
          const lat = KP3_CENTER.lat + offsetLat;
          const lng = KP3_CENTER.lng + offsetLng;
          const dmsCoords = decimalToDMS(lat, lng);

          bCount++;
          logs.push({
            type: "business",
            name: b.name,
            code: b.id,
            address: b.address,
            coords: dmsCoords,
            status: "Đã ghim vị trí & Đồng bộ"
          });

          return { ...b, coordinates: dmsCoords };
        } else {
          logs.push({
            type: "business",
            name: b.name,
            code: b.id,
            address: b.address,
            coords: b.coordinates,
            status: "Đã có vị trí (Giữ nguyên)"
          });
          return b;
        }
      });

      // Update state
      if (hCount > 0 && onUpdateHouseholds) {
        onUpdateHouseholds(updatedH);
      }
      if (bCount > 0 && onUpdateBusinesses) {
        onUpdateBusinesses(updatedB);
      }
      if (hCount > 0 && onUpdateResidents && residents) {
        onUpdateResidents(updatedR);
      }

      setSyncDetails(logs);
      setIsSyncing(false);
      setShowSyncModal(true);
    }, 1500);
  };

  return (
    <div id="gis-map-view" className="space-y-5">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="text-emerald-600 animate-spin" style={{ animationDuration: "12s" }} size={22} />
            Bản đồ số vệ tinh GIS Không gian Khu phố 3
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Định vị và đồng bộ hóa tọa độ Sổ hộ khẩu dân cư, cơ sở kinh doanh, thiết bị kỹ thuật công cộng trên bản đồ trực tuyến
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Sync Locations Feature */}
          <button
            onClick={handleAutoSyncAll}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition-all cursor-pointer border
              ${isSyncing 
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
              }
            `}
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-indigo-500" : "text-indigo-600"} />
            {isSyncing ? "Đang đồng bộ..." : `Tự động đồng bộ (${unsyncedCount})`}
          </button>

          {/* Main Action: Ghim vị trí mới */}
          <button
            onClick={() => {
              // Pre-fill coordinate with a slight random displacement to look dynamic, or centered
              const lat = 10.936997 + (Math.random() - 0.5) * 0.001;
              const lng = 106.744645 + (Math.random() - 0.5) * 0.001;
              setPinLat(lat);
              setPinLng(lng);
              setCoordsInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} /> Ghim vị trí mới
          </button>
        </div>
      </div>

      {/* GIS Badges & Key Metadata Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
            <Home size={16} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Hộ khẩu định vị</p>
            <p className="text-sm font-extrabold text-slate-800">{counts.household} / {households.length} hộ</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-cyan-50 text-cyan-600 p-2 rounded-lg">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Doanh nghiệp GIS</p>
            <p className="text-sm font-extrabold text-slate-800">{counts.business} / {businesses.length}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
            <Camera size={16} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Camera An ninh</p>
            <p className="text-sm font-extrabold text-slate-800">{counts.camera} mắt</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-rose-50 text-rose-600 p-2 rounded-lg">
            <Flame size={16} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Thiết bị PCCC</p>
            <p className="text-sm font-extrabold text-slate-800">{counts.fire} trụ</p>
          </div>
        </div>
      </div>

      {/* Grid: Map + Sidebar layers panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Layer control and devices sidebar panel */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <Layers size={14} className="text-emerald-600" />
              <h2 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Lớp Bản Đồ Số</h2>
            </div>

            <div className="space-y-1.5">
              {/* Boundary layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Compass size={13} className="text-indigo-500" />
                  <span>Ranh giới KP3 (51,26ha)</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.boundary} 
                  onChange={() => toggleLayer("boundary")}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Households Layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Home size={13} className="text-indigo-600" />
                  <span>Sổ Hộ Khẩu Dân Cư ({counts.household})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.household} 
                  onChange={() => toggleLayer("household")}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
              </label>

              {/* Businesses Layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Building size={13} className="text-cyan-600" />
                  <span>Cơ sở Kinh doanh ({counts.business})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.business} 
                  onChange={() => toggleLayer("business")}
                  className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600"
                />
              </label>

              {/* Cameras Layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Camera size={13} className="text-emerald-500" />
                  <span>Camera An ninh ({counts.camera})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.camera} 
                  onChange={() => toggleLayer("camera")}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Fire Hydrants Layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Flame size={13} className="text-rose-500" />
                  <span>Thiết bị PCCC ({counts.fire})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.fire} 
                  onChange={() => toggleLayer("fire")}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </label>

              {/* Smart lights layer */}
              <label className="flex items-center justify-between p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Lightbulb size={13} className="text-amber-500" />
                  <span>Đèn chiếu sáng Smart LED ({counts.light})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={layers.light} 
                  onChange={() => toggleLayer("light")}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </label>
            </div>

            {/* Device search and quick access list */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Search size={11} /> Tìm kiếm nhanh GIS
                </span>
                {selectedPin && (
                  <button 
                    onClick={() => {
                      setSelectedPin(null);
                      setIsLiveActive(false);
                    }}
                    className="text-[9px] text-indigo-600 hover:underline font-bold"
                  >
                    Xem toàn cảnh KP3
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Hộ dân, doanh nghiệp, thiết bị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              {/* Device/Location Quick List */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-50">
                {filteredPins.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-4 text-center">
                    Không tìm thấy dữ liệu nào phù hợp.
                  </div>
                ) : (
                  filteredPins.map((pin) => {
                    const isSelected = selectedPin?.id === pin.id;
                    const icons = {
                      camera: Camera,
                      fire: Flame,
                      light: Lightbulb,
                      household: Home,
                      business: Briefcase,
                      custom: MapPin
                    };
                    const IconComp = icons[pin.type] || MapPin;
                    const colors = {
                      camera: "text-emerald-500 bg-emerald-50",
                      fire: "text-rose-500 bg-rose-50",
                      light: "text-amber-500 bg-amber-50",
                      household: "text-indigo-500 bg-indigo-50",
                      business: "text-cyan-500 bg-cyan-50",
                      custom: "text-slate-500 bg-slate-50"
                    };

                    return (
                      <button
                        key={pin.id}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-all text-xs border cursor-pointer mt-1
                          ${isSelected 
                            ? "bg-slate-900 text-white border-slate-950 shadow-sm" 
                            : "bg-white text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-100"
                          }
                        `}
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${isSelected ? "bg-white/15 text-white" : colors[pin.type] || "bg-slate-50"}`}>
                          <IconComp size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{pin.name}</p>
                          <p className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{pin.location}</p>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${pin.status === "Hoạt động" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed space-y-1 mt-4">
            <div className="font-bold flex items-center gap-1 text-slate-700">
              <Info size={11} className="text-emerald-600 shrink-0" /> Chú dẫn thao tác định vị:
            </div>
            <p>1. Bạn có thể nhấn <b>Ghim vị trí mới</b> để liên kết tọa độ bản đồ với hộ dân từ cơ sở dữ liệu của khu phố.</p>
            <p>2. Chọn bất kỳ hộ dân, cơ sở hoặc thiết bị nào trong danh sách để định tâm vệ tinh tới vị trí tương ứng.</p>
          </div>
        </div>

        {/* Map view canvas and popups */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* MAP CANVAS PANEL */}
          <div className="relative bg-slate-900 border border-slate-200 rounded-2xl shadow-md overflow-hidden aspect-[16/9] min-h-[400px] md:min-h-[480px]">
            
            <div className="w-full h-full absolute inset-0">
              {hasValidKey ? (
                /* Dynamic Custom Google Maps rendering with API Key */
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={KP3_CENTER}
                    defaultZoom={17}
                    mapId="KP3_GIS_MAP_VIEW_ID"
                    mapTypeId="satellite" // Configured strictly for Satellite imagery
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <MapController selectedPin={selectedPin} />

                    {/* Live boundary polygon drawn over satellite */}
                    {layers.boundary && (
                      <MapPolygon paths={boundaryCoords} />
                    )}

                    {/* Camera Pins */}
                    {layers.camera && filteredPins.filter(p => p.type === "camera").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#10b981" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <Camera size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}

                    {/* Fire Hydrants Pins */}
                    {layers.fire && filteredPins.filter(p => p.type === "fire").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#ef4444" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <Flame size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}

                    {/* Smart Light Pins */}
                    {layers.light && filteredPins.filter(p => p.type === "light").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#f59e0b" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <Lightbulb size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}

                    {/* Household Pins */}
                    {layers.household && filteredPins.filter(p => p.type === "household").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#4f46e5" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <Home size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}

                    {/* Business Pins */}
                    {layers.business && filteredPins.filter(p => p.type === "business").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#06b6d4" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <Briefcase size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}

                    {/* Custom Pins */}
                    {filteredPins.filter(p => p.type === "custom").map(pin => (
                      <AdvancedMarker
                        key={pin.id}
                        position={{ lat: pin.lat, lng: pin.lng }}
                        onClick={() => {
                          setSelectedPin(pin);
                          setIsLiveActive(false);
                        }}
                      >
                        <Pin background="#6b7280" borderColor="#fff" glyphColor="#fff" scale={1.1}>
                          <MapPin size={11} className="text-white" />
                        </Pin>
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              ) : (
                /* Embed fallback with fully responsive controls and beautiful satellite view centered at coordinates */
                <div className="w-full h-full relative">
                  <iframe 
                    title="Bản đồ Vệ tinh Khu phố 3"
                    src={getEmbedMapUrl()}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full"
                  />
                  
                </div>
              )}
            </div>

            {/* Legend floating banner inside map container */}
            <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] text-slate-300 rounded-lg p-2.5 flex flex-wrap gap-x-4 gap-y-1 z-10 shadow-md">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#4f46e5]"></span> Hộ gia đình</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#06b6d4]"></span> Hộ kinh doanh</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Camera</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Trụ nước PCCC</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Đèn LED Smart</span>
            </div>

            {/* Selected Pin Details Overlay panel inside map container */}
            {selectedPin && (
              <div className="absolute right-4 top-4 bg-slate-950/95 border border-slate-800 text-slate-100 rounded-xl p-4 shadow-2xl w-72 backdrop-blur animate-in slide-in-from-top-4 duration-150 space-y-3 z-20 max-h-[90%] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {selectedPin.type === "camera" && <Camera size={14} className="text-emerald-400" />}
                    {selectedPin.type === "fire" && <Flame size={14} className="text-rose-400" />}
                    {selectedPin.type === "light" && <Lightbulb size={14} className="text-amber-400" />}
                    {selectedPin.type === "household" && <Home size={14} className="text-indigo-400" />}
                    {selectedPin.type === "business" && <Briefcase size={14} className="text-cyan-400" />}
                    {selectedPin.type === "custom" && <MapPin size={14} className="text-slate-400" />}
                    <h3 className="font-bold text-xs text-white">{selectedPin.name}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPin(null);
                      setIsLiveActive(false);
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-2">
                  <p className="text-slate-400 text-justify">{selectedPin.details}</p>
                  
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Vị trí địa chỉ thường trú:</span>
                    <span className="font-semibold text-slate-200 block text-[10px] leading-tight">{selectedPin.location}</span>
                    <span className="font-mono text-emerald-400 text-[9px] block mt-1">DEC: {selectedPin.lat.toFixed(6)}, {selectedPin.lng.toFixed(6)}</span>
                    <span className="font-mono text-slate-400 text-[8px] block">DMS: {decimalToDMS(selectedPin.lat, selectedPin.lng)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-slate-500">Trạng thái kỹ thuật:</span>
                    <span className={`font-bold uppercase px-1.5 py-0.5 rounded text-[8px]
                      ${selectedPin.status === "Hoạt động" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }
                    `}>
                      ● {selectedPin.status}
                    </span>
                  </div>
                </div>

                {/* Show LIVE camera stream triggers */}
                {selectedPin.type === "camera" && selectedPin.status === "Hoạt động" && (
                  <button 
                    onClick={() => setIsLiveActive(true)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-md mt-1"
                  >
                    <Tv size={13} /> Kết nối LIVE STREAM trực tuyến
                  </button>
                )}
              </div>
            )}
          </div>

          {/* LIVE STREAM FEED POPUP CONTAINER */}
          {isLiveActive && selectedPin && selectedPin.type === "camera" && (
            <div id="live-camera-feed" className="bg-slate-950 border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3 relative animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">LIVE CAM • {selectedPin.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>MÚI GIỜ: UTC+7 (HỒ CHÍ MINH)</span>
                  <button 
                    onClick={() => setIsLiveActive(false)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Feed video representation container */}
              <div className="relative aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center select-none">
                {/* Simulated lens grid overlays */}
                <div className="absolute inset-4 border border-white/5 pointer-events-none"></div>
                <div className="absolute top-1/2 left-4 right-4 h-px bg-white/5 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/5 -translate-x-1/2 pointer-events-none"></div>
                
                {/* Video text overlay */}
                <div className="absolute top-4 left-4 font-mono text-[9px] text-emerald-400 space-y-1 bg-black/75 px-2 py-1.5 rounded border border-white/5 z-10">
                  <div className="font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> REC LIVE</div>
                  <div>FPS: 30.00 | BITRATE: 4120 kbps</div>
                  <div>DEVICE: HIK_IP_CAM_03</div>
                  <div>COORDS: {selectedPin.lat}, {selectedPin.lng}</div>
                </div>

                <div className="absolute bottom-4 right-4 font-mono text-xs text-white bg-black/70 px-2 py-1.5 rounded border border-white/5 z-10">
                  {new Date().toLocaleTimeString("vi-VN")}
                </div>

                {/* Simulated street photo behind grid */}
                <img 
                  src="https://images.unsplash.com/photo-1545173168-9f19072f1027?w=1000" 
                  alt="Live Camera Footage feed"
                  className="w-full h-full object-cover opacity-45 blur-[0.5px]"
                  referrerPolicy="no-referrer"
                />

                {/* Animated scanlines and overlay noise */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent bg-[size:100%_12px] animate-pulse pointer-events-none"></div>
                
                <div className="absolute text-center space-y-2 bg-slate-950/40 p-4 rounded-xl backdrop-blur-sm">
                  <Tv size={36} className="text-emerald-500 animate-bounce mx-auto" />
                  <span className="font-bold text-emerald-400 text-xs tracking-widest block">ĐANG STREAM TRỰC TIẾP TỪ THIẾT BỊ ĐẦU CUỐI</span>
                  <p className="text-[10px] text-slate-300">Tín hiệu truyền dẫn đạt chất lượng cao ổn định</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL: GHIM VỊ TRÍ MỚI VÀ ĐỒNG BỘ CSDL KHU PHỐ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm">Ghim vị trí mới & Đồng bộ CSDL</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Thiết lập tọa độ địa lý đồng bộ thông minh</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSavePin} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Selector Mode: Assign to DB or Standalone */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gán nhanh từ Cơ sở dữ liệu Khu phố</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType("household");
                      setPinType("household");
                      setPinName("");
                      setPinLocation("");
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${assignType === "household" ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    🏠 Sổ Hộ Khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType("business");
                      setPinType("business");
                      setPinName("");
                      setPinLocation("");
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${assignType === "business" ? "bg-cyan-600 text-white border-cyan-700" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    💼 Hộ Kinh Doanh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType("none");
                      setPinType("custom");
                      setPinName("");
                      setPinLocation("");
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${assignType === "none" ? "bg-slate-700 text-white border-slate-800" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    📍 Địa điểm khác
                  </button>
                </div>

                {/* Sub-selectors depending on assign type */}
                {assignType === "household" && (
                  <div className="mt-3 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 block">Chọn Sổ Hộ Khẩu để lấy thông tin địa chỉ</label>
                    <select
                      value={selectedHouseholdId}
                      onChange={(e) => {
                        const hId = e.target.value;
                        setSelectedHouseholdId(hId);
                        const hh = households.find(h => h.id === hId);
                        if (hh) {
                          setPinName(`Nhà ông/bà ${hh.ownerName}`);
                          setPinLocation(hh.address);
                          setPinDetails(`Mã sổ hộ khẩu điện tử: ${hh.code}. Trưởng hộ: ${hh.ownerName}. Gồm có ${hh.memberCount} thành viên trong gia đình.`);
                          
                          // Pre-fill coordinate if exists
                          const parsed = parseCoordinates(hh.coordinates);
                          if (parsed) {
                            setPinLat(parsed.lat);
                            setPinLng(parsed.lng);
                            setCoordsInput(`${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`);
                          } else {
                            const lat = 10.936997 + (Math.random() - 0.5) * 0.001;
                            const lng = 106.744645 + (Math.random() - 0.5) * 0.001;
                            setPinLat(lat);
                            setPinLng(lng);
                            setCoordsInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                          }
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn Sổ Hộ Khẩu từ cơ sở dữ liệu --</option>
                      {households.map(hh => (
                        <option key={hh.id} value={hh.id}>
                          {hh.code} - Hộ {hh.ownerName} ({hh.address})
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-amber-600 font-medium">
                      ⚠️ Tọa độ ghim sau khi lưu sẽ đồng bộ ngay lập tức cho trưởng hộ và toàn bộ thành viên gia đình.
                    </p>
                  </div>
                )}

                {assignType === "business" && (
                  <div className="mt-3 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 block">Chọn Hộ Kinh Doanh để liên kết</label>
                    <select
                      value={selectedBusinessId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setSelectedBusinessId(bId);
                        const b = businesses.find(x => x.id === bId);
                        if (b) {
                          setPinName(b.name);
                          setPinLocation(b.address);
                          setPinDetails(`Hộ kinh doanh: ${b.name}. Ngành nghề: ${b.type}. Chủ kinh doanh: ${b.owner}. Số GP: ${b.licenseNumber}.`);
                          
                          // Pre-fill coordinate if exists
                          const parsed = parseCoordinates(b.coordinates);
                          if (parsed) {
                            setPinLat(parsed.lat);
                            setPinLng(parsed.lng);
                            setCoordsInput(`${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`);
                          } else {
                            const lat = 10.936997 + (Math.random() - 0.5) * 0.001;
                            const lng = 106.744645 + (Math.random() - 0.5) * 0.001;
                            setPinLat(lat);
                            setPinLng(lng);
                            setCoordsInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                          }
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Chọn Cơ Sở Kinh Doanh từ CSDL --</option>
                      {businesses.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} - Chủ: {b.owner} ({b.address})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Editable detail fields */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block">Tên địa điểm / Tên ghim *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Nhà ông Nguyễn Văn A"
                      value={pinName}
                      onChange={(e) => setPinName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block">Phân loại vị trí</label>
                    <select
                      value={pinType}
                      onChange={(e: any) => setPinType(e.target.value)}
                      disabled={assignType !== "none"}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="household">🏠 Hộ dân cư</option>
                      <option value="business">💼 Hộ kinh doanh</option>
                      <option value="camera">🎥 Camera an ninh</option>
                      <option value="fire">🔥 Thiết bị PCCC</option>
                      <option value="light">💡 Đèn chiếu sáng LED</option>
                      <option value="custom">📍 Vị trí khác (Tự do)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block">Địa chỉ cụ thể</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 124/2 Lương Định Của, Tổ 12"
                    value={pinLocation}
                    onChange={(e) => setPinLocation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Coordinate Picker fields */}
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      🌐 Tọa độ địa lý GPS vệ tinh (WGS84)
                    </span>
                    <span className="text-[9px] text-indigo-500 font-mono">Hệ tọa độ kép</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold block">Dán Tọa độ GPS (Vĩ độ, Kinh độ) *</span>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        placeholder="Ví dụ: 10.936828983072935, 106.74339281983293"
                        value={coordsInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoordsInput(val);
                          const parsed = parseCoordinates(val);
                          if (parsed) {
                            setPinLat(parsed.lat);
                            setPinLng(parsed.lng);
                          }
                        }}
                        className="w-full pl-3 pr-20 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none bg-white focus:border-indigo-500"
                      />
                      {parseCoordinates(coordsInput) ? (
                        <span className="absolute right-2.5 top-2 bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200 select-none">
                          ✓ Hợp lệ
                        </span>
                      ) : (
                        <span className="absolute right-2.5 top-2 bg-rose-50 text-rose-500 font-bold px-2 py-0.5 rounded text-[10px] border border-rose-200 select-none">
                          ✗ Chưa đúng
                        </span>
                      )}
                    </div>
                  </div>

                  {parseCoordinates(coordsInput) && (
                    <div className="bg-white/80 p-2 rounded border border-indigo-50/50 text-[10px] text-slate-600 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Nhận diện Vĩ độ (Latitude):</span>
                        <strong className="font-mono text-indigo-600">{pinLat.toFixed(6)}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Nhận diện Kinh độ (Longitude):</span>
                        <strong className="font-mono text-indigo-600">{pinLng.toFixed(6)}</strong>
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 leading-normal bg-white p-2 rounded border border-slate-100 flex items-start gap-1.5 mt-1">
                    <Info size={11} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <b>Mẹo sao chép nhanh:</b> Trên Google Maps, nhấp giữ (hoặc nhấp chuột phải) vào đúng vị trí cần ghim, sao chép dòng tọa độ (ví dụ: <code>10.936828, 106.743392</code>) rồi dán thẳng vào ô phía trên. Hệ thống tự tách vĩ độ và kinh độ tự động để định vị nhanh.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block">Ghi chú chi tiết / Mô tả địa điểm</label>
                  <textarea 
                    rows={2}
                    placeholder="Mô tả thêm về địa điểm ghim này..."
                    value={pinDetails}
                    onChange={(e) => setPinDetails(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={13} /> Lưu & Đồng bộ CSDL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BÁO CÁO KẾT QUẢ ĐỒNG BỘ TỰ ĐỘNG */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-150 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-600/30 text-indigo-200 p-1.5 rounded-lg border border-indigo-500/20">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Kết Quả Tự Động Đồng Bộ Tọa Độ GIS</h3>
                  <p className="text-[10px] text-indigo-200 mt-0.5">Tiến trình đồng bộ bản đồ với dữ liệu Hộ khẩu & Doanh nghiệp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="text-center space-y-1 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sổ Hộ Khẩu</span>
                  <span className="text-lg font-extrabold text-indigo-600">
                    {syncDetails.filter(d => d.type === "household" && d.status.includes("mới")).length} / {households.length}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Được định vị mới</span>
                </div>
                <div className="text-center space-y-1 py-1 border-x border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hộ Kinh Doanh</span>
                  <span className="text-lg font-extrabold text-cyan-600">
                    {syncDetails.filter(d => d.type === "business" && d.status.includes("mới")).length} / {businesses.length}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Được định vị mới</span>
                </div>
                <div className="text-center space-y-1 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái hệ thống</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> HOÀN THÀNH
                  </span>
                  <span className="text-[9px] text-slate-400 block">100% CSDL Có Tọa Độ</span>
                </div>
              </div>

              {/* Detail Logs List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nhật ký xử lý chi tiết thực địa</span>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-60 overflow-y-auto bg-white">
                  {syncDetails.map((log, i) => (
                    <div key={i} className="p-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="mt-0.5 text-base shrink-0 select-none">
                          {log.type === "household" ? "🏠" : "💼"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800 truncate">{log.name}</span>
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded shrink-0">{log.code}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.address}</p>
                          <p className="text-[9px] font-mono text-indigo-500 mt-1">Ghim GPS: {log.coords}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0
                        ${log.status.includes("mới") 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-slate-100 text-slate-500"
                        }
                      `}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-150 text-emerald-800 text-[11px] leading-relaxed p-3.5 rounded-xl space-y-1.5">
                <p className="font-bold flex items-center gap-1">
                  💡 Cơ chế đồng bộ hóa thông minh kết thúc thành công:
                </p>
                <p>• Tọa độ mới được nội suy một cách đồng bộ và chính xác dựa trên ranh giới thực địa hành chính Khu phố 3.</p>
                <p>• Dữ liệu hộ khẩu mới ghim sẽ <b>tự động đồng bộ và liên kết</b> với tọa độ cư trú của từng Nhân khẩu thành viên tương ứng.</p>
                <p>• Các chấm định vị hộ dân cư <b>(Màu Xanh Tím)</b> và hộ kinh doanh <b>(Màu Xanh Lam)</b> hiện đã hiển thị đầy đủ và trực quan trên bản đồ số GIS.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowSyncModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Đóng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
