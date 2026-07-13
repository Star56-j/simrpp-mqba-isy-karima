import React from 'react';
import { ClipboardList, TrendingUp } from 'lucide-react';
import { Attendance, AttendanceSummary, AcademicYear, Semester } from '../types';
import { api } from '../api';

interface AttendanceGuruProps {
  academicYears: AcademicYear[];
  semesters: Semester[];
}

const STATUS_COLORS: Record<string, string> = {
  Hadir: 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Izin:  'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Sakit: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Alpha: 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AttendanceGuru({ academicYears, semesters }: AttendanceGuruProps) {
  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [filterAY,    setFilterAY]    = React.useState(academicYears[0]?.id || '');
  const [filterSem,   setFilterSem]   = React.useState(semesters[0]?.id || '');
  const [filterYear,  setFilterYear]  = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode,   setRekapMode]   = React.useState<'bulan'|'semester'|'tahun'>('bulan');
  const [activeTab,   setActiveTab]   = React.useState<'list'|'rekap'>('list');

  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [summary,     setSummary]     = React.useState<AttendanceSummary | null>(null);
  const [loading,     setLoading]     = React.useState(false);

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem };
    if (rekapMode === 'bulan')     { p.year = filterYear; p.month = filterMonth; }
    else if (rekapMode === 'semester') { p.year = filterYear; }
    else                           { p.year = filterYear; }
    return p;
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  React.useEffect(() => {
    setLoading(true);
    const params = buildParams();
    Promise.all([
      api.getAttendances(params),
      api.getAttendanceSummary(params),
    ]).then(([list, sumList]) => {
      setAttendances(list);
      // sumList berisi hanya milik guru sendiri
      setSummary(sumList[0] || null);
    }).catch(() => {
      setAttendances([]); setSummary(null);
    }).finally(() => setLoading(false));
  }, [buildParams]);

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth)-1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s=>s.id===filterSem)?.name||''} ${filterYear}`
    : `Tahun ${filterYear}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Saya</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau riwayat dan rekap kehadiran Anda sepanjang tahun.</p>
      </div>

      {/* Tab */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['list','rekap'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab===t?'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white':'text-slate-500 hover:text-slate-700'}`}>
            {t === 'list' ? 'Riwayat' : 'Rekap'}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[130px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e=>setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e=>setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rentang</label>
          <select value={rekapMode} onChange={e=>setRekapMode(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="bulan">Per Bulan</option>
            <option value="semester">Per Semester</option>
            <option value="tahun">Per Tahun</option>
          </select>
        </div>
        {rekapMode === 'bulan' && (
          <div className="space-y-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
            <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1 min-w-[80px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun</label>
          <input type="number" value={filterYear} onChange={e=>setFilterYear(e.target.value)} min={2020} max={2035}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
      </div>

      {/* TAB: RIWAYAT */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Riwayat Absensi — {rekapLabel}
            </span>
            <span className="text-xs text-slate-400">{attendances.length} catatan</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada data absensi untuk periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {attendances.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_COLORS[a.status]}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">{a.notes || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {(a as any).semester?.name || semesters.find(s => s.id === a.semesterId)?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: REKAP */}
      {activeTab === 'rekap' && (
        <div className="space-y-5">
          {summary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Hadir', val: summary.hadir, cls: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                  { label: 'Izin',  val: summary.izin,  cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
                  { label: 'Sakit', val: summary.sakit, cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
                  { label: 'Alpha', val: summary.alpha, cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
                ].map(c => (
                  <div key={c.label} className={`p-5 rounded-2xl border ${c.cls}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                    <p className="text-4xl font-black mt-1">{c.val}</p>
                    <p className="text-[10px] mt-1 opacity-60">
                      {summary.total > 0 ? Math.round(c.val / summary.total * 100) : 0}% dari {summary.total} hari
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persentase Kehadiran</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{rekapLabel}</p>
                  </div>
                  <span className={`text-3xl font-black ${summary.persentaseHadir >= 80 ? 'text-emerald-600' : summary.persentaseHadir >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {summary.persentaseHadir}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${summary.persentaseHadir >= 80 ? 'bg-emerald-500' : summary.persentaseHadir >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${summary.persentaseHadir}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                  <span>0%</span>
                  <span className={`font-bold ${summary.persentaseHadir >= 80 ? 'text-emerald-600' : summary.persentaseHadir >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {summary.persentaseHadir >= 80 ? 'Kehadiran Baik' : summary.persentaseHadir >= 60 ? 'Perlu Ditingkatkan' : 'Kehadiran Rendah'}
                  </span>
                  <span>100%</span>
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
