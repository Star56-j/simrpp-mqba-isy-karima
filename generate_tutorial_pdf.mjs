import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Load Logo Base64 if exists
let logoBase64 = null;
try {
  const logoBuffer = fs.readFileSync('public/logo-mqba.png');
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (e) {
  console.log('Logo not found, proceeding with vector header');
}

// Color Palette
const navy = [15, 23, 42];        // #0f172a
const primaryBlue = [14, 116, 144]; // #0e7490
const darkBlue = [3, 105, 161];     // #0369a1
const gold = [199, 168, 106];      // #c7a86a
const darkGold = [143, 107, 57];   // #8f6b39
const softGoldBg = [254, 252, 246]; // #fefcf6
const slateDark = [30, 41, 59];    // #1e293b
const slateMuted = [71, 85, 105];  // #475569
const cardBg = [248, 250, 252];    // #f8fafc

// Helper: Official MQBA Kop Surat Header
function drawOfficialKop(subTitle = "") {
  // Top Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');

  // Add Logo if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 12, 4, 20, 20);
    } catch (err) {}
  }

  const textStartX = logoBase64 ? 115 : 105;

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ AL-QUR'AN DAN BAHASA ARAB (MQBA)", textStartX, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(223, 200, 143);
  doc.text("ISY KARIMA", textStartX, 15.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text("SISTEM INFORMASI RPP & AKADEMIK ONLINE (SIM RPP & AKADEMIK)", textStartX, 20, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Pakel, Gerdu, Karangpandan, Kabupaten Karanganyar, Jawa Tengah 57791", textStartX, 24.5, { align: 'center' });

  // Double Divider Line (Gold & Navy)
  doc.setDrawColor(199, 168, 106);
  doc.setLineWidth(1.2);
  doc.line(10, 30, 200, 30);

  doc.setDrawColor(14, 116, 144);
  doc.setLineWidth(0.4);
  doc.line(10, 31.5, 200, 31.5);
}

// Helper: Page Footer
function drawFooter(page, totalPages = 3) {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(10, 283, 200, 283);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Buku Panduan SIM RPP & Akademik MQBA Isy Karima · https://akademikmqbaisykarima.pages.dev", 10, 288);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text(`Halaman ${page} dari ${totalPages}`, 200, 288, { align: 'right' });
}

// Helper: Chapter Title Banner
function drawChapterBanner(y, chapterNum, title) {
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, y, 190, 10, 2.5, 2.5, 'F');

  // Gold Badge
  doc.setFillColor(199, 168, 106);
  doc.roundedRect(11.5, y + 1.5, 24, 7, 1.5, 1.5, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(chapterNum, 23.5, y + 6.2, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(title, 39, y + 6.6);

  return y + 14;
}

// Helper: Card Box with Icon/Step
function drawStepCard(y, stepNum, title, steps = []) {
  // Compute card height
  let textHeight = 0;
  steps.forEach(s => {
    const lines = doc.splitTextToSize(s, 168);
    textHeight += (lines.length * 4.5);
  });
  const cardHeight = Math.max(18, textHeight + 11);

  // Background Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, 190, cardHeight, 2.5, 2.5, 'F');
  
  // Left Accent Bar
  doc.setFillColor(14, 116, 144);
  doc.roundedRect(10, y, 3.5, cardHeight, 1.5, 1.5, 'F');

  // Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, 190, cardHeight, 2.5, 2.5, 'D');

  // Step Badge & Title
  doc.setFillColor(224, 242, 254);
  doc.roundedRect(16, y + 2.5, 12, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(3, 105, 161);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(stepNum, 22, y + 6.2, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(title, 31, y + 6.5);

  // Content Lines
  let lineY = y + 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  steps.forEach(s => {
    const lines = doc.splitTextToSize(s, 172);
    doc.text(lines, 16, lineY);
    lineY += (lines.length * 4.5);
  });

  return y + cardHeight + 3.5;
}

// =========================================================================
// HALAMAN 1: COVER PANDUAN & BAB I (LOGIN & KELOLA AKUN)
// =========================================================================
drawOfficialKop();

// Cover Banner Box
doc.setFillColor(254, 252, 246);
doc.roundedRect(10, 35, 190, 36, 3, 3, 'F');
doc.setDrawColor(199, 168, 106);
doc.setLineWidth(0.8);
doc.roundedRect(10, 35, 190, 36, 3, 3, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(15, 23, 42);
doc.text("PANDUAN PRAKTIS & TUTORIAL PENGGUNAAN", 105, 44, { align: 'center' });

doc.setFontSize(10.5);
doc.setTextColor(143, 107, 57);
doc.text("PORTAL SISTEM INFORMASI AKADEMIK & RPP ONLINE", 105, 51, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(71, 85, 105);
doc.text("Panduan Langkah Demi Langkah bagi Asatidz Pengajar & Wali Kelas MQBA Isy Karima", 105, 58, { align: 'center' });

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(14, 116, 144);
doc.text("Link Website Resmi: https://akademikmqbaisykarima.pages.dev", 105, 65, { align: 'center' });

let curY = 76;

// BAB I
curY = drawChapterBanner(curY, "BAB I", "CARA MASUK (LOGIN) & PENGATURAN AKUN");

curY = drawStepCard(curY, "1.1", "Membuka Halaman Website", [
  "1. Buka aplikasi browser (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari) di Laptop atau HP Anda.",
  "2. Ketikkan alamat website resmi: https://akademikmqbaisykarima.pages.dev pada kolom alamat browser.",
  "3. Tunggu hingga halaman utama portal login MQBA Isy Karima tampil di layar."
]);

curY = drawStepCard(curY, "1.2", "Cara Login Sebagai Pengajar / Guru Mapel", [
  "1. Pada kotak pilihan peran di layar login, klik tab bertuliskan 'Pengajar'.",
  "2. Masukkan Username Anda (Contoh: ustadz.aidil, ustadz.dzulfikar, ustadzah.lina, dll.).",
  "3. Masukkan Kata Sandi Default: guru123 lalu klik tombol biru 'Masuk ke Sistem'."
]);

curY = drawStepCard(curY, "1.3", "Cara Login Khusus Wali Kelas", [
  "1. Bagi Asatidz yang ditugaskan sebagai Wali Kelas, pada layar login silakan klik tab 'Wali Kelas'.",
  "2. Masukkan Username Wali Kelas (Contoh: wali.aidil, wali.fredy, wali.lina, wali.latief, wali.abdullah, wali.hasna).",
  "3. Masukkan Kata Sandi: wali123 kemudian klik tombol 'Masuk ke Sistem'."
]);

curY = drawStepCard(curY, "1.4", "Mengubah Kata Sandi & Memperbarui Profil Saya", [
  "1. Setelah berhasil masuk ke dalam sistem, klik menu 'Profil Saya' pada bilah menu di sebelah kiri.",
  "2. Asatidz dapat memperbarui nomor WhatsApp aktif, foto profil, dan mengganti kata sandi default demi menjaga keamanan data pribadi dan akun Anda."
]);

drawFooter(1, 3);

// =========================================================================
// HALAMAN 2: BAB II (PANDUAN FITUR ASATIDZ / GURU MAPEL)
// =========================================================================
doc.addPage();
drawOfficialKop();

curY = 35;
curY = drawChapterBanner(curY, "BAB II", "PANDUAN FITUR KBM & PENILAIAN BAGI GURU MAPEL");

curY = drawStepCard(curY, "2.1", "Pembuatan & Pengajuan RPP (Kurikulum Merdeka)", [
  "1. Klik menu 'RPP Saya' di bilah menu kiri, lalu tekan tombol hijau '+ Buat RPP Baru'.",
  "2. Pilih Mata Pelajaran, Kelas yang Anda ajar, dan Semester berjalan.",
  "3. Gunakan fitur 'Bantuan AI RPP' untuk otomatis membuat draf materi, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Alur Pembelajaran (ATP).",
  "4. Isi rincian pertemuan KBM (Pembuka, Kegiatan Inti, Penutup, dan Asesmen).",
  "5. Klik tombol 'Ajukan ke Kurikulum'. RPP yang telah disetujui (Approved) oleh Ketua Kurikulum dapat langsung diunduh atau dicetak kapan saja."
]);

curY = drawStepCard(curY, "2.2", "Pengisian Absensi KBM (Guru & Santri)", [
  "1. Absensi Mengajar Guru: Buka menu 'Absensi Saya' untuk mengisi catatan kehadiran mengajar harian Anda.",
  "2. Absensi Belajar Santri: Buka menu 'Absensi Santri', pilih Kelas dan Mata Pelajaran Anda, lalu tandai status kehadiran santri (Hadir, Sakit, Izin, atau Alpha). Sistem otomatis merekap persentase kehadiran setiap santri."
]);

curY = drawStepCard(curY, "2.3", "Penginputan Nilai & Catatan Rapor Santri", [
  "1. Klik menu 'Nilai & Rapor' pada bilah menu samping.",
  "2. Pilih Kelas dan Mata Pelajaran yang Anda ampu.",
  "3. Masukkan komponen nilai santri:",
  "    • Nilai Harian (Rata-rata kuis / latihan harian)",
  "    • Nilai Bulanan (Tugas proyek / ulangan bulanan)",
  "    • Nilai UTS (Ujian Tengah Semester)",
  "    • Nilai UAS Tulis (Ujian Akhir Semester Tulis - Bobot 60%)",
  "    • Nilai UAS Lisan (Ujian Lisan / Syafahi)",
  "    • Catatan Guru (Tuliskan evaluasi atau pesan motivasi yang akan dicetak di lembar rapor santri).",
  "4. Klik tombol 'Simpan Nilai'. Nilai Akhir dan Predikat (A, B, C, D) akan dihitung otomatis oleh sistem."
]);

curY = drawStepCard(curY, "2.4", "Evaluasi Pembelajaran Bulanan ke Bagian Kurikulum", [
  "1. Klik menu 'Evaluasi Bulanan Mapel'.",
  "2. Laporkan persentase ketercapaian target materi pembelajaran, kendala yang dihadapi di kelas, dan langkah tindak lanjut yang telah dilakukan.",
  "3. Laporan ini akan dipantau langsung oleh Ketua Kurikulum sebagai bahan evaluasi mutu akademik ma'had."
]);

drawFooter(2, 3);

// =========================================================================
// HALAMAN 3: BAB III (WALI KELAS), BAB IV (BANTUAN) & PENGESAHAN
// =========================================================================
doc.addPage();
drawOfficialKop();

curY = 35;
curY = drawChapterBanner(curY, "BAB III", "PANDUAN KHUSUS FITUR WALI KELAS");

curY = drawStepCard(curY, "3.1", "Rekap Nilai & Pencetakan Rapor Kelas Binaan", [
  "1. Klik menu 'Rekap Rapor Kelas' untuk melihat rangkuman nilai seluruh santri di kelas binaan Anda.",
  "2. Wali Kelas dapat mencetak buku rapor resmi santri dengan menekan tombol 'Print' atau 'Download Rapor PDF' yang telah dilengkapi kop resmi dan tanda tangan digital."
]);

curY = drawStepCard(curY, "3.2", "Penilaian Akhlaq, Adab & Catatan Khusus Wali Kelas", [
  "1. Input Skor Akhlaq & Adab santri (skala 0 - 100) yang langsung terhubung ke kartu nilai rapor santri.",
  "2. Lengkapi catatan deskripsi Kepribadian (Kelakuan, Kerajinan, Kerapian) serta capaian Mutqin Tahfizh Al-Qur'an dan pesan khusus dari Wali Kelas."
]);

curY = drawStepCard(curY, "3.3", "Fitur Baru: Layanan 'Konsultasi Wali Santri'", [
  "1. Buka menu 'Konsultasi Wali Santri' pada akun Wali Kelas.",
  "2. Anda dapat membaca pesan pertanyaan atau konsultasi dari orang tua santri, melihat foto/dokumen lampiran yang dikirimkan, dan langsung menuliskan balasan resmi yang akan diterima oleh orang tua santri."
]);

// BAB IV: BANTUAN & PENGESAHAN
curY = drawChapterBanner(curY, "BAB IV", "LAYANAN BANTUAN & INFORMASI AKADEMIK");

curY = drawStepCard(curY, "4.1", "Fitur 'Tanya Admin' & Pengumuman", [
  "1. Fitur Tanya Admin: Gunakan menu ini jika Asatidz mengalami kendala teknis atau membutuhkan perbaikan data.",
  "2. Menu Pengumuman: Digunakan untuk membaca surat edaran resmi, jadwal ujian, dan kalender kegiatan dari Kurikulum."
]);

// Box Tanda Tangan Resmi
curY += 2;
doc.setFillColor(254, 252, 246);
doc.roundedRect(10, curY, 190, 36, 2.5, 2.5, 'F');
doc.setDrawColor(199, 168, 106);
doc.setLineWidth(0.6);
doc.roundedRect(10, curY, 190, 36, 2.5, 2.5, 'D');

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(51, 65, 85);
doc.text("Buku panduan ini diterbitkan secara resmi sebagai pedoman operasional seluruh Asatidz Pengajar dan Wali Kelas.", 14, curY + 6.5);
doc.text("Semoga Allah Subhanahu wa Ta'ala senantiasa memudahkan seluruh ikhtiar kita dalam mendidik para penghafal Al-Qur'an.", 14, curY + 11.5);

// Tanda Tangan Kanan
doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(15, 23, 42);
doc.text("Karanganyar, 20 Agustus 2026", 140, curY + 18);
doc.text("Ketua Kurikulum MQBA Isy Karima,", 140, curY + 22.5);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(14, 116, 144);
doc.text("Ust. Aidil Aqli, S.Ag.", 140, curY + 31);

drawFooter(3, 3);

// Save PDF
const buffer = doc.output('arraybuffer');
fs.writeFileSync('Panduan_SIM_RPP_Akademik_MQBA.pdf', Buffer.from(buffer));
fs.writeFileSync('public/Panduan_SIM_RPP_Akademik_MQBA.pdf', Buffer.from(buffer));

console.log('Premium Tutorial PDF generated successfully!');
