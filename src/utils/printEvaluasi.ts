import { EvaluasiPembelajaran, AcademicYear, Semester } from '../types';

export function printEvaluasi(
  ev: EvaluasiPembelajaran,
  academicYears: AcademicYear[],
  semesters: Semester[]
) {
  const ayName = academicYears.find(a => a.id === ev.academicYearId)?.name || '';
  const semName = semesters.find(s => s.id === ev.semesterId)?.name || '';
  const bulanName = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][ev.bulan] || '';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Evaluasi Pembelajaran - ${ev.teacher?.name || 'Guru'}</title>
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
          grid-template-cols: 1fr 1fr;
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
        <h1>LAPORAN EVALUASI PEMBELAJARAN BULANAN</h1>
        <h2>MARKAZ AL QUR'AN DAN BAHASA ARAB ISY KARIMA</h2>
        <h3>Tahun Ajaran ${ayName} &bull; Semester ${semName}</h3>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Nama Pengajar</td>
          <td class="value">: <strong>${ev.teacher?.name || '—'}</strong></td>
          <td class="label">Bulan Evaluasi</td>
          <td class="value">: <strong>${bulanName} ${ev.tahun}</strong></td>
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
          <div class="card-box-title" style="color: #dc2626;">TP Belum Tercapai / Perlu Tindak Lanjut</div>
          <div style="white-space: pre-wrap;">${ev.tpBelumTercapai || '—'}</div>
        </div>
      </div>

      <div class="section-title">C. Asesmen Formatif Bulanan</div>
      <div class="section-content grid-2">
        <div class="card-box">
          <div class="card-box-title">Hasil Asesmen Formatif</div>
          <div style="white-space: pre-wrap;">${ev.asesmenFormatifHasil || '—'}</div>
        </div>
        <div class="card-box">
          <div class="card-box-title">Catatan Penting Asesmen</div>
          <div style="white-space: pre-wrap;">${ev.asesmenCatatan || '—'}</div>
        </div>
      </div>

      <div class="section-title">D. Kendala & Solusi Pembelajaran</div>
      <div class="section-content grid-2">
        <div class="card-box">
          <div class="card-box-title" style="color: #d97706;">Kendala Yang Dihadapi</div>
          <div style="white-space: pre-wrap;">${ev.kendala || '—'}</div>
        </div>
        <div class="card-box">
          <div class="card-box-title" style="color: #2563eb;">Solusi / Tindak Lanjut</div>
          <div style="white-space: pre-wrap;">${ev.solusi || '—'}</div>
        </div>
      </div>

      <div class="section-title">E. Diferensiasi Pembelajaran</div>
      <div class="section-content">
        <div class="card-box">
          <div style="white-space: pre-wrap;">${ev.diferenciasiDilakukan || '—'}</div>
        </div>
      </div>

      <div class="section-title">F. Rencana Bulan Berikutnya</div>
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
            <strong>Kepala Unit/Kurikulum</strong>
            <div class="signature-space"></div>
            <span class="signature-name">Ust. Umar Alamuddin, Lc.</span>
          </td>
          <td>
            Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
            <strong>Guru Pengajar</strong>
            <div class="signature-space"></div>
            <span class="signature-name">${ev.teacher?.name || '—'}</span>
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
