import * as XLSX from 'xlsx';

/**
 * Mengekspor array objek (JSON) ke file Excel (.xlsx)
 * @param data Array objek yang berisi data baris (key sebagai nama kolom)
 * @param fileName Nama file Excel yang akan diunduh (tanpa ekstensi .xlsx)
 */
export function exportToExcel(data: any[], fileName: string) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  // 1. Buat worksheet dari array objek JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Buat workbook baru dan tambahkan worksheet ke dalamnya
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // 3. Simpan (unduh) file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
