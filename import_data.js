import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olmexwouxzqtdkuuthzo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWV4d291eHpxdGRrdXV0aHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjEyNDIsImV4cCI6MjA5Nzc5NzI0Mn0.hmaq-WPMR4bRZK_GWDS5iNEsCPm2V1wd-Jqrn4hXqUQ';

const supabase = createClient(supabaseUrl, supabaseKey);
const excelPath = 'C:\\Users\\KHUPHO3\\Desktop\\ds072026.xlsx';

// Helper to format Excel dates
const parseExcelDate = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{4,5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const date = new Date((serial - 25569) * 86400 * 1000);
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  if (/^\d{4}$/.test(str)) {
    return `01/01/${str}`;
  }
  return str;
};

// Helper to format CCCD (padding leading 0 if 11 digits)
const formatCCCD = (val) => {
  if (!val) return "";
  let str = String(val).trim().replace(/\.0$/, '');
  if (str.length === 11) {
    str = '0' + str;
  }
  return str;
};

async function runImport() {
  console.log("=== BẮT ĐẦU QUÁ TRÌNH LÀM SẠCH VÀ NẠP DỮ LIỆU THỰC ===");

  // Step 1: Clear old data from tables
  console.log("\n1. Đang xóa dữ liệu cũ trong các bảng...");
  
  const tablesToClear = ['incidents', 'businesses', 'residents', 'households'];
  for (const table of tablesToClear) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.warn(`Cảnh báo khi xóa bảng ${table}:`, error.message);
    } else {
      console.log(`✓ Đã làm sạch bảng: ${table}`);
    }
  }

  // Step 2: Read Excel Workbook
  console.log("\n2. Đang đọc tệp Excel từ Desktop...");
  const workbook = XLSX.readFile(excelPath);

  const residentsList = [];
  const householdMap = new Map(); // Address/Owner -> Household Object
  let householdCounter = 1;

  // Step 3: Parse Sheet "Thường trú"
  if (workbook.SheetNames.includes("Thường trú")) {
    console.log("-> Phân tích sheet 'Thường trú'...");
    const sheet = workbook.Sheets["Thường trú"];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row, idx) => {
      const fullName = String(row['Họ và tên'] || '').trim();
      const cccd = formatCCCD(row['Số ĐDCN/CCCD/\r\nCMND'] || row['Số ĐDCN/CCCD/CMND'] || row['CCCD']);
      if (!fullName) return;

      const birthDate = parseExcelDate(row['Ngày sinh']);
      const gender = String(row['Giới tính'] || 'Nam').trim();
      const ownerName = String(row['Họ và tên chủ hộ'] || fullName).trim();
      const address = String(row['Nơi ở hiện tại'] || row['Nơi thường trú'] || 'Khu phố 3, Phường An Phú').trim();
      
      // Determine household code
      const hhKey = (ownerName + "_" + address).toLowerCase();
      let hhCode = "";
      if (householdMap.has(hhKey)) {
        hhCode = householdMap.get(hhKey).code;
        householdMap.get(hhKey).memberCount += 1;
      } else {
        hhCode = "HK-" + String(householdCounter++).padStart(3, '0');
        householdMap.set(hhKey, {
          id: "HH-" + hhCode,
          code: hhCode,
          owner_name: ownerName,
          address: address,
          type: "Thường trú",
          member_count: 1,
          location: "10°56'08.0\"N 106°44'38.0\"E"
        });
      }

      residentsList.push({
        id: "R-TT-" + String(idx + 1).padStart(4, '0'),
        name: fullName,
        dob: birthDate,
        gender: gender === "Nữ" ? "Nữ" : "Nam",
        idCard: cccd,
        phone: "",
        status: "Thường trú",
        occupation: "Cư dân",
        address: address,
        householdId: hhCode,
        note: `Chủ hộ: ${ownerName}`
      });
    });
    console.log(`  ✓ Đã trích xuất ${residentsList.length} nhân khẩu thường trú.`);
  }

  // Step 4: Parse Sheet "Tạm trú"
  if (workbook.SheetNames.includes("Tạm trú")) {
    console.log("-> Phân tích sheet 'Tạm trú'...");
    const sheet = workbook.Sheets["Tạm trú"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const startCount = residentsList.length;

    rows.forEach((row, idx) => {
      const fullName = String(row['TÊN'] || row['Họ và tên'] || '').trim();
      const cccd = formatCCCD(row['CCCD'] || row['Số ĐDCN/CCCD/CMND']);
      if (!fullName) return;

      const birthDate = parseExcelDate(row['NGÀY SINH']);
      const gender = String(row['GIỚI TÍNH'] || 'Nam').trim();
      const address = String(row['ĐỊA CHỈ TẠM TRÚ'] || row['Nơi ở hiện tại'] || 'Khu phố 3, Phường An Phú').trim();
      
      const hhKey = ("Tạm trú_" + address).toLowerCase();
      let hhCode = "";
      if (householdMap.has(hhKey)) {
        hhCode = householdMap.get(hhKey).code;
        householdMap.get(hhKey).memberCount += 1;
      } else {
        hhCode = "HK-TT-" + String(householdCounter++).padStart(3, '0');
        householdMap.set(hhKey, {
          id: "HH-" + hhCode,
          code: hhCode,
          owner_name: fullName, // Mặc định người đầu tiên ở địa chỉ làm đại diện
          address: address,
          type: "Tạm trú",
          member_count: 1,
          location: "10°56'09.0\"N 106°44'36.0\"E"
        });
      }

      residentsList.push({
        id: "R-TAMTRU-" + String(idx + 1).padStart(4, '0'),
        name: fullName,
        dob: birthDate,
        gender: gender === "Nữ" ? "Nữ" : "Nam",
        idCard: cccd,
        phone: "",
        status: "Tạm trú",
        occupation: "Cư dân",
        address: address,
        householdId: hhCode,
        note: `BHYT: ${row['Thẻ bhyt'] || ''}`
      });
    });
    console.log(`  ✓ Đã trích xuất thêm ${residentsList.length - startCount} nhân khẩu tạm trú.`);
  }

  const householdsList = Array.from(householdMap.values()).map(h => ({
    id: h.id,
    code: h.code,
    owner_name: h.owner_name,
    address: h.address,
    type: h.type,
    member_count: h.memberCount,
    location: h.location
  }));

  console.log(`\nTổng số Hộ khẩu khởi tạo: ${householdsList.length}`);
  console.log(`Tổng số Cư dân khởi tạo: ${residentsList.length}`);

  // Step 5: Batch Insert Households to Supabase
  console.log("\n3. Đang đẩy dữ liệu Hộ khẩu lên Supabase...");
  const batchSize = 250;
  for (let i = 0; i < householdsList.length; i += batchSize) {
    const batch = householdsList.slice(i, i + batchSize);
    const { error } = await supabase.from('households').insert(batch);
    if (error) {
      console.error(`  X Lỗi batch Hộ khẩu ${i}-${i + batch.length}:`, error.message);
    } else {
      console.log(`  ✓ Đã nạp batch Hộ khẩu ${i + 1} -> ${i + batch.length}`);
    }
  }

  // Step 6: Batch Insert Residents to Supabase
  console.log("\n4. Đang đẩy dữ liệu Cư dân lên Supabase...");
  for (let i = 0; i < residentsList.length; i += batchSize) {
    const batch = residentsList.slice(i, i + batchSize);
    const { error } = await supabase.from('residents').insert(batch);
    if (error) {
      console.error(`  X Lỗi batch Cư dân ${i}-${i + batch.length}:`, error.message);
    } else {
      console.log(`  ✓ Đã nạp batch Cư dân ${i + 1} -> ${i + batch.length}`);
    }
  }

  console.log("\n=== HOÀN TẤT ĐỒNG BỘ NẠP DỮ LIỆU THỰC LÊN SUPABASE DB! ===");
}

runImport().catch(err => {
  console.error("Lỗi khi chạy script:", err);
});
