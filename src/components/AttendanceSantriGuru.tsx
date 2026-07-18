import React from 'react';
import { ClipboardList, Plus, CheckCircle, AlertCircle, Download, Upload } from 'lucide-react';
import { Santri, SantriAttendance, SantriAttendanceSummary, SchoolClass, AcademicYear, Semester, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';

interface AttendanceSantriGuruProps {
  academicYears: AcademicYear[];
  semesters: Semester[];
  classes: SchoolClass[];
  schedules: TeachingSchedule[];
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AttendanceSantriGuru({ academicYears, semesters, classes, schedules }: AttendanceSantriGuruProps) {
  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const todayStr     = new Date().toISOString().split('T')[0];

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');

  // Kelas yang diajar guru ini (unique classId)
  const myClassIds = [...new Set(
    schedules.filter(s => s.teacherId === myUser.teacherId).map(s => s.classId)
  )];
  const myClasses = classes.filter(c => myClassIds.includes(c.id));

  const [activeTab, setActiveTab] = React.useState<'isi' | 'list' | 'rekap'>('isi');

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
  const [fClass,  setFClass]  = React.useState(myClasses[0]?.id || '');
  const [fDate,   setFDate]   = React.useState(todayStr);
  const [fHadir,  setFHadir]  = React.useState(0);
  const [fIzin,   setFIzin]   = React.useState(0);
  const [fSakit,  setFSakit]  = React.useState(0);
  const [fAlpha,  setFAlpha]  = React.useState(0);
  const [fNotes,  setFNotes]  = React.useState('');
  const [fAY,     setFAY]     = React.useState(academicYears[0]?.id || '');
  const [fSem,    setFSem]    = React.useState(semesters[0]?.id || '');
  const [submitting,  setSubmitting]  = React.useState(false);
  const [formError,   setFormError]   = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');

  const fTotal = fHadir + fIzin + fSakit + fAlpha;

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
        'Total Pertemuan': s.totalSessions,
        'Rata-rata Hadir': Math.round(s.avgHadir),
        'Rata-rata Izin': Math.round(s.avgIzin),
        'Rata-rata Sakit': Math.round(s.avgSakit),
        'Rata-rata Alpha': Math.round(s.avgAlpha)
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
        const santri = mySantri.find(s => s.nis === String(row['NIS']));
        if (!santri) return null;
        return {
          santriId: santri.id,
          classId: santri.classId,
          date: row['Tanggal'] || new Date().toISOString().split('T')[0],
          status: row['Status'] || 'Hadir',
          notes: row['Keterangan'] || ''
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      alert(`Berhasil mengimport ${attendancesToSave.length} data absensi`);
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
    setSubmitting(true);
    try {
      await api.createSantriAttendanceGuru({
        classId: fClass, date: fDate,
        jumlahHadir: fHadir, jumlahIzin: fIzin, jumlahSakit: fSakit, jumlahAlpha: fAlpha,
        jumlahTotal: fTotal, notes: fNotes, academicYearId: fAY, semesterId: fSem,
      });
      const cls = myClasses.find(c => c.id === fClass);
      setFormSuccess(`Absensi santri Kelas ${cls?.name} tanggal ${fDate} berhasil dicatat.`);
      setFHadir(0); setFIzin(0); setFSakit(0); setFAlpha(0); setFNotes('');
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Santri</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat dan pantau kehadiran santri kelas yang Anda ajar.</p>
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
        <div className="max-w-lg">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-indigo-800 px-6 py-4">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Form Pengisian Absensi Santri</h3>
              <p className="text-indigo-300 text-xs mt-0.5">Isi jumlah kehadiran santri per kelas yang Anda ajar.</p>
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

              {myClasses.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-medium">Anda belum memiliki jadwal mengajar.</p>
                  <p className="text-xs">Hubungi Admin untuk menambahkan jadwal kelas Anda.</p>
                </div>
              ) : (
                <>
                  {/* Kelas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                    <select required value={fClass} onChange={e => setFClass(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {myClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
                    </select>
                  </div>

                  {/* Tanggal */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal</label>
                    <input type="date" required value={fDate} onChange={e => setFDate(e.target.value)}
                      max={todayStr}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400">Tidak bisa mengisi absensi untuk tanggal yang akan datang.</p>
                  </div>

                  {/* Jumlah per status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jumlah Kehadiran</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {label:'Hadir', val:fHadir, setter:setFHadir, color:'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/20', text:'text-indigo-700 dark:text-indigo-400'},
                        {label:'Izin',  val:fIzin,  setter:setFIzin,  color:'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20',    text:'text-blue-700 dark:text-blue-400'},
                        {label:'Sakit', val:fSakit, setter:setFSakit, color:'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20', text:'text-amber-700 dark:text-amber-400'},
                        {label:'Alpha', val:fAlpha, setter:setFAlpha, color:'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20',   text:'text-rose-700 dark:text-rose-400'},
                      ].map(({label, val, setter, color, text}) => (
                        <div key={label} className={`p-3 rounded-xl border-2 ${color} flex flex-col items-center space-y-1`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</span>
                          <input type="number" min={0} value={val} onChange={e => setter(Number(e.target.value))}
                            className={`w-full text-center text-xl font-black bg-transparent ${text} focus:outline-none`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-slate-400 font-medium">Total</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">{fTotal} santri</span>
                    </div>
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

                  <button type="submit" disabled={submitting || myClasses.length === 0}
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
      {(activeTab === 'list' || activeTab === 'rekap') && (
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
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Riwayat Absensi Santri — {rekapLabel}
            </span>
            <span className="text-xs text-slate-400">{attendances.length} catatan</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : attendances.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {attendances.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        Kelas {(a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{a.jumlahHadir}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{a.jumlahIzin}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{a.jumlahSakit}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{a.jumlahAlpha}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">{a.jumlahTotal}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">{a.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}
