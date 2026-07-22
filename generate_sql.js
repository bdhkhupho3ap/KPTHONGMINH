import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const excelPath = 'C:\\Users\\KHUPHO3\\Desktop\\ds072026.xlsx';
const sqlOutputPath = 'C:\\Users\\KHUPHO3\\Desktop\\import_data.sql';

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

// Helper to escape single quotes in SQL strings
const escapeSql = (str) => {
  if (!str) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
};

function generateSql() {
  console.log("=== BẮT ĐẦU ĐỌC EXCEL VÀ TẠO BẢN THẢO SQL ===");

  if (!fs.existsSync(excelPath)) {
    console.error(`Không tìm thấy file Excel tại đường dẫn: ${excelPath}`);
    return;
  }

  const workbook = XLSX.readFile(excelPath);
  const sqlStatements = [];

  // 1. Truncate tables with CASCADE to ensure clean start
  sqlStatements.push("-- 1. LÀM SẠCH DỮ LIỆU CŨ");
  sqlStatements.push("TRUNCATE TABLE public.incidents, public.businesses, public.residents, public.households CASCADE;\n");

  const residentsList = [];
  const householdMap = new Map(); // Address/Owner -> Household Code & UUID
  let householdCounter = 1;

  // 2. Parse "Thường trú"
  if (workbook.SheetNames.includes("Thường trú")) {
    console.log("-> Đọc sheet 'Thường trú'...");
    const sheet = workbook.Sheets["Thường trú"];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row) => {
      const fullName = String(row['Họ và tên'] || '').trim();
      const cccd = formatCCCD(row['Số ĐDCN/CCCD/\r\nCMND'] || row['Số ĐDCN/CCCD/CMND'] || row['CCCD']);
      if (!fullName) return;

      const birthDate = parseExcelDate(row['Ngày sinh']);
      const gender = String(row['Giới tính'] || 'Nam').trim();
      const ownerName = String(row['Họ và tên chủ hộ'] || fullName).trim();
      const address = String(row['Nơi ở hiện tại'] || row['Nơi thường trú'] || 'Khu phố 3, Phường An Phú').trim();

      const hhKey = (ownerName + "_" + address).toLowerCase();
      let hhCode = "";
      let hhId = "";

      if (householdMap.has(hhKey)) {
        const hh = householdMap.get(hhKey);
        hhCode = hh.code;
        hhId = hh.id;
        hh.memberCount += 1;
      } else {
        hhCode = "HK-" + String(householdCounter++).padStart(3, '0');
        hhId = crypto.randomUUID();
        householdMap.set(hhKey, {
          id: hhId,
          code: hhCode,
          owner_name: ownerName,
          address: address,
          type: "Thường trú",
          memberCount: 1
        });
      }

      residentsList.push({
        id: crypto.randomUUID(),
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
  }

  // 3. Parse "Tạm trú"
  if (workbook.SheetNames.includes("Tạm trú")) {
    console.log("-> Đọc sheet 'Tạm trú'...");
    const sheet = workbook.Sheets["Tạm trú"];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row) => {
      const fullName = String(row['TÊN'] || row['Họ và tên'] || '').trim();
      const cccd = formatCCCD(row['CCCD'] || row['Số ĐDCN/CCCD/CMND']);
      if (!fullName) return;

      const birthDate = parseExcelDate(row['NGÀY SINH']);
      const gender = String(row['GIỚI TÍNH'] || 'Nam').trim();
      const address = String(row['ĐỊA CHỈ TẠM TRÚ'] || row['Nơi ở hiện tại'] || 'Khu phố 3, Phường An Phú').trim();

      const hhKey = ("Tạm trú_" + address).toLowerCase();
      let hhCode = "";
      let hhId = "";

      if (householdMap.has(hhKey)) {
        const hh = householdMap.get(hhKey);
        hhCode = hh.code;
        hhId = hh.id;
        hh.memberCount += 1;
      } else {
        hhCode = "HK-TT-" + String(householdCounter++).padStart(3, '0');
        hhId = crypto.randomUUID();
        householdMap.set(hhKey, {
          id: hhId,
          code: hhCode,
          owner_name: fullName,
          address: address,
          type: "Tạm trú",
          memberCount: 1
        });
      }

      residentsList.push({
        id: crypto.randomUUID(),
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
  }

  // 4. Generate SQL inserts for households
  sqlStatements.push("-- 2. THÊM DỮ LIỆU HỘ KHẨU");
  const householdsList = Array.from(householdMap.values());
  
  // Build batch inserts for households
  const hhBatchSize = 100;
  for (let i = 0; i < householdsList.length; i += hhBatchSize) {
    const batch = householdsList.slice(i, i + hhBatchSize);
    const values = batch.map(h => 
      `(${escapeSql(h.id)}, ${escapeSql(h.code)}, ${escapeSql(h.owner_name)}, ${escapeSql(h.address)}, ${escapeSql(h.type)}, ${h.memberCount}, '10°56''08.0\"N 106°44''38.0\"E')`
    ).join(",\n  ");
    sqlStatements.push(`INSERT INTO public.households (id, code, owner_name, address, type, member_count, location) VALUES \n  ${values};`);
  }
  sqlStatements.push("\n");

  // 5. Generate SQL inserts for residents
  sqlStatements.push("-- 3. THÊM DỮ LIỆU NHÂN KHẨU");
  const resBatchSize = 100;
  for (let i = 0; i < residentsList.length; i += resBatchSize) {
    const batch = residentsList.slice(i, i + resBatchSize);
    const values = batch.map(r => 
      `(${escapeSql(r.id)}, ${escapeSql(r.name)}, ${escapeSql(r.dob)}, ${escapeSql(r.gender)}, ${escapeSql(r.idCard)}, ${escapeSql(r.phone)}, ${escapeSql(r.status)}, ${escapeSql(r.occupation)}, ${escapeSql(r.address)}, ${escapeSql(r.householdId)}, ${escapeSql(r.note)})`
    ).join(",\n  ");
    sqlStatements.push(`INSERT INTO public.residents (id, name, dob, gender, "idCard", phone, status, occupation, address, "householdId", note) VALUES \n  ${values};`);
  }

  // Write to Output SQL file
  fs.writeFileSync(sqlOutputPath, sqlStatements.join("\n"), 'utf8');

  console.log(`\n=== TẠO THÀNH CÔNG FILE SQL ===`);
  console.log(`Đường dẫn tệp SQL: ${sqlOutputPath}`);
  console.log(`Tổng số hộ khẩu: ${householdsList.length}`);
  console.log(`Tổng số cư dân: ${residentsList.length}`);
  console.log(`-> Bạn chỉ cần mở tệp này, sao chép toàn bộ nội dung và chạy trong phần 'SQL Editor' của Supabase Dashboard!`);
}

generateSql();
