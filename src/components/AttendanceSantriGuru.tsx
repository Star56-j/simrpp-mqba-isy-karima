import React from 'react';
import { ClipboardList, Plus, CheckCircle, AlertCircle, Download, Upload, Calendar } from 'lucide-react';
import { Santri, SantriAttendance, SantriAttendanceSummary, SchoolClass, AcademicYear, Semester, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import BulkMonthlySantriModal from './BulkMonthlySantriModal';

interface AttendanceSantriGuruProps {
  academicYears: AcademicYear[];
  semesters: Semester[];
  classes: SchoolClass[];
  schedules: TeachingSchedule[];
  santriList: Santri[];
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AttendanceSantriGuru({ academicYears, semesters, classes, schedules, santriList }: AttendanceSantriGuruProps) {
  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const todayStr     = new Date().toISOString().split('T')[0];

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');

  const teacherId = myUser.teacherId || myUser.teacher_id;
  const myClassIds = [...new Set(
    schedules.filter(s => s.teacherId === teacherId).map(s => s.classId)
  )];
  const scheduleClasses = classes.filter(c => myClassIds.includes(c.id));
  
  // Apabila Wali Kelas, Admin, atau tidak ada jadwal mengajar, tampilkan semua kelas agar bisa diisi langsung
  const availableClasses = (myUser.role === 'WaliKelas' || myUser.role === 'Admin' || scheduleClasses.length === 0)
    ? classes
    : scheduleClasses;

  const [activeTab, setActiveTab] = React.useState<'isi' | 'riwayat' | 'rekap'>('isi');

  // Filter riwayat & rekap
  const [filterAY,    setFilterAY]    = React.useState(academicYears[0]?.id || '');
  const [filterSem,   setFilterSem]   = React.useState(semesters[0]?.id || '');
  const [filterYear,  setFilterYear]  = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode,   setRekapMode]   = React.useState<'bulan'|'semester'|'tahun'>('bulan');

  const [attendances, setAttendances] = React.useState<SantriAttendance[]>([]);
  const [summary,     setSummary]     = React.useState<SantriAttendanceSummary[]>([]);
  const [loading,     setLoading]     = React.useState(false);

  // Form isi absensi
  const [fClass,  setFClass]  = React.useState(availableClasses[0]?.id || '');
  const [fDate,   setFDate]   = React.useState(todayStr);
  const [fNotes,  setFNotes]  = React.useState('');
  const [fAY,     setFAY]     = React.useState(academicYears[0]?.id || '');
  const [fSem,    setFSem]    = React.useState(semesters[0]?.id || '');
  const [santriStatuses, setSantriStatuses] = React.useState<Record<string, string>>({});
  
  // Update fClass default jika availableClasses berubah
  React.useEffect(() => {
    if (availableClasses.length > 0 && (!fClass || !availableClasses.some(c => c.id === fClass))) {
      setFClass(availableClasses[0].id);
    }
  }, [availableClasses]);

  // Update santriStatuses when fClass changes
  React.useEffect(() => {
    const classSantris = santriList.filter(s => s.classId === fClass);
    const initialStatuses: Record<string, string> = {};
    classSantris.forEach(s => initialStatuses[s.id] = 'Hadir'); // Default Hadir
    setSantriStatuses(initialStatuses);
  }, [fClass, santriList]);
  
  const [submitting,  setSubmitting]  = React.useState(false);
  const [formError,   setFormError]   = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [editingId,   setEditingId]   = React.useState<string | null>(null);
  const [showBulkSantriModal, setShowBulkSantriModal] = React.useState(false);

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem, year: filterYear };
    if (rekapMode === 'bulan') p.month = filterMonth;
    return p;
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  const loadData = React.useCallback(() => {
    setLoading(true);
    const params = buildParams();
    Promise.all([
      api.getSantriAttendances(params),
      api.getSantriAttendanceSummary(params),
    ]).then(([list, sum]) => {
      setAttendances(list);
      setSummary(sum);
    }).catch(() => { setAttendances([]); setSummary([]); })
      .finally(() => setLoading(false));
  }, [buildParams]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleExport = () => {
    const ayName = academicYears.find(a => a.id === filterAY)?.name || '';
    const semName = semesters.find(s => s.id === filterSem)?.name || '';
    
    if (activeTab === 'riwayat') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Kelas': classes.find(c => c.id === a.classId)?.name || a.classId,
        'Hadir': a.jumlahHadir,
        'Izin': a.jumlahIzin,
        'Sakit': a.jumlahSakit,
        'Alpha': a.jumlahAlpha,
        'Total': a.jumlahTotal,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Santri_Guru_${ayName}_${semName}`);
    } else if (activeTab === 'rekap') {
      const dataToExport = summary.map((s, idx) => ({
        'No': idx + 1,
        'Kelas': classes.find(c => c.id === s.classId)?.name || s.classId,
        'Total Pertemuan': s.total,
        'Rata-rata Hadir': Math.round(s.hadir / (s.total || 1)),
        'Rata-rata Izin': Math.round(s.izin / (s.total || 1)),
        'Rata-rata Sakit': Math.round(s.sakit / (s.total || 1)),
        'Rata-rata Alpha': Math.round(s.alpha / (s.total || 1))
      }));
      exportToExcel(dataToExport, `Rekap_Absensi_Santri_Guru_${ayName}_${semName}`);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile<any>(file);
      if (data.length === 0) throw new Error("File kosong");
      setSubmitting(true);
      const attendancesToSave = data.map(row => {
        const clsName = String(row['Kelas']).replace('Kelas ', '');
        const cls = availableClasses.find(c => c.name === clsName || c.id === clsName);
        if (!cls) return null;
        return {
          classId: cls.id,
          date: row['Tanggal'] || new Date().toISOString().split('T')[0],
          jumlahHadir: Number(row['Hadir'] || 0),
          jumlahIzin: Number(row['Izin'] || 0),
          jumlahSakit: Number(row['Sakit'] || 0),
          jumlahAlpha: Number(row['Alpha'] || 0),
          jumlahTotal: Number(row['Total'] || 0),
          notes: row['Keterangan'] || '',
          academicYearId: filterAY,
          semesterId: filterSem
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      alert(`Berhasil mengimport data absensi`);
      loadData();
    } catch (err: any) {
      alert("Gagal mengimport: " + err.message);
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fClass || !fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    
    const classSantris = santriList.filter(s => s.classId === fClass);
    if (classSantris.length === 0) { setFormError('Tidak ada santri di kelas ini.'); return; }
    
    setSubmitting(true);
    try {
      const cls = availableClasses.find(c => c.id === fClass);
      
      if (editingId) {
        setFormError('Edit riwayat absensi santri format lama tidak didukung. Silakan input baru.');
        setSubmitting(false);
        return;
      }
      
      const attendancesToSave = classSantris.map(santri => ({
        classId: fClass,
        date: fDate,
        santriId: santri.id,
        status: santriStatuses[santri.id] || 'Hadir',
        jumlahHadir: 0, jumlahIzin: 0, jumlahSakit: 0, jumlahAlpha: 0, jumlahTotal: 1,
        notes: fNotes,
        academicYearId: fAY,
        semesterId: fSem
      }));

      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      setFormSuccess(`Absensi detail santri Kelas ${cls?.name} tanggal ${fDate} berhasil dicatat.`);
      
      // Reset
      const initialStatuses: Record<string, string> = {};
      classSantris.forEach(s => initialStatuses[s.id] = 'Hadir');
      setSantriStatuses(initialStatuses);
      setFNotes('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan absensi santri.');
    } finally {
      setSubmitting(false);
    }
  };

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s => s.id === filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Santri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat dan pantau kehadiran seluruh santri per kelas secara langsung.</p>
        </div>
        <button onClick={() => setShowBulkSantriModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
          <Calendar className="w-4 h-4"/><span>⚡ Input Rekap Bulanan Santri Massal</span>
        </button>
      </div>

      {/* Tab & Export */}
      <div className="flex items-center gap-2">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {([
            { id: 'isi', label: 'Isi Absensi' },
            { id: 'riwayat', label: 'Riwayat' },
            { id: 'rekap', label: 'Rekapitulasi' }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition
                ${activeTab === t.id ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        
        {activeTab !== 'isi' && (
          <>
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
              <Upload className="w-4 h-4" /><span>Import</span>
            </button>
            <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
              <Download className="w-4 h-4" /><span>Export</span>
            </button>
          </>
        )}
      </div>

      {/* ===== TAB: ISI ABSENSI ===== */}
      {activeTab === 'isi' && (
        <div className="w-full max-w-4xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-indigo-800 px-6 py-4">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Form Pengisian Absensi Santri (Per Kelas)</h3>
              <p className="text-indigo-300 text-xs mt-0.5">Pilih kelas & tanggal, lalu tandai dan simpan kehadiran seluruh santri sekaligus.</p>
            </div>
            <form onSubmit={handleSelfSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {availableClasses.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-medium">Belum ada kelas terdaftar.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kelas */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Kelas</label>
                      <select required value={fClass} onChange={e => setFClass(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {availableClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
                      </select>
                    </div>

                    {/* Tanggal */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal Absensi</label>
                      <input type="date" required value={fDate} onChange={e => setFDate(e.target.value)}
                        max={todayStr}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  {/* Daftar Santri */}
                  <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                        Daftar Santri Kelas {availableClasses.find(c => c.id === fClass)?.name} ({santriList.filter(s => s.classId === fClass).length} Santri)
                      </label>
                      
                      {/* Quick Action Bulk Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Tandai Semua:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const classSantris = santriList.filter(s => s.classId === fClass);
                            const updated: Record<string, string> = {};
                            classSantris.forEach(s => updated[s.id] = 'Hadir');
                            setSantriStatuses(updated);
                          }}
                          className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer"
                        >
                          ✓ Semua Hadir
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const classSantris = santriList.filter(s => s.classId === fClass);
                            const updated: Record<string, string> = {};
                            classSantris.forEach(s => updated[s.id] = 'Izin');
                            setSantriStatuses(updated);
                          }}
                          className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer"
                        >
                          Semua Izin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const classSantris = santriList.filter(s => s.classId === fClass);
                            const updated: Record<string, string> = {};
                            classSantris.forEach(s => updated[s.id] = 'Sakit');
                            setSantriStatuses(updated);
                          }}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer"
                        >
                          Semua Sakit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const classSantris = santriList.filter(s => s.classId === fClass);
                            const updated: Record<string, string> = {};
                            classSantris.forEach(s => updated[s.id] = 'Alpha');
                            setSantriStatuses(updated);
                          }}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer"
                        >
                          Semua Alpha
                        </button>
                      </div>
                    </div>

                    {santriList.filter(s => s.classId === fClass).length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 font-medium">Tidak ada santri terdaftar di kelas ini.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                            <tr>
                              <th className="px-4 py-3">No</th>
                              <th className="px-4 py-3">Nama Santri</th>
                              <th className="px-4 py-3 text-center">Hadir</th>
                              <th className="px-4 py-3 text-center">Izin</th>
                              <th className="px-4 py-3 text-center">Sakit</th>
                              <th className="px-4 py-3 text-center">Alpha</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {santriList.filter(s => s.classId === fClass).map((santri, idx) => (
                              <tr key={santri.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">{santri.name}</td>
                                {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(status => (
                                  <td key={status} className="px-4 py-3 text-center">
                                    <label className="inline-flex items-center justify-center p-1 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name={`status-${santri.id}`}
                                        checked={santriStatuses[santri.id] === status || (!santriStatuses[santri.id] && status === 'Hadir')}
                                        onChange={() => setSantriStatuses(p => ({...p, [santri.id]: status}))}
                                        className={`w-4 h-4 cursor-pointer ${
                                          status === 'Hadir' ? 'accent-indigo-600' :
                                          status === 'Izin' ? 'accent-blue-500' :
                                          status === 'Sakit' ? 'accent-amber-500' : 'accent-rose-500'
                                        }`}
                                      />
                                    </label>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Keterangan (opsional)</label>
                    <textarea rows={2} placeholder="Contoh: Libur, ada kegiatan pesantren..."
                      value={fNotes} onChange={e => setFNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  {/* Tahun Ajaran & Semester */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                      <select required value={fAY} onChange={e => setFAY(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                      <select required value={fSem} onChange={e => setFSem(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting || availableClasses.length === 0}
                    className="w-full py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider text-white bg-indigo-700 hover:bg-indigo-800 shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? 'Menyimpan...' : 'Simpan Absensi Santri'}</span>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ===== FILTER BAR (Riwayat & Rekap) ===== */}
      {(activeTab === 'riwayat' || activeTab === 'rekap') && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
            <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 min-w-[120px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 min-w-[100px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rentang</label>
            <select value={rekapMode} onChange={e => setRekapMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="bulan">Per Bulan</option>
              <option value="semester">Per Semester</option>
              <option value="tahun">Per Tahun</option>
            </select>
          </div>
          {rekapMode === 'bulan' && (
            <div className="space-y-1 min-w-[130px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 min-w-[80px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun</label>
            <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} min={2020} max={2035}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

      {/* ===== TAB: RIWAYAT ===== */}
      {activeTab === 'riwayat' && (() => {
        // Group by date and class
        const groupedAttendances = Object.values(
          attendances.reduce((acc, a) => {
            const key = `${a.date}-${a.classId}`;
            if (!acc[key]) {
              acc[key] = {
                id: key,
                date: a.date,
                classId: a.classId,
                className: (a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId,
                hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, notes: a.notes,
                absentees: []
              };
            }
            if (a.status) {
              acc[key].total++;
              if (a.status === 'Hadir') acc[key].hadir++;
              else if (a.status === 'Izin') { acc[key].izin++; acc[key].absentees.push(`${a.santri?.name} (I)`); }
              else if (a.status === 'Sakit') { acc[key].sakit++; acc[key].absentees.push(`${a.santri?.name} (S)`); }
              else if (a.status === 'Alpha') { acc[key].alpha++; acc[key].absentees.push(`${a.santri?.name} (A)`); }
            } else {
              // Legacy format support
              acc[key].hadir += (a.jumlahHadir || 0);
              acc[key].izin += (a.jumlahIzin || 0);
              acc[key].sakit += (a.jumlahSakit || 0);
              acc[key].alpha += (a.jumlahAlpha || 0);
              acc[key].total = acc[key].hadir + acc[key].izin + acc[key].sakit + acc[key].alpha;
            }
            return acc;
          }, {} as Record<string, any>)
        ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Riwayat Absensi Santri — {rekapLabel}
              </span>
              <span className="text-xs text-slate-400">{groupedAttendances.length} sesi pertemuan</span>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
            ) : groupedAttendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada data absensi santri untuk periode ini.</p>
              <button onClick={() => setActiveTab('isi')}
                className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                + Isi Absensi Santri Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3 text-center">Hadir</th>
                    <th className="px-4 py-3 text-center">Izin</th>
                    <th className="px-4 py-3 text-center">Sakit</th>
                    <th className="px-4 py-3 text-center">Alpha</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {groupedAttendances.map((a: any, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        Kelas {a.className}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{a.hadir}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{a.izin}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{a.sakit}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{a.alpha}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">{a.total}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">
                        {a.notes || '-'}
                        {a.absentees.length > 0 && (
                          <div className="mt-1 text-[10px] text-rose-500 font-semibold">{a.absentees.join(', ')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => {
                          setFClass(a.classId);
                          setFDate(a.date);
                          const sessionRecords = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId);
                          const existingStatuses: Record<string, string> = {};
                          sessionRecords.forEach(rec => {
                            existingStatuses[rec.santriId] = rec.status;
                          });
                          setSantriStatuses(existingStatuses);
                          if (a.notes) setFNotes(a.notes);
                          setActiveTab('isi');
                        }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition mr-1"
                          title="Edit Absensi Sesi Ini"
                        >
                          Edit
                        </button>
                        <button onClick={async () => {
                          if (window.confirm('Hapus seluruh absensi kelas ini pada tanggal tersebut?')) {
                            setLoading(true);
                            // Find all records for this date and class
                            const recordsToDelete = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId);
                            try {
                              for (const rec of recordsToDelete) {
                                await api.deleteSantriAttendance(rec.id);
                              }
                              loadData();
                            } catch (e) {
                              alert('Gagal menghapus data.');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                          className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                          title="Hapus"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        );
      })()}

      {/* ===== TAB: REKAP ===== */}
      {activeTab === 'rekap' && (
        <div className="space-y-5">
          {summary.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Hadir', val: summary.reduce((s,r)=>s+r.hadir,0), cls: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
                  { label: 'Izin',  val: summary.reduce((s,r)=>s+r.izin,0),  cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
                  { label: 'Sakit', val: summary.reduce((s,r)=>s+r.sakit,0), cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
                  { label: 'Alpha', val: summary.reduce((s,r)=>s+r.alpha,0), cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
                ].map(c => (
                  <div key={c.label} className={`p-5 rounded-2xl border ${c.cls}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                    <p className="text-4xl font-black mt-1">{c.val}</p>
                  </div>
                ))}
              </div>

              {/* Rekap per kelas */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Rekap Per Kelas — {rekapLabel}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                      <tr>
                        <th className="px-4 py-3">Kelas</th>
                        <th className="px-4 py-3 text-center">Hadir</th>
                        <th className="px-4 py-3 text-center">Izin</th>
                        <th className="px-4 py-3 text-center">Sakit</th>
                        <th className="px-4 py-3 text-center">Alpha</th>
                        <th className="px-4 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-center">% Hadir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                      {summary.map(r => (
                        <tr key={r.classId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">Kelas {r.className}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{r.hadir}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{r.izin}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{r.sakit}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{r.alpha}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">{r.total}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${r.rataHadir>=80?'bg-indigo-500':r.rataHadir>=60?'bg-amber-500':'bg-rose-500'}`}
                                  style={{ width: `${r.rataHadir}%` }} />
                              </div>
                              <span className={`text-xs font-extrabold ${r.rataHadir>=80?'text-indigo-600':r.rataHadir>=60?'text-amber-600':'text-rose-600'}`}>
                                {r.rataHadir}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada data rekap untuk periode ini.</p>
            </div>
          )}
        </div>
      )}

      {/* BULK MONTHLY SANTRI MODAL */}
      <BulkMonthlySantriModal
        isOpen={showBulkSantriModal}
        onClose={() => setShowBulkSantriModal(false)}
        classes={availableClasses}
        academicYears={academicYears}
        semesters={semesters}
        santriList={santriList}
        onSuccess={() => loadData()}
        defaultClassId={fClass}
      />
    </div>
  );
}
