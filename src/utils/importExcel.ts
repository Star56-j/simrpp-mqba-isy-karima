import * as XLSX from 'xlsx';

/**
 * Parses an Excel file and returns an array of JSON objects representing the rows.
 * The first row is assumed to be the header row.
 */
export async function parseExcelFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File empty or failed to read.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert the sheet to an array of objects
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(new Error("Gagal mem-parsing file Excel. Pastikan format benar."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file."));
    };

    reader.readAsBinaryString(file);
  });
}
