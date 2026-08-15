import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, Printer, Trash2, Edit3, 
  Calendar, CheckCircle, AlertCircle, MessageSquare, BookOpen, 
  Users, UserCheck, ShieldAlert, Award, X, Sparkles, Send
} from 'lucide-react';
import { EvaluasiWaliKelas, User, SchoolClass, WaliKelas as TWaliKelas, Teacher } from '../types';
import { api } from '../api';

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

      // Filter wali kelas for current user if regular user
      if (currentUser.role === 'Guru' || currentUser.role === 'WaliKelas') {
        const myAssignments = waliRes.filter(w => w.teacherId === (currentUser.teacherId || currentUser.id));
        setMyWaliClasses(myAssignments);
        if (myAssignments.length > 0 && !form.kelasId) {
          setForm(prev => ({ ...prev, kelasId: myAssignments[0].classId }));
        }
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data laporan evaluasi wali kelas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    const defaultClassId = myWaliClasses.length > 0 ? myWaliClasses[0].classId : (classes[0]?.id || '');
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
      alert('Pilih kelas terlebih dahulu.');
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

  const handlePrintPDF = (report: EvaluasiWaliKelas) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Evaluasi Wali Kelas - ${report.kelasNama}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
          .header h2 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; }
          .header h3 { margin: 5px 0 0 0; font-size: 16px; color: #0284c7; font-weight: normal; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          .meta-table td { padding: 6px 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 15px; font-weight: bold; color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
          .content-box { font-size: 13px; text-align: justify; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .footer { margin-top: 40px; width: 100%; display: flex; justify-content: space-between; font-size: 13px; }
          .sig-box { text-align: center; width: 220px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>MADRASAH QUR'AN BERSANAD AL-ISY KARIMA</h2>
          <h3>LAPORAN EVALUASI WALI KELAS KEPADA BAGIAN KURIKULUM (${report.tipePeriode.toUpperCase()})</h3>
        </div>

        <table class="meta-table">
          <tr>
            <td width="15%"><strong>Kelas</strong></td>
            <td width="35%">: ${report.kelasNama}</td>
            <td width="20%"><strong>Periode Laporan</strong></td>
            <td width="30%">: ${report.tipePeriode === 'bulanan' ? `${report.bulan} ${report.tahun}` : `Semester ${report.semester} (${report.tahunAjaran})`}</td>
          </tr>
          <tr>
            <td><strong>Wali Kelas</strong></td>
            <td>: ${report.guruNama}</td>
            <td><strong>Tanggal Dibuat</strong></td>
            <td>: ${new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
        </table>

        <div class="section">
          <div class="section-title">I. Laporan KBM & Kondisi Pembelajaran Kelas</div>
          <div class="content-box">${report.laporanKbm || '- Tidak Ada Catatan -'}</div>
        </div>

        <div class="section">
          <div class="section-title">II. Laporan Masalah & Kendala Kelas</div>
          <div class="content-box">${report.masalahKelas || '- Tidak Ada Masalah/Kendala -'}</div>
        </div>

        <div class="section">
          <div class="section-title">III. Laporan Catatan & Perkembangan Santri/Anak-Anak</div>
          <div class="content-box">${report.perkembanganSantri || '- Tidak Ada Catatan Santri -'}</div>
        </div>

        <div class="section">
          <div class="section-title">IV. Upaya, Solusi & Rekomendasi ke Bagian Kurikulum</div>
          <div class="content-box">${report.rekomendasiKurikulum || '- Tidak Ada Rekomendasi -'}</div>
        </div>

        ${report.tanggapanAdmin ? `
          <div class="section">
            <div class="section-title">V. Catatan / Arahan dari Bagian Kurikulum</div>
            <div class="content-box" style="background: #f0f9ff; border-color: #bae6fd; color: #0369a1;">${report.tanggapanAdmin}</div>
          </div>
        ` : ''}

        <div style="margin-top: 50px; display: table; width: 100%;">
          <div style="display: table-cell; text-align: center; width: 50%;">
            <p>Mengetahui,<br/><strong>Bagian Kurikulum</strong></p>
            <br/><br/><br/>
            <p>( _______________________ )</p>
          </div>
          <div style="display: table-cell; text-align: center; width: 50%;">
            <p>Karanganyar, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/><strong>Wali Kelas ${report.kelasNama}</strong></p>
            <br/><br/><br/>
            <p><strong>${report.guruNama}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Evaluasi Wali Kelas ke Kurikulum</h1>
            <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Wadah pelaporan resmi Wali Kelas kepada Bagian Kurikulum terkait perkembangan KBM, kendala kelas, serta perkembangan santri per Bulan dan per Semester.
            </p>
          </div>
          
          {currentUser.role !== 'Admin' && (
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-sky-900 hover:bg-sky-50 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Laporan Evaluasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-emerald-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tab Switcher & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Periode Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('bulanan')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'bulanan' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan Bulanan</span>
          </button>
          <button
            onClick={() => setActiveTab('semester')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'semester' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Laporan Semester</span>
          </button>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas, wali kelas, atau isi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Memuat Laporan Evaluasi Wali Kelas...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Laporan Evaluasi {activeTab === 'bulanan' ? 'Bulanan' : 'Semester'}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {searchQuery || selectedClassId !== 'ALL' 
              ? 'Tidak ditemukan laporan yang sesuai dengan filter pencarian.' 
              : currentUser.role === 'Admin'
                ? 'Belum ada laporan evaluasi yang dikirimkan oleh para Wali Kelas ke Bagian Kurikulum.'
                : 'Klik tombol "Buat Laporan Evaluasi" di atas untuk mengirimkan laporan evaluasi kelas ke Bagian Kurikulum.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredReports.map((report) => (
            <div 
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition overflow-hidden"
            >
              {/* Card Top Banner */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {report.kelasNama}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-800">{report.kelasNama}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.tipePeriode === 'bulanan' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {report.tipePeriode === 'bulanan' ? `Bulan ${report.bulan} ${report.tahun}` : `Semester ${report.semester} (${report.tahunAjaran})`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Wali Kelas: <strong className="text-slate-700">{report.guruNama}</strong> · Dibuat: {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handlePrintPDF(report)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/80 transition flex items-center gap-1.5 text-xs font-semibold"
                    title="Cetak Cetak PDF Laporan"
                  >
                    <Printer className="w-4 h-4 text-sky-600" />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>

                  {(currentUser.role === 'Admin' || currentUser.teacherId === report.guruId || currentUser.id === report.guruId) && (
                    <>
                      <button
                        onClick={() => handleEdit(report)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/80 transition flex items-center gap-1.5 text-xs font-semibold"
                        title="Edit Laporan"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 text-xs font-semibold"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => { setResponseModal(report); setAdminResponseText(report.tanggapanAdmin || ''); }}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
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
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-sky-800 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>I. Evaluasi KBM & Kondisi Kelas</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{report.laporanKbm || '- Tidak Ada Catatan -'}</p>
                </div>

                {/* Section 2: Masalah Kelas */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>II. Masalah & Kendala Kelas</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{report.masalahKelas || '- Tidak Ada Masalah -'}</p>
                </div>

                {/* Section 3: Perkembangan Santri */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>III. Catatan & Perkembangan Santri</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{report.perkembanganSantri || '- Tidak Ada Catatan -'}</p>
                </div>

                {/* Section 4: Rekomendasi ke Kurikulum */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold mb-1.5 uppercase text-[11px] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>IV. Rekomendasi ke Bagian Kurikulum</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{report.rekomendasiKurikulum || '- Tidak Ada Rekomendasi -'}</p>
                </div>
              </div>

              {/* Tanggapan Kurikulum Section */}
              {report.tanggapanAdmin && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80">
                    <div className="flex items-center gap-2 text-sky-900 font-bold text-xs mb-1">
                      <MessageSquare className="w-4 h-4 text-sky-600" />
                      <span>Catatan / Tanggapan Bagian Kurikulum:</span>
                    </div>
                    <p className="text-xs text-sky-950 font-medium whitespace-pre-wrap leading-relaxed pl-6">{report.tanggapanAdmin}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Create/Edit Laporan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8 animate-fade-in">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {editingId ? 'Edit Laporan Evaluasi Wali Kelas' : 'Buat Laporan Evaluasi Wali Kelas'}
                  </h3>
                  <p className="text-xs text-slate-500">Laporan Resmi Wali Kelas ke Bagian Kurikulum</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full text-slate-400 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Form Row 1: Tipe Periode & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Periode Laporan</label>
                  <select
                    value={form.tipePeriode}
                    onChange={e => setForm(prev => ({ ...prev, tipePeriode: e.target.value as 'bulanan' | 'semester' }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="bulanan">Bulanan</option>
                    <option value="semester">Semesteran</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas yang Dilaporkan</label>
                  <select
                    value={form.kelasId}
                    onChange={e => setForm(prev => ({ ...prev, kelasId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {currentUser.role === 'Admin' ? (
                      classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    ) : myWaliClasses.length > 0 ? (
                      myWaliClasses.map(w => <option key={w.classId} value={w.classId}>{w.class?.name || 'Kelas'}</option>)
                    ) : (
                      classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              {/* Form Row 2: Dynamic Period Specific Inputs */}
              {form.tipePeriode === 'bulanan' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100">
                  <div>
                    <label className="block font-bold text-sky-900 mb-1">Bulan</label>
                    <select
                      value={form.bulan}
                      onChange={e => setForm(prev => ({ ...prev, bulan: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-sky-200 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sky-900 mb-1">Tahun</label>
                    <input
                      type="number"
                      value={form.tahun}
                      onChange={e => setForm(prev => ({ ...prev, tahun: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-sky-200 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-bold text-purple-900 mb-1">Semester</label>
                    <select
                      value={form.semester}
                      onChange={e => setForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-purple-900 mb-1">Tahun Ajaran</label>
                    <input
                      type="text"
                      placeholder="contoh: 2025/2026"
                      value={form.tahunAjaran}
                      onChange={e => setForm(prev => ({ ...prev, tahunAjaran: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Field 1: Laporan KBM */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  I. Evaluasi & Laporan KBM Kelas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kondisi umum proses KBM di kelas, kedisiplinan pengajar, suasana belajar, serta pencapaian akademik..."
                  value={form.laporanKbm}
                  onChange={e => setForm(prev => ({ ...prev, laporanKbm: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 2: Masalah Kelas */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  II. Masalah & Kendala Kelas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan kendala umum yang terjadi di kelas (fasilitas, kebersihan, pelanggaran disiplin kelas, dll)..."
                  value={form.masalahKelas}
                  onChange={e => setForm(prev => ({ ...prev, masalahKelas: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 3: Perkembangan Santri */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  III. Laporan & Perkembangan Santri / Anak-Anak <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sebutkan nama santri yang memerlukan perhatian khusus (hafalan, kesehatan, adab/perilaku) atau santri yang berprestasi..."
                  value={form.perkembanganSantri}
                  onChange={e => setForm(prev => ({ ...prev, perkembanganSantri: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Field 4: Rekomendasi Kurikulum */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  IV. Upaya, Solusi & Rekomendasi ke Bagian Kurikulum <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan upaya yang sudah dilakukan Wali Kelas serta dukungan/kebijakan yang direkomendasikan kepada Kurikulum/Pimpinan..."
                  value={form.rekomendasiKurikulum}
                  onChange={e => setForm(prev => ({ ...prev, rekomendasiKurikulum: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fade-in">
            <div className="p-5 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-700" />
                <h3 className="text-sm font-extrabold text-slate-800">Catatan / Arahan Bagian Kurikulum</h3>
              </div>
              <button onClick={() => setResponseModal(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-200"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
                <p><strong>Laporan Kelas:</strong> {responseModal.kelasNama}</p>
                <p><strong>Wali Kelas:</strong> {responseModal.guruNama}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Tanggapan / Arahan Bagian Kurikulum:</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan masukan, tanggapan, atau solusi dari Bagian Kurikulum untuk Wali Kelas..."
                  value={adminResponseText}
                  onChange={e => setAdminResponseText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminResponse}
                  className="px-4 py-2 rounded-xl bg-sky-700 text-white font-bold hover:bg-sky-800 shadow-xs"
                >
                  Simpan Tanggapan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
