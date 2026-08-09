import { AttendanceSummary, AcademicYear } from '../types';

export function printRekapKehadiran(
  summary: AttendanceSummary[],
  academicYears: AcademicYear[],
  activeAYId: string,
  monthName: string,
  yearStr: string
) {
  const ayName = academicYears.find(a => a.id === activeAYId)?.name || '';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rekap Kehadiran Asatidz & Ustadzah</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
        }
        .header h1 {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .header h2 {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .header h3 {
          font-size: 12px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .month-indicator {
          font-size: 11px;
          font-weight: bold;
          font-style: italic;
          margin-bottom: 10px;
          text-align: left;
        }
        table.rekap-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table.rekap-table th, table.rekap-table td {
          border: 1px solid #c8d2e6;
          padding: 6px 8px;
          font-size: 11px;
        }
        table.rekap-table th {
          background-color: #0b2545;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          font-size: 10px;
        }
        table.rekap-table tr:nth-child(even) {
          background-color: #f4f7fc;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .percentage-cell {
          background-color: #0b2545 !important;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
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
        <button onclick="window.print()" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px;">Cetak Rekap Kehadiran</button>
      </div>

      <div class="header">
        <h1>REKAP KEHADIRAN ASATIDZAH & USTADZAT</h1>
        <h2>MARKAZ AL QUR'AN DAN BAHASA ARAB ISY KARIMA</h2>
        <h3>TAHUN AJARAN ${ayName}</h3>
      </div>

      <div class="month-indicator">Bulan : ${monthName.toUpperCase()} ${yearStr}</div>

      <table class="rekap-table">
        <thead>
          <tr>
            <th rowspan="2" style="width: 5%; vertical-align: middle;">No.</th>
            <th rowspan="2" style="vertical-align: middle;">Nama Asatidz/ah</th>
            <th colspan="4">Kehadiran</th>
            <th rowspan="2" style="width: 12%; vertical-align: middle;">Total JP Wajib</th>
            <th rowspan="2" style="width: 8%; vertical-align: middle;">%</th>
          </tr>
          <tr>
            <th style="width: 7%;">H</th>
            <th style="width: 7%;">S</th>
            <th style="width: 7%;">I</th>
            <th style="width: 7%;">A</th>
          </tr>
        </thead>
        <tbody>
          ${summary.map((r, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td style="font-weight: 500;">${r.teacherName}</td>
              <td class="text-center" style="font-weight: bold;">${r.hadir || '0'}</td>
              <td class="text-center">${r.sakit || '0'}</td>
              <td class="text-center">${r.izin || '0'}</td>
              <td class="text-center">${r.alpha || '0'}</td>
              <td class="text-center" style="font-weight: bold; background-color: #f8fafc;">${r.total || '0'}</td>
              <td class="percentage-cell">${r.persentaseHadir}%</td>
            </tr>
          `).join('')}
        </tbody>
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
