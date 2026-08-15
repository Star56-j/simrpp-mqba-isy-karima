import React from 'react';
import { BookOpen, Edit, Printer, Search, CheckCircle, AlertCircle, Sparkles, FileSpreadsheet, Eye } from 'lucide-react';
import { Santri, SchoolClass, AcademicYear, Semester, WaliKelas, Teacher, Subject, Nilai, RaporDetail } from '../types';
import { api } from '../api';
import RaporModal from './RaporModal';
import { printRapor } from '../utils/printRapor';
import { printPerkembangan } from '../utils/printPerkembangan';
import { computeRaporScore } from '../utils/nilaiWeights';
import * as XLSX from 'xlsx';

interface RekapRaporWaliKelasProps {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  subjects: Subject[];
  waliKelasList: WaliKelas[];
  currentUser: any;
  teachers: Teacher[];
}

export default function RekapRaporWaliKelas({
  classes,
  academicYears,
  semesters,
  subjects,
  waliKelasList,
  currentUser,
  teachers
}: RekapRaporWaliKelasProps) {
  const [santriList, setSantriList] = React.useState<Santri[]>([]);
  const [nilaiList, setNilaiList] = React.useState<Nilai[]>([]);
  const [raporDetails, setRaporDetails] = React.useState<RaporDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Tab switcher
  const [activeTab, setActiveTab] = React.useState<'rapor' | 'perkembangan'>('rapor');

  // Filters
  const [selectedAY, setSelectedAY] = React.useState(academicYears[0]?.id || '');
  const [selectedSem, setSelectedSem] = React.useState(semesters[0]?.id || '');
  const [selectedClass, setSelectedClass] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Laporan Perkembangan Filters
  const [selectedSantriId, setSelectedSantriId] = React.useState('');
  const [timeframe, setTimeframe] = React.useState<'bulanan' | 'semester' | 'tahunan'>('bulanan');
  const [timeframeDetail, setTimeframeDetail] = React.useState('Juli');

  // Rapor modal state
  const [raporModalSantri, setRaporModalSantri] = React.useState<Santri | null>(null);

  // Determine managed classes based on role
  const isWali = currentUser.role === 'Guru';
  const managedWaliClasses = React.useMemo(() => {
    if (isWali) {
      return waliKelasList.filter(
        w => w.teacherId === currentUser.teacherId &&
             w.academicYearId === selectedAY &&
             w.semesterId === selectedSem
      );
    }
    return [];
  }, [waliKelasList, currentUser, isWali, selectedAY, selectedSem]);

  // Set default class based on managed classes or all classes
  React.useEffect(() => {
    if (isWali) {
      if (managedWaliClasses.length > 0) {
        setSelectedClass(managedWaliClasses[0].classId);
      } else {
        setSelectedClass('');
      }
    } else {
      if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0].id);
      }
    }
  }, [managedWaliClasses, isWali, classes, selectedAY, selectedSem]);

  const loadData = React.useCallback(async () => {
    if (!selectedClass || !selectedAY || !selectedSem) {
      setSantriList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [santriData, nilaiData, raporData] = await Promise.all([
        api.getSantri(selectedClass),
        api.getNilai ? await api.getNilai() : [],
        api.getRaporDetail({ academicYearId: selectedAY, semesterId: selectedSem }).catch(() => [])
      ]);

      // Filter grades to only the selected class, academic year
      const filteredNilai = (nilaiData as Nilai[]).filter(
        n => n.academicYearId === selectedAY
      );

      setSantriList(santriData);
      setNilaiList(filteredNilai);
      setRaporDetails(raporData as RaporDetail[]);
      
      if (santriData.length > 0 && !selectedSantriId) {
        setSelectedSantriId(santriData[0].id);
      }
    } catch (err) {
      console.error('Failed to load data for report cards:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedAY, selectedSem]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync selected santri when class/list changes
  React.useEffect(() => {
    if (santriList.length > 0) {
      setSelectedSantriId(santriList[0].id);
    } else {
      setSelectedSantriId('');
    }
  }, [santriList]);

  // Search filter
  const filteredSantri = santriList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  const getRaporStatus = (santriId: string) => {
    const detail = raporDetails.find(r => r.santriId === santriId && r.academicYearId === selectedAY && r.semesterId === selectedSem);
    if (!detail) return { status: 'Belum Diisi', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' };
    
    const isComplete = detail.kepribadian.length > 0 && detail.ketahfizhan.length > 0 && detail.catatanWaliKelas;
    if (isComplete) {
      return { status: 'Lengkap', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' };
    }
    return { status: 'Sebagian', color: 'text-sky-700 bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30' };
  };

  const handlePrint = async (santri: Santri) => {
    try {
      const details = await api.getRaporDetail({ santriId: santri.id, academicYearId: selectedAY, semesterId: selectedSem });
      const raporDetail = details.length > 0 ? details[0] : null;
      
      const classWali = waliKelasList.find(
        w => w.classId === selectedClass && w.academicYearId === selectedAY && w.semesterId === selectedSem
      );
      
      let waliName = "Wali Kelas";
      if (classWali) {
        const teacher = teachers.find(t => t.id === classWali.teacherId);
        waliName = teacher ? teacher.name : "Wali Kelas";
      } else if (currentUser.role === 'Guru') {
        waliName = currentUser.name;
      }

      printRapor(
        santri,
        classes.find(c => c.id === selectedClass)!,
        academicYears.find(a => a.id === selectedAY)!,
        semesters.find(s => s.id === selectedSem)!,
        nilaiList.filter(n => n.semesterId === selectedSem),
        subjects,
        raporDetail,
        waliName
      );
    } catch (err) {
      alert("Gagal mencetak rapor santri. Silakan coba lagi.");
    }
  };

  const handlePrintPerkembangan = () => {
    const santri = santriList.find(s => s.id === selectedSantriId);
    if (!santri) return;

    const classWali = waliKelasList.find(
      w => w.classId === selectedClass && w.academicYearId === selectedAY && w.semesterId === selectedSem
    );
    
    let waliName = "Wali Kelas";
    if (classWali) {
      const teacher = teachers.find(t => t.id === classWali.teacherId);
      waliName = teacher ? teacher.name : "Wali Kelas";
    } else if (currentUser.role === 'Guru') {
      waliName = currentUser.name;
    }

    printPerkembangan(
      santri,
      classes.find(c => c.id === selectedClass)!,
      academicYears.find(a => a.id === selectedAY)!,
      nilaiList,
      subjects,
      raporDetails,
      timeframe,
      timeframeDetail,
      waliName
    );
  };

  const exportProgressToExcel = () => {
    const santri = santriList.find(s => s.id === selectedSantriId);
    if (!santri) return;

    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

    // build structured rows
    const rows: any[][] = [
      ["LAPORAN PERKEMBANGAN HASIL BELAJAR SANTRI"],
      ["Markaz Qur'an dan Bahasa Arab Isy Karima"],
      [],
      ["Nama Santri", ":", santri.name.toUpperCase()],
      ["NIS", ":", santri.nis],
      ["Kelas", ":", selectedClassName],
      ["Periode", ":", `Rentang ${timeframe.toUpperCase()} (${timeframeDetail})`],
      ["Tahun Pelajaran", ":", academicYears.find(a => a.id === selectedAY)?.name || ''],
      [],
    ];

    const getAverage = (n: Nilai): number => {
      return computeRaporScore(n).nilaiAkhirTulis;
    };

    if (timeframe === 'bulanan') {
      rows.push(["No", "Mata Pelajaran", "Nilai Harian", "Nilai Bulanan"]);
      subjects.forEach((subj, idx) => {
        const activeNilai = selectedSem === 'sem-1' ? nilaiList.filter(n => n.semesterId === 'sem-1') : nilaiList.filter(n => n.semesterId === 'sem-2');
        const n = activeNilai.find(x => x.santriId === santri.id && x.subjectId === subj.id);
        const daily = n && n.harian ? n.harian : "-";
        const monthly = n && n.bulanan ? n.bulanan : "-";
        rows.push([idx + 1, subj.name, daily, monthly]);
      });
    } else if (timeframe === 'semester') {
      rows.push(["No", "Mata Pelajaran", "Harian", "Bulanan", "UTS (Mid)", "UAS Tulis (60%)", "UAS Lisan", "Nilai Akhir Rapor"]);
      subjects.forEach((subj, idx) => {
        const semId = timeframeDetail === 'Ganjil' ? 'sem-1' : 'sem-2';
        const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === subj.id && x.semesterId === semId);
        const daily = n && n.harian ? n.harian : "-";
        const monthly = n && n.bulanan ? n.bulanan : "-";
        const uts = n && n.uts ? n.uts : "-";
        const uas = n && n.uas ? n.uas : "-";
        const uasLisan = n && n.uasLisan ? n.uasLisan : "-";
        const finalRapor = n ? getAverage(n) : "-";
        rows.push([idx + 1, subj.name, daily, monthly, uts, uas, uasLisan, finalRapor]);
      });
    } else {
      rows.push(["No", "Mata Pelajaran", "Nilai Rapor S1", "Nilai Rapor S2", "Nilai Akhir Tahun", "Perkembangan"]);
      subjects.forEach((subj, idx) => {
        const nGanjil = nilaiList.find(x => x.santriId === santri.id && x.subjectId === subj.id && x.semesterId === 'sem-1');
        const nGenap = nilaiList.find(x => x.santriId === santri.id && x.subjectId === subj.id && x.semesterId === 'sem-2');

        const avgGanjil = nGanjil ? getAverage(nGanjil) : 0;
        const avgGenap = nGenap ? getAverage(nGenap) : 0;

        const finalScore = avgGanjil > 0 && avgGenap > 0 ? Math.round((avgGanjil + avgGenap) / 2) : (avgGenap || avgGanjil || "-");

        let status = 'Stabil';
        if (avgGanjil > 0 && avgGenap > 0) {
          if (avgGenap > avgGanjil) status = 'Naik';
          else if (avgGenap < avgGanjil) status = 'Turun';
        }

        rows.push([idx + 1, subj.name, avgGanjil || "-", avgGenap || "-", finalScore, status]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perkembangan");
    XLSX.writeFile(wb, `Laporan_Perkembangan_${santri.name.replace(/\s+/g, '_')}_${timeframe}.xlsx`);
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
  const currentSelectedSantri = santriList.find(s => s.id === selectedSantriId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Rekap Rapor & Perkembangan Kelas Bina'an</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Kelola data kepribadian, ketahfizhan, dan lihat laporan grafik perkembangan hasil belajar santri.
          </p>
        </div>
        
        {isWali && managedWaliClasses.length === 0 && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Anda belum ditunjuk sebagai Wali Kelas untuk periode ini.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('rapor')}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'rapor'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Daftar Rapor Santri
        </button>
        <button
          onClick={() => setActiveTab('perkembangan')}
          className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'perkembangan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Laporan Perkembangan
        </button>
      </div>

      {activeTab === 'rapor' ? (
        <>
          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Ajaran</label>
              <select
                value={selectedAY}
                onChange={e => setSelectedAY(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>TA {ay.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester</label>
              <select
                value={selectedSem}
                onChange={e => setSelectedSem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name === 'Ganjil' ? '1 (Gasal)' : '2 (Genap)'}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={isWali && managedWaliClasses.length <= 1}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400"
              >
                <option value="" disabled>Pilih kelas...</option>
                {isWali ? (
                  managedWaliClasses.map(w => {
                    const cls = classes.find(c => c.id === w.classId);
                    return cls ? <option key={cls.id} value={cls.id}>Kelas {cls.name} ({cls.level})</option> : null;
                  })
                ) : (
                  classes.map(cls => <option key={cls.id} value={cls.id}>Kelas {cls.name} ({cls.level})</option>)
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cari Santri</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nama / NIS..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Table */}
          {selectedClass ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  Memuat data santri...
                </div>
              ) : filteredSantri.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400 italic">
                  Tidak ada data santri ditemukan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60">
                        <th className="px-6 py-4" style={{ width: '8%' }}>No</th>
                        <th className="px-6 py-4" style={{ width: '15%' }}>NIS</th>
                        <th className="px-6 py-4">Nama Lengkap</th>
                        <th className="px-6 py-4 text-center" style={{ width: '20%' }}>Kelengkapan</th>
                        <th className="px-6 py-4 text-center" style={{ width: '25%' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredSantri.map((santri, idx) => {
                        const status = getRaporStatus(santri.id);
                        return (
                          <tr key={santri.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-slate-400">{idx + 1}</td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">{santri.nis}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">{santri.name}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${status.color}`}>
                                {status.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setRaporModalSantri(santri)}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Isi Detail</span>
                                </button>
                                <button
                                  onClick={() => handlePrint(santri)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Cetak Rapor</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Silakan pilih kelas terlebih dahulu untuk melihat rekap rapor.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Laporan Perkembangan Tab */
        <div className="space-y-6">
          {/* Config Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={isWali && managedWaliClasses.length <= 1}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              >
                {isWali ? (
                  managedWaliClasses.map(w => {
                    const cls = classes.find(c => c.id === w.classId);
                    return cls ? <option key={cls.id} value={cls.id}>Kelas {cls.name}</option> : null;
                  })
                ) : (
                  classes.map(cls => <option key={cls.id} value={cls.id}>Kelas {cls.name}</option>)
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Santri</label>
              <select
                value={selectedSantriId}
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              >
                {santriList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rentang Laporan</label>
              <select
                value={timeframe}
                onChange={e => {
                  setTimeframe(e.target.value as any);
                  setTimeframeDetail(e.target.value === 'bulanan' ? 'Juli' : e.target.value === 'semester' ? 'Ganjil' : 'Tahunan');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              >
                <option value="bulanan">1 Bulan (Bulanan)</option>
                <option value="semester">1 Semester (Semesterly)</option>
                <option value="tahunan">1 Tahun (Yearly)</option>
              </select>
            </div>

            {timeframe !== 'tahunan' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Periode</label>
                <select
                  value={timeframeDetail}
                  onChange={e => setTimeframeDetail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                >
                  {timeframe === 'bulanan' ? (
                    <>
                      <option value="Juli">Juli</option>
                      <option value="Agustus">Agustus</option>
                      <option value="September">September</option>
                      <option value="Oktober">Oktober</option>
                      <option value="November">November</option>
                      <option value="Desember">Desember</option>
                      <option value="Januari">Januari</option>
                      <option value="Februari">Februari</option>
                      <option value="Maret">Maret</option>
                      <option value="April">April</option>
                      <option value="Mei">Mei</option>
                      <option value="Juni">Juni</option>
                    </>
                  ) : (
                    <>
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="flex items-end gap-2 md:col-span-1">
              <button
                onClick={handlePrintPerkembangan}
                disabled={!selectedSantriId}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={exportProgressToExcel}
                disabled={!selectedSantriId}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Report Card Preview */}
          {currentSelectedSantri ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Preview Laporan Perkembangan</h4>
                  <p className="text-xs text-slate-400">Santri: {currentSelectedSantri.name} | NIS: {currentSelectedSantri.nis}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded border border-indigo-100 dark:border-indigo-900/30">
                  {timeframe} - {timeframeDetail}
                </span>
              </div>

              {/* Structured Tables depending on timeframe */}
              {timeframe === 'bulanan' && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Hasil Penilaian Akademik Bulanan</h5>
                  <div className="overflow-x-auto border rounded-xl dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold border-b dark:border-slate-800">
                          <th className="p-3 text-center" style={{ width: '8%' }}>No</th>
                          <th className="p-3">Mata Pelajaran</th>
                          <th className="p-3 text-center" style={{ width: '25%' }}>Rerata Harian</th>
                          <th className="p-3 text-center" style={{ width: '25%' }}>Ujian Bulanan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subj, idx) => {
                          const n = nilaiList.find(x => x.santriId === selectedSantriId && x.subjectId === subj.id);
                          return (
                            <tr key={subj.id} className="border-b last:border-0 dark:border-slate-850">
                              <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{subj.name}</td>
                              <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{n && n.harian ? n.harian : '-'}</td>
                              <td className="p-3 text-center font-bold text-teal-600 dark:text-teal-400">{n && n.bulanan ? n.bulanan : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {timeframe === 'semester' && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Rincian Nilai Semester ({timeframeDetail})</h5>
                  <div className="overflow-x-auto border rounded-xl dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold border-b dark:border-slate-800">
                          <th className="p-3 text-center" style={{ width: '8%' }}>No</th>
                          <th className="p-3">Mata Pelajaran</th>
                          <th className="p-3 text-center">Harian</th>
                          <th className="p-3 text-center">Bulanan</th>
                          <th className="p-3 text-center">UTS</th>
                          <th className="p-3 text-center">UAS</th>
                          <th className="p-3 text-center">Rerata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subj, idx) => {
                          const semId = timeframeDetail === 'Ganjil' ? 'sem-1' : 'sem-2';
                          const n = nilaiList.find(x => x.santriId === selectedSantriId && x.subjectId === subj.id && x.semesterId === semId);
                          const avg = n ? Math.round((n.harian + n.bulanan + n.uts + n.uas + (n.uasLisan || 0)) / [n.harian, n.bulanan, n.uts, n.uas, n.uasLisan || 0].filter(v => v > 0).length) : 0;
                          return (
                            <tr key={subj.id} className="border-b last:border-0 dark:border-slate-850">
                              <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{subj.name}</td>
                              <td className="p-3 text-center">{n && n.harian ? n.harian : '-'}</td>
                              <td className="p-3 text-center">{n && n.bulanan ? n.bulanan : '-'}</td>
                              <td className="p-3 text-center">{n && n.uts ? n.uts : '-'}</td>
                              <td className="p-3 text-center">{n && n.uas ? n.uas : '-'}</td>
                              <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{avg || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {timeframe === 'tahunan' && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Rerata Hasil Belajar & Perkembangan Tahunan</h5>
                  <div className="overflow-x-auto border rounded-xl dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold border-b dark:border-slate-800">
                          <th className="p-3 text-center" style={{ width: '8%' }}>No</th>
                          <th className="p-3">Mata Pelajaran</th>
                          <th className="p-3 text-center">Rerata S1</th>
                          <th className="p-3 text-center">Rerata S2</th>
                          <th className="p-3 text-center">Nilai Akhir</th>
                          <th className="p-3 text-center" style={{ width: '18%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subj, idx) => {
                          const nGanjil = nilaiList.find(x => x.santriId === selectedSantriId && x.subjectId === subj.id && x.semesterId === 'sem-1');
                          const nGenap = nilaiList.find(x => x.santriId === selectedSantriId && x.subjectId === subj.id && x.semesterId === 'sem-2');
                          
                          const getAvg = (n: Nilai | undefined) => {
                            if (!n) return 0;
                            const count = [n.harian, n.bulanan, n.uts, n.uas, n.uasLisan || 0].filter(v => v > 0).length;
                            return count === 0 ? 0 : Math.round((n.harian + n.bulanan + n.uts + n.uas + (n.uasLisan || 0)) / count);
                          };

                          const avgG = getAvg(nGanjil);
                          const avgGe = getAvg(nGenap);
                          const final = avgG > 0 && avgGe > 0 ? Math.round((avgG + avgGe) / 2) : (avgGe || avgG || 0);

                          let status = { text: 'Stabil', color: 'text-slate-600 bg-slate-50 dark:bg-slate-800/40' };
                          if (avgG > 0 && avgGe > 0) {
                            if (avgGe > avgG) status = { text: '📈 Naik', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20' };
                            else if (avgGe < avgG) status = { text: '📉 Turun', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/20' };
                          }

                          return (
                            <tr key={subj.id} className="border-b last:border-0 dark:border-slate-850">
                              <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{subj.name}</td>
                              <td className="p-3 text-center">{avgG || '-'}</td>
                              <td className="p-3 text-center">{avgGe || '-'}</td>
                              <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{final || '-'}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${status.color}`}>
                                  {status.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Belum ada data santri di kelas ini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rapor Detail Modal */}
      {raporModalSantri && (
        <RaporModal
          santri={raporModalSantri}
          academicYearId={selectedAY}
          semesterId={selectedSem}
          onClose={() => setRaporModalSantri(null)}
          onSave={() => {
            setRaporModalSantri(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
