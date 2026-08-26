import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

// =============================================================================
// DATA AKUN LENGKAP PENGAJAR & WALI KELAS MQBA ISY KARIMA
// (Kecuali Akun Admin)
// =============================================================================
const akunData = [
  { no: 1, name: 'Ust. Muhammad Abdul Malik Ibrahim, S.Kom', role: 'Guru', username: 'ustadz.abdul.malik', pass: 'guru123', info: 'Pengajar Informatika' },
  { no: 2, name: 'Ust. Umar Alamuddin, Lc., Al-Hafizh', role: 'Guru', username: 'ustadz.umar', pass: 'guru123', info: 'Pengajar Diniyyah / Al-Qur\'an' },
  { no: 3, name: 'Ust. Dzulfikar Tri Baskara, S.Ag, M.Pd', role: 'Guru', username: 'ustadz.dzulfikar', pass: 'guru123', info: 'Pengajar Bahasa Arab & Diniyyah' },
  { no: 4, name: 'Ust. Nashiruddin Karim, Lc., Al-Hafizh', role: 'Guru', username: 'ustadz.karim', pass: 'guru123', info: 'Pengajar Diniyyah & Tahfizh' },
  { no: 5, name: 'Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh', role: 'Guru & Wali Kelas', username: 'ustadz.fredy / wali.fredy', pass: 'guru123 / wali123', info: 'Wali Kelas VIII Putra' },
  { no: 6, name: 'Ust. Muhammad Ilyas Abdullah', role: 'Guru', username: 'ustadz.ilyas', pass: 'guru123', info: 'Pengajar Tai Chi Semua Kelas Putra' },
  { no: 7, name: 'Usth. Aulia Anim Amanillah', role: 'Guru', username: 'ustadzah.anim', pass: 'guru123', info: 'Pengajar Diniyyah Putri' },
  { no: 8, name: 'Usth. Iffah Luthfiyah', role: 'Guru', username: 'ustadzah.iffah', pass: 'guru123', info: 'Pengajar Bahasa Arab Putri' },
  { no: 9, name: 'Ust. Yunan Hidayat, Al Hafizh', role: 'Guru', username: 'ustadz.yunan', pass: 'guru123', info: 'Pengajar Tahfizh Al-Qur\'an' },
  { no: 10, name: 'Ust. Faqih Hidayat, Lc', role: 'Guru', username: 'ustadz.faqih', pass: 'guru123', info: 'Pengajar Diniyyah' },
  { no: 11, name: 'Usth. Indri Nur Bidari, S.Si', role: 'Guru', username: 'ustadzah.indri', pass: 'guru123', info: 'Pengajar IPA / Sains' },
  { no: 12, name: 'Ust. Aidil Aqli, S.Ag.', role: 'Guru & Wali Kelas', username: 'ustadz.aidil / wali.aidil', pass: 'guru123 / wali123', info: 'Wali Kelas VII Putra' },
  { no: 13, name: 'Usth. Saiba Musyaiya', role: 'Guru', username: 'ustadzah.saiba.musyaiya', pass: 'guru123', info: 'Pengajar Diniyyah Putri' },
  { no: 14, name: 'Ust. M. Arya Mukti al-Hafizh', role: 'Guru', username: 'ustadz.arya', pass: 'guru123', info: 'Pengajar Tahfizh Al-Qur\'an' },
  { no: 15, name: 'Ust. Abdul Kholif al-Hafizh', role: 'Guru', username: 'ustadz.kholif', pass: 'guru123', info: 'Pengajar Tahfizh Al-Qur\'an' },
  { no: 16, name: 'Usth. Bela Dwi Lestari, S.Pd., Gr', role: 'Guru', username: 'ustadzah.bela', pass: 'guru123', info: 'Pengajar Matematika' },
  { no: 17, name: 'Ust. Farhan Akhandi', role: 'Guru', username: 'ustadz.farhan', pass: 'guru123', info: 'Pengajar Bahasa Inggris' },
  { no: 18, name: 'Ust. Tubagus Ahadiyat Rachmadi Luhur, S.Ag.', role: 'Guru', username: 'ustadz.tubagus', pass: 'guru123', info: 'Pengajar PAI & Diniyyah' },
  { no: 19, name: 'Ust. Muhammad Hafizh, S.Si', role: 'Guru', username: 'ustadz.hafizh', pass: 'guru123', info: 'Pengajar IPA / Fisika' },
  { no: 20, name: 'Usth. Rifanisa Nurulfitria, S.Hum., M.Si.', role: 'Guru', username: 'ustadzah.fani', pass: 'guru123', info: 'Pengajar Bahasa Indonesia' },
  { no: 21, name: 'Ust. Azri Robani Indra Robbi, S.Ag.', role: 'Guru', username: 'ustadz.azri', pass: 'guru123', info: 'Pengajar IPS / Sejarah Islam' },
  { no: 22, name: 'Usth. Extika Nur Fadhillah', role: 'Guru', username: 'ustadzah.dila', pass: 'guru123', info: 'Pengajar Umum Putri' },
  { no: 23, name: 'Usth. Azizah Nur Aini, S.Pd., Gr', role: 'Guru', username: 'ustadzah.azizah', pass: 'guru123', info: 'Pengajar Bahasa Inggris Putri' },
  { no: 24, name: 'Usth. Hasri Haryani Direja, S.Ds', role: 'Guru', username: 'ustadzah.hasri', pass: 'guru123', info: 'Pengajar Seni & Prakarya' },
  { no: 25, name: 'Ust. Muhammad Latief Amiruddin, S.T.', role: 'Guru & Wali Kelas', username: 'ustadz.latief / wali.latief', pass: 'guru123 / wali123', info: 'Wali Kelas IX Putra' },
  { no: 26, name: 'Ust. Akmal Firmana, ST', role: 'Guru', username: 'ustadz.akmal', pass: 'guru123', info: 'Pengajar Matematika & Eksak' },
  { no: 27, name: 'Usth. Lina Ayu Fitriyyah, S.Ag.', role: 'Guru & Wali Kelas', username: 'ustadzah.lina / wali.lina', pass: 'guru123 / wali123', info: 'Wali Kelas VII Putri' },
  { no: 28, name: 'Ust. Rezkidar', role: 'Guru', username: 'ustadz.rezkidar', pass: 'guru123', info: 'Pengajar PJOK / Olahraga' },
  { no: 29, name: 'Ust. Abdullah Kristianto, S.Sos.', role: 'Guru & Wali Kelas', username: 'ustadz.abdullah / wali.abdullah', pass: 'guru123 / wali123', info: 'Pengajar ABY VII & I\'dad Putra, Wali Kelas I\'dad Putra' },
  { no: 30, name: 'Usth. Hasna Halimatun Basyaria, S.Ag.', role: 'Wali Kelas', username: 'wali.hasna', pass: 'wali123', info: 'Wali Kelas I\'dad & VIII Putri' }
];

// =============================================================================
// COLOR PALETTE: ISLAMIC FLAT MODERN
// =============================================================================
const PALETTE = {
  islamicGreenDark: [6, 78, 59],     // Deep Emerald Forest #064e3b
  islamicGreenLight: [16, 185, 129], // Bright Emerald #10b981
  goldAccent: [217, 119, 6],         // Islamic Ochre Gold #d97706
  goldLight: [254, 243, 199],        // Soft Gold Tint #fef3c7
  slateDark: [15, 23, 42],           // Deep Midnight Slate #0f172a
  slateText: [30, 41, 59],           // Charcoal text #1e293b
  slateMuted: [100, 116, 139],       // Secondary Slate #64748b
  bgLight: [248, 250, 252],          // Off-white / Cream
  cardBorder: [226, 232, 240],       // Light Border
  cyanAccent: [14, 116, 144]         // Ocean Cyan Accent
};

// =============================================================================
// HELPER: ISLAMIC FLAT KOP SURAT (TANPA LOGO GAMBAR)
// =============================================================================
function drawIslamicKop(doc, titleText, subtitleText) {
  // Top Banner Rectangle
  doc.setFillColor(...PALETTE.islamicGreenDark);
  doc.rect(0, 0, 210, 30, 'F');

  // Decorative Golden Top Border Strip
  doc.setFillColor(...PALETTE.goldAccent);
  doc.rect(0, 0, 210, 2.5, 'F');

  // Center Islamic Typography
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 7.5, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text("SISTEM INFORMASI RPP & AKADEMIK (SIM RPP & AKADEMIK)", 105, 20.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Pakel, Gerdu, Karangpandan, Kabupaten Karanganyar, Jawa Tengah 57791", 105, 25.5, { align: 'center' });

  // Double Decorative Separator Line
  doc.setDrawColor(...PALETTE.goldAccent);
  doc.setLineWidth(1.0);
  doc.line(10, 32, 200, 32);

  doc.setDrawColor(...PALETTE.islamicGreenLight);
  doc.setLineWidth(0.3);
  doc.line(10, 33.5, 200, 33.5);

  // Document Title Card
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(10, 37, 190, 18, 2, 2, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(10, 37, 190, 18, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text(titleText.toUpperCase(), 105, 44.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateMuted);
  doc.text(subtitleText, 105, 50.5, { align: 'center' });
}

// =============================================================================
// GENERATOR 1: PDF DAFTAR AKUN PENGAJAR & WALI KELAS
// =============================================================================
function generateDaftarAkunPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawIslamicKop(
    doc,
    "DAFTAR AKUN & KREDENSIAL LOGIN PENGAJAR DAN WALI KELAS",
    "Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev"
  );

  const tableRows = akunData.map(g => [
    g.no.toString(),
    g.name,
    g.role,
    g.username,
    g.pass,
    g.info
  ]);

  autoTable(doc, {
    startY: 58,
    head: [['No', 'Nama Ustadz / Ustadzah', 'Peran / Role', 'Username / ID Login', 'Kata Sandi Default', 'Keterangan / Binaan']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: PALETTE.islamicGreenDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: PALETTE.slateText,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 54 },
      2: { halign: 'center', cellWidth: 26 },
      3: { fontStyle: 'bold', textColor: PALETTE.cyanAccent, cellWidth: 42 },
      4: { halign: 'center', fontStyle: 'bold', textColor: PALETTE.goldAccent, cellWidth: 26 },
      5: { cellWidth: 34 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 10, right: 10, bottom: 22 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Kredensial Resmi Markaz Al-Qur'an dan Bahasa Arab Isy Karima · Halaman ${data.pageNumber} dari ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }
  });

  const finalY = doc.lastAutoTable.finalY + 5;
  if (finalY < 250) {
    // Petunjuk Card Box
    doc.setFillColor(254, 252, 246);
    doc.roundedRect(10, finalY, 190, 32, 2, 2, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, finalY, 190, 32, 2, 2, 'D');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PALETTE.islamicGreenDark);
    doc.text('Petunjuk Penggunaan Akun & Keamanan:', 14, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.slateText);
    doc.text('1. Kunjungi portal resmi aplikasi di browser melalui alamat: https://akademikmqbaisykarima.pages.dev', 14, finalY + 11.5);
    doc.text('2. Pilih tab sesuai peran: tab "Pengajar" bagi guru mapel atau tab "Wali Kelas" bagi penugasan wali kelas.', 14, finalY + 16);
    doc.text('3. Masukkan Username / ID Login dan Kata Sandi Default sebagaimana tercantum pada tabel di atas.', 14, finalY + 20.5);
    doc.text('4. Demi keamanan, setiap Asatidz dapat mengganti kata sandi setelah berhasil masuk pada menu Profil.', 14, finalY + 25);

    // Signature Area
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slateDark);
    doc.text('Karanganyar, 26 Agustus 2026', 150, finalY + 7);
    doc.text('Ketua Kurikulum MQBA Isy Karima,', 150, finalY + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.islamicGreenDark);
    doc.text('Ust. Aidil Aqli, S.Ag.', 150, finalY + 27);
  }

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync('daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(pdfOutput));
  fs.writeFileSync('public/daftar_akun_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(pdfOutput));
  console.log('✅ Berhasil membuat: daftar_akun_pengajar_dan_wali_kelas_mqba.pdf');
}

// =============================================================================
// GENERATOR 2: BUKU PANDUAN & PENGENALAN FITUR APLIKASI
// (BAHASA MANUSIAWI, SANTUN, SOPAN, DESAIN ISLAMIC FLAT MODERN TANPA LOGO)
// =============================================================================
function generateBukuPanduanPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // ---------------------------------------------------------------------------
  // HALAMAN 1: COVER & MUKADDIMAH
  // ---------------------------------------------------------------------------
  // Cover Header Background
  doc.setFillColor(...PALETTE.islamicGreenDark);
  doc.rect(0, 0, 210, 80, 'F');

  // Gold Top Border
  doc.setFillColor(...PALETTE.goldAccent);
  doc.rect(0, 0, 210, 3, 'F');

  // Header Typography
  doc.setTextColor(254, 243, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", 105, 18, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text("BISMILLAHIRRAHMANIRRAHIM", 105, 24, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB ISY KARIMA", 105, 35, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(209, 250, 229);
  doc.text("BUKU PANDUAN & PENGENALAN FITUR APLIKASI AKADEMIK", 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Panduan Terpadu Untuk Ustadz/Ustadzah Pengajar & Wali Kelas", 105, 51, { align: 'center' });
  doc.text("Alamat Akses Portal: https://akademikmqbaisykarima.pages.dev", 105, 58, { align: 'center' });

  // Gold Accent line below cover
  doc.setFillColor(...PALETTE.goldAccent);
  doc.rect(0, 78, 210, 2, 'F');

  // Mukaddimah Card
  let curY = 90;
  doc.setFillColor(254, 252, 246);
  doc.roundedRect(12, curY, 186, 44, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.goldAccent);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 44, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text("KATA PENGANTAR (MUKADDIMAH)", 18, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...PALETTE.slateText);
  doc.text("Assalamu’alaikum Warahmatullahi Wabarakatuh,", 18, curY + 14);
  
  const introText = "Segala puji bagi Allah Subhanahu wa Ta'ala yang telah memberikan taufiq serta kekuatan kepada kita dalam berkhidmah mendidik para penghafal Al-Qur'an dan penuntut ilmu syar'i. Sholawat dan salam semoga senantiasa tercurah kepada Baginda Nabi Muhammad Shallallahu 'Alaihi wa Sallam. Buku panduan ini disusun sebagai rujukan praktis dan bersahabat bagi segenap Asatidz dan Asatidzah di Markaz Al-Qur'an dan Bahasa Arab (MQBA) Isy Karima dalam memanfaatkan Sistem Informasi RPP & Akademik terintegrasi, guna mempermudah pencatatan KBM, presensi santri, penilaian, serta evaluasi kurikulum.";
  const introLines = doc.splitTextToSize(introText, 174);
  doc.text(introLines, 18, curY + 20);

  // BAB I: AKSES & LOGIN
  curY = 142;
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(12, curY, 186, 68, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 68, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text("BAB I. CARA LOGIN & KREDENSIAL AKUN", 18, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);

  const bab1Points = [
    "1. Akses Portal: Buka peramban (Google Chrome / Safari / Firefox) di HP maupun Laptop, lalu ketik alamat:",
    "   https://akademikmqbaisykarima.pages.dev",
    "2. Memilih Tab Login yang Tepat:",
    "   • Tab 'Pengajar' : Digunakan saat Ustadz/Ustadzah hendak mengelola RPP, Presensi Mengajar, Input Nilai & Evaluasi Mapel.",
    "   • Tab 'Wali Kelas' : Digunakan khusus oleh Ustadz/Ustadzah yang mengemban amanah sebagai Wali Kelas santri.",
    "3. Masukkan Kredensial Akun:",
    "   • Gunakan username resmi (misal: ustadz.abdullah / wali.abdullah) dan kata sandi default: guru123 / wali123.",
    "4. Menu Profil & Kata Sandi: Setelah berhasil masuk, Ustadz/Ustadzah dapat memperbarui kata sandi pribadi sewaktu-waktu."
  ];

  let lineOffset = 15;
  bab1Points.forEach(pt => {
    doc.text(pt, 18, curY + lineOffset);
    lineOffset += 5.2;
  });

  // BAB II Preview: PANDUAN FITUR PENGAJAR (1 & 2)
  curY = 217;
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(12, curY, 186, 66, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 66, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text("BAB II. FITUR UTAMA PENGAJAR (GURU MATA PELAJARAN)", 18, curY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("1. Dashboard Pengajar & Jadwal Mengajar", 18, curY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  doc.text("Menampilkan ringkasan jam mengajar mingguan, kelas binaan, mata pelajaran yang diampu, serta statistik keterlaksanaan KBM harian secara real-time.", 22, curY + 21, { maxWidth: 170 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("2. Penyusunan RPP Kurikulum Merdeka & Generator AI MQBA", 18, curY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const rppExpl = "Ustadz/Ustadzah dapat menyusun RPP (Rencana Pelaksanaan Pembelajaran) secara mandiri atau memanfaatkan Generator AI MQBA. Cukup pilih Mapel, Kelas, Materi Pokok, dan Alokasi Waktu, lalu sistem akan secara cerdas menyusun Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Langkah Pembelajaran Berdiferensiasi, serta Rubrik Asesmen siap cetak dan simpan PDF.";
  doc.text(doc.splitTextToSize(rppExpl, 170), 22, curY + 37);

  // Footer Page 1
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 1 dari 3", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 2: FITUR PENGAJAR (LANJUTAN 3, 4, 5, 6)
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawIslamicKop(
    doc,
    "BAB II. FITUR UTAMA PENGAJAR (LANJUTAN)",
    "Panduan Presensi Mandiri, Presensi Santri, Penilaian & Evaluasi Pembelajaran"
  );

  curY = 58;

  // Fitur 3 & 4
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(12, curY, 186, 70, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 70, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("3. Presensi Kehadiran Guru (Presensi Mandiri)", 18, curY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const presGuruExpl = "Fitur untuk mencatat kehadiran mengajar Ustadz/Ustadzah setiap kali KBM berlangsung. Tersedia pilihan status Hadir, Izin, Sakit, atau Tugas Luar. Pemilihan tanggal kini semakin mudah dengan 3 Dropdown Interaktif (Tanggal 1-31, Bulan, Tahun) serta tombol cepat 'Hari Ini' dan 'Kemarin'. Ustadz/Ustadzah juga dapat melampirkan foto bukti KBM.";
  doc.text(doc.splitTextToSize(presGuruExpl, 174), 22, curY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("4. Presensi Santri Per Pertemuan KBM", 18, curY + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const presSantriExpl = "Setiap kali masuk ke kelas, pengajar dapat mengisi daftar kehadiran santri binaan. Cukup tentukan Tanggal, Kelas, Mapel, dan Topik Materi yang diajarkan. Secara default seluruh santri diset 'Hadir' sehingga pengajar cukup mengubah santri yang Sakit, Izin, atau Ghaib/Alfa. Hasil presensi tersimpan otomatis dan terhubung ke laporan wali kelas.";
  doc.text(doc.splitTextToSize(presSantriExpl, 174), 22, curY + 41);

  // Fitur 5 & 6
  curY = 134;
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(12, curY, 186, 88, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 88, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("5. Pengelolaan & Input Nilai Santri", 18, curY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const nilaiExpl = "Memudahkan asatidz dalam merekap capaian hasil belajar santri:\n• Nilai Formatif (Tugas harian, setoran hafalan, keaktifan halaqah/kelas).\n• Nilai Sumatif / Lingkup Materi (Ulangan harian per materi TP).\n• Nilai PTS (Penilaian Tengah Semester) & Nilai PAS (Penilaian Akhir Semester).\nSistem secara otomatis menghitung nilai akhir, rata-rata kelas, dan status ketuntasan santri.";
  doc.text(doc.splitTextToSize(nilaiExpl, 174), 22, curY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.cyanAccent);
  doc.text("6. Evaluasi Pembelajaran (Bulanan, Semester, dan Tahunan)", 18, curY + 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const evalExpl = "Wujud muhasabah dan refleksi mutu KBM berbasis 8 Dimensi Kurikulum Merdeka. Pengajar dapat mengisi tiga jenis evaluasi:\n• 📅 Evaluasi Bulanan : Rekapitulasi pertemuan, TP tercapai/belum, kendala & solusi bulanan.\n• 📆 Evaluasi Semester : Evaluasi menyeluruh per semester (Ganjil/Genap) dan tindak lanjut.\n• 🗓️ Evaluasi Tahunan : Refleksi akhir tahun ajaran penuh untuk usulan kurikulum ke depan.\nSeluruh data evaluasi dapat dicetak fisik maupun diunduh langsung sebagai file PDF resmi.";
  doc.text(doc.splitTextToSize(evalExpl, 174), 22, curY + 51);

  // Tips Card Box on Page 2
  curY = 227;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(12, curY, 186, 52, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.goldAccent);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 52, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PALETTE.goldAccent);
  doc.text("💡 TIPS PRAKTIS UNTUK USTADZ & USTADZAH PENGAJAR:", 18, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...PALETTE.slateDark);
  const tips = [
    "1. Lakukan presensi santri di awal atau akhir jam pelajaran agar rekap kehadiran selalu akurat dan terdata.",
    "2. Gunakan AI Generator RPP sebagai inspirasi variasi metode mengajar yang interaktif dan menyenangkan santri.",
    "3. Input nilai tugas/setoran secara berkala agar tidak menumpuk di akhir semester menjelang pembagian rapor.",
    "4. Setiap laporan evaluasi bulanan yang diisi akan menjadi dasar pertimbangan pengembangan kurikulum MQBA."
  ];
  let tipOffset = 15;
  tips.forEach(t => {
    doc.text(t, 18, curY + tipOffset);
    tipOffset += 8.5;
  });

  // Footer Page 2
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 2 dari 3", 105, 290, { align: 'center' });

  // ---------------------------------------------------------------------------
  // HALAMAN 3: FITUR WALI KELAS & PENUTUP
  // ---------------------------------------------------------------------------
  doc.addPage();
  drawIslamicKop(
    doc,
    "BAB III. FITUR WALI KELAS & BAB IV. PENUTUP",
    "Panduan Khusus Penugasan Wali Kelas Markaz Al-Qur'an dan Bahasa Arab Isy Karima"
  );

  curY = 58;

  // BAB III Fitur Wali Kelas
  doc.setFillColor(...PALETTE.bgLight);
  doc.roundedRect(12, curY, 186, 120, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 120, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text("BAB III. PANDUAN FITUR KHUSUS WALI KELAS", 18, curY + 8);

  const waliFitur = [
    {
      title: "1. Rekap Data Santri Kelas Binaan",
      desc: "Wali kelas dapat memantau seluruh biodata santri di kelasnya, data wali santri, kontak darurat, serta rekam jejak akademik santri secara terpusat."
    },
    {
      title: "2. Rekapitulasi Presensi & Kedisiplinan Kelas",
      desc: "Menampilkan akumulasi kehadiran santri dari seluruh mata pelajaran (Total Hadir, Sakit, Izin, dan Alfa), sehingga wali kelas dapat segera menindaklanjuti santri yang sering berhalangan hadir."
    },
    {
      title: "3. Catatan Perkembangan & Evaluasi Wali Kelas",
      desc: "Fitur khusus bagi wali kelas untuk mencatat perkembangan adab, ibadah harian, kedisiplinan asrama/kelas, kendala belajar santri, serta arahan bimbingan konseling per periode (Bulanan / Semester)."
    },
    {
      title: "4. Monitoring Keterisian Nilai & Cetak Rapor Santri MQBA",
      desc: "Wali kelas dapat memantau mata pelajaran mana saja yang nilainya sudah lengkap diinput oleh para guru mapel. Setelah seluruh nilai tuntas, wali kelas dapat langsung mencetak lembar Rapor Santri MQBA Isy Karima resmi."
    }
  ];

  let wOffset = 17;
  waliFitur.forEach(wf => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.cyanAccent);
    doc.text(wf.title, 18, curY + wOffset);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slateText);
    doc.text(doc.splitTextToSize(wf.desc, 174), 22, curY + wOffset + 5);
    wOffset += 24;
  });

  // BAB IV: PENUTUP & DOA
  curY = 184;
  doc.setFillColor(254, 252, 246);
  doc.roundedRect(12, curY, 186, 50, 2.5, 2.5, 'F');
  doc.setDrawColor(...PALETTE.goldAccent);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, curY, 186, 50, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text("BAB IV. PENUTUP & BANTUAN TEKNIS", 18, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateText);
  const closingText = "Demikian buku panduan pengenalan fitur ini kami susun dengan harapan dapat memberikan kemudahan dan kejelasan bagi segenap Asatidz dan Asatidzah. Jika terdapat kendala teknis, masukan, atau pertanyaan seputar penggunaan aplikasi, silakan menghubungi Tim Kurikulum & IT MQBA Isy Karima.\n\nSemoga setiap lelah dan peluh yang kita curahkan dalam mendidik para generasi Qur'ani dicatat oleh Allah Subhanahu wa Ta'ala sebagai amal jariyah yang berlipat ganda. Aamiin Ya Rabbal 'Alamin.";
  doc.text(doc.splitTextToSize(closingText, 174), 18, curY + 14);

  // Signature Block
  curY = 240;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.slateDark);
  doc.text('Karanganyar, 26 Agustus 2026', 145, curY);
  doc.text('Kepala Kurikulum MQBA Isy Karima,', 145, curY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PALETTE.islamicGreenDark);
  doc.text('Ust. Aidil Aqli, S.Ag.', 145, curY + 22);

  // Footer Page 3
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · Halaman 3 dari 3", 105, 290, { align: 'center' });

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync('buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(pdfOutput));
  fs.writeFileSync('public/buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf', Buffer.from(pdfOutput));
  console.log('✅ Berhasil membuat: buku_panduan_pengenalan_fitur_pengajar_dan_wali_kelas_mqba.pdf');
}

// =============================================================================
// RUN BOTH GENERATORS
// =============================================================================
console.log('Memulai pembuatan dokumen PDF...');
generateDaftarAkunPdf();
generateBukuPanduanPdf();
console.log('Semua dokumen PDF berhasil dibuat dengan standar Islamic Flat Modern tanpa logo!');
