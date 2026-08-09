import { Santri, Nilai, Subject, RaporDetail, SchoolClass, AcademicYear } from '../types';

export function printPerkembangan(
  santri: Santri,
  kelas: SchoolClass,
  ay: AcademicYear,
  nilaiList: Nilai[],
  allSubjects: Subject[],
  raporDetails: RaporDetail[],
  timeframe: 'bulanan' | 'semester' | 'tahunan',
  timeframeDetail: string,
  waliKelasName: string
) {
  const getAverage = (n: Nilai): number => {
    const count = [n.harian, n.bulanan, n.uts, n.uas, n.uasLisan || 0].filter(v => v > 0).length;
    if (count === 0) return 0;
    return Math.round((n.harian + n.bulanan + n.uts + n.uas + (n.uasLisan || 0)) / count);
  };

  // Helper to extract data
  const ganjilRapor = raporDetails.find(r => r.santriId === santri.id && r.semesterId === 'sem-1');
  const genapRapor = raporDetails.find(r => r.santriId === santri.id && r.semesterId === 'sem-2');

  const ganjilNilai = nilaiList.filter(n => n.santriId === santri.id && n.semesterId === 'sem-1');
  const genapNilai = nilaiList.filter(n => n.santriId === santri.id && n.semesterId === 'sem-2');

  let tableHtml = '';
  let attendanceHtml = '';
  let otherDetailsHtml = '';

  if (timeframe === 'bulanan') {
    // Bulanan Layout
    const selectedSem = timeframeDetail.includes('Juli') || timeframeDetail.includes('Agustus') || timeframeDetail.includes('September') || timeframeDetail.includes('Oktober') || timeframeDetail.includes('November') || timeframeDetail.includes('Desember') ? 'sem-1' : 'sem-2';
    const activeRapor = selectedSem === 'sem-1' ? ganjilRapor : genapRapor;
    const activeNilai = selectedSem === 'sem-1' ? ganjilNilai : genapNilai;

    tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 55%;">Mata Pelajaran</th>
            <th style="width: 20%;">Nilai Harian (Rata-rata)</th>
            <th style="width: 20%;">Nilai Ujian Bulanan</th>
          </tr>
        </thead>
        <tbody>
          ${allSubjects.map((subj, idx) => {
            const n = activeNilai.find(x => x.subjectId === subj.id);
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${subj.name}</td>
                <td class="text-center" style="font-weight: bold;">${n && n.harian ? n.harian : '-'}</td>
                <td class="text-center" style="font-weight: bold;">${n && n.bulanan ? n.bulanan : '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Estimate monthly absences from semester totals
    const totalAbsen = activeRapor?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
    const mSakit = Math.ceil(totalAbsen.sakit / 5) || 0;
    const mIzin = Math.ceil(totalAbsen.izin / 5) || 0;
    const mAlpha = Math.ceil(totalAbsen.tanpaKeterangan / 5) || 0;

    attendanceHtml = `
      <table class="data-table" style="width: 50%;">
        <tbody>
          <tr><td style="width: 60%;">Sakit</td><td class="text-center" style="font-weight: bold;">${mSakit}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Izin</td><td class="text-center" style="font-weight: bold;">${mIzin}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Tanpa Keterangan</td><td class="text-center" style="font-weight: bold;">${mAlpha}</td><td class="text-center">pertemuan</td></tr>
        </tbody>
      </table>
    `;

    otherDetailsHtml = `
      <div class="section-title">Perkembangan Karakter & Halaqah Al-Qur'an</div>
      <div style="border: 1.5px solid #000; padding: 12px; min-height: 60px; font-size: 11px; margin-bottom: 20px; line-height: 1.4;">
        <b>Perkembangan Tahfidz:</b> ${activeRapor?.ketahfizhan[0]?.penilaian || 'Sangat baik, konsisten menambah setoran hafalan.'}
        <br><br>
        <b>Sikap & Karakter:</b> Santri menunjukkan kedisiplinan yang baik selama bulan ini. Hubungan sosial dengan teman sebaya terjalin harmonis.
      </div>
    `;

  } else if (timeframe === 'semester') {
    // Semester Layout
    const selectedSem = timeframeDetail === 'Ganjil' ? 'sem-1' : 'sem-2';
    const activeRapor = selectedSem === 'sem-1' ? ganjilRapor : genapRapor;
    const activeNilai = selectedSem === 'sem-1' ? ganjilNilai : genapNilai;

    tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 45%;">Mata Pelajaran</th>
            <th style="width: 10%;">Harian</th>
            <th style="width: 10%;">Bulanan</th>
            <th style="width: 10%;">UTS</th>
            <th style="width: 10%;">UAS</th>
            <th style="width: 10%;">Rata-rata</th>
          </tr>
        </thead>
        <tbody>
          ${allSubjects.map((subj, idx) => {
            const n = activeNilai.find(x => x.subjectId === subj.id);
            const avg = n ? getAverage(n) : 0;
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${subj.name}</td>
                <td class="text-center">${n && n.harian ? n.harian : '-'}</td>
                <td class="text-center">${n && n.bulanan ? n.bulanan : '-'}</td>
                <td class="text-center">${n && n.uts ? n.uts : '-'}</td>
                <td class="text-center">${n && n.uas ? n.uas : '-'}</td>
                <td class="text-center" style="font-weight: bold;">${avg || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    const absen = activeRapor?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
    attendanceHtml = `
      <table class="data-table" style="width: 50%;">
        <tbody>
          <tr><td style="width: 60%;">Sakit</td><td class="text-center" style="font-weight: bold;">${absen.sakit}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Izin</td><td class="text-center" style="font-weight: bold;">${absen.izin}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Tanpa Keterangan</td><td class="text-center" style="font-weight: bold;">${absen.tanpaKeterangan}</td><td class="text-center">pertemuan</td></tr>
        </tbody>
      </table>
    `;

    otherDetailsHtml = `
      <div class="section-title">A. KEPRIBADIAN</div>
      <table class="data-table" style="margin-bottom: 20px;">
        <thead>
          <tr><th style="width: 20%;">Predikat</th><th>Deskripsi</th></tr>
        </thead>
        <tbody>
          ${(activeRapor?.kepribadian || [{ aspek: 'Kepribadian', predikat: 'B', deskripsi: 'Memiliki sikap sopan, taat, dan disiplin dalam KBM.' }]).map(k => `
            <tr>
              <td class="text-center" style="font-weight: bold; font-size: 13px;">${k.predikat}</td>
              <td>${k.deskripsi}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">C. KETAHFIZHAN</div>
      <table class="data-table" style="margin-bottom: 20px;">
        <thead>
          <tr><th style="width: 30%;">Capaian Tahfizhul Qur'an</th><th>Penilaian Al-Qur'an</th></tr>
        </thead>
        <tbody>
          ${(activeRapor?.ketahfizhan || [{ capaian: '9 Juz', penilaian: 'Hafalan sangat baik, murojaah konsisten.' }]).map(k => `
            <tr>
              <td class="text-center" style="font-weight: bold;">${k.capaian}</td>
              <td>${k.penilaian}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">F. CATATAN WALI KELAS</div>
      <div style="border: 1.5px solid #000; padding: 12px; min-height: 60px; font-size: 11px; margin-bottom: 20px; text-align: justify; white-space: pre-wrap;">${activeRapor?.catatanWaliKelas || 'Prestasinya sangat baik, perlu dipertahankan. Selalu berusaha mematuhi tata tertib pondok.'}</div>
    `;

  } else {
    // Tahunan Layout
    tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 45%;">Mata Pelajaran</th>
            <th style="width: 15%;">Rata-rata Ganjil (S1)</th>
            <th style="width: 15%;">Rata-rata Genap (S2)</th>
            <th style="width: 10%;">Nilai Akhir</th>
            <th style="width: 10%;">Perkembangan</th>
          </tr>
        </thead>
        <tbody>
          ${allSubjects.map((subj, idx) => {
            const nGanjil = ganjilNilai.find(x => x.subjectId === subj.id);
            const nGenap = genapNilai.find(x => x.subjectId === subj.id);

            const avgGanjil = nGanjil ? getAverage(nGanjil) : 0;
            const avgGenap = nGenap ? getAverage(nGenap) : 0;

            const finalScore = avgGanjil > 0 && avgGenap > 0 ? Math.round((avgGanjil + avgGenap) / 2) : (avgGenap || avgGanjil || 0);

            let status = '➖ Stabil';
            if (avgGanjil > 0 && avgGenap > 0) {
              if (avgGenap > avgGanjil) status = '📈 Naik';
              else if (avgGenap < avgGanjil) status = '📉 Turun';
            }

            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${subj.name}</td>
                <td class="text-center">${avgGanjil || '-'}</td>
                <td class="text-center">${avgGenap || '-'}</td>
                <td class="text-center" style="font-weight: bold;">${finalScore || '-'}</td>
                <td class="text-center" style="font-weight: bold; font-size: 10px;">${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    const tGanjil = ganjilRapor?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
    const tGenap = genapRapor?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
    const totalAbsen = {
      sakit: tGanjil.sakit + tGenap.sakit,
      izin: tGanjil.izin + tGenap.izin,
      tanpaKeterangan: tGanjil.tanpaKeterangan + tGenap.tanpaKeterangan
    };

    attendanceHtml = `
      <table class="data-table" style="width: 50%;">
        <tbody>
          <tr><td style="width: 60%;">Total Sakit (S1 + S2)</td><td class="text-center" style="font-weight: bold;">${totalAbsen.sakit}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Total Izin (S1 + S2)</td><td class="text-center" style="font-weight: bold;">${totalAbsen.izin}</td><td class="text-center">pertemuan</td></tr>
          <tr><td>Total Tanpa Keterangan</td><td class="text-center" style="font-weight: bold;">${totalAbsen.tanpaKeterangan}</td><td class="text-center">pertemuan</td></tr>
        </tbody>
      </table>
    `;

    otherDetailsHtml = `
      <div class="section-title">Hasil Akhir Tahun Pelajaran</div>
      <div style="border: 1.5px solid #000; padding: 12px; min-height: 60px; font-size: 11px; margin-bottom: 20px; line-height: 1.5;">
        <b>Keterangan Kenaikan:</b> ${genapRapor?.keputusanKenaikan || 'NAIK / TIDAK NAIK'}
        <br><br>
        <b>Catatan Akhir Tahun:</b> Santri menunjukkan pertumbuhan akademik dan spiritual yang luar biasa di sepanjang tahun pelajaran ini. Pertahankan semangat belajar menghafal Al-Qur'an dan akhlak terpuji di kelas berikutnya.
      </div>
    `;
  }

  const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Perkembangan - ${santri.name}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          line-height: 1.3;
        }
        @page {
          size: A4;
          margin: 0;
        }
        .page {
          width: 210mm;
          height: 296mm;
          padding: 15mm 15mm;
          box-sizing: border-box;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        .content-area {
          flex: 1;
        }
        .bismillah {
          text-align: center;
          font-size: 18px;
          font-family: 'Times New Roman', serif;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .header-title {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
          text-decoration: underline;
        }
        .info-table {
          width: 100%;
          margin-bottom: 15px;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 3px 0;
          vertical-align: top;
          font-size: 11px;
        }
        .section-title {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 5px;
          font-size: 11px;
          text-transform: uppercase;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        table.data-table th, table.data-table td {
          border: 1.5px solid #000;
          padding: 5px 8px;
          font-size: 11px;
          color: #000;
        }
        table.data-table th {
          text-align: center;
          font-weight: bold;
          background-color: #ffffff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer-logo-area {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1.5px solid #000;
          padding-top: 5px;
          font-size: 9px;
          margin-top: auto;
        }
        .footer-logo-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .footer-logo-left img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .footer-logo-left-text {
          font-family: 'Arial', sans-serif;
          font-weight: bold;
          line-height: 1.1;
        }
        .footer-logo-left-text .yps { color: #0c4a6e; font-size: 9px; }
        .footer-logo-left-text .mqba { color: #0c4a6e; font-size: 9px; }
        .footer-logo-left-text .ik { color: #047857; font-size: 13px; letter-spacing: 1px; }
        .footer-logo-right { text-align: right; line-height: 1.2; }
        .footer-logo-right .address { font-weight: bold; }
        .footer-logo-right .bank { font-weight: bold; margin-top: 2px; }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
          font-size: 11px;
          width: 33%;
          padding-top: 5px;
        }
        .signature-space { height: 50px; }
        .signature-name { font-weight: bold; text-decoration: underline; }
        @media print {
          body { background: #fff; }
          .no-print { display: none; }
          .page {
            border: none;
            box-shadow: none;
            padding: 15mm 15mm;
            margin: 0;
            width: auto;
            height: 100vh;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Cetak Laporan</button>
      </div>

      <div class="page">
        <div class="content-area">
          <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <div class="header-title">LAPORAN PERKEMBANGAN HASIL BELAJAR SANTRI</div>

          <table class="info-table">
            <tr>
              <td style="width: 18%;"><b>Nama Lembaga</b></td>
              <td style="width: 2%;">:</td>
              <td style="width: 45%;">MQBA Wustha Isy Karima</td>
              <td style="width: 15%;"><b>Kelas</b></td>
              <td style="width: 2%;">:</td>
              <td style="width: 18%;"><b>${kelas.name}</b></td>
            </tr>
            <tr>
              <td><b>Nama Santri</b></td>
              <td>:</td>
              <td><b>${santri.name.toUpperCase()}</b></td>
              <td><b>Periode Laporan</b></td>
              <td>:</td>
              <td><b>Rentang ${timeframe.toUpperCase()} (${timeframeDetail})</b></td>
            </tr>
            <tr>
              <td><b>NIS / NISN</b></td>
              <td>:</td>
              <td>${santri.nis} / ${raporDetails[0]?.nisn || '-'}</td>
              <td><b>Tahun Pelajaran</b></td>
              <td>:</td>
              <td><b>${ay.name}</b></td>
            </tr>
          </table>

          <div class="section-title">Hasil Penilaian Akademik</div>
          ${tableHtml}

          <div class="section-title">Kehadiran & Partisipasi</div>
          ${attendanceHtml}

          ${otherDetailsHtml}

          <!-- Signatures -->
          <div class="signature-section" style="margin-top: 30px;">
            <table class="signature-table">
              <tr>
                <td></td>
                <td></td>
                <td style="text-align: left; padding-left: 30px;">
                  Karanganyar, ${dateStr}<br>
                  Wali Kelas
                </td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 20px;">Orang Tua/Wali</td>
                <td>
                  Mengetahui<br>
                  Ketua Unit
                </td>
                <td></td>
              </tr>
              <tr class="signature-space">
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 20px;">
                  ..........................................
                </td>
                <td class="signature-name">
                  ${ketuaUnitName}
                </td>
                <td class="signature-name" style="text-align: left; padding-left: 30px;">
                  ${waliKelasName}
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-logo-area">
          <div class="footer-logo-left">
            <img src="/logo-mqba.png" alt="Logo MQBA" onerror="this.src='https://simrpp-mqba-isy-karima.pages.dev/logo-mqba.png'" />
            <div class="footer-logo-left-text">
              <div class="yps">YAYASAN SOSIAL & PENDIDIKAN ISLAM ISY KARIMA</div>
              <div class="mqba">MA'HAD TAHFIZHUL QUR'AN ISY KARIMA</div>
              <div class="mqba">MARKAZ AL-QUR'AN DAN BAHASA ARAB</div>
              <div class="ik">ISY KARIMA</div>
            </div>
          </div>
          <div class="footer-logo-right">
            <div class="address">Ngringin RT 01/RW 11, Bangsri, Karangpandan, Karanganyar, Jawa Tengah 57791</div>
            <div>Telp. +6281228586090 | Fax +62271730717 | http://isykarima.com</div>
            <div class="bank">Bank Syariah Indonesia (BSI) No. Rek. 709 467 4446 an. Nashiruddin QQ MAQBA ISY KARIMA</div>
          </div>
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
