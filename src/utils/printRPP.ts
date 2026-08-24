import { RPP } from '../types';

export const printRPP = (rpp: RPP) => {
  const w = window.open('', '_blank');
  if (!w) return;
  const ganjilRows = (rpp.syllabusItems || []).filter(s => s.semester === 'Ganjil')
    .map(s => `<tr><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.meetingNo}</td><td style="padding:4px 8px;border:1px solid #ccc;">${s.topic}</td><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.date || '-'}</td></tr>`).join('');
  const genapRows = (rpp.syllabusItems || []).filter(s => s.semester === 'Genap')
    .map(s => `<tr><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.meetingNo}</td><td style="padding:4px 8px;border:1px solid #ccc;">${s.topic}</td><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.date || '-'}</td></tr>`).join('');

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const teacherName = rpp.teacher?.name || (rpp as any).teacherName || myUser.name || 'Guru Pengajar';
  const subjectName = rpp.subject?.name || (rpp as any).subjectName || 'Mata Pelajaran';
  const className = rpp.class?.name || (rpp as any).className || '-';
  const classLevel = rpp.class?.level || '';
  const academicYearName = rpp.academicYear?.name || (rpp as any).academicYearName || '-';

  w.document.write(`<!DOCTYPE html><html><head><title>RPP - ${subjectName}</title>
  <style>
    body{font-family:'Times New Roman',serif;line-height:1.7;padding:40px;color:#111;font-size:13px;}
    .header{text-align:center;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:22px;}
    .header h1{font-size:17px;margin:0;font-weight:bold;text-transform:uppercase;}
    .header h2{font-size:14px;margin:4px 0 0;font-weight:normal;}
    .header p{font-size:11px;margin:2px 0 0;color:#555;}
    .title{text-align:center;font-weight:bold;font-size:14px;text-transform:uppercase;margin-bottom:20px;text-decoration:underline;letter-spacing:1px;}
    table.id{width:100%;border-collapse:collapse;margin-bottom:18px;}
    table.id td{padding:3px 0;vertical-align:top;}
    table.id td.lbl{width:200px;}
    table.id td.col{width:16px;text-align:center;}
    .sec{font-weight:bold;font-size:12px;text-transform:uppercase;margin-top:16px;margin-bottom:6px;border-bottom:1px solid #000;padding-bottom:2px;letter-spacing:.5px;}
    .cnt{font-size:13px;margin-left:12px;white-space:pre-wrap;text-align:justify;margin-bottom:12px;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
    .box{border:1px solid #bbb;border-radius:4px;padding:10px;}
    .box-title{font-weight:bold;font-size:11px;text-transform:uppercase;margin-bottom:6px;}
    .box-blue .box-title{color:#1d4ed8;}
    .box-violet .box-title{color:#7c3aed;}
    .box-amber .box-title{color:#b45309;}
    .box-indigo .box-title{color:#065f46;}
    .sem-box{border:1px solid #bbb;border-radius:4px;padding:12px;margin-bottom:14px;}
    .sem-title{font-weight:bold;font-size:12px;margin-bottom:8px;text-transform:uppercase;}
    table.syl{width:100%;border-collapse:collapse;font-size:12px;}
    table.syl th{background:#f0f0f0;padding:5px 8px;border:1px solid #ccc;text-align:left;}
    .sigs{width:100%;border-collapse:collapse;margin-top:48px;}
    .sigs td{text-align:center;font-size:13px;width:50%;}
    .sig-space{height:70px;}
  </style></head><body>
  <div class="header">
    <h1>Markaz Qur'an dan Bahasa Arab (MQBA) Isy Karima</h1>
    <h2>Yayasan Sosial dan Pendidikan Isy Karima</h2>
    <p>Karanganyar, Jawa Tengah, Indonesia &nbsp;|&nbsp; info@isykarima.id</p>
  </div>
  <div class="title">Rencana Pelaksanaan Pembelajaran (RPP) Kurikulum Merdeka</div>
  <table class="id">
    <tr><td class="lbl">Mata Pelajaran</td><td class="col">:</td><td><strong>${subjectName} ${rpp.subject?.category ? `(${rpp.subject.category})` : ''}</strong></td></tr>
    <tr><td class="lbl">Kelas / Jenjang</td><td class="col">:</td><td>Kelas ${className} ${classLevel ? `(${classLevel})` : ''}</td></tr>
    <tr><td class="lbl">Nama Pengajar</td><td class="col">:</td><td><strong>${teacherName}</strong></td></tr>
    <tr><td class="lbl">Tahun Ajaran</td><td class="col">:</td><td>Tahun Pelajaran ${academicYearName}</td></tr>
    <tr><td class="lbl">Jumlah Pertemuan</td><td class="col">:</td><td>Ganjil: ${rpp.totalMeetingsGanjil || 16} &nbsp;|&nbsp; Genap: ${rpp.totalMeetingsGenap || 16} pertemuan</td></tr>
    <tr><td class="lbl">Profil Pelajar</td><td class="col">:</td><td>${rpp.profilPelajar || '-'}</td></tr>
    <tr><td class="lbl">Sarana & Prasarana</td><td class="col">:</td><td>${rpp.sarana || '-'}</td></tr>
  </table>
  <div class="sec">I. Capaian Pembelajaran (CP)</div><div class="cnt">${rpp.capaiPembelajaran || '-'}</div>
  <div class="sec">II. Tujuan Pembelajaran (TP)</div><div class="cnt">${rpp.tujuanPembelajaran || '-'}</div>
  <div class="sec">III. Alur Tujuan Pembelajaran (ATP)</div><div class="cnt">${rpp.alurTP || '-'}</div>
  <div class="sec">IV. Materi Pembelajaran</div>
  <div class="grid2">
    <div class="box box-blue"><div class="box-title">Semester Ganjil (${rpp.totalMeetingsGanjil || 16} pertemuan)</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.materiGanjil || '-'}</div></div>
    <div class="box box-violet"><div class="box-title">Semester Genap (${rpp.totalMeetingsGenap || 16} pertemuan)</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.materiGenap || '-'}</div></div>
  </div>
  <div class="sec">V. Kegiatan Pembelajaran</div>
  <div class="box box-amber" style="margin-bottom:8px;"><div class="box-title">Pendahuluan</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.pendahuluan || '-'}</div></div>
  <div class="box box-indigo" style="margin-bottom:8px;"><div class="box-title">Kegiatan Inti</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.kegiatanInti || '-'}</div></div>
  <div class="box" style="margin-bottom:14px;"><div class="box-title" style="color:#1d4ed8;">Penutup</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.penutup || '-'}</div></div>
  <div class="sec">VI. Metode & Media</div>
  <div class="grid2">
    <div class="box"><div class="box-title">Metode / Model Pembelajaran</div><div style="font-size:12px;">${rpp.metode || '-'}</div></div>
    <div class="box"><div class="box-title">Media & Alat</div><div style="font-size:12px;">${rpp.media || '-'}</div></div>
  </div>
  <div class="sec">VII. Asesmen</div>
  <div class="grid3">
    <div class="box"><div class="box-title">Diagnostik</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenDiagnostik || '-'}</div></div>
    <div class="box box-blue"><div class="box-title">Formatif</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenFormatif || '-'}</div></div>
    <div class="box box-indigo"><div class="box-title">Sumatif</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenSumatif || '-'}</div></div>
  </div>
  <div class="sec">VIII. Diferensiasi & Pengayaan</div>
  <div class="grid2">
    <div class="box"><div class="box-title">Pembelajaran Berdiferensiasi</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.diferensiasi || '-'}</div></div>
    <div class="box"><div class="box-title">Pengayaan & Remedial</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.pengayaan || '-'}</div></div>
  </div>
  ${rpp.catatan ? `<div class="sec">Catatan Guru</div><div class="cnt">${rpp.catatan}</div>` : ''}
  ${ganjilRows || genapRows ? `
  <div class="sec">IX. Silabus Rincian Per Pertemuan</div>
  ${ganjilRows ? `<div class="sem-box"><div class="sem-title">Semester Ganjil</div>
  <table class="syl"><tr><th style="width:40px;">No</th><th>Pokok Bahasan / Materi</th><th style="width:90px;">Tgl Rencana</th></tr>${ganjilRows}</table></div>` : ''}
  ${genapRows ? `<div class="sem-box"><div class="sem-title">Semester Genap</div>
  <table class="syl"><tr><th style="width:40px;">No</th><th>Pokok Bahasan / Materi</th><th style="width:90px;">Tgl Rencana</th></tr>${genapRows}</table></div>` : ''}
  ` : ''}
  <table class="sigs"><tr>
    <td>Menyetujui,<br/><strong>Kepala Kurikulum MQBA</strong><div class="sig-space"></div><strong>( Ust. Aidil Aqli, S.Ag. )</strong></td>
    <td>Karanganyar, ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}<br/><strong>Guru Pengajar</strong><div class="sig-space"></div><strong>( ${teacherName} )</strong></td>
  </tr></table>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
  </body></html>`);
  w.document.close();
};
