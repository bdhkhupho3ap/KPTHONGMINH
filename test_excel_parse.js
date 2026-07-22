import XLSX from 'xlsx';

const excelPath = 'C:\\Users\\KHUPHO3\\Desktop\\ds072026.xlsx';

const parseExcelDate = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{5}$/.test(str)) {
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

try {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Tạm trú'];
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  console.log("Total rows in JSON (Tạm trú):", jsonData.length);
  
  const mapped = jsonData.map((row, idx) => {
    const findVal = (keys) => {
      const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "");
      const foundKey = Object.keys(row).find(k => 
        keys.some(key => normalize(k) === normalize(key))
      );
      return foundKey ? String(row[foundKey]).trim() : "";
    };

    const fullName = findVal(["Họ và Tên", "Ho va Ten", "fullName", "Họ tên", "Ho ten", "Tên", "Ten"]);
    const cccd = findVal(["Số ĐDCN/CCCD/\r\nCMND", "Số ĐDCN/CCCD/CMND", "Số CCCD", "So CCCD", "cccd", "CMND", "Số định danh", "So dinh danh"]);
    
    const isValid = !!fullName && !!cccd;
    
    return {
      fullName,
      cccd,
      isValid,
      rowNumber: idx + 2
    };
  });
  
  const valid = mapped.filter(r => r.isValid);
  const invalid = mapped.filter(r => !r.isValid);
  
  console.log("Valid rows:", valid.length);
  console.log("Invalid rows:", invalid.length);
  if (invalid.length > 0) {
    console.log("Sample invalid rows (first 5):", invalid.slice(0, 5));
  }
} catch (err) {
  console.error(err);
}
