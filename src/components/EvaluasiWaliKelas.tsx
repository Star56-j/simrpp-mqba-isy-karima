import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, Printer, Trash2, Edit3, 
  Calendar, CheckCircle, AlertCircle, MessageSquare, BookOpen, 
  Users, UserCheck, ShieldAlert, Award, X, Sparkles, Send, Download,
  Check, GraduationCap
} from 'lucide-react';
import { EvaluasiWaliKelas, User, SchoolClass, WaliKelas as TWaliKelas, Teacher } from '../types';
import { api } from '../api';
import { downloadEvaluasiWaliKelasPdf } from '../utils/pdfDownloader';

interface EvaluasiWaliKelasProps {
  currentUser: User;
}

export const EvaluasiWaliKelasComponent: React.FC<EvaluasiWaliKelasProps> = ({ currentUser }) => {
  const [reports, setReports] = useState<EvaluasiWaliKelas[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myWaliClasses, setMyWaliClasses] = useState<TWaliKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & State
  const [activeTab, setActiveTab] = useState<'bulanan' | 'semester'>('bulanan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    tipePeriode: 'bulanan' as 'bulanan' | 'semester',
    bulan: 'Agustus',
    tahun: new Date().getFullYear().toString(),
    semester: 'Ganjil',
    tahunAjaran: '2025/2026',
    kelasId: '',
    laporanKbm: '',
    masalahKelas: '',
    perkembanganSantri: '',
    rekomendasiKurikulum: '',
    tanggapanAdmin: ''
  });

  // Response Modal for Admin
  const [responseModal, setResponseModal] = useState<EvaluasiWaliKelas | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [evalRes, classRes, waliRes] = await Promise.all([
        api.getEvaluasiWaliKelas(),
        api.getClasses(),
        api.getWaliKelas()
      ]);

      setReports(evalRes);
      setClasses(classRes);

      // Filter wali kelas for current user if regular user / wali kelas
      if (currentUser.role === 'Guru' || currentUser.role === 'WaliKelas') {
        const teacherIds = [currentUser.teacherId, currentUser.id, (currentUser as any).teacher_id, (currentUser.teacher && currentUser.teacher.id)].filter(Boolean);
        const myAssignments = waliRes.filter(w => teacherIds.includes(w.teacherId) || teacherIds.includes((w as any).teacher_id));
        setMyWaliClasses(myAssignments);
        if (myAssignments.length > 0) {
          const firstClsId = myAssignments[0].classId || (myAssignments[0] as any).class_id;
          setForm(prev => ({ ...prev, kelasId: firstClsId }));
        }
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data laporan evaluasi wali kelas.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get allowed classes for form
  const getAllowedClasses = () => {
    if (currentUser.role === 'Admin') return classes;
    if (myWaliClasses.length > 0) {
      const assignedIds = myWaliClasses.map(w => w.classId || (w as any).class_id);
      const filtered = classes.filter(c => assignedIds.includes(c.id));
      if (filtered.length > 0) return filtered;
      return myWaliClasses.map(w => ({
        id: w.classId || (w as any).class_id,
        name: w.class?.name || 'Kelas Binaan',
        level: 'I\'dad'
      })) as SchoolClass[];
    }
    return classes;
  };

  const handleOpenNewModal = () => {
    const allowed = getAllowedClasses();
    const defaultClassId = allowed.length > 0 ? allowed[0].id : '';
    setEditingId(null);
    setForm({
      tipePeriode: activeTab,
      bulan: 'Agustus',
      tahun: new Date().getFullYear().toString(),
      semester: 'Ganjil',
      tahunAjaran: '2025/2026',
      kelasId: defaultClassId,
      laporanKbm: '',
      masalahKelas: '',
      perkembanganSantri: '',
      rekomendasiKurikulum: '',
      tanggapanAdmin: ''
    });
    setShowModal(true);
  };

  const handleEdit = (report: EvaluasiWaliKelas) => {
    setEditingId(report.id);
    setForm({
      tipePeriode: report.tipePeriode,
      bulan: report.bulan || 'Agustus',
      tahun: report.tahun || new Date().getFullYear().toString(),
      semester: report.semester || 'Ganjil',
      tahunAjaran: report.tahunAjaran || '2025/2026',
      kelasId: report.kelasId,
      laporanKbm: report.laporanKbm,
      masalahKelas: report.masalahKelas,
      perkembanganSantri: report.perkembanganSantri,
      rekomendasiKurikulum: report.rekomendasiKurikulum,
      tanggapanAdmin: report.tanggapanAdmin || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan evaluasi ini?')) return;
    try {
      await api.deleteEvaluasiWaliKelas(id);
      setReports(prev => prev.filter(r => r.id !== id));
      setSuccessMsg('Laporan evaluasi berhasil dihapus.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus laporan.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelasId) {
      alert('Pilih kelas yang diampu terlebih dahulu.');
      return;
    }

    const selectedClass = classes.find(c => c.id === form.kelasId);
    const kelasNama = selectedClass ? selectedClass.name : 'Kelas';
    const guruNama = currentUser.name;
    const guruId = currentUser.teacherId || currentUser.id;

    const payload = {
      guruId,
      guruNama,
      kelasId: form.kelasId,
      kelasNama,
      tipePeriode: form.tipePeriode,
      bulan: form.tipePeriode === 'bulanan' ? form.bulan : '',
      tahun: form.tipePeriode === 'bulanan' ? form.tahun : '',
      semester: form.tipePeriode === 'semester' ? form.semester : '',
      tahunAjaran: form.tipePeriode === 'semester' ? form.tahunAjaran : '',
      laporanKbm: form.laporanKbm,
      masalahKelas: form.masalahKelas,
      perkembanganSantri: form.perkembanganSantri,
      rekomendasiKurikulum: form.rekomendasiKurikulum,
      tanggapanAdmin: form.tanggapanAdmin,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await api.updateEvaluasiWaliKelas(editingId, payload);
        setReports(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
        setSuccessMsg('Laporan evaluasi wali kelas berhasil diperbarui.');
      } else {
        const newRecord = await api.createEvaluasiWaliKelas({
          id: `ewk-${crypto.randomUUID()}`,
          ...payload,
          createdAt: new Date().toISOString()
        });
        setReports(prev => [newRecord, ...prev]);
        setSuccessMsg('Laporan evaluasi wali kelas berhasil dikirimkan ke Kurikulum.');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan laporan.');
    }
  };

  const handleSaveAdminResponse = async () => {
    if (!responseModal) return;
    try {
      await api.updateEvaluasiWaliKelas(responseModal.id, {
        tanggapanAdmin: adminResponseText,
        updatedAt: new Date().toISOString()
      });
      setReports(prev => prev.map(r => r.id === responseModal.id ? { ...r, tanggapanAdmin: adminResponseText } : r));
      setResponseModal(null);
      setSuccessMsg('Tanggapan/Catatan Bagian Kurikulum berhasil disimpan.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan tanggapan.');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (r.tipePeriode !== activeTab) return false;
    if (selectedClassId !== 'ALL' && r.kelasId !== selectedClassId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTeacher = r.guruNama.toLowerCase().includes(q);
      const matchClass = r.kelasNama.toLowerCase().includes(q);
      const matchContent = (r.laporanKbm + r.masalahKelas + r.perkembanganSantri).toLowerCase().includes(q);
      return matchTeacher || matchClass || matchContent;
    }
    return true;
  });

  const allowedClasses = getAllowedClasses();
  const isAssignedSingleClass = currentUser.role !== 'Admin' && allowedClasses.length === 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-sky-900 via-sky-800 to-sky-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 opacity-10 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E")`}} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              Laporan Pertanggungjawaban Wali Kelas
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Evaluasi Wali Kelas ke Kurikulum</h1>
            <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Wadah pelaporan resmi Wali Kelas kepada Bagian Kurikulum terkait perkembangan KBM, kendala kelas, serta perkembangan santri per Bulan dan per Semester.
            </p>
          </div>
          
          {currentUser.role !== 'Admin' && (
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-sky-900 hover:bg-sky-50 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Laporan Evaluasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tab Switcher & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Periode Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'bulanan' 
                ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-200 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan Bulanan</span>
          </button>
          <button
            onClick={() => setActiveTab('semester')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'semester' 
                ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-200 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Laporan Semester</span>
          </button>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {allowedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kelas, wali kelas, atau isi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid List */}
      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Memuat Laporan Evaluasi Wali Kelas...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Belum Ada Laporan Evaluasi {activeTab === 'bulanan' ? 'Bulanan' : 'Semester'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery || selectedClassId !== 'ALL' 
              ? 'Tidak ditemukan laporan yang sesuai dengan filter pencarian.' 
              : currentUser.role === 'Admin'
                ? 'Belum ada laporan evaluasi yang dikirimkan oleh para Wali Kelas ke Bagian Kurikulum.'
                : 'Klik tombol "Buat Laporan Evaluasi" di atas untuk mengirimkan laporan evaluasi kelas binaan Anda ke Bagian Kurikulum.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredReports.map((report) => (
            <div 
              key={report.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Card Top Banner */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 dark:from-sky-600 dark:to-sky-800 text-white flex items-center justify-center shadow-sm shadow-sky-500/20 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">{report.kelasNama}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        report.tipePeriode === 'bulanan' 
                          ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/60' 
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-700/60'
                      }`}>
                        {report.tipePeriode === 'bulanan' ? `Bulan ${report.bulan} ${report.tahun}` : `Semester ${report.semester} (${report.tahunAjaran})`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Wali Kelas: <strong className="text-slate-800 dark:text-slate-200 font-bold">{report.guruNama}</strong> · <span className="opacity-80">Dibuat: {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => downloadEvaluasiWaliKelasPdf(report)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Print Cetak Fisik"
                  >
                    <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  <button
                    onClick={() => downloadEvaluasiWaliKelasPdf(report)}
                    className="px-2.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Download File PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>

                  {(currentUser.role === 'Admin' || currentUser.teacherId === report.guruId || currentUser.id === report.guruId) && (
                    <>
                      <button
                        onClick={() => handleEdit(report)}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Edit Laporan"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => { setResponseModal(report); setAdminResponseText(report.tanggapanAdmin || ''); }}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{report.tanggapanAdmin ? 'Edit Tanggapan' : 'Beri Catatan'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body Content (4 Main Sections) */}
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Section 1: KBM */}
                <div className="p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50">
                  <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>I. Evaluasi KBM & Kondisi Kelas</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{report.laporanKbm || '- Tidak Ada Catatan -'}</p>
                </div>

                {/* Section 2: Masalah Kelas */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>II. Masalah & Kendala Kelas</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{report.masalahKelas || '- Tidak Ada Masalah -'}</p>
                </div>

                {/* Section 3: Perkembangan Santri */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>III. Catatan & Perkembangan Santri</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{report.perkembanganSantri || '- Tidak Ada Catatan -'}</p>
                </div>

                {/* Section 4: Rekomendasi ke Kurikulum */}
                <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50">
                  <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>IV. Rekomendasi ke Bagian Kurikulum</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{report.rekomendasiKurikulum || '- Tidak Ada Rekomendasi -'}</p>
                </div>
              </div>

              {/* Tanggapan Kurikulum Section */}
              {report.tanggapanAdmin && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60">
                    <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-bold text-xs mb-1">
                      <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Catatan / Tanggapan Bagian Kurikulum:</span>
                    </div>
                    <p className="text-xs text-sky-950 dark:text-sky-200 font-medium whitespace-pre-wrap leading-relaxed pl-6">{report.tanggapanAdmin}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Create/Edit Laporan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Laporan Evaluasi Wali Kelas' : 'Buat Laporan Evaluasi Wali Kelas'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Laporan Resmi Wali Kelas ke Bagian Kurikulum</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Form Row 1: Tipe Periode & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Tipe Periode Laporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.tipePeriode}
                    onChange={e => setForm(prev => ({ ...prev, tipePeriode: e.target.value as 'bulanan' | 'semester' }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="bulanan">Bulanan</option>
                    <option value="semester">Semesteran</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Kelas yang Dilaporkan <span className="text-rose-500">*</span></span>
                    {currentUser.role !== 'Admin' && (
                      <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">Kelas Binaan Anda</span>
                    )}
                  </label>
                  
                  {isAssignedSingleClass ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-sky-300 dark:border-sky-700/80 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 font-bold">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {allowedClasses[0]?.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-700 dark:text-sky-300 bg-sky-200/60 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                        Terkunci Otomatis
                      </span>
                    </div>
                  ) : (
                    <select
                      value={form.kelasId}
                      onChange={e => setForm(prev => ({ ...prev, kelasId: e.target.value }))}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                    >
                      {allowedClasses.length === 0 ? (
                        <option value="" disabled>Anda belum ditugaskan sebagai Wali Kelas</option>
                      ) : (
                        allowedClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* Form Row 2: Dynamic Period Specific Inputs */}
              {form.tipePeriode === 'bulanan' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sky-50/80 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-100 dark:border-sky-800/60">
                  <div>
                    <label className="block font-bold text-sky-950 dark:text-sky-200 mb-1.5">Bulan</label>
                    <select
                      value={form.bulan}
                      onChange={e => setForm(prev => ({ ...prev, bulan: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-sky-200 dark:border-sky-700/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                    >
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sky-950 dark:text-sky-200 mb-1.5">Tahun</label>
                    <input
                      type="number"
                      value={form.tahun}
                      onChange={e => setForm(prev => ({ ...prev, tahun: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-sky-200 dark:border-sky-700/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/80 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/60">
                  <div>
                    <label className="block font-bold text-purple-950 dark:text-purple-200 mb-1.5">Semester</label>
                    <select
                      value={form.semester}
                      onChange={e => setForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-purple-700/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-purple-950 dark:text-purple-200 mb-1.5">Tahun Ajaran</label>
                    <input
                      type="text"
                      placeholder="contoh: 2025/2026"
                      value={form.tahunAjaran}
                      onChange={e => setForm(prev => ({ ...prev, tahunAjaran: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-purple-700/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Field 1: Laporan KBM */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  I. Evaluasi & Laporan KBM Kelas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kondisi umum proses KBM di kelas, kedisiplinan pengajar, suasana belajar, serta pencapaian akademik..."
                  value={form.laporanKbm}
                  onChange={e => setForm(prev => ({ ...prev, laporanKbm: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 2: Masalah Kelas */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  II. Masalah & Kendala Kelas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan kendala umum yang terjadi di kelas (fasilitas, kebersihan, pelanggaran disiplin kelas, dll)..."
                  value={form.masalahKelas}
                  onChange={e => setForm(prev => ({ ...prev, masalahKelas: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 3: Perkembangan Santri */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  III. Laporan & Perkembangan Santri / Anak-Anak <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sebutkan nama santri yang memerlukan perhatian khusus (hafalan, kesehatan, adab/perilaku) atau santri yang berprestasi..."
                  value={form.perkembanganSantri}
                  onChange={e => setForm(prev => ({ ...prev, perkembanganSantri: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 4: Rekomendasi Kurikulum */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  IV. Upaya, Solusi & Rekomendasi ke Bagian Kurikulum <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan upaya yang sudah dilakukan Wali Kelas serta dukungan/kebijakan yang direkomendasikan kepada Kurikulum/Pimpinan..."
                  value={form.rekomendasiKurikulum}
                  onChange={e => setForm(prev => ({ ...prev, rekomendasiKurikulum: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Kirim Laporan ke Kurikulum'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Tanggapan / Catatan Kurikulum</h3>
              </div>
              <button 
                onClick={() => setResponseModal(null)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-200">{responseModal.kelasNama} - {responseModal.guruNama}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{responseModal.tipePeriode === 'bulanan' ? `Bulan ${responseModal.bulan} ${responseModal.tahun}` : `Semester ${responseModal.semester} (${responseModal.tahunAjaran})`}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">Tanggapan, Catatan, atau Arahan Kurikulum:</label>
                <textarea
                  rows={4}
                  value={adminResponseText}
                  onChange={e => setAdminResponseText(e.target.value)}
                  placeholder="Tuliskan arahan, tindak lanjut, atau respon kurikulum untuk wali kelas..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAdminResponse}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
