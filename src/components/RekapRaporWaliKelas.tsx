import React from 'react';
import { BookOpen, Edit, Printer, Search, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Santri, SchoolClass, AcademicYear, Semester, WaliKelas, Teacher, Subject, Nilai, RaporDetail } from '../types';
import { api } from '../api';
import RaporModal from './RaporModal';
import { printRapor } from '../utils/printRapor';

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

  // Filters
  const [selectedAY, setSelectedAY] = React.useState(academicYears[0]?.id || '');
  const [selectedSem, setSelectedSem] = React.useState(semesters[0]?.id || '');
  const [selectedClass, setSelectedClass] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

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
        api.getSantri({ classId: selectedClass }),
        api.getSchedules().then(async () => {
          // get all grades for the selected class, academic year and semester
          return api.getNilai ? await api.getNilai() : [];
        }).catch(() => []),
        api.getRaporDetail({ academicYearId: selectedAY, semesterId: selectedSem }).catch(() => [])
      ]);

      // Filter grades to only the selected class, academic year and semester
      const filteredNilai = (nilaiData as Nilai[]).filter(
        n => n.academicYearId === selectedAY && n.semesterId === selectedSem
      );

      setSantriList(santriData);
      setNilaiList(filteredNilai);
      setRaporDetails(raporData as RaporDetail[]);
    } catch (err) {
      console.error('Failed to load data for report cards:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedAY, selectedSem]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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
        nilaiList,
        subjects,
        raporDetail,
        waliName
      );
    } catch (err) {
      alert("Gagal mencetak rapor santri. Silakan coba lagi.");
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Rekap Rapor Kelas Bina'an</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Kelola data kepribadian, ketahfizhan, ekstrakurikuler, ketidakhadiran, dan cetak rapor resmi.
          </p>
        </div>
        
        {isWali && managedWaliClasses.length === 0 && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Anda belum ditunjuk sebagai Wali Kelas untuk periode ini.</span>
          </div>
        )}
      </div>

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

      {/* Santri List Table */}
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
                    <th className="px-6 py-4 style={{ width: '8%' }}">No</th>
                    <th className="px-6 py-4 style={{ width: '15%' }}">NIS</th>
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
