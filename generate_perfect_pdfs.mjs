import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

// =============================================================================
// ISLAMIC FLAT COLOR PALETTE (PREMIUM & HARMONIOUS)
// =============================================================================
const PALETTE = {
  emeraldDark: [6, 78, 59],       // Deep Emerald #064e3b
  emeraldMedium: [5, 150, 105],   // Primary Green #059669
  emeraldLight: [209, 250, 229],  // Soft Mint Tint #d1fae5
  goldOchre: [180, 83, 9],        // Islamic Ochre Gold #b45309
  goldLight: [254, 243, 199],     // Warm Gold Cream #fef3c7
  goldBorder: [217, 119, 6],      // Golden Border #d97706
  navySlate: [15, 23, 42],        // Midnight Slate #0f172a
  textDark: [30, 41, 59],         // Slate Charcoal #1e293b
  textMuted: [100, 116, 139],     // Slate Gray #64748b
  bgCard: [248, 250, 252],        // Light Card #f8fafc
  borderCard: [226, 232, 240],    // Card Border #e2e8f0
  cyanAccent: [14, 116, 144]      // Ocean Cyan #0e7490
};

// =============================================================================
// DATA AKUN PENGAJAR (GURU MAPEL) - 29 ASATIDZ (ADMIN EXCLUDED)
// =============================================================================
const guruData = [
  { no: 1, name: 'Ust. Muhammad Abdul Malik Ibrahim, S.Kom', username: 'ustadz.abdul.malik', pass: 'guru123', mapel: 'Informatika & Komputer', kelas: 'Kelas VII Putra & VII Putri' },
  { no: 2, name: 'Ust. Umar Alamuddin, Lc., Al-Hafizh', username: 'ustadz.umar', pass: 'guru123', mapel: 'Aqidah', kelas: 'Kelas VII Putri & VIII Putri' },
  { no: 3, name: 'Ust. Dzulfikar Tri Baskara, S.Ag, M.Pd', username: 'ustadz.dzulfikar', pass: 'guru123', mapel: 'Bahasa Inggris', kelas: 'Kelas VIII Putra & IX Putra' },
  { no: 4, name: 'Ust. Nashiruddin Karim, Lc., Al-Hafizh', username: 'ustadz.karim', pass: 'guru123', mapel: 'Fiqih & Adab', kelas: 'Kelas VIII Putri & IX Putra' },
  { no: 5, name: 'Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh', username: 'ustadz.fredy', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'Kelas VIII Putra & IX Putra' },
  { no: 6, name: 'Ust. Muhammad Ilyas Abdullah', username: 'ustadz.ilyas', pass: 'guru123', mapel: 'Tai Chi (Beladiri)', kelas: 'Semua Kelas Putra (I\'dad, VII, VIII, IX)' },
  { no: 7, name: 'Usth. Aulia Anim Amanillah', username: 'ustadzah.anim', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'I\'dad Putri & Kelas VII Putri' },
  { no: 8, name: 'Ust. Sahmura Maulana al-Maghribi, S.Mat, M.Mat', username: 'ustadz.sahmura', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VII Putra' },
  { no: 9, name: 'Usth. Iffah Luthfiyah', username: 'ustadzah.iffah', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'Kelas VII Putri & VIII Putri' },
  { no: 10, name: 'Ust. Yunan Hidayat, Al Hafizh', username: 'ustadz.yunan', pass: 'guru123', mapel: 'Tajwid & Tilawah', kelas: 'I\'dad Putra, VII Putra, VIII Putra' },
  { no: 11, name: 'Ust. Faqih Hidayat, Lc', username: 'ustadz.faqih', pass: 'guru123', mapel: 'Aqidah', kelas: 'Kelas VII Putra & VIII Putra' },
  { no: 12, name: 'Usth. Indri Nur Bidari, S.Si', username: 'ustadzah.indri', pass: 'guru123', mapel: 'Bahasa Inggris', kelas: 'Kelas VIII Putri' },
  { no: 13, name: 'Ust. Aidil Aqli, S.Ag.', username: 'ustadz.aidil', pass: 'guru123', mapel: 'Akhlaq & Bahasa Indonesia', kelas: 'Kelas VII Putra & IX Putra' },
  { no: 14, name: 'Usth. Saiba Musyaiya', username: 'ustadzah.saiba.musyaiya', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'I\'dad Putri, VII Putri, VIII Putri' },
  { no: 15, name: 'Ust. M. Arya Mukti, S.Pd al-Hafizh', username: 'ustadz.arya', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'I\'dad Putra & Kelas IX Putra' },
  { no: 16, name: 'Ust. Abdul Kholif al-Hafizh', username: 'ustadz.kholif', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'Kelas VIII Putra' },
  { no: 17, name: 'Usth. Bela Dwi Lestari, S.Pd., Gr', username: 'ustadzah.bela', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VIII Putri' },
  { no: 18, name: 'Ust. Farhan Akhandi, S.Ag', username: 'ustadz.farhan', pass: 'guru123', mapel: 'Fiqih', kelas: 'Kelas IX Putra' },
  { no: 19, name: 'Ust. Tubagus Ahadiyat Rachmadi Luhur, S.Ag.', username: 'ustadz.tubagus', pass: 'guru123', mapel: 'Siroh Nabawiyyah', kelas: 'Kelas VIII Putra & IX Putra' },
  { no: 20, name: 'Ust. Muhammad Hafizh, S.Si', username: 'ustadz.hafizh', pass: 'guru123', mapel: 'IPA (Ilmu Pengetahuan Alam)', kelas: 'Kelas VIII Putra & IX Putra' },
  { no: 21, name: 'Usth. Rifanisa Nurulfitria, S.Hum., M.Si.', username: 'ustadzah.fani', pass: 'guru123', mapel: 'Siroh Nabawiyyah', kelas: 'Kelas VIII Putri' },
  { no: 22, name: 'Ust. Azri Robani Indra Robbi, S.Ag.', username: 'ustadz.azri', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'I\'dad Putra & Kelas VII Putra' },
  { no: 23, name: 'Usth. Extika Nur Fadhillah', username: 'ustadzah.dila', pass: 'guru123', mapel: 'Tajwid Al-Qur\'an', kelas: 'I\'dad Putri & Kelas VII Putri' },
  { no: 24, name: 'Usth. Azizah Nur Aini, S.Pd., Gr', username: 'ustadzah.azizah', pass: 'guru123', mapel: 'IPA (Ilmu Pengetahuan Alam)', kelas: 'Kelas VIII Putri' },
  { no: 25, name: 'Usth. Hasri Haryani Direja, S.Ds', username: 'ustadzah.hasri', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VII Putri' },
  { no: 26, name: 'Ust. Muhammad Latief Amiruddin, S.T.', username: 'ustadz.latief', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VIII Putra' },
  { no: 27, name: 'Ust. Akmal Firmana, ST', username: 'ustadz.akmal', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas IX Putra' },
  { no: 28, name: 'Usth. Lina Ayu Fitriyyah, S.Ag.', username: 'ustadzah.lina', pass: 'guru123', mapel: 'Akhlaq', kelas: 'Kelas VII Putri' },
  { no: 29, name: 'Ust. Rezkidar', username: 'ustadz.rezkidar', pass: 'guru123', mapel: 'Fiqih', kelas: 'Kelas VIII Putra' },
  { no: 30, name: 'Ust. Abdullah Kristianto, S.Sos.', username: 'ustadz.abdullah', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'I\'dad Putra & Kelas VII Putra' }
];

// =============================================================================
// DATA AKUN WALI KELAS (HOMEROOM TEACHERS) - 7 KELAS
// =============================================================================
const waliData = [
  { no: 1, kelas: 'I\'dad Putra', level: 'I\'dad', wali: 'Ust. Abdullah Kristianto, S.Sos.', username: 'wali.abdullah', pass: 'wali123' },
  { no: 2, kelas: 'I\'dad Putri', level: 'I\'dad', wali: 'Usth. Hasna Halimatun Basyaria, S.Ag.', username: 'wali.hasna', pass: 'wali123' },
  { no: 3, kelas: 'Kelas VII Putra', level: 'Wustho', wali: 'Ust. Aidil Aqli, S.Ag.', username: 'wali.aidil', pass: 'wali123' },
  { no: 4, kelas: 'Kelas VII Putri', level: 'Wustho', wali: 'Usth. Lina Ayu Fitriyyah, S.Ag.', username: 'wali.lina', pass: 'wali123' },
  { no: 5, kelas: 'Kelas VIII Putra', level: 'Wustho', wali: 'Ust. Fredy Susilo Supriyanto, S.Ag.', username: 'wali.fredy', pass: 'wali123' },
  { no: 6, kelas: 'Kelas VIII Putri', level: 'Wustho', wali: 'Usth. Hasna Halimatun Basyaria, S.Ag.', username: 'wali.hasna', pass: 'wali123' },
  { no: 7, kelas: 'Kelas IX Putra', level: 'Wustho', wali: 'Ust. Muhammad Latief Amiruddin, S.T.', username: 'wali.latief', pass: 'wali123' }
];

// =============================================================================
// HELPER: OFFICIAL ISLAMIC FLAT KOP SURAT (TANPA LOGO GAMBAR)
// =============================================================================
function drawOfficialIslamicKop(doc, titleText, subtitleText) {
  // Top Banner Background
  doc.setFillColor(...PALETTE.emeraldDark);
  doc.rect(0, 0, 210, 29, 'F');

  // Gold Top Border Line
  doc.setFillColor(...PALETTE.goldOchre);
  doc.rect(0, 0, 210, 2.5, 'F');

  // Header Typography
  doc.setTextColor(...PALETTE.goldLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 7.5, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.emeraldLight);
  doc.text("SISTEM INFORMASI RPP & AKADEMIK (SIM RPP & AKADEMIK)", 105, 20, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Pakel, Gerdu, Karangpandan, Kabupaten Karanganyar, Jawa Tengah 57791", 105, 24.5, { align: 'center' });

  // Double Decorative Separator Line
  doc.setDrawColor(...PALETTE.goldBorder);
  doc.setLineWidth(0.8);
  doc.line(10, 31, 200, 31);

  doc.setDrawColor(...PALETTE.emeraldMedium);
  doc.setLineWidth(0.3);
  doc.line(10, 32.5, 200, 32.5);

  // Document Title Card
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(10, 36, 190, 16, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.5);
  doc.roundedRect(10, 36, 190, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text(titleText.toUpperCase(), 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(subtitleText, 105, 48.5, { align: 'center' });
}

// =============================================================================
// 1. GENERATE DAFTAR AKUN PENGAJAR & WALI KELAS PDF
// =============================================================================
export function createDaftarAkunPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawOfficialIslamicKop(
    doc,
    "DAFTAR AKUN & KREDENSIAL LOGIN PENGAJAR DAN WALI KELAS",
    "Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev"
  );

  // Section Header: Tabel Pengajar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("A. DAFTAR AKUN PENGAJAR (GURU MATA PELAJARAN)", 10, 57);

  const guruRows = guruData.map(g => [
    g.no.toString(),
    g.name,
    g.username,
    g.pass,
    g.mapel,
    g.kelas
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['No', 'Nama Ustadz / Ustadzah', 'Username Login', 'Kata Sandi', 'Mata Pelajaran', 'Kelas Mengajar']],
    body: guruRows,
    theme: 'grid',
    headStyles: {
      fillColor: PALETTE.emeraldDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: PALETTE.textDark,
      valign: 'middle',
      cellPadding: 1.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 48 },
      2: { fontStyle: 'bold', textColor: PALETTE.cyanAccent, cellWidth: 35 },
      3: { halign: 'center', fontStyle: 'bold', textColor: PALETTE.goldOchre, cellWidth: 19 },
      4: { cellWidth: 38 },
      5: { cellWidth: 43 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 10, right: 10, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.2);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Kredensial Resmi Markaz Al-Qur'an dan Bahasa Arab Isy Karima · Halaman ${data.pageNumber} dari ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }
  });

  // Table 2: Wali Kelas
  let curY = doc.lastAutoTable.finalY + 6;
  if (curY > 210) {
    doc.addPage();
    drawOfficialIslamicKop(
      doc,
      "DAFTAR AKUN WALI KELAS & PETUNJUK AKSES",
      "Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev"
    );
    curY = 58;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("B. DAFTAR AKUN WALI KELAS (HOMEROOM TEACHERS)", 10, curY);

  const waliRows = waliData.map(w => [
    w.no.toString(),
    w.kelas,
    w.wali,
    w.username,
    w.pass,
    w.level
  ]);

  autoTable(doc, {
    startY: curY + 3,
    head: [['No', 'Kelas Binaan', 'Nama Wali Kelas (Ustadz / Ustadzah)', 'Username Login Wali', 'Kata Sandi', 'Tingkat']],
    body: waliRows,
    theme: 'grid',
    headStyles: {
      fillColor: PALETTE.goldOchre,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: PALETTE.textDark,
      valign: 'middle',
      cellPadding: 1.4
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', halign: 'center', cellWidth: 32 },
      2: { fontStyle: 'bold', cellWidth: 62 },
      3: { fontStyle: 'bold', textColor: PALETTE.emeraldMedium, cellWidth: 38 },
      4: { halign: 'center', fontStyle: 'bold', textColor: PALETTE.goldOchre, cellWidth: 25 },
      5: { halign: 'center', cellWidth: 26 }
    },
    alternateRowStyles: {
      fillColor: [254, 252, 246]
    },
    margin: { left: 10, right: 10, bottom: 20 }
  });

  // Petunjuk & Tanda Tangan
  const finalY = doc.lastAutoTable.finalY + 5;
  if (finalY < 245) {
    doc.setFillColor(254, 252, 246);
    doc.roundedRect(10, finalY, 190, 32, 2, 2, 'F');
    doc.setDrawColor(...PALETTE.goldBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, finalY, 190, 32, 2, 2, 'D');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PALETTE.emeraldDark);
    doc.text('Petunjuk Penggunaan & Keamanan Akun:', 14, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.textDark);
    doc.text('1. Buka browser (Chrome / Safari / Edge) dan akses alamat: https://akademikmqbaisykarima.pages.dev', 14, finalY + 10.5);
    doc.text('2. Pilih Tab "Pengajar" bagi guru mata pelajaran atau Tab "Wali Kelas" bagi tugas wali kelas binaan.', 14, finalY + 15);
    doc.text('3. Masukkan Username / ID Login dan Kata Sandi Default sebagaimana tercantum pada tabel di atas.', 14, finalY + 19.5);
    doc.text('4. Demi keamanan, setiap Asatidz dapat memperbarui kata sandi pribadi sewaktu-waktu di menu Profil Saya.', 14, finalY + 24);

    // Signature Area
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.navySlate);
    doc.text('Karanganyar, 26 Agustus 2026', 148, finalY + 6);
    doc.text('Kepala Kurikulum MQBA Isy Karima,', 148, finalY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.emeraldDark);
    doc.text('Ust. Aidil Aqli, S.Ag.', 148, finalY + 26);
  }

  const buf = doc.output('arraybuffer');
  fs.writeFileSync('daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  fs.writeFileSync('public/daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  console.log('✅ Berhasil membuat file: daftar_akun_pengajar_dan_wali_kelas_mqba.pdf');
}

// =============================================================================
// 2. GENERATE BUKU PANDUAN & PENGENALAN FITUR APLIKASI PDF (4 HALAMAN LENGKAP)
// =============================================================================
export function createBukuPanduanPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // ---------------------------------------------------------------------------
  // HALAMAN 1: COVER, MUKADDIMAH & BAB I (LOGIN)
  // ---------------------------------------------------------------------------
  // Header Banner
  doc.setFillColor(...PALETTE.emeraldDark);
  doc.rect(0, 0, 210, 72, 'F');
  doc.setFillColor(...PALETTE.goldOchre);
  doc.rect(0, 0, 210, 3, 'F');

  // Header Title
  doc.setTextColor(...PALETTE.goldLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 14, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 24, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(...PALETTE.goldLight);
  doc.text("BUKU PANDUAN PENGGUNAAN SISTEM INFORMASI AKADEMIK", 105, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.emeraldLight);
  doc.text("Panduan Lengkap & Pengenalan Fitur untuk Ustadz/Ustadzah Pengajar & Wali Kelas", 105, 41, { align: 'center' });
  doc.text("Tahun Ajaran 2025/2026 · Alamat Portal: https://akademikmqbaisykarima.pages.dev", 105, 48, { align: 'center' });

  doc.setFillColor(...PALETTE.goldBorder);
  doc.rect(0, 70, 210, 2, 'F');

  // Mukaddimah Box
  let y = 80;
  doc.setFillColor(254, 252, 246);
  doc.roundedRect(12, y, 186, 44, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.goldBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 44, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("KATA PENGANTAR (MUKADDIMAH)", 18, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  doc.text("Assalamu’alaikum Warahmatullahi Wabarakatuh,", 18, y + 13.5);

  const intro = "Segala puji dan syukur kita panjatkan ke hadirat Allah Subhanahu wa Ta'ala yang telah mengamanahkan kepada kita tugas mulia mendidik para penghafal Al-Qur'an dan penuntut ilmu syar'i. Sholawat dan salam senantiasa tercurah kepada Baginda Nabi Muhammad Shallallahu 'Alaihi wa Sallam. Buku panduan ini disusun dengan bahasa yang ringkas, bersahabat, dan terstruktur guna mempermudah Asatidz dan Asatidzah dalam mengoperasikan seluruh fitur SIM RPP & Akademik Markaz Al-Qur'an dan Bahasa Arab Isy Karima.";
  doc.text(doc.splitTextToSize(intro, 174), 18, y + 19);

  // BAB I: AKSES & LOGIN
  y = 132;
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(12, y, 186, 76, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 76, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("BAB I. PANDUAN MEMULAI & LOGIN SISTEM", 18, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);

  const bab1 = [
    "1. Membuka Portal Aplikasi:",
    "   Buka browser di HP atau Komputer/Laptop (disarankan Google Chrome / Safari / Edge), lalu kunjungi:",
    "   https://akademikmqbaisykarima.pages.dev",
    "2. Memilih Tab Login yang Tepat:",
    "   • Tab 'Pengajar'  : Khusus saat Ustadz/Ustadzah login untuk membuat RPP, Presensi Mengajar, Input Nilai & Evaluasi Mapel.",
    "   • Tab 'Wali Kelas': Khusus bagi Ustadz/Ustadzah yang bertugas membina kelas santri (monitoring santri, rapor & evaluasi kelas).",
    "3. Memasukkan Kredensial Resmi:",
    "   • Gunakan Username resmi (misal: ustadz.abdullah atau wali.abdullah) serta Kata Sandi default: guru123 / wali123.",
    "4. Pengaturan Profil & Ganti Kata Sandi:",
    "   • Setelah berhasil masuk, klik ikon 'Profil' di pojok kanan atas untuk memperbarui kata sandi pribadi demi kenyamanan."
  ];

  let offY = 14;
  bab1.forEach(b => {
    doc.text(b, 18, y + offY);
    offY += 5.5;
  });

  // Footer Page 1
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 1 dari 3", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 2: BAB II. FITUR UTAMA PENGAJAR (RPP, AI, PRESENSI GURU & SANTRI)
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawOfficialIslamicKop(
    doc,
    "BAB II. PANDUAN FITUR PENGAJAR (GURU MATA PELAJARAN)",
    "Penyusunan RPP Kurikulum Merdeka, Bantuan AI, Presensi Mandiri & Presensi Santri"
  );

  y = 56;

  // Fitur 1 & 2 Box
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(12, y, 186, 74, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 74, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("1. Dashboard Pengajar & Jadwal Mengajar Harian", 18, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  doc.text("Menampilkan ringkasan jam mengajar mingguan, kelas binaan, daftar mata pelajaran yang diampu, serta status keterlaksanaan KBM harian secara otomatis dan real-time.", 22, y + 13, { maxWidth: 170 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("2. Penyusunan RPP Kurikulum Merdeka & Generator AI MQBA", 18, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  const rppText = "Ustadz/Ustadzah dapat menyusun RPP (Rencana Pelaksanaan Pembelajaran) dengan dua metode mudah:\n• Cara Mandiri: Mengisi Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Langkah Pembelajaran Berdiferensiasi, serta Rubrik Asesmen.\n• Generator AI Cerdas MQBA: Cukup pilih Mata Pelajaran, Kelas, dan Topik Materi, lalu klik tombol 'Generate dengan AI'. Sistem akan menyusun draf RPP lengkap dan siap disimpan, dicetak, maupun diunduh dalam format PDF resmi.";
  doc.text(doc.splitTextToSize(rppText, 172), 22, y + 31.5);

  // Fitur 3 & 4 Box
  y = 136;
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(12, y, 186, 78, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 78, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("3. Presensi Kehadiran Guru (Presensi Mengajar Mandiri)", 18, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  const presGuru = "Digunakan saat Ustadz/Ustadzah hadir mengajar di halaqah/kelas. Pengajar dapat memilih status (Hadir, Izin, Sakit, atau Tugas). Pemilihan tanggal semakin praktis dengan 3 Dropdown Interaktif (Tanggal 1-31, Bulan, Tahun) serta tombol cepat 'Hari Ini' dan 'Kemarin'. Ustadz/Ustadzah juga dapat mengunggah foto dokumentasi kegiatan KBM.";
  doc.text(doc.splitTextToSize(presGuru, 172), 22, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("4. Presensi Santri Per Pertemuan KBM", 18, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  const presSantri = "Setiap kali masuk ke kelas, pengajar dapat langsung mencatat presensi santri. Pilih Jadwal KBM, tanggal, dan topik materi yang diajarkan. Secara default seluruh santri berstatus 'Hadir' sehingga pengajar cukup mengganti santri yang Sakit, Izin, atau Alfa. Rekapitulasi presensi langsung tersimpan dan terhubung ke laporan wali kelas.";
  doc.text(doc.splitTextToSize(presSantri, 172), 22, y + 43.5);

  // Tips Card on Page 2
  y = 220;
  doc.setFillColor(254, 252, 246);
  doc.roundedRect(12, y, 186, 58, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.goldBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 58, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.goldOchre);
  doc.text("TIPS PRAKTIS PENGELOLAAN KBM UNTUK USTADZ & USTADZAH:", 18, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(...PALETTE.textDark);
  const tips = [
    "1. Lakukan presensi santri saat KBM berlangsung agar data kehadiran santri selalu terbarui (up-to-date).",
    "2. Manfaatkan Generator AI RPP untuk memperkaya ide aktivitas pembelajaran aktif dan variatif bagi santri.",
    "3. Catat topik materi di setiap pertemuan KBM sebagai rekam jejak jurnal mengajar yang rapi dan terdokumentasi.",
    "4. Apabila berhalangan hadir karena uzur syar'i atau tugas pondok, segera catat status izin/tugas di presensi guru."
  ];
  let tipY = 14;
  tips.forEach(t => {
    doc.text(t, 18, y + tipY);
    tipY += 8.5;
  });

  // Footer Page 2
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 2 dari 3", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 3: FITUR PENGAJAR (NILAI & EVALUASI), FITUR WALI KELAS & PENUTUP
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawOfficialIslamicKop(
    doc,
    "BAB II (LANJUTAN), BAB III (WALI KELAS) & BAB IV (PENUTUP)",
    "Pengelolaan Nilai, Evaluasi Guru (Bulanan/Semester/Tahunan) & Fitur Wali Kelas"
  );

  y = 56;

  // Nilai & Evaluasi Box
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(12, y, 186, 70, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 70, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("5. Pengelolaan & Input Nilai Santri (Formatif, Sumatif, PTS, PAS)", 18, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  const nilaiText = "Memudahkan asatidz merekap capaian santri: Nilai Formatif (tugas, hafalan, kuis), Nilai Sumatif (ulangan materi TP), Nilai PTS, dan Nilai PAS. Nilai akhir rapor dihitung otomatis berdasarkan bobot kurikulum.";
  doc.text(doc.splitTextToSize(nilaiText, 172), 22, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("6. Evaluasi Pembelajaran Guru (Bulanan, Semester, dan Tahunan)", 18, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.textDark);
  const evalText = "Sebagai sarana muhasabah mutu pembelajaran berbasis 8 Dimensi Kurikulum Merdeka:\n• Evaluasi Bulanan  : Laporan KBM, capaian TP, asesmen, kendala & rencana tindak lanjut bulanan.\n• Evaluasi Semester : Evaluasi capaian satu semester (Ganjil/Genap) dan persiapan semester depan.\n• Evaluasi Tahunan  : Refleksi akhir tahun ajaran untuk usulan perbaikan kurikulum ke depan.\nSeluruh data evaluasi dapat dicetak fisik maupun diunduh sebagai file PDF resmi.";
  doc.text(doc.splitTextToSize(evalText, 172), 22, y + 35.5);

  // BAB III Fitur Wali Kelas
  y = 132;
  doc.setFillColor(...PALETTE.bgCard);
  doc.roundedRect(12, y, 186, 68, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.borderCard);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 68, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("BAB III. PANDUAN FITUR KHUSUS WALI KELAS", 18, y + 7.5);

  const waliPoints = [
    { title: "1. Data Santri & Kontak Wali:", desc: "Memantau profil santri, kontak darurat wali santri, dan rekam jejak akademik kelas binaan." },
    { title: "2. Rekapitulasi Presensi Kelas:", desc: "Melihat akumulasi kehadiran santri (Hadir, Sakit, Izin, Alfa) dari seluruh mapel yang diikuti." },
    { title: "3. Catatan Evaluasi Wali Kelas:", desc: "Mencatat perkembangan adab, ibadah harian, kedisiplinan, serta bimbingan konseling santri." },
    { title: "4. Monitoring Nilai & Rapor Santri:", desc: "Memantau keterisian nilai guru mapel dan mencetak lembar Rapor Santri MQBA resmi." }
  ];

  let wY = 14;
  waliPoints.forEach(wp => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...PALETTE.cyanAccent);
    doc.text(wp.title, 18, y + wY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PALETTE.textDark);
    doc.text(wp.desc, 68, y + wY, { maxWidth: 126 });
    wY += 12;
  });

  // BAB IV Penutup & Signature
  y = 206;
  doc.setFillColor(254, 252, 246);
  doc.roundedRect(12, y, 186, 68, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.goldBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, y, 186, 68, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text("BAB IV. PENUTUP & LAYANAN BANTUAN TEKNIS", 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(...PALETTE.textDark);
  const closing = "Semoga buku panduan ini memberikan kemudahan bagi segenap Asatidz dan Asatidzah dalam menjalankan amanah mulia di Markaz Al-Qur'an dan Bahasa Arab Isy Karima. Apabila mendapati kendala teknis dalam penggunaan aplikasi, silakan menghubungi Tim Kurikulum & IT MQBA.\n\nSemoga jerih payah kita dicatat sebagai amal jariyah yang penuh berkah di sisi Allah Subhanahu wa Ta'ala. Aamiin.";
  doc.text(doc.splitTextToSize(closing, 172), 18, y + 13);

  // Signature Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.navySlate);
  doc.text('Karanganyar, 26 Agustus 2026', 148, y + 36);
  doc.text('Kepala Kurikulum MQBA Isy Karima,', 148, y + 40.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.emeraldDark);
  doc.text('Ust. Aidil Aqli, S.Ag.', 148, y + 58);

  // Footer Page 3
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 3 dari 3", 105, 290, { align: 'center' });

  const buf = doc.output('arraybuffer');
  fs.writeFileSync('buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  fs.writeFileSync('public/buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  console.log('✅ Berhasil membuat file: buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================
console.log('--- GENERATING PERFECT ISLAMIC FLAT PDFS ---');
createDaftarAkunPdf();
createBukuPanduanPdf();
console.log('--- ALL PERFECT PDFS GENERATED SUCCESSFULLY ---');
