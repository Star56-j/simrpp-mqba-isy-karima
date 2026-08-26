import React from 'react';
import {
  ClipboardCheck,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Target,
  AlertTriangle,
  Calendar,
  Star,
  Filter,
  X,
  Save,
  Users,
  BarChart3,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { api } from '../api';
import { EvaluasiPembelajaran, Teacher, Subject, SchoolClass, AcademicYear, Semester, TeachingSchedule } from '../types';
import { printEvaluasi } from '../utils/printEvaluasi';
import { downloadEvaluasiGuruPdf } from '../utils/pdfDownloader';
import { exportToExcel } from '../utils/exportExcel';
import { printGenericTable } from '../utils/printUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';

const BULAN_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const PREDIKAT_CONFIG = {
  'Sangat Baik': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30', dot: 'bg-emerald-500', pct: '≥ 90%' },
  'Baik': { color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30', dot: 'bg-blue-500', pct: '75–89%' },
  'Cukup': { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/30', dot: 'bg-amber-500', pct: '60–74%' },
  'Perlu Perbaikan': { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/30', dot: 'bg-rose-500', pct: '< 60%' },
} as const;

interface Props {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  schedules: TeachingSchedule[];
  currentUser: { id: string; name: string; role: string; teacherId?: string } | null;
}

interface FormData {
  jenisEvaluasi: 'Bulanan' | 'Semester' | 'Tahunan';
  bulan: number;
  tahun: number;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  semesterId: string;
  totalPertemuanRencana: number;
  totalPertemuanTerlaksana: number;
  tpTercapai: string;
  tpBelumTercapai: string;
  asesmenFormatifHasil: string;
  asesmenCatatan: string;
  kendala: string;
  solusi: string;
  diferenciasiDilakukan: string;
  rencanaBulanDepan: string;
  refleksiGuru: string;
  predikatKetercapaian: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perbaikan';
}

const EMPTY_FORM: FormData = {
  jenisEvaluasi: 'Bulanan',
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  teacherId: '',
  subjectId: '',
  classId: '',
  academicYearId: '',
  semesterId: '',
  totalPertemuanRencana: 4,
  totalPertemuanTerlaksana: 4,
  tpTercapai: '',
  tpBelumTercapai: '',
  asesmenFormatifHasil: '',
  asesmenCatatan: '',
  kendala: '',
  solusi: '',
  diferenciasiDilakukan: '',
  rencanaBulanDepan: '',
  refleksiGuru: '',
  predikatKetercapaian: 'Baik',
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition';
const textareaCls = inputCls + ' resize-none';

export default function EvaluasiPembelajaranPage({
  teachers, subjects, classes, academicYears, semesters, schedules, currentUser
}: Props) {
  const isAdmin = currentUser?.role === 'Admin';
  const myTeacherId = currentUser?.teacherId;

  const [list, setList] = React.useState<EvaluasiPembelajaran[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<EvaluasiPembelajaran | null>(null);
  const [form, setForm] = React.useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [detailItem, setDetailItem] = React.useState<EvaluasiPembelajaran | null>(null);

  const [filterJenis, setFilterJenis] = React.useState<string>('Semua');
  const [filterBulan, setFilterBulan] = React.useState(0);
  const [filterSemester, setFilterSemester] = React.useState('');
  const [filterTeacher, setFilterTeacher] = React.useState('');
  const [filterClass, setFilterClass] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEvaluasi();
      setList(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data evaluasi');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  React.useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3500); return () => clearTimeout(t); }
  }, [success]);
  React.useEffect(() => {
    if (error && !showForm) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error, showForm]);

  const uniqueMySubjectClassPairs = React.useMemo(() => {
    const myScheds = myTeacherId ? schedules.filter(s => s.teacherId === myTeacherId || s.teacher_id === myTeacherId) : schedules;
    const seen = new Set<string>();
    return myScheds.filter(s => {
      const key = `${s.subjectId || (s as any).subject_id}-${s.classId || (s as any).class_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [schedules, myTeacherId]);

  const handleOpenCreate = (defaultJenis: 'Bulanan' | 'Semester' | 'Tahunan' = 'Bulanan') => {
    setForm({
      ...EMPTY_FORM,
      jenisEvaluasi: defaultJenis,
      teacherId: isAdmin ? '' : (myTeacherId || ''),
      academicYearId: academicYears[0]?.id || '',
      semesterId: semesters[0]?.id || '',
    });
    setEditTarget(null);
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (ev: EvaluasiPembelajaran) => {
    setForm({
      jenisEvaluasi: ev.jenisEvaluasi || 'Bulanan',
      bulan: ev.bulan || 1,
      tahun: ev.tahun || new Date().getFullYear(),
      teacherId: ev.teacherId,
      subjectId: ev.subjectId,
      classId: ev.classId,
      academicYearId: ev.academicYearId,
      semesterId: ev.semesterId,
      totalPertemuanRencana: ev.totalPertemuanRencana,
      totalPertemuanTerlaksana: ev.totalPertemuanTerlaksana,
      tpTercapai: ev.tpTercapai,
      tpBelumTercapai: ev.tpBelumTercapai,
      asesmenFormatifHasil: ev.asesmenFormatifHasil,
      asesmenCatatan: ev.asesmenCatatan,
      kendala: ev.kendala,
      solusi: ev.solusi,
      diferenciasiDilakukan: ev.diferenciasiDilakukan,
      rencanaBulanDepan: ev.rencanaBulanDepan,
      refleksiGuru: ev.refleksiGuru,
      predikatKetercapaian: ev.predikatKetercapaian,
    });
    setEditTarget(ev);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.teacherId || !form.subjectId || !form.classId || !form.academicYearId || !form.semesterId) {
      setError('Harap lengkapi: Pengajar, Mata Pelajaran, Kelas, Tahun Ajaran, dan Semester.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await api.updateEvaluasi(editTarget.id, form);
        setSuccess('Evaluasi berhasil diperbarui!');
      } else {
        await api.createEvaluasi(form);
        setSuccess('Evaluasi berhasil disimpan!');
      }
      setShowForm(false);
      setEditTarget(null);
      await fetchData();
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan evaluasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus evaluasi ini secara permanen?')) return;
    try {
      await api.deleteEvaluasi(id);
      setSuccess('Evaluasi berhasil dihapus.');
      if (detailItem?.id === id) setDetailItem(null);
      await fetchData();
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus evaluasi');
    }
  };

  const filtered = React.useMemo(() => list.filter(e => {
    const j = e.jenisEvaluasi || 'Bulanan';
    if (filterJenis !== 'Semua' && j !== filterJenis) return false;
    if (filterBulan && e.bulan !== filterBulan && j === 'Bulanan') return false;
    if (filterSemester && e.semesterId !== filterSemester) return false;
    if (filterTeacher && e.teacherId !== filterTeacher) return false;
    if (filterClass && e.classId !== filterClass) return false;
    return true;
  }), [list, filterJenis, filterBulan, filterSemester, filterTeacher, filterClass]);

  const stats = React.useMemo(() => {
    const total = filtered.length;
    const avgPct = total > 0 ? Math.round(filtered.reduce((s, e) => s + e.persentaseTerlaksana, 0) / total) : 0;
    return {
      total, avgPct,
      sangat: filtered.filter(e => e.predikatKetercapaian === 'Sangat Baik').length,
      baik: filtered.filter(e => e.predikatKetercapaian === 'Baik').length,
      cukup: filtered.filter(e => e.predikatKetercapaian === 'Cukup').length,
      perlu: filtered.filter(e => e.predikatKetercapaian === 'Perlu Perbaikan').length,
    };
  }, [filtered]);

  const handleExport = () => {
    const dataToExport = filtered.map((e, idx) => ({
      'No': idx + 1,
      'Jenis': e.jenisEvaluasi || 'Bulanan',
      'Periode': (e.jenisEvaluasi === 'Tahunan') ? `TA ${e.academicYear?.name || e.academicYearId}` : (e.jenisEvaluasi === 'Semester') ? `Semester ${e.semester?.name || e.semesterId} ${e.tahun}` : `${BULAN_NAMES[e.bulan]} ${e.tahun}`,
      'Guru': teachers.find(t => t.id === e.teacherId)?.name || e.teacherId,
      'Kelas': classes.find(c => c.id === e.classId)?.name || e.classId,
      'Mapel': subjects.find(s => s.id === e.subjectId)?.name || e.subjectId,
      'Predikat': e.predikatKetercapaian,
      '% Terlaksana': `${e.persentaseTerlaksana}%`,
      'Catatan / Refleksi': e.refleksiGuru || '-'
    }));
    exportToExcel(dataToExport, `Data_Evaluasi_Guru_MQBA`);
  };

  const handlePrint = () => {
    const title = 'Rekap Evaluasi Pembelajaran Guru (Bulanan, Semester & Tahunan)';
    const subtitle = `Filter Jenis: ${filterJenis}`;
    const headers = ['No', 'Jenis', 'Periode', 'Guru', 'Kelas', 'Mapel', 'Predikat', 'Terlaksana (%)'];
    const dataRows = filtered.map((e, idx) => [
      idx + 1,
      e.jenisEvaluasi || 'Bulanan',
      (e.jenisEvaluasi === 'Tahunan') ? `TA ${e.academicYear?.name || ''}` : (e.jenisEvaluasi === 'Semester') ? `Sem. ${e.semester?.name || ''} ${e.tahun}` : `${BULAN_NAMES[e.bulan]} ${e.tahun}`,
      teachers.find(t => t.id === e.teacherId)?.name || e.teacherId,
      classes.find(c => c.id === e.classId)?.name || e.classId,
      subjects.find(s => s.id === e.subjectId)?.name || e.subjectId,
      e.predikatKetercapaian,
      `${e.persentaseTerlaksana}%`
    ]);
    printGenericTable(title, subtitle, headers, dataRows);
  };

  const handleWhatsApp = () => {
    const title = 'Laporan Evaluasi Pembelajaran Guru MQBA';
    let text = ``;
    text += filtered.slice(0, 50).map(e => `- [${e.jenisEvaluasi || 'Bulanan'}] ${teachers.find(t => t.id === e.teacherId)?.name || e.teacherId} (${subjects.find(s => s.id === e.subjectId)?.name || 'Mapel'} - Kls ${classes.find(c => c.id === e.classId)?.name || e.classId}): ${e.predikatKetercapaian} (${e.persentaseTerlaksana}%)`).join('\n');
    if (filtered.length > 50) text += `\n...dan ${filtered.length - 50} data lainnya.`;
    shareToWhatsApp(title, text);
  };

  // ── FORM MODAL ──────────────────────────────────────────────
  const renderForm = () => (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-t-3xl px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-0.5">Kurikulum Merdeka</p>
            <h2 id="modal-title" className="text-lg font-black text-white">
              {editTarget ? `Edit Evaluasi Pembelajaran (${form.jenisEvaluasi})` : `Isi Evaluasi Pembelajaran ${form.jenisEvaluasi}`}
            </h2>
          </div>
          <button aria-label="Tutup" onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex gap-2 items-start rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800/40 p-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* Pilihan Jenis Evaluasi */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-1.5">
            {[
              { id: 'Bulanan', label: '📅 Evaluasi Bulanan', desc: 'Per-bulan kalender' },
              { id: 'Semester', label: '📆 Evaluasi Semester', desc: 'Per-semester (Ganjil / Genap)' },
              { id: 'Tahunan', label: '🗓️ Evaluasi Tahunan', desc: 'Per-tahun ajaran penuh' },
            ].map(j => (
              <button
                key={j.id}
                type="button"
                onClick={() => setForm(p => ({ ...p, jenisEvaluasi: j.id as any }))}
                className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                  form.jenisEvaluasi === j.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.01]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div>{j.label}</div>
                <div className={`text-[9px] font-medium opacity-80 mt-0.5 ${form.jenisEvaluasi === j.id ? 'text-indigo-100' : 'text-slate-400'}`}>{j.desc}</div>
              </button>
            ))}
          </div>

          {/* Identitas */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Identitas & Periode Evaluasi</h3>
            <div className="grid grid-cols-2 gap-3">
              {form.jenisEvaluasi === 'Bulanan' && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Bulan Evaluasi</label>
                  <select value={form.bulan} onChange={e => setForm(p => ({ ...p, bulan: Number(e.target.value) }))} className={inputCls}>
                    {BULAN_NAMES.slice(1).map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
                  </select>
                </div>
              )}
              {form.jenisEvaluasi !== 'Tahunan' && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Tahun Kalender</label>
                  <input type="number" value={form.tahun} onChange={e => setForm(p => ({ ...p, tahun: Number(e.target.value) }))} className={inputCls} />
                </div>
              )}
              <div className={form.jenisEvaluasi === 'Tahunan' ? 'col-span-2' : ''}>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Tahun Ajaran</label>
                <select value={form.academicYearId} onChange={e => setForm(p => ({ ...p, academicYearId: e.target.value }))} className={inputCls}>
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  {academicYears.map(a => <option key={a.id} value={a.id}>TA {a.name}</option>)}
                </select>
              </div>
              {form.jenisEvaluasi !== 'Tahunan' && (
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Semester</label>
                  <select value={form.semesterId} onChange={e => setForm(p => ({ ...p, semesterId: e.target.value }))} className={inputCls}>
                    <option value="">-- Pilih Semester --</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              {isAdmin ? (
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Pengajar</label>
                  <select value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))} className={inputCls}>
                    <option value="">-- Pilih Pengajar --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Pilih Jadwal Mengajar (Mapel & Kelas)</label>
                  <select onChange={e => {
                    const sch = schedules.find(s => s.id === e.target.value);
                    if (sch) setForm(p => ({ ...p, subjectId: sch.subjectId || (sch as any).subject_id, classId: sch.classId || (sch as any).class_id }));
                  }} className={inputCls}>
                    <option value="">-- Pilih Jadwal --</option>
                    {uniqueMySubjectClassPairs.map(s => {
                      const subId = s.subjectId || (s as any).subject_id;
                      const cId = s.classId || (s as any).class_id;
                      const sub = subjects.find(x => x.id === subId);
                      const cls = classes.find(x => x.id === cId);
                      return <option key={s.id} value={s.id}>{sub?.name || subId} — {cls?.name || cId}</option>;
                    })}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Mata Pelajaran</label>
                <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} className={inputCls}>
                  <option value="">-- Pilih Mapel --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Kelas</label>
                <select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} className={inputCls}>
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* A: Keterlaksanaan */}
          <section className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />A. Keterlaksanaan Pembelajaran</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Rencana (pertemuan)</label>
                <input type="number" min={0} value={form.totalPertemuanRencana} onChange={e => setForm(p => ({ ...p, totalPertemuanRencana: Number(e.target.value) }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Terlaksana</label>
                <input type="number" min={0} value={form.totalPertemuanTerlaksana} onChange={e => setForm(p => ({ ...p, totalPertemuanTerlaksana: Number(e.target.value) }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Persentase</label>
                <div className="flex items-center h-[34px] rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 px-3 text-sm font-black text-indigo-700 dark:text-indigo-300">
                  {form.totalPertemuanRencana > 0 ? Math.round((form.totalPertemuanTerlaksana / form.totalPertemuanRencana) * 100) : 0}%
                </div>
              </div>
            </div>
          </section>

          {/* B: TP */}
          <section className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2"><Target className="w-4 h-4" />B. Capaian Tujuan Pembelajaran (TP)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">TP Sudah Tercapai ({form.jenisEvaluasi})</label>
                <textarea rows={2} value={form.tpTercapai} onChange={e => setForm(p => ({ ...p, tpTercapai: e.target.value }))} placeholder="Contoh: Santri mampu membaca dengan tartil, hafal materi/surat yang ditargetkan..." className={textareaCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">TP Belum Tercapai / Perlu Penguatan</label>
                <textarea rows={2} value={form.tpBelumTercapai} onChange={e => setForm(p => ({ ...p, tpBelumTercapai: e.target.value }))} placeholder="Contoh: Masih perlu penguatan makhraj atau pemahaman konsep tertentu..." className={textareaCls} />
              </div>
            </div>
          </section>

          {/* C: Asesmen */}
          <section className="bg-sky-50 dark:bg-sky-950/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-2"><ClipboardCheck className="w-4 h-4" />C. Asesmen & Capaian Hasil Belajar</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Hasil Asesmen (Formatif / Sumatif / Ujian)</label>
                <textarea rows={2} value={form.asesmenFormatifHasil} onChange={e => setForm(p => ({ ...p, asesmenFormatifHasil: e.target.value }))} placeholder="Contoh: Rata-rata nilai kelas 84/100, 90% santri tuntas KKM..." className={textareaCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Catatan Khusus dari Asesmen</label>
                <textarea rows={2} value={form.asesmenCatatan} onChange={e => setForm(p => ({ ...p, asesmenCatatan: e.target.value }))} placeholder="Catatan penting terkait progres santri..." className={textareaCls} />
              </div>
            </div>
          </section>

          {/* D: Kendala */}
          <section className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />D. Kendala & Solusi Pembelajaran</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Kendala yang Dihadapi</label>
                <textarea rows={2} value={form.kendala} onChange={e => setForm(p => ({ ...p, kendala: e.target.value }))} placeholder="Contoh: Perbedaan kecepatan belajar santri, keterbatasan waktu..." className={textareaCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Solusi / Tindak Lanjut</label>
                <textarea rows={2} value={form.solusi} onChange={e => setForm(p => ({ ...p, solusi: e.target.value }))} placeholder="Contoh: Bimbingan kelompok khusus, pengayaan materi..." className={textareaCls} />
              </div>
            </div>
          </section>

          {/* E: Diferensiasi */}
          <section className="bg-violet-50 dark:bg-violet-950/20 rounded-2xl p-4 border border-violet-100 dark:border-violet-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-3 flex items-center gap-2"><Users className="w-4 h-4" />E. Diferensiasi Pembelajaran</h3>
            <textarea rows={2} value={form.diferenciasiDilakukan} onChange={e => setForm(p => ({ ...p, diferenciasiDilakukan: e.target.value }))} placeholder="Contoh: Pengelompokan santri berdasarkan capaian hafalan/pemahaman, tutor sebaya..." className={textareaCls} />
          </section>

          {/* F: Rencana */}
          <section className="bg-teal-50 dark:bg-teal-950/20 rounded-2xl p-4 border border-teal-100 dark:border-teal-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              F. Rencana {form.jenisEvaluasi === 'Tahunan' ? 'Tahun Ajaran Berikutnya' : form.jenisEvaluasi === 'Semester' ? 'Semester Berikutnya' : 'Bulan Berikutnya'}
            </h3>
            <textarea rows={2} value={form.rencanaBulanDepan} onChange={e => setForm(p => ({ ...p, rencanaBulanDepan: e.target.value }))} placeholder={
              form.jenisEvaluasi === 'Tahunan'
                ? 'Rekomendasi kurikulum dan strategi pengajaran untuk tahun ajaran berikutnya...'
                : form.jenisEvaluasi === 'Semester'
                ? 'Target capaian dan rencana pengajaran untuk semester berikutnya...'
                : 'Target hafalan/materi untuk bulan depan...'
            } className={textareaCls} />
          </section>

          {/* G&H: Refleksi & Predikat */}
          <section className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2"><Star className="w-4 h-4" />G & H. Refleksi Guru & Predikat Ketercapaian</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Refleksi Pengajar</label>
                <textarea rows={3} value={form.refleksiGuru} onChange={e => setForm(p => ({ ...p, refleksiGuru: e.target.value }))} placeholder="Tuliskan refleksi dan evaluasi diri pengajar secara jujur tentang proses pembelajaran..." className={textareaCls} />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Predikat Ketercapaian Pembelajaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Sangat Baik', 'Baik', 'Cukup', 'Perlu Perbaikan'] as const).map(p => (
                    <button key={p} type="button"
                      onClick={() => setForm(f => ({ ...f, predikatKetercapaian: p }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        form.predikatKetercapaian === p
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${form.predikatKetercapaian === p ? 'bg-white' : PREDIKAT_CONFIG[p].dot}`} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowForm(false)} disabled={saving}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-sm font-black shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0">
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : (editTarget ? 'Perbarui Evaluasi' : `Simpan Evaluasi ${form.jenisEvaluasi}`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DETAIL MODAL ─────────────────────────────────────────────
  const renderDetail = () => {
    if (!detailItem) return null;
    const cfg = PREDIKAT_CONFIG[detailItem.predikatKetercapaian];
    const jenis = detailItem.jenisEvaluasi || 'Bulanan';
    const periodeText = jenis === 'Tahunan'
      ? `TA ${detailItem.academicYear?.name || ''}`
      : jenis === 'Semester'
      ? `Semester ${detailItem.semester?.name || ''} ${detailItem.tahun}`
      : `Bulan ${BULAN_NAMES[detailItem.bulan]} ${detailItem.tahun}`;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 mb-6">
          <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 rounded-t-3xl px-6 py-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  jenis === 'Tahunan' ? 'bg-emerald-500 text-white' : jenis === 'Semester' ? 'bg-purple-500 text-white' : 'bg-indigo-500 text-white'
                }`}>
                  Evaluasi {jenis}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold">
                  {detailItem.subject?.name} · {detailItem.class?.name}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">{detailItem.teacher?.name}</h2>
              <p className="text-xs text-indigo-200 mt-0.5 font-medium">{periodeText} · TA {detailItem.academicYear?.name}</p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-black border ${cfg.color}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {detailItem.predikatKetercapaian}
              </span>
            </div>
            <button aria-label="Tutup detail" onClick={() => setDetailItem(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex gap-4">
              <div className="flex-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{detailItem.persentaseTerlaksana}%</p>
                <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">Keterlaksanaan</p>
                <p className="text-xs text-slate-500 mt-1">{detailItem.totalPertemuanTerlaksana}/{detailItem.totalPertemuanRencana} pertemuan</p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2.5 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-black">TP Tercapai</p>
                  <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">{detailItem.tpTercapai || <span className="italic text-slate-400">—</span>}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2.5 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-rose-600 font-black">Belum Tercapai</p>
                  <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed">{detailItem.tpBelumTercapai || <span className="italic text-slate-400">—</span>}</p>
                </div>
              </div>
            </div>

            {[
              { title: 'C. Asesmen & Capaian', val: detailItem.asesmenFormatifHasil, sub: detailItem.asesmenCatatan, subLabel: 'Catatan Asesmen' },
              { title: 'D. Kendala Pembelajaran', val: detailItem.kendala, sub: detailItem.solusi, subLabel: 'Solusi / Tindak Lanjut' },
            ].map(item => (
              <div key={item.title} className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{item.title}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.val || <span className="italic text-slate-400">—</span>}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{item.subLabel}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.sub || <span className="italic text-slate-400">—</span>}</p>
                </div>
              </div>
            ))}

            {[
              { label: 'E. Diferensiasi Pembelajaran', val: detailItem.diferenciasiDilakukan },
              { label: `F. Rencana ${jenis === 'Tahunan' ? 'Tahun Ajaran Berikutnya' : jenis === 'Semester' ? 'Semester Berikutnya' : 'Bulan Berikutnya'}`, val: detailItem.rencanaBulanDepan },
              { label: 'G. Refleksi Guru', val: detailItem.refleksiGuru },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.val || <span className="italic text-slate-400">—</span>}</p>
              </div>
            ))}

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { handleOpenEdit(detailItem); setDetailItem(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              {isAdmin && (
                <button onClick={() => { handleDelete(detailItem.id); setDetailItem(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
              <button onClick={() => printEvaluasi(detailItem, academicYears, semesters)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                title="Print Cetak Fisik">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={() => downloadEvaluasiGuruPdf(detailItem, academicYears, semesters)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition cursor-pointer"
                title="Download File PDF">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button onClick={() => setDetailItem(null)}
                className="ml-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ─────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white">Evaluasi Pembelajaran Guru</h1>
              <p className="text-slate-400 text-xs mt-0.5">Laporan Evaluasi Bulanan, Semester & Tahunan berbasis Kurikulum Merdeka</p>
            </div>
          </div>
          {!isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleOpenCreate('Bulanan')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Evaluasi Bulanan</span>
              </button>
              <button onClick={() => handleOpenCreate('Semester')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-sm transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Evaluasi Semester</span>
              </button>
              <button onClick={() => handleOpenCreate('Tahunan')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Evaluasi Tahunan</span>
              </button>
            </div>
          )}
        </div>

        <ExportBar 
          onExportExcel={handleExport}
          onPrint={handlePrint}
          onWhatsApp={handleWhatsApp}
          itemName="Evaluasi Pembelajaran Guru"
        />

        {/* Alerts */}
        {success && (
          <div className="flex gap-2 items-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />{success}
          </div>
        )}
        {error && !showForm && (
          <div className="flex gap-2 items-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-4 text-sm text-rose-700 dark:text-rose-300 font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total', val: stats.total, cls: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300', icon: FileText },
            { label: 'Rata-rata %', val: `${stats.avgPct}%`, cls: 'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-800/30 text-sky-700 dark:text-sky-300', icon: BarChart3 },
            { label: 'Sangat Baik', val: stats.sangat, cls: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300', icon: Star },
            { label: 'Baik', val: stats.baik, cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-300', icon: CheckCircle2 },
            { label: 'Cukup', val: stats.cukup, cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-300', icon: AlertCircle },
            { label: 'Perlu Perbaikan', val: stats.perlu, cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800/30 text-rose-700 dark:text-rose-300', icon: AlertTriangle },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`border rounded-2xl p-3 text-center ${s.cls}`}>
                <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" />
                <p className="text-xl font-black">{s.val}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Filter Evaluasi</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
              className="rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-1.5 text-xs font-bold outline-none text-indigo-700 dark:text-indigo-300">
              <option value="Semua">Semua Jenis</option>
              <option value="Bulanan">📅 Bulanan</option>
              <option value="Semester">📆 Semester</option>
              <option value="Tahunan">🗓️ Tahunan</option>
            </select>
            <select value={filterBulan} onChange={e => setFilterBulan(Number(e.target.value))}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200">
              <option value={0}>Semua Bulan</option>
              {BULAN_NAMES.slice(1).map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
            </select>
            <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200">
              <option value="">Semua Semester</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {isAdmin && (
              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200">
                <option value="">Semua Guru</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200">
              <option value="">Semua Kelas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => { setFilterJenis('Semua'); setFilterBulan(0); setFilterSemester(''); setFilterTeacher(''); setFilterClass(''); }}
              className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition cursor-pointer px-2 py-1.5">
              <X className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Memuat data evaluasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada evaluasi pembelajaran</p>
            <p className="text-xs text-slate-400 mt-1">{isAdmin ? 'Belum ada laporan evaluasi pembelajaran yang dikirimkan oleh para guru mata pelajaran.' : 'Pilih salah satu tombol "+ Evaluasi Bulanan", "+ Evaluasi Semester", atau "+ Evaluasi Tahunan" untuk mulai mengisi.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(ev => {
              const cfg = PREDIKAT_CONFIG[ev.predikatKetercapaian];
              const pctColor = ev.persentaseTerlaksana >= 90 ? 'bg-emerald-500' : ev.persentaseTerlaksana >= 75 ? 'bg-blue-500' : ev.persentaseTerlaksana >= 60 ? 'bg-amber-500' : 'bg-rose-500';
              const jenis = ev.jenisEvaluasi || 'Bulanan';
              const periodeStr = jenis === 'Tahunan'
                ? `TA ${ev.academicYear?.name || ''}`
                : jenis === 'Semester'
                ? `Sem. ${ev.semester?.name || ''} ${ev.tahun}`
                : `${BULAN_NAMES[ev.bulan]} ${ev.tahun} · Sem. ${ev.semester?.name || ''}`;

              return (
                <div key={ev.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full ${pctColor} transition-all duration-700`} style={{ width: `${ev.persentaseTerlaksana}%` }} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              jenis === 'Tahunan' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : jenis === 'Semester' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                            }`}>
                              {jenis}
                            </span>
                            <p className="text-[9px] font-bold text-slate-400">{periodeStr}</p>
                          </div>
                          <h3 className="font-black text-sm text-slate-800 dark:text-white leading-tight mt-0.5 truncate">{ev.teacher?.name || '—'}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ev.subject?.name} · {ev.class?.name}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {ev.predikatKetercapaian}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                        <span className="text-slate-500">Keterlaksanaan</span>
                        <span className="font-black text-slate-800 dark:text-white">{ev.persentaseTerlaksana}%
                          <span className="text-slate-400 font-normal ml-1">({ev.totalPertemuanTerlaksana}/{ev.totalPertemuanRencana} prtm)</span>
                        </span>
                      </div>

                      {ev.tpTercapai && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-3 py-2 mb-3">
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">TP Tercapai</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{ev.tpTercapai}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="flex gap-2">
                      <button onClick={() => setDetailItem(ev)}
                        className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center justify-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Detail
                      </button>
                      <button onClick={() => printEvaluasi(ev, academicYears, semesters)}
                        className="py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Print Cetak Fisik">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => downloadEvaluasiGuruPdf(ev, academicYears, semesters)}
                        className="py-2 px-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition cursor-pointer"
                        title="Download File PDF">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleOpenEdit(ev)}
                        className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition cursor-pointer"
                        title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(ev.id)}
                          className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-slate-400 font-medium pb-4">
            Menampilkan <strong>{filtered.length}</strong> dari <strong>{list.length}</strong> evaluasi pembelajaran
          </p>
        )}
      </div>

      {showForm && renderForm()}
      {detailItem && renderDetail()}
    </div>
  );
}
