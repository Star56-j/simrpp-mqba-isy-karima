import { AttendanceSummary, AcademicYear } from '../types';

export function printRekapKehadiran(
  summary: AttendanceSummary[],
  academicYears: AcademicYear[],
  activeAYId: string,
  monthName: string,
  yearStr: string
) {
  const ayName = academicYears.find(a => a.id === activeAYId)?.name || activeAYId || '';
  const periodText = monthName ? `${monthName.toUpperCase()} ${yearStr}` : `TAHUN AJARAN ${ayName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekap Kehadiran Asatidz & Ustazah - MQBA Isy Karima</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 10px;
          background: #ffffff;
          color: #0f172a;
        }
        .no-print {
          margin-bottom: 20px;
          text-align: right;
        }
        .btn-print {
          padding: 8px 18px;
          background: #0f2942;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn-print:hover {
          background: #1e3a5f;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #0f2942;
          padding-bottom: 12px;
        }
        .header h1 {
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
          color: #0f2942;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: #334155;
          text-transform: uppercase;
        }
        .header h3 {
          font-size: 11px;
          font-weight: 700;
          margin: 0;
          color: #64748b;
          text-transform: uppercase;
        }
        .meta-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 11px;
          font-weight: 600;
          color: #334155;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #0f2942;
          color: #ffffff;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-align: center;
        }
        .th-sub {
          background-color: #1e3a5f;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        
        .percentage-cell {
          background-color: #0f2942;
          color: #ffffff;
          font-weight: 800;
          text-align: center;
        }
        .jp-wajib-cell {
          background-color: #f8fafc;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .sig-box {
          width: 250px;
          text-align: center;
        }
        .sig-box .title {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 50px;
        }
        .sig-box .name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button onclick="window.print()" class="btn-print">🖨️ Cetak / Simpan PDF</button>
      </div>

      <div class="header">
        <h1>MARKAZ AL QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA</h1>
        <h2>REKAPITULASI KEHADIRAN ASATIDZAH & USTADZAT</h2>
        <h3>PERIODE: ${periodText}</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 35px;">NO</th>
            <th rowspan="2">NAMA ASATIDZ / USTAZAH</th>
            <th rowspan="2" style="width: 220px; background-color: #0d2847;">MATA PELAJARAN YANG DIAMPU</th>
            <th colspan="4" class="th-sub">KEHADIRAN</th>
            <th rowspan="2" style="width: 95px; background-color: #0d2847;">TOTAL JP WAJIB</th>
            <th rowspan="2" style="width: 95px; background-color: #0d2847;">TOTAL KEHADIRAN</th>
            <th rowspan="2" style="width: 75px;">% HADIR</th>
          </tr>
          <tr>
            <th class="th-sub" style="width: 35px;">H</th>
            <th class="th-sub" style="width: 35px;">S</th>
            <th class="th-sub" style="width: 35px;">I</th>
            <th class="th-sub" style="width: 35px;">A</th>
          </tr>
        </thead>
        <tbody>
          ${summary.length === 0 ? `
            <tr>
              <td colspan="10" class="text-center" style="padding: 20px; color: #94a3b8;">Belum ada data kehadiran untuk periode ini.</td>
            </tr>
          ` : summary.map((r, idx) => `
            <tr>
              <td class="text-center" style="color: #64748b; font-family: monospace;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a; padding-left: 10px;">${r.teacherName}</td>
              <td style="font-weight: 600; color: #334155; padding-left: 10px;">${((r as any).subjectsTaught || (r as any).subjectName || 'Pengajar MQBA').replace(/ • /g, '<br><span style="color:#64748b; font-size:10px; font-weight:600;">• </span>')}</td>
              <td class="text-center font-bold" style="color: #0f2942;">${r.hadir || '0'}</td>
              <td class="text-center">${r.sakit || '0'}</td>
              <td class="text-center">${r.izin || '0'}</td>
              <td class="text-center" style="${r.alpha > 0 ? 'color: #e11d48; font-weight: 700;' : ''}">${r.alpha || '0'}</td>
              <td class="jp-wajib-cell">${r.total || (r.hadir + r.sakit + r.izin + r.alpha) || '0'}</td>
              <td class="jp-wajib-cell font-bold" style="color: #0f2942;">${r.hadir || '0'}</td>
              <td class="percentage-cell">${r.persentaseHadir}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">
          <div class="title">Mengetahui,<br>Mudir MQBA Isy Karima</div>
          <div class="name">Ustadz. Umar Alamuddin, Lc. Al-Hafizh</div>
        </div>
        <div class="sig-box">
          <div class="title">Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Ketua Akademik MQBA Isy Karima</div>
          <div class="name">Ustadz. Aidil Aqli. S.Ag</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export function printRekapKehadiranSantri(
  summary: any[],
  academicYears: AcademicYear[],
  activeAYId: string,
  periodTitle: string
) {
  const ayName = academicYears.find(a => a.id === activeAYId)?.name || activeAYId || '';
  const periodText = periodTitle.toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekap Kehadiran Santri - MQBA Isy Karima</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 10px;
          background: #ffffff;
          color: #0f172a;
        }
        .no-print {
          margin-bottom: 20px;
          text-align: right;
        }
        .btn-print {
          padding: 8px 18px;
          background: #0f2942;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn-print:hover {
          background: #1e3a5f;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #0f2942;
          padding-bottom: 12px;
        }
        .header h1 {
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 4px 0;
          letter-spacing: 0.5px;
          color: #0f2942;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 4px 0;
          color: #334155;
          text-transform: uppercase;
        }
        .header h3 {
          font-size: 11px;
          font-weight: 700;
          margin: 0;
          color: #64748b;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #0f2942;
          color: #ffffff;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          text-align: center;
        }
        .th-sub {
          background-color: #1e3a5f;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        
        .percentage-cell {
          background-color: #0f2942;
          color: #ffffff;
          font-weight: 800;
          text-align: center;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .sig-box {
          width: 250px;
          text-align: center;
        }
        .sig-box .title {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 50px;
        }
        .sig-box .name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button onclick="window.print()" class="btn-print">🖨️ Cetak / Simpan PDF</button>
      </div>

      <div class="header">
        <h1>MARKAZ AL QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA</h1>
        <h2>REKAPITULASI KEHADIRAN SANTRI</h2>
        <h3>PERIODE: ${periodText} (TA ${ayName})</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 35px;">NO</th>
            <th rowspan="2">NAMA SANTRI / KELAS</th>
            <th rowspan="2" style="width: 140px; background-color: #0d2847;">NIS / KELAS</th>
            <th colspan="4" class="th-sub">KEHADIRAN</th>
            <th rowspan="2" style="width: 110px; background-color: #0d2847;">TOTAL HARI</th>
            <th rowspan="2" style="width: 80px;">% HADIR</th>
          </tr>
          <tr>
            <th class="th-sub" style="width: 40px;">H</th>
            <th class="th-sub" style="width: 40px;">S</th>
            <th class="th-sub" style="width: 40px;">I</th>
            <th class="th-sub" style="width: 40px;">A</th>
          </tr>
        </thead>
        <tbody>
          ${summary.length === 0 ? `
            <tr>
              <td colspan="9" class="text-center" style="padding: 20px; color: #94a3b8;">Belum ada data kehadiran santri untuk periode ini.</td>
            </tr>
          ` : summary.map((r, idx) => {
            const pct = r.persentaseHadir !== undefined ? r.persentaseHadir : (r.rataHadir !== undefined ? r.rataHadir : 0);
            return `
            <tr>
              <td class="text-center" style="color: #64748b; font-family: monospace;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a; padding-left: 10px;">${r.santriName || r.className || r.name || 'Santri'}</td>
              <td style="font-weight: 600; color: #334155; padding-left: 10px;">${r.nis || (r.className ? 'Kelas ' + r.className : '-')}</td>
              <td class="text-center font-bold" style="color: #0f2942;">${r.hadir || '0'}</td>
              <td class="text-center">${r.sakit || '0'}</td>
              <td class="text-center">${r.izin || '0'}</td>
              <td class="text-center" style="${r.alpha > 0 ? 'color: #e11d48; font-weight: 700;' : ''}">${r.alpha || '0'}</td>
              <td class="text-center font-bold">${r.total || (r.hadir + r.sakit + r.izin + r.alpha) || '0'}</td>
              <td class="percentage-cell">${pct}%</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">
          <div class="title">Mengetahui,<br>Mudir MQBA Isy Karima</div>
          <div class="name">Ustadz. Umar Alamuddin, Lc. Al-Hafizh</div>
        </div>
        <div class="sig-box">
          <div class="title">Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Ketua Akademik MQBA Isy Karima</div>
          <div class="name">Ustadz. Aidil Aqli. S.Ag</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
