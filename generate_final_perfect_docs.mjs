import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// =============================================================================
// TEMA WARNA PERSIS SESUAI APLIKASI WEB (OCEAN SKY & ISLAMIC AMBER GOLD)
// =============================================================================
const PALETTE = {
  oceanDeep: [12, 74, 110],       // #0c4a6e - Header utama web
  skyPrimary: [3, 105, 161],      // #0369a1 - Warna biru utama aplikasi
  skyBright: [2, 132, 199],       // #0284c7 - Tombol & fokus interaktif
  skyLight: [224, 242, 254],      // #e0f2fe - Aksen background lembut
  skyIceBg: [240, 249, 255],      // #f0f9ff - Background halaman web
  goldAmber: [217, 119, 6],       // #d97706 - Aksen emas/amber islami
  goldWarmBg: [254, 243, 199],    // #fef3c7 - Highlight emas lembut
  goldDeep: [180, 83, 9],         // #b45309 - Border emas tegas
  slateDark: [15, 23, 42],        // #0f172a - Teks judul charcoal
  textBody: [30, 41, 59],         // #1e293b - Teks isi rapi & jelas
  textMuted: [100, 116, 139],     // #64748b - Teks keterangan/subjudul
  cardBorder: [203, 213, 225],    // #cbd5e1 - Border card
  cardBg: [255, 255, 255]         // #ffffff - Card putih bersih
};

// Helper: load base64 from docs_screenshots_processed
function getFramedImage(filename) {
  const fullPath = path.join('docs_screenshots_processed', filename);
  if (fs.existsSync(fullPath)) {
    const buffer = fs.readFileSync(fullPath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }
  return null;
}

// Pre-load all polished framed images
const imgLogin = getFramedImage('01_login.png');
const imgDashboardGuru = getFramedImage('02_dashboard.png');
const imgRpp = getFramedImage('03_rpp.png');
const imgAbsensiGuru = getFramedImage('04_absensi_guru.png');
const imgAbsensiSantri = getFramedImage('05_absensi_santri.png');
const imgNilai = getFramedImage('06_nilai.png');
const imgEvaluasi = getFramedImage('07_evaluasi.png');
const imgRekapRapor = getFramedImage('08_rekap_rapor.png');

// =============================================================================
// DATA AKUN PENGAJAR (GURU MAPEL) - 30 ASATIDZ (ADMIN DIKECUALIKAN)
// =============================================================================
const guruData = [
  { no: 1, name: 'Ust. Muhammad Abdul Malik Ibrahim, S.Kom', username: 'ustadz.abdul.malik', pass: 'guru123', mapel: 'Khot', kelas: 'Kelas VII Putra & Kelas VII Putri' },
  { no: 2, name: 'Ust. Umar Alamuddin, Lc., Al-Hafizh', username: 'ustadz.umar', pass: 'guru123', mapel: 'Aqidah', kelas: 'Kelas VII Putri & Kelas VIII Putri' },
  { no: 3, name: 'Ust. Dzulfikar Tri Baskara, S.Ag, M.Pd', username: 'ustadz.dzulfikar', pass: 'guru123', mapel: 'Bahasa Inggris', kelas: 'Kelas VIII Putra & Kelas IX Putra' },
  { no: 4, name: 'Ust. Nashiruddin Karim, Lc., Al-Hafizh', username: 'ustadz.karim', pass: 'guru123', mapel: 'Fiqih & Adab', kelas: 'Kelas VIII Putri & Kelas IX Putra' },
  { no: 5, name: 'Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh', username: 'ustadz.fredy', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'Kelas VIII Putra & Kelas IX Putra' },
  { no: 6, name: 'Ust. Muhammad Ilyas Abdullah', username: 'ustadz.ilyas', pass: 'guru123', mapel: 'Tai Chi (Beladiri)', kelas: 'Semua Kelas Putra (I\'dad, VII, VIII, IX)' },
  { no: 7, name: 'Usth. Aulia Anim Amanillah', username: 'ustadzah.anim', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'I\'dad Putri & Kelas VII Putri' },
  { no: 8, name: 'Ust. Sahmura Maulana al-Maghribi, S.Mat, M.Mat', username: 'ustadz.sahmura', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VII Putra' },
  { no: 9, name: 'Usth. Iffah Luthfiyah', username: 'ustadzah.iffah', pass: 'guru123', mapel: 'ABY (Al-Arabiyyah Baina Yadaik)', kelas: 'Kelas VII Putri & Kelas VIII Putri' },
  { no: 10, name: 'Ust. Yunan Hidayat, Al Hafizh', username: 'ustadz.yunan', pass: 'guru123', mapel: 'Tajwid & Tilawah', kelas: 'I\'dad Putra, VII Putra, VIII Putra' },
  { no: 11, name: 'Ust. Faqih Hidayat, Lc', username: 'ustadz.faqih', pass: 'guru123', mapel: 'Aqidah', kelas: 'Kelas VII Putra & Kelas VIII Putra' },
  { no: 12, name: 'Usth. Indri Nur Bidari, S.Si', username: 'ustadzah.indri', pass: 'guru123', mapel: 'Bahasa Inggris', kelas: 'Kelas VIII Putri' },
  { no: 13, name: 'Ust. Aidil Aqli, S.Ag.', username: 'ustadz.aidil', pass: 'guru123', mapel: 'Akhlaq & Bahasa Indonesia', kelas: 'Kelas VII Putra & IX Putra' },
  { no: 14, name: 'Usth. Saiba Musyaiya', username: 'ustadzah.saiba.musyaiya', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'I\'dad Putri, VII Putri, VIII Putri' },
  { no: 15, name: 'Ust. M. Arya Mukti, S.Pd al-Hafizh', username: 'ustadz.arya', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'I\'dad Putra & Kelas IX Putra' },
  { no: 16, name: 'Ust. Abdul Kholif al-Hafizh', username: 'ustadz.kholif', pass: 'guru123', mapel: 'Tahsin Al-Qur\'an', kelas: 'Kelas VIII Putra' },
  { no: 17, name: 'Usth. Bela Dwi Lestari, S.Pd., Gr', username: 'ustadzah.bela', pass: 'guru123', mapel: 'Matematika', kelas: 'Kelas VIII Putri' },
  { no: 18, name: 'Ust. Farhan Akhandi, S.Ag', username: 'ustadz.farhan', pass: 'guru123', mapel: 'Fiqih', kelas: 'Kelas IX Putra' },
  { no: 19, name: 'Ust. Tubagus Ahadiyat Rachmadi Luhur, S.Ag.', username: 'ustadz.tubagus', pass: 'guru123', mapel: 'Siroh Nabawiyyah', kelas: 'Kelas VIII Putra & Kelas IX Putra' },
  { no: 20, name: 'Ust. Muhammad Hafizh, S.Si', username: 'ustadz.hafizh', pass: 'guru123', mapel: 'IPA (Ilmu Pengetahuan Alam)', kelas: 'Kelas VIII Putra & Kelas IX Putra' },
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
// DATA AKUN WALI KELAS (HOMEROOM TEACHERS) - 7 KELAS LENGKAP
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
// HELPER: OFFICIAL ISLAMIC OCEAN BLUE KOP SURAT (SESUAI TEMA WEBSITE)
// =============================================================================
function drawWebThemeKop(doc, titleText, subtitleText) {
  // Top Banner (Ocean Deep Gradient Look)
  doc.setFillColor(...PALETTE.oceanDeep);
  doc.rect(0, 0, 210, 28, 'F');

  // Gold Top Border Line
  doc.setFillColor(...PALETTE.goldAmber);
  doc.rect(0, 0, 210, 2.5, 'F');

  // Bismillah
  doc.setTextColor(...PALETTE.goldWarmBg);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 7.5, { align: 'center' });

  // Institute Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12.5);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 14, { align: 'center' });

  // System Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.skyLight);
  doc.text("SISTEM INFORMASI RPP & AKADEMIK (SIM RPP & AKADEMIK)", 105, 19.5, { align: 'center' });

  // Address
  doc.setFontSize(7.2);
  doc.setTextColor(186, 230, 253);
  doc.text("Pakel, Gerdu, Karangpandan, Kabupaten Karanganyar, Jawa Tengah 57791", 105, 24, { align: 'center' });

  // Dual Decorative Separator
  doc.setDrawColor(...PALETTE.goldAmber);
  doc.setLineWidth(0.8);
  doc.line(10, 30, 200, 30);

  doc.setDrawColor(...PALETTE.skyBright);
  doc.setLineWidth(0.3);
  doc.line(10, 31.5, 200, 31.5);

  // Title Box (Soft Ice Sky Card)
  doc.setFillColor(...PALETTE.skyIceBg);
  doc.roundedRect(10, 35, 190, 15, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(10, 35, 190, 15, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text(titleText.toUpperCase(), 105, 41.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.textMuted);
  doc.text(subtitleText, 105, 46.5, { align: 'center' });
}

// =============================================================================
// 1. GENERATE DAFTAR AKUN PENGAJAR & WALI KELAS PDF
// =============================================================================
function generateDaftarAkunPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawWebThemeKop(
    doc,
    "DAFTAR AKUN & KREDENSIAL LOGIN PENGAJAR DAN WALI KELAS",
    "Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev · Tahun Ajaran 2025/2026"
  );

  // Section Header: Pengajar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("A. DAFTAR AKUN PENGAJAR (GURU MATA PELAJARAN)", 10, 55);

  const guruRows = guruData.map(g => [
    g.no.toString(),
    g.name,
    g.username,
    g.pass,
    g.mapel,
    g.kelas
  ]);

  autoTable(doc, {
    startY: 57,
    head: [['No', 'Nama Ustadz / Ustadzah', 'Username Login', 'Kata Sandi', 'Mata Pelajaran', 'Kelas Mengajar']],
    body: guruRows,
    theme: 'grid',
    headStyles: {
      fillColor: PALETTE.oceanDeep,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: PALETTE.textBody,
      valign: 'middle',
      cellPadding: 1.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 48 },
      2: { fontStyle: 'bold', textColor: PALETTE.skyPrimary, cellWidth: 35 },
      3: { halign: 'center', fontStyle: 'bold', textColor: PALETTE.goldDeep, cellWidth: 19 },
      4: { cellWidth: 38 },
      5: { cellWidth: 43 }
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255]
    },
    margin: { left: 10, right: 10, bottom: 18 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
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
  let curY = doc.lastAutoTable.finalY + 5;
  if (curY > 215) {
    doc.addPage();
    drawWebThemeKop(
      doc,
      "DAFTAR AKUN WALI KELAS & PETUNJUK AKSES",
      "Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev"
    );
    curY = 55;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
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
    startY: curY + 2.5,
    head: [['No', 'Kelas Binaan', 'Nama Wali Kelas (Ustadz / Ustadzah)', 'Username Login Wali', 'Kata Sandi', 'Tingkat']],
    body: waliRows,
    theme: 'grid',
    headStyles: {
      fillColor: PALETTE.goldAmber,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: PALETTE.textBody,
      valign: 'middle',
      cellPadding: 1.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', halign: 'center', cellWidth: 32 },
      2: { fontStyle: 'bold', cellWidth: 62 },
      3: { fontStyle: 'bold', textColor: PALETTE.skyPrimary, cellWidth: 38 },
      4: { halign: 'center', fontStyle: 'bold', textColor: PALETTE.goldDeep, cellWidth: 25 },
      5: { halign: 'center', cellWidth: 26 }
    },
    alternateRowStyles: {
      fillColor: [254, 252, 246]
    },
    margin: { left: 10, right: 10, bottom: 18 }
  });

  // Petunjuk & Tanda Tangan
  const finalY = doc.lastAutoTable.finalY + 4;
  if (finalY < 250) {
    doc.setFillColor(...PALETTE.skyIceBg);
    doc.roundedRect(10, finalY, 190, 30, 2, 2, 'F');
    doc.setDrawColor(...PALETTE.goldAmber);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, finalY, 190, 30, 2, 2, 'D');

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PALETTE.oceanDeep);
    doc.text('Petunjuk Penggunaan & Keamanan Akun:', 14, finalY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.textBody);
    doc.text('1. Buka browser di HP/Laptop dan akses alamat: https://akademikmqbaisykarima.pages.dev', 14, finalY + 9.5);
    doc.text('2. Pilih Tab "Pengajar" bagi guru mata pelajaran atau Tab "Wali Kelas" bagi tugas binaan kelas.', 14, finalY + 13.5);
    doc.text('3. Masukkan Username / ID Login dan Kata Sandi Default sebagaimana tercantum pada tabel di atas.', 14, finalY + 17.5);
    doc.text('4. Demi keamanan, setiap Asatidz dapat memperbarui kata sandi pribadi sewaktu-waktu di menu Profil Saya.', 14, finalY + 21.5);

    // Signature Area
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.slateDark);
    doc.text('Karanganyar, 26 Agustus 2026', 148, finalY + 5.5);
    doc.text('Kepala Kurikulum MQBA Isy Karima,', 148, finalY + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...PALETTE.oceanDeep);
    doc.text('Ust. Aidil Aqli, S.Ag.', 148, finalY + 24.5);
  }

  const buf = doc.output('arraybuffer');
  fs.writeFileSync('daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  fs.writeFileSync('public/daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  console.log('✅ Berhasil membuat file: daftar_akun_pengajar_dan_wali_kelas_mqba.pdf (Warna Tema Web)');
}

// =============================================================================
// 2. GENERATE BUKU PANDUAN DENGAN GAMBAR BROWSER FRAME & WARNA TEMA WEB
// =============================================================================
function generateBukuPanduanLengkapPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Helper to add screenshot with nice frame
  const addScreenshotFrame = (imgData, x, y, w, h, caption) => {
    if (!imgData) return;
    // Image container
    try {
      doc.addImage(imgData, 'JPEG', x, y, w, h, undefined, 'FAST');
    } catch (e) {}

    // Caption underneath
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.skyPrimary);
    doc.text(caption, x + (w / 2), y + h + 3.8, { align: 'center' });
  };

  // ---------------------------------------------------------------------------
  // HALAMAN 1: COVER, MUKADDIMAH & BAB I (LOGIN DENGAN GAMBAR)
  // ---------------------------------------------------------------------------
  // Top Banner (Ocean Deep)
  doc.setFillColor(...PALETTE.oceanDeep);
  doc.rect(0, 0, 210, 62, 'F');
  doc.setFillColor(...PALETTE.goldAmber);
  doc.rect(0, 0, 210, 2.5, 'F');

  doc.setTextColor(...PALETTE.goldWarmBg);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 12, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13.5);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 21, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(...PALETTE.goldWarmBg);
  doc.text("BUKU PANDUAN SISTEM INFORMASI RPP & AKADEMIK ONLINE", 105, 29.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.skyLight);
  doc.text("Panduan Terpadu Bergambar untuk Ustadz/Ustadzah Pengajar & Wali Kelas", 105, 37, { align: 'center' });
  doc.text("Tahun Ajaran 2025/2026 · Alamat Website: https://akademikmqbaisykarima.pages.dev", 105, 43, { align: 'center' });

  doc.setFillColor(...PALETTE.goldAmber);
  doc.rect(0, 60, 210, 2, 'F');

  // Mukaddimah
  let y = 68;
  doc.setFillColor(...PALETTE.skyIceBg);
  doc.roundedRect(10, y, 190, 36, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.goldAmber);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 36, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("KATA PENGANTAR (MUKADDIMAH)", 15, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.textBody);
  doc.text("Assalamu’alaikum Warahmatullahi Wabarakatuh,", 15, y + 12);
  const mukaddimah = "Segala puji bagi Allah Subhanahu wa Ta'ala yang telah mempercayakan kepada kita amanah mendidik generasi penghafal Al-Qur'an di Markaz Al-Qur'an dan Bahasa Arab (MQBA) Isy Karima. Sholawat dan salam senantiasa tercurah kepada Nabi Muhammad Shallallahu 'Alaihi wa Sallam. Buku panduan resmi ini dilengkapi tangkapan layar antarmuka asli dari website aplikasi agar Asatidz dan Asatidzah dapat memahami dan mengoperasikan setiap menu dengan mudah, cepat, dan nyaman.";
  doc.text(doc.splitTextToSize(mukaddimah, 180), 15, y + 17);

  // BAB I: AKSES & LOGIN
  y = 108;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 88, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 88, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("BAB I. PANDUAN AKSES & CARA LOGIN KE WEBSITE", 15, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const loginPoints = [
    "1. Akses Website: Buka browser di HP / Laptop (Chrome/Safari), ketik: https://akademikmqbaisykarima.pages.dev",
    "2. Memilih Tab Peran:",
    "   • Tab 'Pengajar'  : Untuk masuk sebagai Guru Mapel (menyusun RPP, Absensi Mengajar, Nilai & Evaluasi).",
    "   • Tab 'Wali Kelas': Untuk masuk sebagai Wali Kelas (monitoring santri binaan, presensi kelas, & cetak rapor).",
    "3. Masukkan Kredensial: Username resmi (misal: ustadz.abdullah atau wali.abdullah) & Sandi: guru123 / wali123.",
    "4. Profil Saya: Ustadz/Ustadzah dapat mengubah kata sandi pribadi sewaktu-waktu di menu 'Profil Saya'."
  ];
  let offY = 12.5;
  loginPoints.forEach(p => {
    doc.text(p, 15, y + offY);
    offY += 5;
  });

  // Gambar 1: Layar Login
  addScreenshotFrame(imgLogin, 38, y + 43, 134, 38, "Gambar 1: Tampilan Layar Login SIM RPP & Akademik MQBA Isy Karima");

  // Footer Hal 1
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 1 dari 5", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 2: BAB II. FITUR PENGAJAR (DASHBOARD & RPP MODUL AJAR DENGAN AI)
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawWebThemeKop(
    doc,
    "BAB II. FITUR PENGAJAR: DASHBOARD & RPP MODUL AJAR",
    "Jadwal Mengajar, Jam KBM, Penyusunan RPP Kurikulum Merdeka & Generator AI"
  );

  y = 54;

  // 1. Dashboard Guru
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 106, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 106, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("1. Menu 'Dashboard' Pengajar", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  doc.text("Menampilkan ringkasan data mengajar Asatidz: Total Jam Mengajar mingguan, Jumlah Kelas Binaan, Mata Pelajaran yang diampu, serta Jadwal Mengajar Harian dan kalender KBM.", 15, y + 12, { maxWidth: 180 });

  addScreenshotFrame(imgDashboardGuru, 25, y + 19, 160, 80, "Gambar 2: Tampilan Dashboard Pengajar & Rekap Jadwal KBM");

  // 2. RPP & Modul Ajar
  y = 164;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 118, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 118, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("2. Menu 'RPP Saya' (Penyusunan RPP & Generator AI Cerdas)", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const rppExpl = "Asatidz dapat menyusun RPP Kurikulum Merdeka dengan mudah:\n• Klik tombol '+ Susun RPP Baru' untuk mengisi Capaian Pembelajaran (CP), TP, Langkah KBM & Asesmen.\n• Gunakan tombol 'Generate dengan AI': Cukup pilih Mapel, Kelas & Topik Materi, maka sistem akan menyusun draf RPP lengkap secara otomatis dalam beberapa detik!\n• Tersedia tombol Cetak Fisik dan Download File PDF resmi.";
  doc.text(doc.splitTextToSize(rppExpl, 180), 15, y + 12);

  addScreenshotFrame(imgRpp, 25, y + 33, 160, 78, "Gambar 3: Tampilan Halaman RPP Saya & Manajemen Modul Ajar");

  // Footer Hal 2
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 2 dari 5", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 3: FITUR PENGAJAR: PRESENSI GURU & PRESENSI SANTRI
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawWebThemeKop(
    doc,
    "BAB II. FITUR PENGAJAR: PRESENSI GURU & PRESENSI SANTRI",
    "Presensi Mengajar Mandiri, Pilihan 3 Dropdown Tanggal, & Presensi KBM Santri"
  );

  y = 54;

  // 3. Presensi Guru (Absensi Saya)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("3. Menu 'Absensi Saya' (Presensi Kehadiran Guru Mandiri)", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const presGuruText = "Fitur untuk mencatat kehadiran mengajar mandiri setiap kali KBM berlangsung:\n• Pilih Tanggal melalui 3 Dropdown Interaktif (Tanggal 1-31, Bulan, Tahun) atau klik tombol instan [Hari Ini] / [Kemarin].\n• Pilih Status: Hadir, Sakit, Izin, atau Tugas Luar. Asatidz juga dapat mengunggah foto bukti KBM.";
  doc.text(doc.splitTextToSize(presGuruText, 180), 15, y + 12);

  addScreenshotFrame(imgAbsensiGuru, 25, y + 26, 160, 75, "Gambar 4: Tampilan Menu Absensi Saya (Presensi Kehadiran Guru Mandiri)");

  // 4. Presensi Santri (Absensi Santri)
  y = 166;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 116, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 116, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("4. Menu 'Absensi Santri' (Presensi Santri Per Pertemuan KBM)", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const presSantriText = "Setiap kali masuk ke halaqah/kelas, Asatidz mengisi daftar kehadiran santri:\n• Pilih Jadwal Mengajar, Tanggal KBM, dan tuliskan Topik Materi yang diajarkan.\n• Secara default seluruh santri berstatus 'Hadir', cukup ubah santri yang Sakit (S), Izin (I), atau Ghaib/Alfa (A).\n• Klik 'Simpan Presensi Santri' untuk menyimpan rekap yang langsung terhubung ke dashboard wali kelas.";
  doc.text(doc.splitTextToSize(presSantriText, 180), 15, y + 12);

  addScreenshotFrame(imgAbsensiSantri, 25, y + 29, 160, 80, "Gambar 5: Tampilan Menu Absensi Santri Per Pertemuan KBM");

  // Footer Hal 3
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 3 dari 5", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 4: FITUR PENGAJAR: NILAI SANTRI & EVALUASI PEMBELAJARAN
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawWebThemeKop(
    doc,
    "BAB II. FITUR PENGAJAR: NILAI & EVALUASI PEMBELAJARAN",
    "Input Nilai Formatif/Sumatif/PTS/PAS & Evaluasi Guru (Bulanan, Semester, Tahunan)"
  );

  y = 54;

  // 5. Penilaian Santri
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("5. Menu 'Nilai & Rapor' (Pengelolaan Nilai Santri)", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const nilaiText = "Memudahkan pengajar memasukkan nilai santri secara terpadu:\n• Nilai Formatif (Tugas harian, setoran hafalan, keaktifan halaqah).\n• Nilai Sumatif (Ulangan lingkup materi per TP), Nilai PTS (Tengah Semester), dan Nilai PAS (Akhir Semester).\n• Sistem secara otomatis menghitung nilai akhir, rata-rata kelas, dan status ketuntasan santri.";
  doc.text(doc.splitTextToSize(nilaiText, 180), 15, y + 12);

  addScreenshotFrame(imgNilai, 25, y + 26, 160, 75, "Gambar 6: Tampilan Pengelolaan Nilai Santri & Rapor");

  // 6. Evaluasi Guru
  y = 166;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 116, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 116, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("6. Menu 'Evaluasi Bulanan Mapel' / Evaluasi Pembelajaran Guru", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const evalText = "Sarana muhasabah dan pelaporan mutu pembelajaran berbasis 8 Dimensi Kurikulum Merdeka:\n• Pilihan Jenis: 📅 [Evaluasi Bulanan], 📆 [Evaluasi Semester], atau 🗓️ [Evaluasi Tahunan].\n• Memuat: Keterlaksanaan KBM, Capaian TP, Hasil Asesmen, Kendala & Solusi, Diferensiasi, Rencana & Refleksi.\n• Laporan dapat dicetak fisik maupun diunduh langsung sebagai file PDF resmi.";
  doc.text(doc.splitTextToSize(evalText, 180), 15, y + 12);

  addScreenshotFrame(imgEvaluasi, 25, y + 29, 160, 80, "Gambar 7: Tampilan Form & Laporan Evaluasi Pembelajaran Guru");

  // Footer Hal 4
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 4 dari 5", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 5: FITUR WALI KELAS & PENUTUP
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawWebThemeKop(
    doc,
    "BAB III. FITUR WALI KELAS & BAB IV. PENUTUP",
    "Monitoring Santri Binaan, Rekap Rapor Kelas, FAQ, Tips Praktis & Bantuan Teknis"
  );

  y = 54;

  // BAB III Fitur Wali Kelas
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, y, 190, 118, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 118, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("BAB III. PANDUAN FITUR KHUSUS WALI KELAS", 15, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const waliExpl = "Bagi Asatidz yang mengemban amanah sebagai Wali Kelas, silakan login melalui Tab 'Wali Kelas':\n• Dashboard Wali Kelas: Memantau biodata santri binaan, NIS, kontak wali, dan rekam jejak akademik.\n• Absensi Santri: Memantau akumulasi kehadiran santri kelas binaan dari seluruh mata pelajaran.\n• Rekap Rapor Kelas: Mengontrol keterisian nilai dari seluruh guru mapel dan mencetak lembar Rapor Santri MQBA resmi.";
  doc.text(doc.splitTextToSize(waliExpl, 180), 15, y + 12);

  addScreenshotFrame(imgRekapRapor, 25, y + 27, 160, 84, "Gambar 8: Tampilan Menu Rekap Rapor Kelas & Cetak Rapor Santri MQBA");

  // BAB IV Penutup & Tips
  y = 176;
  doc.setFillColor(...PALETTE.skyIceBg);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.goldAmber);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, 108, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text("BAB IV. TIPS PRAKTIS, FAQ & PENUTUP", 15, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.textBody);
  const faqText = [
    "• Tanya: Bagaimana jika saya lupa kata sandi akun?",
    "  Jawab: Hubungi Bagian Kurikulum atau Admin IT untuk mereset kata sandi kembali ke default (guru123 / wali123).",
    "• Tanya: Apakah aplikasi ini bisa dibuka di HP Android / iPhone?",
    "  Jawab: Sangat bisa! Website SIM RPP & Akademik didesain responsive dan nyaman digunakan di layar smartphone.",
    "• Tanya: Kapan evaluasi bulanan sebaiknya diisi?",
    "  Jawab: Disarankan mengisi di pekan terakhir setiap bulan kalender berjalan agar rekap keterlaksanaan KBM akurat."
  ];
  let fY = 12;
  faqText.forEach(f => {
    doc.text(f, 15, y + fY);
    fY += 4.5;
  });

  const closingMsg = "Demikian buku panduan terpadu ini kami susun. Semoga menjadi washilah kemudahan dan kelancaran khidmah Asatidz dan Asatidzah di Markaz Al-Qur'an dan Bahasa Arab Isy Karima. Semoga jerih payah kita dicatat sebagai amal jariyah yang berlipat ganda di sisi Allah Subhanahu wa Ta'ala. Aamiin Ya Rabbal 'Alamin.";
  doc.text(doc.splitTextToSize(closingMsg, 180), 15, y + 42);

  // Signature Area
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...PALETTE.slateDark);
  doc.text('Karanganyar, 26 Agustus 2026', 148, y + 68);
  doc.text('Kepala Kurikulum MQBA Isy Karima,', 148, y + 72.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.oceanDeep);
  doc.text('Ust. Aidil Aqli, S.Ag.', 148, y + 96);

  // Footer Hal 5
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 5 dari 5", 105, 290, { align: 'center' });

  const buf = doc.output('arraybuffer');
  fs.writeFileSync('buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  fs.writeFileSync('public/buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(buf));
  console.log('✅ Berhasil membuat file: buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf (Warna Tema Web & Framed Screenshots)');
}

// =============================================================================
// RUN BOTH GENERATORS
// =============================================================================
console.log('--- GENERATING FINAL THEME-MATCHED ISLAMIC WEB PDFS ---');
generateDaftarAkunPdf();
generateBukuPanduanLengkapPdf();
console.log('--- ALL PERFECT PDFS SUCCESSFULLY CREATED ---');
