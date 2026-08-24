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

/**
 * Mengekspor Rekap Kehadiran Asatidz & Ustazah ke file Excel (.xlsx)
 * dengan format grouped header (Kehadiran: H, S, I, A | Total JP Wajib | % Hadir)
 * serta kolom Mata Pelajaran yang Diampu.
 */
export function exportRekapGuruExcel(summary: any[], periodTitle: string, fileName: string) {
  if (!summary || summary.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const rows: any[][] = [
    [`REKAPITULASI KEHADIRAN ASATIDZAH & USTADZAT - ${periodTitle.toUpperCase()}`],
    ['MARKAZ AL QUR\'AN DAN BAHASA ARAB ISY KARIMA'],
    [],
    ['No', 'Nama Asatidz / Ustazah', 'Mata Pelajaran yang Diampu', 'Kehadiran', '', '', '', 'Total JP Wajib', 'Total Kehadiran', '% Hadir'],
    ['', '', '', 'H', 'S', 'I', 'A', '', '', '']
  ];

  summary.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.teacherName || r.name || 'Pengajar',
      r.subjectsTaught || r.subjectName || 'Pengajar MQBA',
      r.hadir || 0,
      r.sakit || 0,
      r.izin || 0,
      r.alpha || 0,
      r.total || (r.hadir + r.sakit + r.izin + r.alpha) || 0,
      r.hadir || 0,
      `${r.persentaseHadir || 0}%`
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Merge header cells:
  // Row 0: A1:J1 (Title)
  // Row 1: A2:J2 (Subtitle)
  // Row 3 & 4 (Header grouped):
  // No: A4:A5
  // Nama: B4:B5
  // Mapel: C4:C5
  // Kehadiran: D4:G4
  // Total JP Wajib: H4:H5
  // Total Kehadiran: I4:I5
  // % Hadir: J4:J5
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } }
  ];

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 40 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kehadiran Guru');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Mengekspor Rekap Kehadiran Santri ke file Excel (.xlsx)
 * dengan format grouped header (Kehadiran: H, S, I, A | Total Hari | % Hadir)
 */
export function exportRekapSantriExcel(summary: any[], periodTitle: string, fileName: string) {
  if (!summary || summary.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const rows: any[][] = [
    [`REKAPITULASI KEHADIRAN SANTRI - ${periodTitle.toUpperCase()}`],
    ['MARKAZ AL QUR\'AN DAN BAHASA ARAB ISY KARIMA'],
    [],
    ['No', 'Nama Santri / Kelas', 'NIS / Kelas', 'Kehadiran', '', '', '', 'Total Hari', '% Hadir'],
    ['', '', '', 'H', 'S', 'I', 'A', '', '']
  ];

  summary.forEach((r, idx) => {
    rows.push([
      idx + 1,
      r.santriName || r.className || r.name || 'Santri',
      r.nis || r.classId || '-',
      r.hadir || 0,
      r.sakit || 0,
      r.izin || 0,
      r.alpha || 0,
      r.total || (r.hadir + r.sakit + r.izin + r.alpha) || 0,
      `${r.persentaseHadir !== undefined ? r.persentaseHadir : (r.rataHadir !== undefined ? r.rataHadir : 0)}%`
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kehadiran Santri');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

