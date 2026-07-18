import React from 'react';
import {
  Crown, Plus, Edit, Trash2, X, CheckCircle, AlertCircle, Users, GraduationCap
} from 'lucide-react';
import { WaliKelas, Teacher, SchoolClass, AcademicYear, Semester } from '../types';
import { api } from '../api';

interface WaliKelasProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  onRefresh: () => void;
}

export default function WaliKelasPage({ teachers, classes, academicYears, semesters, onRefresh }: WaliKelasProps) {
  const [waliList, setWaliList] = React.useState<WaliKelas[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Filter
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');

  // Form modal
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [fClass, setFClass] = React.useState('');
  const [fTeacher, setFTeacher] = React.useState('');
  const [fAY, setFAY] = React.useState(academicYears[0]?.id || '');
  const [fSem, setFSem] = React.useState(semesters[0]?.id || '');
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAY) params.academicYearId = filterAY;
      if (filterSem) params.semesterId = filterSem;
      const data = await api.getWaliKelas(params);
      setWaliList(data);
    } catch { setWaliList([]); }
    finally { setLoading(false); }
  }, [filterAY, filterSem]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setEditId(null);
    setFClass('');
    setFTeacher('');
    setFAY(academicYears[0]?.id || '');
    setFSem(semesters[0]?.id || '');
    setFormError('');
    setFormSuccess('');
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (w: WaliKelas) => {
    setEditId(w.id);
    setFClass(w.classId);
    setFTeacher(w.teacherId);
    setFAY(w.academicYearId);
    setFSem(w.semesterId);
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fClass || !fTeacher || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    setSubmitting(true);
    try {
      if (editId) {
        await api.updateWaliKelas(editId, { teacherId: fTeacher, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Wali kelas berhasil diperbarui.');
      } else {
        await api.createWaliKelas({ classId: fClass, teacherId: fTeacher, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Wali kelas berhasil ditunjuk.');
      }
      setTimeout(() => { setShowForm(false); resetForm(); loadData(); onRefresh(); }, 800);
    } catch (err: any) { setFormError(err.message || 'Gagal menyimpan.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try { await api.deleteWaliKelas(deleteId); setDeleteId(null); loadData(); onRefresh(); }
    catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  // Kelas yang sudah punya wali kelas pada filter saat ini
  const usedClassIds = new Set(waliList.map(w => w.classId));
  // Saat tambah baru, hanya tampilkan kelas yang belum punya wali kelas
  const availableClasses = editId ? classes : classes.filter(c => !usedClassIds.has(c.id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Wali Kelas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola penugasan wali kelas untuk setiap kelas di MQBA Isy Karima.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
          <Plus className="w-4 h-4" /><span>Tunjuk Wali Kelas</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[140px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 opacity-80">Total Kelas</p>
          <p className="text-3xl font-black text-indigo-800 dark:text-indigo-300 mt-1">{classes.length}</p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 opacity-80">Sudah Ada Wali</p>
          <p className="text-3xl font-black text-teal-800 dark:text-teal-300 mt-1">{waliList.length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 opacity-80">Belum Ditunjuk</p>
          <p className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-1">{Math.max(0, classes.length - waliList.length)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Daftar Wali Kelas</span>
          </span>
          <span className="text-xs text-slate-400">{waliList.length} penugasan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : waliList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Crown className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800" />
            <p className="text-sm font-semibold">Belum ada penugasan wali kelas.</p>
            <p className="text-xs">Klik "Tunjuk Wali Kelas" untuk menambahkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                <tr>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Wali Kelas</th>
                  <th className="px-4 py-3">Tahun Ajaran</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {waliList.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          Kelas {(w as any).class?.name || classes.find(c => c.id === w.classId)?.name || w.classId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-xs">
                          {((w as any).teacher?.name || teachers.find(t => t.id === w.teacherId)?.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {(w as any).teacher?.name || teachers.find(t => t.id === w.teacherId)?.name || w.teacherId}
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 uppercase tracking-wide">
                            Wali Kelas
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      TA {(w as any).academicYear?.name || academicYears.find(y => y.id === w.academicYearId)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {(w as any).semester?.name || semesters.find(s => s.id === w.semesterId)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-1.5">
                        <button onClick={() => openEdit(w)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(w.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition" title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>{editId ? 'Ganti Wali Kelas' : 'Tunjuk Wali Kelas'}</span>
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /><span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Kelas — disabled saat edit */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                <select required value={fClass} onChange={e => setFClass(e.target.value)} disabled={!!editId}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400">
                  <option value="" disabled>Pilih kelas...</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name} ({c.level})</option>)}
                </select>
                {editId && <p className="text-[10px] text-slate-400">Kelas tidak dapat diubah. Hapus lalu buat baru jika ingin mengganti kelas.</p>}
                {!editId && availableClasses.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold">Semua kelas sudah memiliki wali kelas pada periode ini.</p>
                )}
              </div>

              {/* Guru / Wali Kelas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Wali Kelas (Guru)</label>
                <select required value={fTeacher} onChange={e => setFTeacher(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="" disabled>Pilih guru...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* TA & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select required value={fAY} onChange={e => setFAY(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select required value={fSem} onChange={e => setFSem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
                <button type="submit" disabled={submitting || (!editId && availableClasses.length === 0)}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tunjuk Wali Kelas'}
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
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus penugasan wali kelas ini?</h3>
            <p className="text-xs text-slate-500">Guru yang bersangkutan tidak akan lagi tampil sebagai wali kelas. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60">
                <Trash2 className="w-3.5 h-3.5" /><span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
