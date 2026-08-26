import { EvaluasiPembelajaran, AcademicYear, Semester } from '../types';

export function printEvaluasi(
  ev: EvaluasiPembelajaran,
  academicYears: AcademicYear[],
  semesters: Semester[]
) {
  const ayName = academicYears.find(a => a.id === ev.academicYearId)?.name || '';
  const semName = semesters.find(s => s.id === ev.semesterId)?.name || '';
  const bulanName = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][ev.bulan] || '';
  const jenis = ev.jenisEvaluasi || 'Bulanan';
  const headerTitle = jenis === 'Tahunan'
    ? 'LAPORAN EVALUASI PEMBELAJARAN TAHUNAN'
    : jenis === 'Semester'
    ? 'LAPORAN EVALUASI PEMBELAJARAN SEMESTER'
    : 'LAPORAN EVALUASI PEMBELAJARAN BULANAN';

  const periodeLabel = jenis === 'Tahunan'
    ? 'Periode Tahun Ajaran'
    : jenis === 'Semester'
    ? 'Periode Semester'
    : 'Bulan Evaluasi';

  const periodeValue = jenis === 'Tahunan'
    ? `TA ${ayName}`
    : jenis === 'Semester'
    ? `Semester ${semName} ${ev.tahun}`
    : `${bulanName} ${ev.tahun}`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${headerTitle} - ${ev.teacher?.name || 'Guru'}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #000;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 2px solid #0b2545;
          padding-bottom: 10px;
        }
        .header h1 {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0b2545;
        }
        .header h2 {
          font-size: 12px;
          font-weight: 700;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .header h3 {
          font-size: 11px;
          font-weight: 600;
          margin: 0;
          color: #555;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .info-table td {
          padding: 4px 8px;
          font-size: 11px;
        }
        .info-table td.label {
          font-weight: bold;
          color: #555;
          width: 18%;
        }
        .info-table td.value {
          border-bottom: 1px solid #e2e8f0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #0b2545;
          background-color: #f1f5f9;
          padding: 6px 10px;
          margin-top: 15px;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-left: 4px solid #0b2545;
        }
        .section-content {
          padding: 2px 10px 8px 10px;
          font-size: 11px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .card-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          background: #f8fafc;
          margin-bottom: 10px;
        }
        .card-box-title {
          font-weight: bold;
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
        }
        .badge-sangat-baik { background-color: #d1fae5; color: #065f46; }
        .badge-baik { background-color: #dbeafe; color: #1e40af; }
        .badge-cukup { background-color: #fef3c7; color: #92400e; }
        .badge-perbaikan { background-color: #fee2e2; color: #991b1b; }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 40px;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
          font-size: 11px;
          width: 50%;
        }
        .signature-space {
          height: 60px;
        }
        .signature-name {
          font-weight: bold;
          text-decoration: underline;
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
          }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px;">Cetak Evaluasi</button>
      </div>

      <div class="header">
        <h1>${headerTitle}</h1>
        <h2>MARKAZ AL QUR'AN DAN BAHASA ARAB ISY KARIMA</h2>
        <h3>Tahun Ajaran ${ayName} ${jenis !== 'Tahunan' ? `&bull; Semester ${semName}` : ''}</h3>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Nama Pengajar</td>
          <td class="value">: <strong>${ev.teacher?.name || '—'}</strong></td>
          <td class="label">${periodeLabel}</td>
          <td class="value">: <strong>${periodeValue}</strong></td>
        </tr>
        <tr>
          <td class="label">Mata Pelajaran</td>
          <td class="value">: ${ev.subject?.name || '—'}</td>
          <td class="label">Kelas Binaan</td>
          <td class="value">: ${ev.class?.name || '—'}</td>
        </tr>
      </table>

      <div class="section-title">A. Keterlaksanaan Pembelajaran</div>
      <div class="section-content">
        <div class="card-box" style="background: #f0fdf4; border-color: #bbf7d0;">
          <table style="width: 100%; text-align: center; font-size: 11px;">
            <tr>
              <td><strong>Rencana Pertemuan:</strong><br/>${ev.totalPertemuanRencana} Pertemuan</td>
              <td><strong>Terlaksana:</strong><br/>${ev.totalPertemuanTerlaksana} Pertemuan</td>
              <td><strong>Persentase Keterlaksanaan:</strong><br/><strong style="font-size: 14px; color: #15803d;">${ev.persentaseTerlaksana}%</strong></td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section-title">B. Capaian Tujuan Pembelajaran (TP)</div>
      <div class="section-content grid-2">
        <div class="card-box">
          <div class="card-box-title" style="color: #16a34a;">TP Sudah Tercapai</div>
          <div style="white-space: pre-wrap;">${ev.tpTercapai || '—'}</div>
        </div>
        <div class="card-box">
          <div class="card-box-title" style="color: #dc2626;">TP Belum Tercapai / Perlu Penguatan</div>
          <div style="white-space: pre-wrap;">${ev.tpBelumTercapai || '—'}</div>
        </div>
      </div>

      <div class="section-title">C. Asesmen & Capaian Hasil Belajar</div>
      <div class="section-content grid-2">
        <div class="card-box">
          <div class="card-box-title">Hasil Asesmen</div>
          <div style="white-space: pre-wrap;">${ev.asesmenFormatifHasil || '—'}</div>
        </div>
        <div class="card-box">
          <div class="card-box-title">Catatan Asesmen</div>
          <div style="white-space: pre-wrap;">${ev.asesmenCatatan || '—'}</div>
        </div>
      </div>

      <div class="section-title">D. Kendala & Solusi Pembelajaran</div>
      <div class="section-content grid-2">
        <div class="card-box">
          <div class="card-box-title" style="color: #ea580c;">Kendala yang Dihadapi</div>
          <div style="white-space: pre-wrap;">${ev.kendala || '—'}</div>
        </div>
        <div class="card-box">
          <div class="card-box-title" style="color: #0284c7;">Solusi / Tindak Lanjut</div>
          <div style="white-space: pre-wrap;">${ev.solusi || '—'}</div>
        </div>
      </div>

      <div class="section-title">E. Diferensiasi Pembelajaran</div>
      <div class="section-content">
        <div class="card-box">
          <div style="white-space: pre-wrap;">${ev.diferenciasiDilakukan || '—'}</div>
        </div>
      </div>

      <div class="section-title">F. Rencana ${jenis === 'Tahunan' ? 'Tahun Ajaran Berikutnya' : jenis === 'Semester' ? 'Semester Berikutnya' : 'Bulan Berikutnya'}</div>
      <div class="section-content">
        <div class="card-box">
          <div style="white-space: pre-wrap;">${ev.rencanaBulanDepan || '—'}</div>
        </div>
      </div>

      <div class="section-title">G. Refleksi Pengajar</div>
      <div class="section-content">
        <div class="card-box" style="background: #fffdf5; border-color: #fef08a;">
          <div style="white-space: pre-wrap; font-style: italic;">${ev.refleksiGuru || '—'}</div>
        </div>
      </div>

      <div class="section-title">H. Predikat Ketercapaian Pembelajaran</div>
      <div class="section-content" style="margin-bottom: 20px;">
        <span class="badge ${
          ev.predikatKetercapaian === 'Sangat Baik' ? 'badge-sangat-baik' :
          ev.predikatKetercapaian === 'Baik' ? 'badge-baik' :
          ev.predikatKetercapaian === 'Cukup' ? 'badge-cukup' : 'badge-perbaikan'
        }">
          ${ev.predikatKetercapaian}
        </span>
      </div>

      <table class="signature-table">
        <tr>
          <td>
            Mengetahui,<br/>
            <strong>Kepala Kurikulum MQBA</strong>
            <div class="signature-space"></div>
            <span class="signature-name">Ust. Aidil Aqli, S.Ag.</span>
          </td>
          <td>
            Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
            <strong>Guru Pengajar</strong>
            <div class="signature-space"></div>
            <span class="signature-name">${ev.teacher?.name || 'Guru'}</span>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export function printEvaluasiWaliKelas(ev: any) {
  const periodeStr = ev.tipePeriode === 'bulanan'
    ? `Bulan ${ev.bulan || ''} ${ev.tahun || ''}`
    : `Semester ${ev.semester || ''} TA ${ev.tahunAjaran || ''}`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Evaluasi Wali Kelas - ${ev.kelasNama || 'Kelas'}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13px; margin: 0; padding: 40px; color: #111; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { font-size: 17px; margin: 0; font-weight: bold; text-transform: uppercase; }
        .header h2 { font-size: 14px; margin: 4px 0 0; font-weight: normal; }
        .header p { font-size: 11px; margin: 2px 0 0; color: #555; }
        .title { text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 20px; text-decoration: underline; }
        table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        table.info td { padding: 4px 0; vertical-align: top; }
        table.info td.lbl { width: 180px; font-weight: bold; }
        table.info td.col { width: 16px; text-align: center; }
        .sec { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .cnt { font-size: 13px; margin-left: 12px; white-space: pre-wrap; text-align: justify; margin-bottom: 14px; }
        .sigs { width: 100%; border-collapse: collapse; margin-top: 48px; }
        .sigs td { text-align: center; font-size: 13px; width: 50%; }
        .sig-space { height: 70px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Cetak PDF</button>
      </div>
      <div class="header">
        <h1>Markaz Qur'an dan Bahasa Arab (MQBA) Isy Karima</h1>
        <h2>Yayasan Sosial dan Pendidikan Isy Karima</h2>
        <p>Karanganyar, Jawa Tengah, Indonesia &nbsp;|&nbsp; info@isykarima.id</p>
      </div>
      <div class="title">LAPORAN EVALUASI WALI KELAS</div>
      <table class="info">
        <tr><td class="lbl">Kelas Bimbingan</td><td class="col">:</td><td><strong>${ev.kelasNama || '-'}</strong></td></tr>
        <tr><td class="lbl">Nama Wali Kelas</td><td class="col">:</td><td><strong>${ev.guruNama || '-'}</strong></td></tr>
        <tr><td class="lbl">Periode Evaluasi</td><td class="col">:</td><td>${periodeStr}</td></tr>
        <tr><td class="lbl">Tanggal Laporan</td><td class="col">:</td><td>${ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td></tr>
      </table>

      <div class="sec">I. Laporan KBM & Kedisiplinan Pembelajaran Kelas</div>
      <div class="cnt">${ev.laporanKbm || '-'}</div>

      <div class="sec">II. Permasalahan & Kendala Khusus Kelas</div>
      <div class="cnt">${ev.masalahKelas || '-'}</div>

      <div class="sec">III. Catatan Perkembangan Santri & Karakter</div>
      <div class="cnt">${ev.perkembanganSantri || '-'}</div>

      <div class="sec">IV. Usulan & Rekomendasi kepada Kurikulum</div>
      <div class="cnt">${ev.rekomendasiKurikulum || '-'}</div>

      ${ev.tanggapanAdmin ? `
      <div class="sec">V. Tanggapan / Solusi dari Kurikulum</div>
      <div class="cnt">${ev.tanggapanAdmin}</div>
      ` : ''}

      <table class="sigs">
        <tr>
          <td>Menyetujui,<br/><strong>Kepala Kurikulum MQBA</strong><div class="sig-space"></div><strong>( Ust. Aidil Aqli, S.Ag. )</strong></td>
          <td>Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/><strong>Wali Kelas</strong><div class="sig-space"></div><strong>( ${ev.guruNama || 'Wali Kelas'} )</strong></td>
        </tr>
      </table>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
