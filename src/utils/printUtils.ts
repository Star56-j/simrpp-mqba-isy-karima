export function printGenericTable(
  title: string,
  subtitle: string,
  headers: string[],
  dataRows: (string | number)[][]
) {
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
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
          font-size: 12px;
          font-weight: 800;
          margin: 0 0 5px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #334155;
        }
        .header h3 {
          font-size: 11px;
          font-weight: 600;
          margin: 0;
          color: #64748b;
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
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px;">🖨️ Cetak / Save PDF</button>
      </div>

      <div class="header">
        <h1>${title}</h1>
        <h2>MARKAZ AL QUR'AN DAN BAHASA ARAB ISY KARIMA</h2>
        <h3>${subtitle}</h3>
      </div>

      <table class="rekap-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataRows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : '-'}</td>`).join('')}
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
