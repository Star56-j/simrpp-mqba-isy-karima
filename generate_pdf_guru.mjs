import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

// Data Akun Pengajar & Wali Kelas MQBA Isy Karima
const guruData = [
  { no: 1, name: 'Ust. Muhammad Abdul Malik Ibrahim, S.Kom', role: 'Guru', username: 'ustadz.abdul.malik', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 2, name: 'Ust. Umar Alamuddin, Lc., Al-Hafizh', role: 'Guru', username: 'ustadz.umar', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 3, name: 'Ust. Dzulfikar Tri Baskara, S.Ag, M.Pd', role: 'Guru', username: 'ustadz.dzulfikar', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 4, name: 'Ust. Nashiruddin Karim, Lc., Al-Hafizh', role: 'Guru', username: 'ustadz.karim', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 5, name: 'Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh', role: 'Guru & Wali Kelas', username: 'ustadz.fredy / wali.fredy', pass: 'guru123 / wali123', info: 'Wali Kelas VIII Putra' },
  { no: 6, name: 'Ust. Muhammad Ilyas Abdullah', role: 'Guru', username: 'ustadz.abdullah', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 7, name: 'Usth. Aulia Anim Amanillah', role: 'Guru', username: 'ustadzah.anim', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 8, name: 'Usth. Iffah Luthfiyah', role: 'Guru', username: 'ustadzah.iffah', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 9, name: 'Ust. Yunan Hidayat, Al Hafizh', role: 'Guru', username: 'ustadz.yunan', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 10, name: 'Ust. Faqih Hidayat, Lc', role: 'Guru', username: 'ustadz.faqih', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 11, name: 'Usth. Indri Nur Bidari, S.Si', role: 'Guru', username: 'ustadzah.indri', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 12, name: 'Ust. Aidil Aqli, S.Ag.', role: 'Guru & Wali Kelas', username: 'ustadz.aidil / wali.aidil', pass: 'guru123 / wali123', info: 'Wali Kelas VII Putra' },
  { no: 13, name: 'Usth. Saiba Musyaiya', role: 'Guru', username: 'ustadzah.saiba.musyaiya', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 14, name: 'Ust. M. Arya Mukti al-Hafizh', role: 'Guru', username: 'ustadz.arya', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 15, name: 'Ust. Abdul Kholif al-Hafizh', role: 'Guru', username: 'ustadz.kholif', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 16, name: 'Usth. Bela Dwi Lestari, S.Pd., Gr', role: 'Guru', username: 'ustadzah.bela', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 17, name: 'Ust. Farhan Akhandi', role: 'Guru', username: 'ustadz.farhan', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 18, name: 'Ust. Tubagus Ahadiyat Rachmadi Luhur, S.Ag.', role: 'Guru', username: 'ustadz.tubagus', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 19, name: 'Ust. Muhammad Hafizh, S.Si', role: 'Guru', username: 'ustadz.hafizh', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 20, name: 'Usth. Rifanisa Nurulfitria, S.Hum., M.Si.', role: 'Guru', username: 'ustadzah.fani', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 21, name: 'Ust. Azri Robani Indra Robbi, S.Ag.', role: 'Guru', username: 'ustadz.azri', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 22, name: 'Usth. Extika Nur Fadhillah', role: 'Guru', username: 'ustadzah.dila', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 23, name: 'Usth. Azizah Nur Aini, S.Pd., Gr', role: 'Guru', username: 'ustadzah.azizah', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 24, name: 'Usth. Hasri Haryani Direja, S.Ds', role: 'Guru', username: 'ustadzah.hasri', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 25, name: 'Ust. Muhammad Latief Amiruddin, S.T.', role: 'Guru & Wali Kelas', username: 'ustadz.latief / wali.latief', pass: 'guru123 / wali123', info: 'Wali Kelas IX Putra' },
  { no: 26, name: 'Ust. Akmal Firmana, ST', role: 'Guru', username: 'ustadz.akmal', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 27, name: 'Usth. Lina Ayu Fitriyyah, S.Ag.', role: 'Guru & Wali Kelas', username: 'ustadzah.lina / wali.lina', pass: 'guru123 / wali123', info: 'Wali Kelas VII Putri' },
  { no: 28, name: 'Ust. Rezkidar', role: 'Guru', username: 'ustadz.rezkidar', pass: 'guru123', info: 'Pengajar Mapel' },
  { no: 29, name: 'Ust. Abdullah Kristianto, S.Sos.', role: 'Guru & Wali Kelas', username: 'ustadz.abdullah / wali.abdullah', pass: 'guru123 / wali123', info: 'Pengajar ABY VII & I\'dad Putra, Wali Kelas I\'dad Putra' },
  { no: 30, name: 'Usth. Hasna Halimatun Basyaria, S.Ag.', role: 'Wali Kelas', username: 'wali.hasna', pass: 'wali123', info: 'Wali Kelas I\'dad & VIII Putri' }
];

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
} catch (e) {}

// Helper: Official MQBA Kop Surat Header
function drawOfficialKop() {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');

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

  // Double Divider Line
  doc.setDrawColor(199, 168, 106);
  doc.setLineWidth(1.2);
  doc.line(10, 30, 200, 30);

  doc.setDrawColor(14, 116, 144);
  doc.setLineWidth(0.4);
  doc.line(10, 31.5, 200, 31.5);
}

drawOfficialKop();

// Document Title Box
doc.setFillColor(254, 252, 246);
doc.roundedRect(10, 35, 190, 20, 2.5, 2.5, 'F');
doc.setDrawColor(199, 168, 106);
doc.setLineWidth(0.6);
doc.roundedRect(10, 35, 190, 20, 2.5, 2.5, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(15, 23, 42);
doc.text('DAFTAR AKUN & KREDENSIAL LOGIN PENGARAH / USTADZ / USTADZAH', 105, 43, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(71, 85, 105);
doc.text('Portal Resmi SIM RPP & Akademik: https://akademikmqbaisykarima.pages.dev', 105, 50, { align: 'center' });

// Table
const tableRows = guruData.map(g => [
  g.no.toString(),
  g.name,
  g.role,
  g.username,
  g.pass,
  g.info
]);

autoTable(doc, {
  startY: 58,
  head: [['No', 'Nama Ustadz / Ustadzah', 'Peran / Role', 'Username / Email', 'Kata Sandi Default', 'Keterangan / Pengampu']],
  body: tableRows,
  theme: 'grid',
  headStyles: {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 8,
    halign: 'center',
    valign: 'middle'
  },
  bodyStyles: {
    fontSize: 8,
    textColor: [30, 41, 59],
    valign: 'middle'
  },
  columnStyles: {
    0: { halign: 'center', cellWidth: 8 },
    1: { fontStyle: 'bold', cellWidth: 54 },
    2: { halign: 'center', cellWidth: 26 },
    3: { fontStyle: 'bold', textColor: [14, 116, 144], cellWidth: 42 },
    4: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 27 },
    5: { cellWidth: 33 }
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
      `Dokumen Resmi Akademik MQBA Isy Karima · Halaman ${data.pageNumber} dari ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
});

// Final notes on last page
const finalY = (doc).lastAutoTable.finalY + 6;
if (finalY < 250) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Petunjuk Penggunaan Akun:', 10, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Buka browser dan kunjungi: https://akademikmqbaisykarima.pages.dev', 10, finalY + 4.5);
  doc.text('2. Pilih tab "Pengajar" atau "Wali Kelas" pada layar login.', 10, finalY + 8.5);
  doc.text('3. Masukkan Username / Email serta Kata Sandi default sebagaimana tercantum pada tabel di atas.', 10, finalY + 12.5);
  doc.text('4. Demi keamanan, setiap Asatidz disarankan mengganti kata sandi setelah berhasil login di menu "Profil Saya".', 10, finalY + 16.5);

  // Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Karanganyar, 20 Agustus 2026', 145, finalY + 4);
  doc.text('Ketua Kurikulum MQBA Isy Karima,', 145, finalY + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144);
  doc.text('Ust. Aidil Aqli, S.Ag.', 145, finalY + 24);
}

// Save PDF
const buffer = doc.output('arraybuffer');
fs.writeFileSync('Daftar_Login_Guru_MQBA_Isy_Karima.pdf', Buffer.from(buffer));
fs.writeFileSync('public/Daftar_Login_Guru_MQBA_Isy_Karima.pdf', Buffer.from(buffer));

console.log('Account List PDF updated successfully with correct Kop Surat!');
