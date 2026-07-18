import React from 'react';
import {
  ClipboardList, Plus, Search, Filter, Edit, Trash2, X,
  CheckCircle, AlertCircle, BarChart2, Calendar, Users, Download
} from 'lucide-react';
import { Attendance, AttendanceSummary, Teacher, AcademicYear, Semester } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';

interface AttendanceAdminProps {
  teachers: Teacher[];
  academicYears: AcademicYear[];
  semesters: Semester[];
}

const STATUS_COLORS: Record<string, string> = {
  Hadir:  'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
  Izin:   'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Sakit:  'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Alpha:  'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export default function AttendanceAdmin({ teachers, academicYears, semesters }: AttendanceAdminProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [activeTab, setActiveTab] = React.useState<'input' | 'rekap'>('input');

  // Filter state
  const [filterTeacher, setFilterTeacher] = React.useState('');
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');
  const [filterYear, setFilterYear] = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode, setRekapMode] = React.useState<'bulan' | 'semester' | 'tahun'>('bulan');

  // Data
  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [summary, setSummary] = React.useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Form
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [fTeacher, setFTeacher] = React.useState('');
  const [fDate, setFDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [fStatus, setFStatus] = React.useState<'Hadir'|'Izin'|'Sakit'|'Alpha'>('Hadir');
  const [fNotes, setFNotes] = React.useState('');
  const [fAY, setFAY] = React.useState(academicYears[0]?.id || '');
  const [fSem, setFSem] = React.useState(semesters[0]?.id || '');
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadAttendances = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem };
      if (filterTeacher) params.teacherId = filterTeacher;
      if (rekapMode === 'bulan') { params.year = filterYear; params.month = filterMonth; }
      else if (rekapMode === 'semester') { params.year = filterYear; }
      else { params.year = filterYear; }
      const data = await api.getAttendances(params);
      setAttendances(data);
    } catch { setAttendances([]); } finally { setLoading(false); }
  }, [filterTeacher, filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  const loadSummary = React.useCallback(async () => {
    try {
      const params: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem };
      if (rekapMode === 'bulan') { params.year = filterYear; params.month = filterMonth; }
      else if (rekapMode === 'semester') params.year = filterYear;
      else params.year = filterYear;
      const data = await api.getAttendanceSummary(params);
      setSummary(data);
    } catch { setSummary([]); }
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  React.useEffect(() => { loadAttendances(); loadSummary(); }, [loadAttendances, loadSummary]);

  const resetForm = () => {
    setEditId(null); setFTeacher(''); setFDate(new Date().toISOString().split('T')[0]);
    setFStatus('Hadir'); setFNotes(''); setFAY(academicYears[0]?.id || '');
    setFSem(semesters[0]?.id || ''); setFormError(''); setFormSuccess('');
  };

  const openEdit = (a: Attendance) => {
    setEditId(a.id); setFTeacher(a.teacherId); setFDate(a.date);
    setFStatus(a.status as any); setFNotes(a.notes);
    setFAY(a.academicYearId); setFSem(a.semesterId);
    setFormError(''); setFormSuccess(''); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fTeacher || !fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    try {
      if (editId) {
        await api.updateAttendance(editId, { status: fStatus, notes: fNotes, date: fDate, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Absensi berhasil diperbarui.');
      } else {
        await api.createAttendance({ teacherId: fTeacher, date: fDate, status: fStatus, notes: fNotes, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Absensi berhasil dicatat.');
      }
      setTimeout(() => { setShowForm(false); resetForm(); loadAttendances(); loadSummary(); }, 900);
    } catch (err: any) { setFormError(err.message || 'Gagal menyimpan.'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try { await api.deleteAttendance(deleteId); setDeleteId(null); loadAttendances(); loadSummary(); }
    catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth)-1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s=>s.id===filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  const handleExport = () => {
    if (activeTab === 'input') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Nama Guru': teachers.find(t => t.id === a.teacherId)?.name || a.teacherId,
        'Status': a.status,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Guru_${rekapLabel.replace(/ /g, '_')}`);
    } else {
      const dataToExport = summary.map((s, idx) => ({
        'No': idx + 1,
        'Nama Guru': teachers.find(t => t.id === s.teacherId)?.name || s.teacherId,
        'Hadir': s.totalHadir,
        'Izin': s.totalIzin,
        'Sakit': s.totalSakit,
        'Alpha': s.totalAlpha
      }));
      exportToExcel(dataToExport, `Rekap_Absensi_Guru_${rekapLabel.replace(/ /g, '_')}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Guru</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat dan pantau kehadiran seluruh pengajar MQBA Isy Karima.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
          <Plus className="w-4 h-4"/><span>Catat Absensi</span>
        </button>
      </div>

      {/* Tab & Export */}
      <div className="flex items-center gap-2">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {(['input','rekap'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab===t?'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white':'text-slate-500 hover:text-slate-700'}`}>
              {t === 'input' ? 'Data Absensi' : 'Rekap & Statistik'}
            </button>
          ))}
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
          <Download className="w-4 h-4" /><span>Export</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e=>setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e=>setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rentang</label>
          <select value={rekapMode} onChange={e=>setRekapMode(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="bulan">Per Bulan</option>
            <option value="semester">Per Semester</option>
            <option value="tahun">Per Tahun</option>
          </select>
        </div>
        {rekapMode !== 'tahun' && rekapMode !== 'semester' && (
          <div className="space-y-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
            <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1 min-w-[80px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun</label>
          <input type="number" value={filterYear} onChange={e=>setFilterYear(e.target.value)} min={2020} max={2035}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        {activeTab === 'input' && (
          <div className="space-y-1 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Guru</label>
            <select value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Semua Guru</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* TAB: DATA ABSENSI */}
      {activeTab === 'input' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Daftar Absensi — {rekapLabel}
            </span>
            <span className="text-xs text-slate-400">{attendances.length} catatan</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800"/>
              <p className="text-sm font-medium">Belum ada data absensi untuk periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Guru</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {attendances.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {new Date(a.date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        {(a as any).teacher?.name || teachers.find(t=>t.id===a.teacherId)?.name || a.teacherId}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_COLORS[a.status]}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">{a.notes || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center space-x-1.5">
                          <button onClick={() => openEdit(a)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Edit">
                            <Edit className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => setDeleteId(a.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition" title="Hapus">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
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
        <div className="space-y-4">
          {/* Summary cards */}
          {summary.length > 0 && (() => {
            const totHadir = summary.reduce((s,r)=>s+r.hadir,0);
            const totIzin  = summary.reduce((s,r)=>s+r.izin,0);
            const totSakit = summary.reduce((s,r)=>s+r.sakit,0);
            const totAlpha = summary.reduce((s,r)=>s+r.alpha,0);
            const totAll   = totHadir+totIzin+totSakit+totAlpha;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Total Hadir',val:totHadir,cls:'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400'},
                  {label:'Izin',val:totIzin,cls:'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'},
                  {label:'Sakit',val:totSakit,cls:'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'},
                  {label:'Alpha',val:totAlpha,cls:'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'},
                ].map(c=>(
                  <div key={c.label} className={`p-4 rounded-2xl border ${c.cls}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                    <p className="text-3xl font-black mt-1">{c.val}</p>
                    <p className="text-[10px] mt-0.5 opacity-60">{totAll>0?Math.round(c.val/totAll*100):0}% dari total</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Per-teacher table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Rekap Per Guru — {rekapLabel}
              </span>
            </div>
            {summary.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Belum ada data untuk periode ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-4 py-3">Nama Guru</th>
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
                      <tr key={r.teacherId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{r.teacherName}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{r.hadir}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{r.izin}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{r.sakit}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{r.alpha}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">{r.total}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{width:`${r.persentaseHadir}%`}}/>
                            </div>
                            <span className={`text-xs font-extrabold ${r.persentaseHadir>=80?'text-indigo-600':r.persentaseHadir>=60?'text-amber-600':'text-rose-600'}`}>
                              {r.persentaseHadir}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                {editId ? 'Edit Absensi' : 'Catat Absensi Baru'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{formError}</span></div>}
            {formSuccess && <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2"><CheckCircle className="w-4 h-4"/><span>{formSuccess}</span></div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Guru</label>
                <select required value={fTeacher} onChange={e=>setFTeacher(e.target.value)} disabled={!!editId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 dark:disabled:bg-slate-800">
                  <option value="" disabled>Pilih guru...</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal</label>
                  <input type="date" required value={fDate} onChange={e=>setFDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                  <select required value={fStatus} onChange={e=>setFStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['Hadir','Izin','Sakit','Alpha'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select required value={fAY} onChange={e=>setFAY(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select required value={fSem} onChange={e=>setFSem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Keterangan (opsional)</label>
                <input type="text" placeholder="Contoh: Izin keperluan keluarga" value={fNotes} onChange={e=>setFNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
                <button type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition">
                  {editId ? 'Simpan Perubahan' : 'Catat Absensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus data absensi ini?</h3>
            <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60">
                <Trash2 className="w-3.5 h-3.5"/><span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
