import { Santri, Nilai, Subject, RaporDetail, SchoolClass, AcademicYear, Semester } from '../types';
import { computeRaporScore } from './nilaiWeights';

export function printRapor(
  santri: Santri,
  kelas: SchoolClass,
  ay: AcademicYear,
  sem: Semester,
  nilaiList: Nilai[],
  allSubjects: Subject[],
  raporDetail: RaporDetail | null,
  waliKelasName: string,
  ketuaUnitName: string = "Ust. Umar Alamuddin, Lc."
) {
  const getAverage = (n: Nilai): number => {
    return computeRaporScore(n).nilaiAkhirTulis;
  };

  // Compute rata-rata kelas for each subject
  const subjectAverages: Record<string, number> = {};
  allSubjects.forEach(subj => {
    const subjNilai = nilaiList.filter(n => n.subjectId === subj.id);
    if (subjNilai.length > 0) {
      subjectAverages[subj.id] = Math.round(subjNilai.reduce((a, b) => a + getAverage(b), 0) / subjNilai.length);
    } else {
      subjectAverages[subj.id] = 0;
    }
  });

  // Calculate overall averages for each santri in the class to compute Rank
  const classSantriIds = Array.from(new Set(nilaiList.map(n => n.santriId)));
  const santriAverages = classSantriIds.map(sId => {
    const sNilai = allSubjects.map(subj => {
      const n = nilaiList.find(x => x.santriId === sId && x.subjectId === subj.id);
      return n ? getAverage(n) : 0;
    });
    const total = sNilai.reduce((a, b) => a + b, 0);
    const avg = sNilai.length > 0 ? total / sNilai.length : 0;
    return { santriId: sId, total, avg };
  });

  // Sort by overall average descending
  santriAverages.sort((a, b) => b.avg - a.avg);

  // Find rank of the current santri
  const currentSantriAvgIndex = santriAverages.findIndex(x => x.santriId === santri.id);
  const rankNumber = currentSantriAvgIndex !== -1 ? currentSantriAvgIndex + 1 : 1;
  const totalSantriInClass = classSantriIds.includes(santri.id) ? classSantriIds.length : classSantriIds.length + 1;
  const rankStr = `${rankNumber} dari ${totalSantriInClass} santri`;

  const absen = raporDetail?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
  const attendanceVal = Math.max(70, 100 - ((absen.tanpaKeterangan || 0) * 5 + (absen.izin || 0) * 2 + (absen.sakit || 0) * 1));

  // This santri's scores with weighted components
  const santriNilai = allSubjects.map(subj => {
    const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === subj.id);
    const weighted = n ? computeRaporScore(n, 90, attendanceVal) : { midAvg: 0, uasTulis: 0, uasLisan: null, nilaiAkhirTulis: 0 };
    return {
      subject: subj.name,
      midAvg: weighted.midAvg,
      uasTulis: weighted.uasTulis,
      uasLisan: weighted.uasLisan,
      score: weighted.nilaiAkhirTulis,
      classAvg: subjectAverages[subj.id] || 0
    };
  });

  const totalScore = santriNilai.reduce((a, b) => a + b.score, 0);
  const avgScore = santriNilai.length > 0 ? Math.round(totalScore / santriNilai.length) : 0;
  
  // Calculate Class Average of total averages
  const totalClassAvg = allSubjects.reduce((a, subj) => a + (subjectAverages[subj.id] || 0), 0);
  const avgClassAvg = allSubjects.length > 0 ? Math.round(totalClassAvg / allSubjects.length) : 0;

  const kepribadian = raporDetail?.kepribadian || [
    { aspek: 'Kepribadian', predikat: 'B', deskripsi: 'Memiliki sikap sopan, taat, dan santai, namun terkadang terlalu santai.' }
  ];

  const ketahfizhan = raporDetail?.ketahfizhan || [
    { capaian: '9 Juz', penilaian: 'Untuk hafalan sangat baik, tahsin sudah bagus, adab sangat baik.' }
  ];

  const ekstrakurikuler = raporDetail?.ekstrakurikuler || [
    { namaKegiatan: 'Furusiyyah', nilai: 'A+', keterangan: 'Semangat dan sangat bagus dalam praktek latihan berkuda, hafal setengah dari matan.' }
  ];

  const catatan = raporDetail?.catatanWaliKelas || '';
  const kenaikan = raporDetail?.keputusanKenaikan || '';
  const tanggapan = raporDetail?.tanggapanOrangTua || '';

  const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Cetak Rapor - ${santri.name}</title>
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
          height: 296mm; /* slightly shorter to fit perfectly on A4 printout */
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
        .footer-logo-left-text .yps {
          color: #0c4a6e;
          font-size: 9px;
        }
        .footer-logo-left-text .mqba {
          color: #0c4a6e;
          font-size: 9px;
        }
        .footer-logo-left-text .ik {
          color: #047857;
          font-size: 13px;
          letter-spacing: 1px;
        }
        .footer-logo-right {
          text-align: right;
          line-height: 1.2;
        }
        .footer-logo-right .address {
          font-weight: bold;
        }
        .footer-logo-right .bank {
          font-weight: bold;
          margin-top: 2px;
        }
        .note {
          font-style: italic;
          font-size: 9px;
          margin-top: 2px;
        }
        .signature-section {
          margin-top: 30px;
          width: 100%;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
          font-size: 11px;
          width: 33%;
          padding-top: 5px;
        }
        .signature-space {
          height: 55px;
        }
        .signature-name {
          font-weight: bold;
          text-decoration: underline;
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            background: #fff;
          }
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
        <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Cetak Rapor (PDF)</button>
      </div>

      <!-- PAGE 1 -->
      <div class="page">
        <div class="content-area">
          <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <div class="header-title">PENCAPAIAN KOMPETENSI PESERTA DIDIK</div>

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
              <td><b>Alamat</b></td>
              <td>:</td>
              <td>JL. Solo - Tawangmangu KM. 34 Pakel</td>
              <td><b>Semester</b></td>
              <td>:</td>
              <td><b>${sem.name === 'Ganjil' ? '1 (Gasal)' : '2 (Genap)'}</b></td>
            </tr>
            <tr>
              <td><b>Nama</b></td>
              <td>:</td>
              <td><b>${santri.name.toUpperCase()}</b></td>
              <td><b>Tahun Pelajaran</b></td>
              <td>:</td>
              <td><b>${ay.name}</b></td>
            </tr>
            <tr>
              <td><b>NIS</b></td>
              <td>:</td>
              <td>${santri.nis}</td>
              <td colspan="3"></td>
            </tr>
            <tr>
              <td><b>NISN</b></td>
              <td>:</td>
              <td>${raporDetail?.nisn || '-'}</td>
              <td colspan="3"></td>
            </tr>
          </table>

          <!-- A. KEPRIBADIAN -->
          <div class="section-title">A. KEPRIBADIAN</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 15%;">Predikat</th>
                <th style="width: 85%;">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              ${kepribadian.map(k => `
                <tr>
                  <td class="text-center" style="font-weight: bold; font-size: 14px;">${k.predikat || 'B'}</td>
                  <td style="padding: 8px 12px; text-align: justify;">${k.deskripsi || (k.aspek ? `${k.aspek}: ` : '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- B. PENGETAHUAN -->
          <div class="section-title">B. PENGETAHUAN</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 34%;">Mata Pelajaran</th>
                <th style="width: 12%;">UH / Mid</th>
                <th style="width: 13%;">UAS Tulis</th>
                <th style="width: 12%;">UAS Lisan</th>
                <th style="width: 12.5%;">Nilai Akhir</th>
                <th style="width: 12.5%;">Rata Kelas</th>
              </tr>
            </thead>
            <tbody>
              ${santriNilai.map((n, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${n.subject}</td>
                  <td class="text-center">${n.midAvg || '-'}</td>
                  <td class="text-center">${n.uasTulis || '-'}</td>
                  <td class="text-center" style="font-weight: ${n.uasLisan ? 'bold' : 'normal'}; font-style: ${n.uasLisan ? 'normal' : 'italic'}; color: ${n.uasLisan ? '#000' : '#888'};">
                    ${n.uasLisan ?? '-'}
                  </td>
                  <td class="text-center" style="font-weight: bold; background-color: #f8fafc;">${n.score || '-'}</td>
                  <td class="text-center">${n.classAvg || '-'}</td>
                </tr>
              `).join('')}
              <tr>
                <th colspan="5" style="text-align: right; padding-right: 10px;">JUMLAH NILAI AKHIR</th>
                <td class="text-center" style="font-weight: bold; background-color: #f1f5f9;">${totalScore || '-'}</td>
                <td class="text-center">${totalClassAvg || '-'}</td>
              </tr>
              <tr>
                <th colspan="5" style="text-align: right; padding-right: 10px;">RATA-RATA HARIAN & RAPOR</th>
                <td class="text-center" style="font-weight: bold; background-color: #f1f5f9;">${avgScore || '-'}</td>
                <td class="text-center">${avgClassAvg || '-'}</td>
              </tr>
              <tr>
                <th colspan="5" style="text-align: right; padding-right: 10px;">PERINGKAT (RANKING)</th>
                <td colspan="2" class="text-center" style="font-weight: bold; font-size: 11px; background-color: #f1f5f9;">${rankStr}</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size: 8px; font-style: italic; color: #555; margin-top: -4px; margin-bottom: 12px;">
            * Pembobotan Nilai Akhir: 30% Akhlaq, 10% Kehadiran, 10% UH/Bulanan/Mid Semester, 60% Ujian Semester Tulis. Ujian Lisan dipisahkan sendiri pada kolom khusus.
          </div>

          <!-- C. KETAHFIZHAN -->
          <div class="section-title">C. KETAHFIZHAN</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30%;">Capaian Tahfizhul Qur'an</th>
                <th style="width: 70%;">Penilaian Al-Qur'an</th>
              </tr>
            </thead>
            <tbody>
              ${ketahfizhan.map(k => `
                <tr>
                  <td class="text-center" style="font-weight: bold;">${k.capaian || '-'}</td>
                  <td style="padding: 8px 12px;">${k.penilaian || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- D. EKSTRAKURIKULER -->
          <div class="section-title">D. EKSTRAKURIKULER</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">No.</th>
                <th style="width: 35%;">Kegiatan Ekstrakurikuler</th>
                <th style="width: 15%;">Nilai</th>
                <th style="width: 45%;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${ekstrakurikuler.map((e, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${e.namaKegiatan || '-'}</td>
                  <td class="text-center" style="font-weight: bold;">${e.nilai || '-'}</td>
                  <td style="font-size: 10px;">${e.keterangan || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- PAGE 1 FOOTER -->
        <div class="footer-logo-area">
          <div class="footer-logo-left">
            <img src="/logo-mqba.png" alt="Logo MQBA" onerror="this.src='https://akademikmqbaisykarima.pages.dev/logo-mqba.png'" />
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

      <!-- PAGE 2 -->
      <div class="page">
        <div class="content-area">
          <!-- E. KETIDAKHADIRAN -->
          <div class="section-title" style="margin-top: 0;">E. KETIDAKHADIRAN</div>
          <table class="data-table" style="width: 60%; margin-bottom: 5px;">
            <tbody>
              <tr>
                <td style="width: 50%;">Sakit</td>
                <td style="width: 25%; font-weight: bold;" class="text-center">${absen.sakit || 0}</td>
                <td style="width: 25%;" class="text-center">pertemuan</td>
              </tr>
              <tr>
                <td>Izin</td>
                <td style="font-weight: bold;" class="text-center">${absen.izin || 0}</td>
                <td class="text-center">pertemuan</td>
              </tr>
              <tr>
                <td>Tanpa Keterangan</td>
                <td style="font-weight: bold;" class="text-center">${absen.tanpaKeterangan || 0}</td>
                <td class="text-center">pertemuan</td>
              </tr>
            </tbody>
          </table>
          <div class="note" style="margin-bottom: 25px;">* Ketidakhadiran dihitung dari tiap materi yang tidak diikuti, bukan akumulasi hari.</div>

          <!-- F. CATATAN WALI KELAS -->
          <div class="section-title">F. CATATAN WALI KELAS</div>
          <div style="border: 1.5px solid #000; padding: 12px; min-height: 80px; font-size: 11px; margin-bottom: 25px; text-align: justify; white-space: pre-wrap;">${catatan || 'Prestasinya sangat baik, perlu dipertahankan.\nSelalu berusaha untuk mematuhi tata tertib pondok dan patuh terhadap Ustadz.'}</div>

          <!-- G. TANGGAPAN ORANG TUA/WALI -->
          <div class="section-title">G. TANGGAPAN ORANG TUA/WALI</div>
          <div style="border: 1.5px solid #000; padding: 12px; min-height: 80px; font-size: 11px; margin-bottom: 35px; white-space: pre-wrap;">${tanggapan || ''}</div>

          <!-- Keterangan Kenaikan Kelas (Semester Genap) -->
          ${sem.name === 'Genap' ? `
            <div style="border: 1.5px solid #000; padding: 10px; font-size: 11px; font-weight: bold; margin-bottom: 30px;">
              Keputusan Kenaikan Kelas: ${kenaikan || 'NAIK / TIDAK NAIK ke Kelas .....................'}
              <div style="font-size: 9px; font-weight: normal; font-style: italic; margin-top: 3px;">* Coret yang tidak perlu</div>
            </div>
          ` : ''}

          <!-- Signatures Section -->
          <div class="signature-section">
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
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  }
}
