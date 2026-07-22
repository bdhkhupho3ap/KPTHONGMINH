import XLSX from 'xlsx';
import path from 'path';

const excelPath = 'C:\\Users\\KHUPHO3\\Desktop\\ds072026.xlsx';

try {
  console.log("Reading workbook...");
  const workbook = XLSX.readFile(excelPath);
  console.log("SheetNames:", workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Sheet "${sheetName}" total rows:`, rows.length);
    if (rows.length > 0) {
      console.log("Headers:", Object.keys(rows[0]));
      console.log("First Row Sample:", rows[0]);
    }
  });
} catch (err) {
  console.error("Error:", err);
}
