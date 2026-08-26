import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RPP, EvaluasiPembelajaran, EvaluasiWaliKelas, AcademicYear, Santri, SchoolClass, Semester, Nilai, Subject, RaporDetail } from '../types';
import { computeRaporScore } from './nilaiWeights';

const BULAN_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Helper: Bulletproof Save Blob to Downloads
export function savePdfBlob(doc: jsPDF, filename: string) {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    doc.save(cleanFilename);
  } catch (err) {
    console.warn('doc.save failed, trying blob URL fallback:', err);
    try {
      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (e) {
      console.error('All PDF download mechanisms failed:', e);
    }
  }
}

// Helper: Add Official MQBA Header
function addMQBAHeader(doc: jsPDF, title: string) {
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA", 105, 14, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA', 105, 19.5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Karanganyar, Jawa Tengah, Indonesia | info@isykarima.id', 105, 24, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Double line header
  doc.setLineWidth(0.8);
  doc.line(15, 27, 195, 27);
  doc.setLineWidth(0.3);
  doc.line(15, 28.5, 195, 28.5);

  // Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(title.toUpperCase(), 105, 34.5, { align: 'center' });
  return 40;
}

// 1. DIRECT DOWNLOAD RPP AS PDF FILE
export function downloadRPPPdf(rpp: RPP) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const teacherName = rpp.teacher?.name || (rpp as any).teacherName || myUser.name || 'Guru Pengajar';
  const subjectName = rpp.subject?.name || (rpp as any).subjectName || 'Mata Pelajaran';
  const className = rpp.class?.name || (rpp as any).className || '-';
  const classLevel = rpp.class?.level || '';
  const academicYearName = rpp.academicYear?.name || (rpp as any).academicYearName || '-';

  let y = addMQBAHeader(doc, 'Rencana Pelaksanaan Pembelajaran (RPP) Kurikulum Merdeka');

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 1.2, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 4 }, 2: { cellWidth: 134 } },
    body: [
      ['Mata Pelajaran', ':', `${subjectName} ${rpp.subject?.category ? `(${rpp.subject.category})` : ''}`],
      ['Kelas / Jenjang', ':', `Kelas ${className} ${classLevel ? `(${classLevel})` : ''}`],
      ['Nama Pengajar', ':', teacherName],
      ['Tahun Ajaran', ':', `Tahun Pelajaran ${academicYearName}`],
      ['Jumlah Pertemuan', ':', `Ganjil: ${rpp.totalMeetingsGanjil || 16} | Genap: ${rpp.totalMeetingsGenap || 16} pertemuan`],
      ['Profil Pelajar', ':', rpp.profilPelajar || '-'],
      ['Sarana & Prasarana', ':', rpp.sarana || '-']
    ]
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 3;

  const addSection = (secTitle: string, content: string) => {
    if (y > 260) { doc.addPage(); y = 15; }
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(secTitle, 15, y);
    doc.setLineWidth(0.2);
    doc.line(15, y + 1, 195, y + 1);
    y += 4.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(content || '-', 180);
    doc.text(lines, 15, y);
    y += (lines.length * 4.2) + 3;
  };

  addSection('I. Capaian Pembelajaran (CP)', rpp.capaiPembelajaran || '-');
  addSection('II. Tujuan Pembelajaran (TP)', rpp.tujuanPembelajaran || '-');
  addSection('III. Alur Tujuan Pembelajaran (ATP)', rpp.alurTP || '-');
  addSection('IV. Materi Pembelajaran Ganjil & Genap', `Semester Ganjil:\n${rpp.materiGanjil || '-'}\n\nSemester Genap:\n${rpp.materiGenap || '-'}`);
  addSection('V. Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)', `1. Pendahuluan:\n${rpp.pendahuluan || '-'}\n\n2. Kegiatan Inti:\n${rpp.kegiatanInti || '-'}\n\n3. Penutup:\n${rpp.penutup || '-'}`);
  addSection('VI. Metode, Media & Asesmen', `Metode: ${rpp.metode || '-'}\nMedia: ${rpp.media || '-'}\nAsesmen Diagnostik: ${rpp.asesmenDiagnostik || '-'}\nAsesmen Formatif: ${rpp.asesmenFormatif || '-'}\nAsesmen Sumatif: ${rpp.asesmenSumatif || '-'}`);

  const syllabus = rpp.syllabusItems || [];
  if (syllabus.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('VII. Silabus Rincian Pertemuan', 15, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { font: 'times', fontSize: 8.5, cellPadding: 1.8 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      head: [['Sem', 'No', 'Materi / Pokok Bahasan', 'Tgl Rencana']],
      body: syllabus.map(s => [s.semester, s.meetingNo, s.topic, s.date || '-'])
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;
  }

  if (y > 240) { doc.addPage(); y = 20; } else { y += 5; }
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Menyetujui,', 45, y, { align: 'center' });
  doc.text('Kepala Kurikulum MQBA', 45, y + 4.5, { align: 'center' });

  doc.text(`Karanganyar, ${todayStr}`, 155, y, { align: 'center' });
  doc.text('Guru Pengajar', 155, y + 4.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text('( Ust. Aidil Aqli, S.Ag. )', 45, y + 24, { align: 'center' });
  doc.text(`( ${teacherName} )`, 155, y + 24, { align: 'center' });

  savePdfBlob(doc, `RPP_${subjectName.replace(/\s+/g, '_')}_Kelas_${className}.pdf`);
}

// 2. DIRECT DOWNLOAD EVALUASI GURU AS PDF FILE
export function downloadEvaluasiGuruPdf(ev: EvaluasiPembelajaran, academicYears: AcademicYear[], semesters: Semester[]) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const ayObj = academicYears.find(a => a.id === ev.academicYearId);
  const semObj = semesters.find(s => s.id === ev.semesterId);
  const jenis = ev.jenisEvaluasi || 'Bulanan';
  const headerTitle = jenis === 'Tahunan'
    ? 'Laporan Evaluasi Pembelajaran Tahunan Guru'
    : jenis === 'Semester'
    ? 'Laporan Evaluasi Pembelajaran Semester Guru'
    : 'Laporan Evaluasi Pembelajaran Bulanan Guru';

  const periodeStr = jenis === 'Tahunan'
    ? `Tahun Ajaran ${ayObj?.name || '-'}`
    : jenis === 'Semester'
    ? `Semester ${semObj?.name || '-'} ${ev.tahun} · TA ${ayObj?.name || '-'}`
    : `Bulan ${BULAN_NAMES[ev.bulan]} ${ev.tahun} · Semester ${semObj?.name || '-'} TA ${ayObj?.name || '-'}`;

  let y = addMQBAHeader(doc, headerTitle);

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 1.2, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 4 }, 2: { cellWidth: 134 } },
    body: [
      ['Nama Guru', ':', ev.teacher?.name || '-'],
      ['Mata Pelajaran', ':', ev.subject?.name || '-'],
      ['Kelas Bimbingan', ':', ev.class?.name || '-'],
      ['Jenis & Periode', ':', `Evaluasi ${jenis} (${periodeStr})`],
      ['Keterlaksanaan KBM', ':', `${ev.totalPertemuanTerlaksana} dari ${ev.totalPertemuanRencana} Pertemuan (${ev.persentaseTerlaksana}%) - Predikat: ${ev.predikatKetercapaian}`]
    ]
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 3;

  const addSec = (title: string, body: string) => {
    if (y > 255) { doc.addPage(); y = 15; }
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(title, 15, y);
    doc.setLineWidth(0.2);
    doc.line(15, y + 1, 195, y + 1);
    y += 4.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(body || '-', 180);
    doc.text(lines, 15, y);
    y += (lines.length * 4.2) + 3;
  };

  const rencanaTitle = jenis === 'Tahunan' ? 'Rencana Tahun Ajaran Berikutnya' : jenis === 'Semester' ? 'Rencana Semester Berikutnya' : 'Rencana Bulan Depan';

  addSec('I. Ketercapaian Tujuan Pembelajaran (TP)', `TP Tercapai:\n${ev.tpTercapai || '-'}\n\nTP Belum Tercapai / Perlu Penguatan:\n${ev.tpBelumTercapai || '-'}`);
  addSec('II. Hasil Asesmen & Catatan', `Hasil Asesmen:\n${ev.asesmenFormatifHasil || '-'}\n\nCatatan Hasil Asesmen:\n${ev.asesmenCatatan || '-'}`);
  addSec('III. Kendala Pembelajaran & Solusi', `Kendala yang Dihadapi:\n${ev.kendala || '-'}\n\nSolusi / Tindak Lanjut:\n${ev.solusi || '-'}`);
  addSec('IV. Diferensiasi, Rencana & Refleksi Guru', `Diferensiasi Pembelajaran:\n${ev.diferenciasiDilakukan || '-'}\n\n${rencanaTitle}:\n${ev.rencanaBulanDepan || '-'}\n\nRefleksi Guru:\n${ev.refleksiGuru || '-'}`);

  if (y > 240) { doc.addPage(); y = 20; } else { y += 5; }
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Menyetujui,', 45, y, { align: 'center' });
  doc.text('Kepala Kurikulum MQBA', 45, y + 4.5, { align: 'center' });

  doc.text(`Karanganyar, ${todayStr}`, 155, y, { align: 'center' });
  doc.text('Guru Pengajar', 155, y + 4.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text('( Ust. Aidil Aqli, S.Ag. )', 45, y + 24, { align: 'center' });
  doc.text(`( ${ev.teacher?.name || 'Guru'} )`, 155, y + 24, { align: 'center' });

  const filenameSuffix = jenis === 'Tahunan'
    ? `TA_${(ayObj?.name || 'TA').replace(/[^a-zA-Z0-9]/g, '_')}`
    : jenis === 'Semester'
    ? `Sem_${(semObj?.name || 'Sem').replace(/[^a-zA-Z0-9]/g, '_')}_${ev.tahun}`
    : `${BULAN_NAMES[ev.bulan]}_${ev.tahun}`;

  savePdfBlob(doc, `Evaluasi_${jenis}_${(ev.teacher?.name || 'Guru').replace(/\s+/g, '_')}_${filenameSuffix}.pdf`);
}

// 3. DIRECT DOWNLOAD EVALUASI WALI KELAS AS PDF FILE
export function downloadEvaluasiWaliKelasPdf(ev: EvaluasiWaliKelas) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const periodeStr = ev.tipePeriode === 'bulanan'
    ? `Bulan ${ev.bulan || ''} ${ev.tahun || ''}`
    : `Semester ${ev.semester || ''} TA ${ev.tahunAjaran || ''}`;

  let y = addMQBAHeader(doc, 'Laporan Evaluasi Wali Kelas');

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 1.2, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 4 }, 2: { cellWidth: 134 } },
    body: [
      ['Kelas Bimbingan', ':', ev.kelasNama || '-'],
      ['Nama Wali Kelas', ':', ev.guruNama || '-'],
      ['Periode Evaluasi', ':', periodeStr],
      ['Tanggal Laporan', ':', ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-']
    ]
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 3;

  const addSec = (title: string, body: string) => {
    if (y > 255) { doc.addPage(); y = 15; }
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(title, 15, y);
    doc.setLineWidth(0.2);
    doc.line(15, y + 1, 195, y + 1);
    y += 4.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(body || '-', 180);
    doc.text(lines, 15, y);
    y += (lines.length * 4.2) + 3;
  };

  addSec('I. Laporan KBM & Kedisiplinan Pembelajaran Kelas', ev.laporanKbm || '-');
  addSec('II. Permasalahan & Kendala Khusus Kelas', ev.masalahKelas || '-');
  addSec('III. Catatan Perkembangan Santri & Karakter', ev.perkembanganSantri || '-');
  addSec('IV. Usulan & Rekomendasi kepada Kurikulum', ev.rekomendasiKurikulum || '-');
  if (ev.tanggapanAdmin) {
    addSec('V. Tanggapan / Solusi dari Kurikulum', ev.tanggapanAdmin);
  }

  if (y > 240) { doc.addPage(); y = 20; } else { y += 5; }
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Menyetujui,', 45, y, { align: 'center' });
  doc.text('Kepala Kurikulum MQBA', 45, y + 4.5, { align: 'center' });

  doc.text(`Karanganyar, ${todayStr}`, 155, y, { align: 'center' });
  doc.text('Wali Kelas', 155, y + 4.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text('( Ust. Aidil Aqli, S.Ag. )', 45, y + 24, { align: 'center' });
  doc.text(`( ${ev.guruNama || 'Wali Kelas'} )`, 155, y + 24, { align: 'center' });

  savePdfBlob(doc, `Evaluasi_WaliKelas_${(ev.kelasNama || 'Kelas').replace(/\s+/g, '_')}.pdf`);
}

// 4. DIRECT DOWNLOAD REKAP KEHADIRAN GURU AS PDF FILE
export function downloadRekapKehadiranPdf(items: any[], academicYears: AcademicYear[], filterAY: string, periodTitle: string, filterYear: string) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const ayObj = academicYears.find(a => a.id === filterAY);
  const ayName = ayObj?.name || 'Semua TA';

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA", 148.5, 12, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA', 148.5, 17, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(15, 20, 282, 20);

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(`REKAP KEHADIRAN MENGAJAR GURU - ${periodTitle.toUpperCase()} ${filterYear}`, 148.5, 26, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('times', 'normal');
  doc.text(`Tahun Pelajaran: ${ayName}`, 148.5, 31, { align: 'center' });

  const safeItems = items && items.length > 0 ? items : [];

  autoTable(doc, {
    startY: 35,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
    headStyles: { fillColor: [15, 41, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
      2: { halign: 'left', cellWidth: 78 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    head: [['No', 'Nama Asatidz / Ustazah', 'Mata Pelajaran yang Diampu', 'H', 'S', 'I', 'A', 'Total JP Wajib', 'Total Kehadiran', '% Hadir']],
    body: safeItems.length > 0 ? safeItems.map((it, idx) => {
      const hadir = Number(it.hadir) || 0;
      const sakit = Number(it.sakit) || 0;
      const izin = Number(it.izin) || 0;
      const alpha = Number(it.alpha || it.alpa) || 0;
      const total = Number(it.total) || (hadir + sakit + izin + alpha) || 0;
      const pct = it.persentaseHadir !== undefined ? it.persentaseHadir : (total > 0 ? Math.round((hadir / total) * 100) : 0);
      const subjectText = it.subjectsTaught || it.subjectName || 'Pengajar MQBA';
      return [
        idx + 1,
        it.teacherName || it.guruName || 'Pengajar',
        subjectText,
        hadir,
        sakit,
        izin,
        alpha,
        total,
        hadir,
        `${pct}%`
      ];
    }) : [['1', 'Data Kehadiran', 'Pengajar MQBA', '0', '0', '0', '0', '0', '0', '0%']]
  });

  const finalY = ((doc as any).lastAutoTable?.finalY ?? 40) + 8;
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Karanganyar, ${todayStr}`, 240, finalY, { align: 'center' });
  doc.text('Kepala Kurikulum MQBA', 240, finalY + 4.5, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('( Ust. Aidil Aqli, S.Ag. )', 240, finalY + 24, { align: 'center' });

  savePdfBlob(doc, `Rekap_Kehadiran_Guru_${periodTitle.replace(/\s+/g, '_')}_${filterYear}.pdf`);
}

// 5. DIRECT DOWNLOAD RAPOR SANTRI AS PDF FILE
export function downloadRaporPdf(
  santri: Santri,
  cls: SchoolClass,
  ay: AcademicYear,
  sem: Semester,
  nilaiList: Nilai[],
  subjects: Subject[],
  raporDetail: RaporDetail | null,
  waliKelasName: string,
  ketuaUnitName: string = 'Ust. Aidil Aqli, S.Ag.',
  akhlaqScore: number = 90
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // PAGE 1: Academic Scores & Extracurriculars
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA", 105, 14, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA', 105, 19.5, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Karanganyar, Jawa Tengah, Indonesia | info@isykarima.id', 105, 24, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.setLineWidth(0.8);
  doc.line(15, 27, 195, 27);
  doc.setLineWidth(0.3);
  doc.line(15, 28.5, 195, 28.5);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN HASIL BELAJAR SANTRI (RAPOR)', 105, 34.5, { align: 'center' });

  autoTable(doc, {
    startY: 38,
    theme: 'plain',
    styles: { font: 'times', fontSize: 9.5, cellPadding: 1, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 }, 1: { cellWidth: 4 }, 2: { cellWidth: 65 }, 3: { fontStyle: 'bold', cellWidth: 28 }, 4: { cellWidth: 4 }, 5: { cellWidth: 55 } },
    body: [
      ['Nama Santri', ':', santri.name, 'Kelas', ':', `${cls.name} (${cls.level || ''})`],
      ['NIS / NISN', ':', `${santri.nis || '-'} / ${raporDetail?.nisn || '-'}`, 'Semester / TA', ':', `${sem.name} / ${ay.name}`]
    ]
  });

  let y = ((doc as any).lastAutoTable?.finalY ?? 40) + 4;

  const santriNilai = (nilaiList || []).filter(n => n.santriId === santri.id);
  const subjectsToDisplay = subjects && subjects.length > 0 ? subjects : [];

  const nilaiRows = subjectsToDisplay.map((subj, idx) => {
    const n = santriNilai.find(item => item.subjectId === subj.id);
    const weighted = n ? computeRaporScore(n, akhlaqScore) : null;
    const score = weighted ? weighted.nilaiAkhirTulis : 0;
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score > 0 ? 'D' : '-';
    return [
      idx + 1,
      subj.name,
      (subj as any).kkm || 70,
      score > 0 ? Math.round(score) : '-',
      grade,
      score >= 80 ? 'Sangat baik dalam memahami materi' : score >= 70 ? 'Cukup baik, perlu ditingkatkan' : 'Perlu bimbingan dan remedial'
    ];
  });

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('A. NILAI CAPAIAN AKADEMIK', 15, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 1.6 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 70 }
    },
    head: [['No', 'Mata Pelajaran', 'KKM', 'Nilai', 'Predikat', 'Capaian Kompetensi']],
    body: nilaiRows.length > 0 ? nilaiRows : [['1', 'Semua Mata Pelajaran', '70', '-', '-', 'Belum ada nilai diinput']]
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 5;

  // PAGE 2: Ekstra, Karakter & Signatures
  doc.addPage();
  y = 15;

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('B. KETIDAKHADIRAN', 15, y);
  y += 2.5;

  const absen = (raporDetail as any)?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', cellWidth: 60 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } },
    head: [['Keterangan', 'Jumlah', 'Satuan']],
    body: [
      ['Sakit', absen.sakit || 0, 'Pertemuan'],
      ['Izin', absen.izin || 0, 'Pertemuan'],
      ['Tanpa Keterangan', absen.tanpaKeterangan || 0, 'Pertemuan']
    ]
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 5;

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('C. CATATAN & REKOMENDASI WALI KELAS', 15, y);
  y += 4;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  const noteLines = doc.splitTextToSize(raporDetail?.catatanWaliKelas || 'Tingkatkan terus prestasi belajar dan kedisiplinan beribadah.', 180);
  doc.text(noteLines, 15, y);
  y += (noteLines.length * 4.5) + 6;

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);

  doc.text('Orang Tua / Wali Santri', 35, y, { align: 'center' });
  doc.text('Mengetahui,', 105, y, { align: 'center' });
  doc.text('Ketua Unit MQBA', 105, y + 4.5, { align: 'center' });

  doc.text(`Karanganyar, ${todayStr}`, 165, y, { align: 'center' });
  doc.text('Wali Kelas', 165, y + 4.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text('( ........................................ )', 35, y + 24, { align: 'center' });
  doc.text(`( ${ketuaUnitName} )`, 105, y + 24, { align: 'center' });
  doc.text(`( ${waliKelasName} )`, 165, y + 24, { align: 'center' });

  savePdfBlob(doc, `Rapor_${santri.name.replace(/\s+/g, '_')}_Kelas_${cls.name}.pdf`);
}

// 6. DIRECT DOWNLOAD REKAP SANTRI ABSENSI AS PDF FILE
export function downloadRekapSantriPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: any[][],
  filename: string
) {
  const isLandscape = headers.length > 7;
  const doc = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
  const centerX = isLandscape ? 148.5 : 105;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA", centerX, 13, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA', centerX, 18, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(15, 21, isLandscape ? 282 : 195, 21);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), centerX, 28, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('times', 'normal');
  doc.text(subtitle, centerX, 33, { align: 'center' });

  const safeRows = rows && rows.length > 0 ? rows : [];

  autoTable(doc, {
    startY: 37,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
    headStyles: { fillColor: [15, 41, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [headers],
    body: safeRows.length > 0 ? safeRows : [['1', 'Data kosong', '-', '-', '-', '-', '-', '-']]
  });

  const finalY = ((doc as any).lastAutoTable?.finalY ?? 40) + 8;
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const sigX = isLandscape ? 240 : 155;
  if (finalY < (isLandscape ? 180 : 255)) {
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Karanganyar, ${todayStr}`, sigX, finalY, { align: 'center' });
    doc.text('Kepala Kurikulum MQBA', sigX, finalY + 4.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('( Ust. Aidil Aqli, S.Ag. )', sigX, finalY + 24, { align: 'center' });
  }

  savePdfBlob(doc, filename);
}

// 7. DIRECT DOWNLOAD REKAP NILAI SANTRI AS PDF FILE
export function downloadNilaiSantriPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: any[][],
  filename: string
) {
  const isLandscape = headers.length > 7;
  const doc = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
  const centerX = isLandscape ? 148.5 : 105;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text("MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA", centerX, 13, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA', centerX, 18, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(15, 21, isLandscape ? 282 : 195, 21);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), centerX, 28, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('times', 'normal');
  doc.text(subtitle, centerX, 33, { align: 'center' });

  const safeRows = rows && rows.length > 0 ? rows : [];

  autoTable(doc, {
    startY: 37,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 1.8, halign: 'center' },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [headers],
    body: safeRows.length > 0 ? safeRows : [['1', 'Data kosong', '-', '-', '-', '-', '-', '-']]
  });

  const finalY = ((doc as any).lastAutoTable?.finalY ?? 40) + 8;
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const sigX = isLandscape ? 240 : 155;
  if (finalY < (isLandscape ? 180 : 255)) {
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Karanganyar, ${todayStr}`, sigX, finalY, { align: 'center' });
    doc.text('Kepala Kurikulum MQBA', sigX, finalY + 4.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text('( Ust. Aidil Aqli, S.Ag. )', sigX, finalY + 24, { align: 'center' });
  }

  savePdfBlob(doc, filename);
}
