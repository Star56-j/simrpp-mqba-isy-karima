import { Santri, Nilai, Subject, RaporDetail, SchoolClass, AcademicYear, Semester, WaliKelas, Teacher } from '../types';

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
    const count = [n.harian, n.bulanan, n.uts, n.uas].filter(v => v > 0).length;
    if (count === 0) return 0;
    return Math.round((n.harian + n.bulanan + n.uts + n.uas) / count);
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

  // This santri's scores
  const santriNilai = allSubjects.map(subj => {
    const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === subj.id);
    return {
      subject: subj.name,
      score: n ? getAverage(n) : 0,
      classAvg: subjectAverages[subj.id] || 0
    };
  });

  const totalScore = santriNilai.reduce((a, b) => a + b.score, 0);
  const avgScore = santriNilai.length > 0 ? Math.round(totalScore / santriNilai.length) : 0;
  
  // Calculate Class Average of total averages (simplified)
  const totalClassAvg = allSubjects.reduce((a, subj) => a + (subjectAverages[subj.id] || 0), 0);
  const avgClassAvg = allSubjects.length > 0 ? Math.round(totalClassAvg / allSubjects.length) : 0;

  // Compute Rank
  // To get exact rank we need all santri scores, but since we don't pass all santri, we will skip exact rank or just say "-"
  // For simplicity we will put a placeholder or passed rank if we add it to params.
  const rank = "1 dari 12 santri"; // Placeholder for now

  const kepribadian = raporDetail?.kepribadian || [
    { aspek: 'Kelakuan', predikat: '', deskripsi: '' },
    { aspek: 'Kerajinan', predikat: '', deskripsi: '' },
    { aspek: 'Kerapian', predikat: '', deskripsi: '' }
  ];

  const ketahfizhan = raporDetail?.ketahfizhan || [
    { capaian: 'Hafalan Baru (Ziyadah)', penilaian: '' },
    { capaian: 'Pengulangan (Murojaah)', penilaian: '' }
  ];

  const ekstrakurikuler = raporDetail?.ekstrakurikuler || [
    { namaKegiatan: 'Pramuka', nilai: '', keterangan: '' }
  ];

  const absen = raporDetail?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
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
          font-family: 'Times New Roman', Times, serif;
          font-size: 12px;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #000;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .info-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 2px 5px;
          vertical-align: top;
        }
        .section-title {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 5px;
          font-size: 12px;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #000;
          padding: 5px;
          vertical-align: middle;
        }
        table.data-table th {
          text-align: center;
          font-weight: bold;
          background-color: #f9f9f9;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer {
          margin-top: 30px;
          width: 100%;
        }
        .footer-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          margin-top: 50px;
        }
        .footer-table td {
          vertical-align: bottom;
          padding-bottom: 10px;
        }
        .signature-line {
          display: inline-block;
          width: 80%;
          border-bottom: 1px dashed #000;
          margin-bottom: 5px;
          height: 60px;
        }
        .note {
          font-style: italic;
          font-size: 10px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cetak PDF / Printer</button>
      </div>

      <div class="header">
        PENCAPAIAN KOMPETENSI PESERTA DIDIK
      </div>

      <table class="info-table">
        <tr>
          <td width="15%"><b>Nama Lembaga</b></td>
          <td width="2%">:</td>
          <td width="43%">MQBA Wustha Isy Karima</td>
          <td width="15%"><b>Kelas</b></td>
          <td width="2%">:</td>
          <td width="23%">${kelas.name}</td>
        </tr>
        <tr>
          <td><b>Alamat</b></td>
          <td>:</td>
          <td>JL. Solo - Tawangmangu KM.34 Pakel</td>
          <td><b>Semester</b></td>
          <td>:</td>
          <td>${sem.name === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'}</td>
        </tr>
        <tr>
          <td><b>Nama</b></td>
          <td>:</td>
          <td><b>${santri.name}</b></td>
          <td><b>Tahun Pelajaran</b></td>
          <td>:</td>
          <td>${ay.name}</td>
        </tr>
        <tr>
          <td><b>NIS</b></td>
          <td>:</td>
          <td>${santri.nis}</td>
          <td></td><td></td><td></td>
        </tr>
      </table>

      <!-- A. KEPRIBADIAN -->
      <div class="section-title">A. KEPRIBADIAN</div>
      <table class="data-table">
        <thead>
          <tr>
            <th width="30%">Predikat</th>
            <th width="70%">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          ${kepribadian.map(k => `
            <tr>
              <td class="text-center">${k.predikat || '&nbsp;'}</td>
              <td>${k.aspek}: ${k.deskripsi || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- B. PENGETAHUAN -->
      <div class="section-title">B. PENGETAHUAN</div>
      <table class="data-table">
        <thead>
          <tr>
            <th width="5%">No</th>
            <th width="55%">Mata Pelajaran</th>
            <th width="20%">Nilai</th>
            <th width="20%">Rata-Rata Kelas</th>
          </tr>
        </thead>
        <tbody>
          ${santriNilai.map((n, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td>${n.subject}</td>
              <td class="text-center">${n.score || 0}</td>
              <td class="text-center">${n.classAvg || 0}</td>
            </tr>
          `).join('')}
          <tr>
            <th colspan="2" class="text-center">JUMLAH</th>
            <th class="text-center">${totalScore}</th>
            <th class="text-center">${totalScore}</th>
          </tr>
          <tr>
            <th colspan="2" class="text-center">RATA-RATA</th>
            <th class="text-center">${avgScore}</th>
            <th class="text-center">${avgClassAvg}</th>
          </tr>
          <!-- Rank can be skipped if too complex, or shown as - -->
        </tbody>
      </table>

      <!-- C. KETAHFIZHAN -->
      <div class="section-title">C. KETAHFIZHAN</div>
      <table class="data-table">
        <thead>
          <tr>
            <th width="50%">Capaian Tahfizhul Qur'an</th>
            <th width="50%">Penilaian Al-Qur'an</th>
          </tr>
        </thead>
        <tbody>
          ${ketahfizhan.map(k => `
            <tr>
              <td class="text-center">${k.capaian || '&nbsp;'}</td>
              <td class="text-center">${k.penilaian || '&nbsp;'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- D. EKSTRAKURIKULER -->
      <div class="section-title">D. EKSTRAKURIKULER</div>
      <table class="data-table">
        <thead>
          <tr>
            <th width="5%">No</th>
            <th width="45%">Kegiatan Ekstrakurikuler</th>
            <th width="20%">Nilai</th>
            <th width="30%">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${ekstrakurikuler.map((e, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td>${e.namaKegiatan || '&nbsp;'}</td>
              <td class="text-center">${e.nilai || '&nbsp;'}</td>
              <td>${e.keterangan || '&nbsp;'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- E. KETIDAKHADIRAN -->
      <div class="section-title">E. KETIDAKHADIRAN</div>
      <table class="data-table" style="width: 60%;">
        <tbody>
          <tr>
            <td width="50%" class="text-center">Sakit</td>
            <td width="30%" class="text-center">${absen.sakit || 0}</td>
            <td width="20%" class="text-center">hari</td>
          </tr>
          <tr>
            <td class="text-center">Izin</td>
            <td class="text-center">${absen.izin || 0}</td>
            <td class="text-center">hari</td>
          </tr>
          <tr>
            <td class="text-center">Tanpa Keterangan</td>
            <td class="text-center">${absen.tanpaKeterangan || 0}</td>
            <td class="text-center">hari</td>
          </tr>
        </tbody>
      </table>
      <div class="note">* Ketidakhadiran dihitung dari tiap materi yang tidak diikuti, bukan akumulasi hari.</div>

      <!-- F. CATATAN WALI KELAS -->
      <div class="section-title">F. CATATAN WALI KELAS</div>
      <table class="data-table">
        <tbody>
          <tr>
            <td style="height: 60px; vertical-align: top;">${catatan || '&nbsp;'}</td>
          </tr>
        </tbody>
      </table>

      <!-- G. TANGGAPAN ORANG TUA/WALI -->
      <div class="section-title">G. TANGGAPAN ORANG TUA/WALI</div>
      <table class="data-table">
        <tbody>
          <tr>
            <td style="height: 60px; vertical-align: top;">${tanggapan || '&nbsp;'}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
          <tr>
            <td style="padding: 5px;">
              Keterangan Kenaikan Kelas: <b>${kenaikan || '..............................................'}</b>
              <br><span class="note">*) Coret yang tidak perlu</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Signatures -->
      <table class="footer-table">
        <tr>
          <td width="33%"></td>
          <td width="33%"></td>
          <td width="34%" style="text-align: left; padding-left: 20px;">
            Karanganyar, ${dateStr}<br>
            Wali Kelas
          </td>
        </tr>
        <tr>
          <td style="text-align: left; padding-left: 20px;">Orang Tua/Wali</td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td style="height: 80px;"></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: left; padding-left: 20px;">
            <div style="border-bottom: 1px dotted #000; width: 80%;"></div>
          </td>
          <td></td>
          <td style="text-align: left; padding-left: 20px;">
            <b>${waliKelasName}</b>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: center; padding-top: 20px;">
            Mengetahui<br>Ketua Unit<br>
            <br><br><br>
            <b>${ketuaUnitName}</b>
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
    // Use timeout to allow styles to load before print
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  }
}
