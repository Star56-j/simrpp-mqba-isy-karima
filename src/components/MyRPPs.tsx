import React from 'react';
import {
  FileText, Edit, Trash, Search, X, AlertCircle,
  CheckCircle, Upload, CloudLightning, Send, Save,
  ChevronDown, ChevronUp, PlusCircle, Trash2, BookOpen, Download
} from 'lucide-react';
import { RPP, Subject, SchoolClass, AcademicYear, SyllabusItem } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';

interface MyRPPsProps {
  rpps: RPP[];
  subjects: Subject[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  onRefresh: () => void;
}

// Langkah-langkah form sebagai wizard
const STEPS = [
  { id: 1, label: 'Identitas',     desc: 'Mapel, Kelas, Tahun Ajaran' },
  { id: 2, label: 'Capaian & TP',  desc: 'CP, Tujuan, Alur TP' },
  { id: 3, label: 'Materi',        desc: 'Materi Ganjil & Genap' },
  { id: 4, label: 'Pembelajaran',  desc: 'Kegiatan 3 Fase' },
  { id: 5, label: 'Asesmen',       desc: 'Diagnostik, Formatif, Sumatif' },
  { id: 6, label: 'Silabus',       desc: 'Rincian Per Pertemuan' },
];

export default function MyRPPs({ rpps, subjects, classes, academicYears, onRefresh }: MyRPPsProps) {
  const [activeTab, setActiveTab] = React.useState<'history' | 'create'>('history');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');
  const [expandedRppId, setExpandedRppId] = React.useState<string | null>(null);
  const [currentStep, setCurrentStep] = React.useState(1);

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const myRpps = rpps.filter(r => r.teacherId === myUser.teacherId);

  // === FORM STATE ===
  const [editingRppId, setEditingRppId] = React.useState<string | null>(null);

  // Step 1: Identitas
  const [subjectId, setSubjectId]           = React.useState('');
  const [classId, setClassId]               = React.useState('');
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [profilPelajar, setProfilPelajar]   = React.useState('');
  const [sarana, setSarana]                 = React.useState('');

  // Step 2: Capaian & TP
  const [capaiPembelajaran, setCapaiPembelajaran]     = React.useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran]   = React.useState('');
  const [alurTP, setAlurTP]                           = React.useState('');

  // Step 3: Materi
  const [materiGanjil, setMateriGanjil]           = React.useState('');
  const [materiGenap, setMateriGenap]             = React.useState('');
  const [totalMeetingsGanjil, setTotalMeetingsGanjil] = React.useState<number>(16);
  const [totalMeetingsGenap, setTotalMeetingsGenap]   = React.useState<number>(16);

  // Step 4: Pembelajaran
  const [pendahuluan, setPendahuluan]   = React.useState('');
  const [kegiatanInti, setKegiatanInti] = React.useState('');
  const [penutup, setPenutup]           = React.useState('');
  const [metode, setMetode]             = React.useState('');
  const [media, setMedia]               = React.useState('');

  // Step 5: Asesmen & Diferensiasi
  const [asesmenDiagnostik, setAsesmenDiagnostik] = React.useState('');
  const [asesmenFormatif, setAsesmenFormatif]     = React.useState('');
  const [asesmenSumatif, setAsesmenSumatif]       = React.useState('');
  const [diferensiasi, setDiferensiasi]           = React.useState('');
  const [pengayaan, setPengayaan]                 = React.useState('');
  const [catatan, setCatatan]                     = React.useState('');

  // Step 6: Silabus & Lampiran
  const [syllabusItems, setSyllabusItems]   = React.useState<SyllabusItem[]>([]);
  const [syllabusTab, setSyllabusTab]       = React.useState<'Ganjil' | 'Genap'>('Ganjil');
  const [attachmentUrl, setAttachmentUrl]   = React.useState('');
  const [attachmentName, setAttachmentName] = React.useState('');

  // UI
  const [uploading, setUploading]         = React.useState(false);
  const [isAutosaving, setIsAutosaving]   = React.useState(false);
  const [lastAutosave, setLastAutosave]   = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage]   = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const buildPayload = (status: 'Draft' | 'Menunggu Persetujuan') => ({
    subjectId, classId, academicYearId,
    profilPelajar, sarana,
    capaiPembelajaran, tujuanPembelajaran, alurTP,
    materiGanjil, materiGenap,
    totalMeetingsGanjil: Number(totalMeetingsGanjil),
    totalMeetingsGenap: Number(totalMeetingsGenap),
    pendahuluan, kegiatanInti, penutup, metode, media,
    asesmenDiagnostik, asesmenFormatif, asesmenSumatif,
    diferensiasi, pengayaan, catatan,
    syllabusItems, attachmentUrl, attachmentName, status
  });

  // Autosave draft
  React.useEffect(() => {
    if (activeTab !== 'create' || !subjectId || !classId || !academicYearId) return;
    const timer = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        const payload = buildPayload('Draft');
        if (editingRppId) { await api.updateRPP(editingRppId, payload); }
        else { const res = await api.createRPP(payload); setEditingRppId(res.id); }
        setLastAutosave(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch { /* silent */ } finally { setIsAutosaving(false); }
    }, 4000);
    return () => clearTimeout(timer);
  }, [subjectId, classId, academicYearId, profilPelajar, sarana,
      capaiPembelajaran, tujuanPembelajaran, alurTP,
      materiGanjil, materiGenap, totalMeetingsGanjil, totalMeetingsGenap,
      pendahuluan, kegiatanInti, penutup, metode, media,
      asesmenDiagnostik, asesmenFormatif, asesmenSumatif,
      diferensiasi, pengayaan, catatan, syllabusItems, activeTab]);

  const resetForm = () => {
    setEditingRppId(null); setCurrentStep(1);
    setSubjectId(''); setClassId(''); setAcademicYearId('');
    setProfilPelajar(''); setSarana('');
    setCapaiPembelajaran(''); setTujuanPembelajaran(''); setAlurTP('');
    setMateriGanjil(''); setMateriGenap('');
    setTotalMeetingsGanjil(16); setTotalMeetingsGenap(16);
    setPendahuluan(''); setKegiatanInti(''); setPenutup('');
    setMetode(''); setMedia('');
    setAsesmenDiagnostik(''); setAsesmenFormatif(''); setAsesmenSumatif('');
    setDiferensiasi(''); setPengayaan(''); setCatatan('');
    setSyllabusItems([]); setAttachmentUrl(''); setAttachmentName('');
    setErrorMessage(''); setSuccessMessage(''); setLastAutosave(null);
  };

  const handleEditClick = (rpp: RPP) => {
    setEditingRppId(rpp.id); setCurrentStep(1);
    setSubjectId(rpp.subjectId); setClassId(rpp.classId); setAcademicYearId(rpp.academicYearId);
    setProfilPelajar(rpp.profilPelajar || ''); setSarana(rpp.sarana || '');
    setCapaiPembelajaran(rpp.capaiPembelajaran || '');
    setTujuanPembelajaran(rpp.tujuanPembelajaran || '');
    setAlurTP(rpp.alurTP || '');
    setMateriGanjil(rpp.materiGanjil || ''); setMateriGenap(rpp.materiGenap || '');
    setTotalMeetingsGanjil(rpp.totalMeetingsGanjil || 16);
    setTotalMeetingsGenap(rpp.totalMeetingsGenap || 16);
    setPendahuluan(rpp.pendahuluan || ''); setKegiatanInti(rpp.kegiatanInti || '');
    setPenutup(rpp.penutup || ''); setMetode(rpp.metode || ''); setMedia(rpp.media || '');
    setAsesmenDiagnostik(rpp.asesmenDiagnostik || '');
    setAsesmenFormatif(rpp.asesmenFormatif || '');
    setAsesmenSumatif(rpp.asesmenSumatif || '');
    setDiferensiasi(rpp.diferensiasi || ''); setPengayaan(rpp.pengayaan || '');
    setCatatan(rpp.catatan || '');
    setSyllabusItems(rpp.syllabusItems || []);
    setAttachmentUrl(rpp.attachmentUrl || ''); setAttachmentName(rpp.attachmentName || '');
    setErrorMessage(''); setSuccessMessage(''); setLastAutosave(null);
    setActiveTab('create');
  };

  const handleDelete = async (rpp: RPP) => {
    if (window.confirm('Hapus RPP ini?')) {
      try { await api.deleteRPP(rpp.id); onRefresh(); }
      catch (err: any) { alert(err.message || 'Gagal menghapus RPP.'); }
    }
  };

  const handleSaveRPP = async (targetStatus: 'Draft' | 'Menunggu Persetujuan') => {
    setErrorMessage(''); setSuccessMessage('');
    if (!subjectId || !classId || !academicYearId) {
      setErrorMessage('Mata pelajaran, kelas, dan tahun ajaran wajib dipilih.'); return;
    }
    if (targetStatus === 'Menunggu Persetujuan') {
      if (!capaiPembelajaran.trim() || !tujuanPembelajaran.trim()) {
        setErrorMessage('Harap lengkapi Capaian Pembelajaran dan Tujuan Pembelajaran sebelum mengirim.'); return;
      }
    }
    try {
      const payload = buildPayload(targetStatus);
      if (editingRppId) { await api.updateRPP(editingRppId, payload); }
      else { await api.createRPP(payload); }
      setSuccessMessage(targetStatus === 'Draft' ? 'RPP tersimpan sebagai draft.' : 'RPP dikirim untuk persetujuan Kurikulum.');
      setTimeout(() => { resetForm(); onRefresh(); setActiveTab('history'); }, 1200);
    } catch (err: any) { setErrorMessage(err.message || 'Gagal menyimpan RPP.'); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Maksimal 5MB'); return; }
    setUploading(true);
    try { const res = await api.uploadAttachment(file); setAttachmentUrl(res.url); setAttachmentName(res.name); }
    catch (err: any) { alert('Gagal upload: ' + err.message); }
    finally { setUploading(false); }
  };

  // Silabus helpers
  const addSyllabusItem = (sem: 'Ganjil' | 'Genap') => {
    const semItems = syllabusItems.filter(s => s.semester === sem);
    const nextNo = semItems.length > 0 ? Math.max(...semItems.map(s => s.meetingNo)) + 1 : 1;
    setSyllabusItems([...syllabusItems, { meetingNo: nextNo, semester: sem, topic: '', date: '' }]);
  };
  const updateSyllabusItem = (idx: number, field: keyof SyllabusItem, value: string | number) => {
    const updated = [...syllabusItems]; (updated[idx] as any)[field] = value; setSyllabusItems(updated);
  };
  const removeSyllabusItem = (idx: number) => setSyllabusItems(syllabusItems.filter((_, i) => i !== idx));

  const filteredMyRpps = myRpps.filter(r => {
    const matchSearch = (r.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.academicYear?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch && (statusFilter === 'Semua' || r.status === statusFilter);
  });

  const handleExport = () => {
    const dataToExport = filteredMyRpps.map((r, idx) => ({
      'No': idx + 1,
      'Mata Pelajaran': r.subject?.name || r.subjectId,
      'Kelas': r.class?.name || r.classId,
      'Tahun Ajaran': r.academicYear?.name || r.academicYearId,
      'Fase / Semester': `${r.fase || '-'} / ${r.semester || '-'}`,
      'Status': r.status,
      'Tgl Dibuat': new Date(r.createdAt).toLocaleDateString('id-ID'),
      'Catatan Revisi': r.revisionNotes || '-'
    }));
    exportToExcel(dataToExport, `Riwayat_RPP_Saya`);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile<any>(file);
      if (data.length === 0) throw new Error("File kosong");
      const rppListToSave = data.map(row => {
        const subjName = String(row['Mata Pelajaran']);
        const clsName = String(row['Kelas']);
        const subj = subjects.find(s => s.name === subjName || s.id === subjName);
        const cls = classes.find(c => c.name === clsName || c.id === clsName);
        const ayName = String(row['Tahun Ajaran']);
        const ay = academicYears.find(a => a.name === ayName || a.id === ayName) || academicYears[0];
        
        if (!subj || !cls) return null;
        return {
          subjectId: subj.id,
          classId: cls.id,
          academicYearId: ay?.id,
          fase: String(row['Fase'] || ''),
          semester: String(row['Semester'] || ''),
          capaiPembelajaran: String(row['Capaian Pembelajaran'] || ''),
          tujuanPembelajaran: String(row['Tujuan Pembelajaran'] || '')
        };
      }).filter(Boolean);
      await api.createRPPBulk({ rppList: rppListToSave });
      alert(`Berhasil mengimport data RPP`);
      onRefresh();
    } catch (err: any) {
      alert("Gagal mengimport: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const ganjilItems = syllabusItems.filter(s => s.semester === 'Ganjil').map(s => ({ ...s, _idx: syllabusItems.indexOf(s) }));
  const genapItems  = syllabusItems.filter(s => s.semester === 'Genap').map(s => ({ ...s, _idx: syllabusItems.indexOf(s) }));

  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";
  const sectionCls = "space-y-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Tab */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">RPP Kurikulum Merdeka</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Susun Rencana Pembelajaran berbasis Capaian Pembelajaran (CP) per tahun ajaran.</p>
        </div>
        <div className="flex items-center space-x-1 border border-slate-100 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${activeTab === 'history' ? 'bg-indigo-700 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Riwayat RPP
          </button>
          <button onClick={() => { resetForm(); setActiveTab('create'); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${activeTab === 'create' ? 'bg-indigo-700 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            Buat RPP Baru
          </button>
        </div>
      </div>

      {/* ===== TAB RIWAYAT ===== */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari mata pelajaran, kelas, atau tahun ajaran..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/25 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none">
              <option value="Semua">Semua Status</option>
              <option value="Menunggu Persetujuan">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Revisi">Revisi</option>
              <option value="Draft">Draft</option>
            </select>
            <div className="flex items-center space-x-2">
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 whitespace-nowrap">
                <Upload className="w-4 h-4" /><span>Import</span>
              </button>
              <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 whitespace-nowrap">
                <Download className="w-4 h-4" /><span>Export</span>
              </button>
            </div>
          </div>

          {filteredMyRpps.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada RPP terdaftar.</p>
              <p className="text-xs mt-1">Klik "Buat RPP Baru" untuk mulai menyusun.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyRpps.map(rpp => (
                <div key={rpp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs overflow-hidden
                  ${rpp.status === 'Revisi' ? 'border-rose-200 dark:border-rose-900/40' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{rpp.subject?.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kelas {rpp.class?.name} &bull; TA {rpp.academicYear?.name} &bull; {rpp.totalMeetingsGanjil + rpp.totalMeetingsGenap} pertemuan</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border
                        ${rpp.status === 'Disetujui' ? 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400' :
                          rpp.status === 'Menunggu Persetujuan' ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400' :
                          rpp.status === 'Revisi' ? 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400' :
                          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {rpp.status}
                      </span>
                      {rpp.status !== 'Disetujui' && (
                        <button onClick={() => handleEditClick(rpp)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><Edit className="w-4 h-4" /></button>
                      )}
                      {rpp.status === 'Draft' && (
                        <button onClick={() => handleDelete(rpp)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"><Trash className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => setExpandedRppId(expandedRppId === rpp.id ? null : rpp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        {expandedRppId === rpp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {rpp.status === 'Revisi' && rpp.revisionNotes && (
                    <div className="mx-5 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                      <span className="font-bold">Catatan Revisi: </span><em>"{rpp.revisionNotes}"</em>
                    </div>
                  )}
                  {expandedRppId === rpp.id && (
                    <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4 text-xs text-slate-600 dark:text-slate-400">
                      {rpp.capaiPembelajaran && <div><p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Capaian Pembelajaran</p><p className="whitespace-pre-wrap">{rpp.capaiPembelajaran}</p></div>}
                      {rpp.tujuanPembelajaran && <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Tujuan Pembelajaran</p><p className="whitespace-pre-wrap">{rpp.tujuanPembelajaran}</p></div>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                          <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Materi Ganjil ({rpp.totalMeetingsGanjil} pertemuan)</p>
                          <p className="whitespace-pre-wrap">{rpp.materiGanjil || '-'}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                          <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Materi Genap ({rpp.totalMeetingsGenap} pertemuan)</p>
                          <p className="whitespace-pre-wrap">{rpp.materiGenap || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB FORM BUAT/EDIT ===== */}
      {activeTab === 'create' && (
        <div className="space-y-5">
          {/* Step Progress */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between overflow-x-auto gap-1">
              {STEPS.map((step, i) => (
                <button key={step.id} onClick={() => setCurrentStep(step.id)} type="button"
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition flex-shrink-0 min-w-[80px]
                    ${currentStep === step.id ? 'bg-indigo-700 text-white' : currentStep > step.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${currentStep === step.id ? 'text-white' : ''}`}>{step.label}</span>
                  <span className={`text-[9px] mt-0.5 hidden sm:block ${currentStep === step.id ? 'text-indigo-100' : 'text-slate-400'}`}>{step.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
            {/* Autosave bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {STEPS[currentStep - 1].label} — {STEPS[currentStep - 1].desc}
              </h3>
              <div className="text-[10px] text-slate-400">
                {isAutosaving ? <span className="text-indigo-600 font-bold flex items-center gap-1"><CloudLightning className="w-3 h-3 animate-bounce"/>Menyimpan...</span>
                  : lastAutosave ? <span className="text-indigo-500 italic">Draft tersimpan ({lastAutosave})</span>
                  : <span>Auto-save aktif</span>}
              </div>
            </div>

            {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs"><AlertCircle className="w-4 h-4"/><span>{errorMessage}</span></div>}
            {successMessage && <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs"><CheckCircle className="w-4 h-4"/><span>{successMessage}</span></div>}

            {/* STEP 1: Identitas */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Mata Pelajaran</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!!editingRppId} className={inputCls}>
                      <option value="" disabled>Pilih mata pelajaran...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Kelas</label>
                    <select value={classId} onChange={e => setClassId(e.target.value)} disabled={!!editingRppId} className={inputCls}>
                      <option value="" disabled>Pilih kelas...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name} ({c.level})</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Tahun Ajaran</label>
                    <select value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} disabled={!!editingRppId} className={inputCls}>
                      <option value="" disabled>Pilih tahun ajaran...</option>
                      {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className={labelCls}>Profil Pelajar Pancasila yang Disasar</label>
                  <input type="text" value={profilPelajar} onChange={e => setProfilPelajar(e.target.value)}
                    placeholder="Cth: Beriman & Bertakwa, Mandiri, Bernalar Kritis, Bergotong Royong"
                    className={inputCls} />
                </div>
                <div><label className={labelCls}>Sarana & Prasarana</label>
                  <input type="text" value={sarana} onChange={e => setSarana(e.target.value)}
                    placeholder="Cth: Mushaf Al-Qur'an, Papan Tulis, Proyektor, Kitab..."
                    className={inputCls} />
                </div>
              </div>
            )}

            {/* STEP 2: Capaian & TP */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className={sectionCls}>
                  <div className="flex items-center space-x-2 mb-1"><span className="w-6 h-6 rounded-full bg-indigo-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">CP</span><label className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Capaian Pembelajaran</label></div>
                  <p className="text-[11px] text-slate-400 mb-2">Deskripsikan kompetensi yang harus dicapai peserta didik di akhir fase/tahun ini.</p>
                  <textarea rows={4} value={capaiPembelajaran} onChange={e => setCapaiPembelajaran(e.target.value)}
                    placeholder="Pada akhir fase ini, peserta didik mampu..." className={inputCls} />
                </div>
                <div className={sectionCls}>
                  <div className="flex items-center space-x-2 mb-1"><span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">TP</span><label className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Tujuan Pembelajaran (TP)</label></div>
                  <p className="text-[11px] text-slate-400 mb-2">Uraikan tujuan konkret yang ingin dicapai sepanjang tahun ajaran ini (bisa berupa poin-poin).</p>
                  <textarea rows={4} value={tujuanPembelajaran} onChange={e => setTujuanPembelajaran(e.target.value)}
                    placeholder="1. Santri mampu...\n2. Santri dapat...\n3. Santri memahami..." className={inputCls} />
                </div>
                <div className={sectionCls}>
                  <div className="flex items-center space-x-2 mb-1"><span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">ATP</span><label className="text-xs font-extrabold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Alur Tujuan Pembelajaran (ATP)</label></div>
                  <p className="text-[11px] text-slate-400 mb-2">Urutan logis pencapaian tujuan pembelajaran dari awal hingga akhir tahun.</p>
                  <textarea rows={3} value={alurTP} onChange={e => setAlurTP(e.target.value)}
                    placeholder="Diagnostik → Materi A → Materi B → Evaluasi Tengah → Materi C → Evaluasi Akhir"
                    className={inputCls} />
                </div>
              </div>
            )}

            {/* STEP 3: Materi */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">Semester Ganjil</h4>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-slate-500">Pertemuan:</label>
                      <input type="number" min={1} max={50} value={totalMeetingsGanjil} onChange={e => setTotalMeetingsGanjil(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </div>
                  </div>
                  <textarea rows={5} value={materiGanjil} onChange={e => setMateriGanjil(e.target.value)}
                    placeholder="Daftar topik/bab/kitab/surat yang akan dipelajari semester ganjil..." className={inputCls} />
                </div>
                <div className="p-4 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-violet-700 dark:text-violet-400 text-xs uppercase tracking-wider">Semester Genap</h4>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-slate-500">Pertemuan:</label>
                      <input type="number" min={1} max={50} value={totalMeetingsGenap} onChange={e => setTotalMeetingsGenap(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                    </div>
                  </div>
                  <textarea rows={5} value={materiGenap} onChange={e => setMateriGenap(e.target.value)}
                    placeholder="Daftar topik/bab/kitab/surat yang akan dipelajari semester genap..." className={inputCls} />
                </div>
              </div>
            )}

            {/* STEP 4: Kegiatan Pembelajaran */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className={sectionCls}>
                  <label className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">Pendahuluan (Pembuka)</label>
                  <p className="text-[11px] text-slate-400 mb-2">Apersepsi, motivasi, penyampaian tujuan, pertanyaan pemantik.</p>
                  <textarea rows={3} value={pendahuluan} onChange={e => setPendahuluan(e.target.value)}
                    placeholder="1. Salam dan doa bersama...\n2. Apersepsi materi sebelumnya...\n3. Penyampaian tujuan hari ini..." className={inputCls}/>
                </div>
                <div className={sectionCls}>
                  <label className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">Kegiatan Inti</label>
                  <p className="text-[11px] text-slate-400 mb-2">Eksplorasi, kolaborasi, elaborasi, dan refleksi pembelajaran.</p>
                  <textarea rows={5} value={kegiatanInti} onChange={e => setKegiatanInti(e.target.value)}
                    placeholder="1. Eksplorasi: Guru menyampaikan...\n2. Kolaborasi: Santri berdiskusi...\n3. Elaborasi: Santri mempresentasikan...\n4. Refleksi: Guru dan santri menyimpulkan..." className={inputCls}/>
                </div>
                <div className={sectionCls}>
                  <label className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">Penutup</label>
                  <p className="text-[11px] text-slate-400 mb-2">Rangkuman, refleksi, penugasan, dan doa penutup.</p>
                  <textarea rows={3} value={penutup} onChange={e => setPenutup(e.target.value)}
                    placeholder="1. Rangkuman poin utama...\n2. Refleksi bersama santri...\n3. Penugasan untuk pertemuan berikutnya...\n4. Doa penutup majelis." className={inputCls}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Metode / Model Pembelajaran</label>
                    <input type="text" value={metode} onChange={e => setMetode(e.target.value)}
                      placeholder="Cth: Talaqqi, Ceramah Interaktif, Diskusi, Project Based Learning..."
                      className={inputCls}/>
                  </div>
                  <div><label className={labelCls}>Media & Alat Pembelajaran</label>
                    <input type="text" value={media} onChange={e => setMedia(e.target.value)}
                      placeholder="Cth: Mushaf, Papan Tulis, Proyektor, Kartu Dalil..."
                      className={inputCls}/>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Asesmen & Diferensiasi */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={sectionCls}>
                    <label className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1">Asesmen Diagnostik</label>
                    <p className="text-[11px] text-slate-400 mb-2">Penilaian awal untuk mengetahui kemampuan awal santri.</p>
                    <textarea rows={3} value={asesmenDiagnostik} onChange={e => setAsesmenDiagnostik(e.target.value)}
                      placeholder="Tes lisan/tulisan di awal semester untuk pemetaan kemampuan..." className={inputCls}/>
                  </div>
                  <div className={sectionCls}>
                    <label className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">Asesmen Formatif</label>
                    <p className="text-[11px] text-slate-400 mb-2">Penilaian proses selama pembelajaran berlangsung.</p>
                    <textarea rows={3} value={asesmenFormatif} onChange={e => setAsesmenFormatif(e.target.value)}
                      placeholder="Observasi keaktifan, tanya jawab, kuis singkat, setoran per pertemuan..." className={inputCls}/>
                  </div>
                  <div className={sectionCls}>
                    <label className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">Asesmen Sumatif</label>
                    <p className="text-[11px] text-slate-400 mb-2">Penilaian akhir untuk mengukur ketercapaian tujuan.</p>
                    <textarea rows={3} value={asesmenSumatif} onChange={e => setAsesmenSumatif(e.target.value)}
                      placeholder="Ujian akhir semester: lisan, tertulis, atau portofolio..." className={inputCls}/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Pembelajaran Berdiferensiasi</label>
                    <textarea rows={3} value={diferensiasi} onChange={e => setDiferensiasi(e.target.value)}
                      placeholder="Perlakuan berbeda untuk santri dengan kemampuan beragam (lambat, sedang, cepat)..."
                      className={inputCls}/>
                  </div>
                  <div><label className={labelCls}>Pengayaan & Remedial</label>
                    <textarea rows={3} value={pengayaan} onChange={e => setPengayaan(e.target.value)}
                      placeholder="Program pengayaan untuk santri berprestasi dan remedial untuk yang belum mencapai TP..."
                      className={inputCls}/>
                  </div>
                </div>
                <div><label className={labelCls}>Catatan Guru</label>
                  <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)}
                    placeholder="Catatan khusus, kendala, atau rekomendasi untuk kelas ini..." className={inputCls}/>
                </div>
              </div>
            )}

            {/* STEP 6: Silabus & Lampiran */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Silabus Rincian Per Pertemuan (Opsional)</label>
                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      {(['Ganjil','Genap'] as const).map(s => (
                        <button key={s} onClick={() => setSyllabusTab(s)} type="button"
                          className={`px-3 py-1 rounded-md text-xs font-bold transition ${syllabusTab === s ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  {(syllabusTab === 'Ganjil' ? ganjilItems : genapItems).map(item => (
                    <div key={item._idx} className="flex items-center space-x-2">
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">{item.meetingNo}</span>
                      <input type="text" placeholder={`Topik pertemuan ${item.meetingNo}...`}
                        value={item.topic} onChange={e => updateSyllabusItem(item._idx, 'topic', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                      <input type="date" value={item.date || ''} onChange={e => updateSyllabusItem(item._idx, 'date', e.target.value)}
                        className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                      <button onClick={() => removeSyllabusItem(item._idx)} type="button"
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                  <button onClick={() => addSyllabusItem(syllabusTab)} type="button"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition">
                    <PlusCircle className="w-3.5 h-3.5"/><span>Tambah Pertemuan {syllabusTab}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Lampiran Pendukung (PDF/Gambar, maks. 5MB)</label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center bg-slate-50/25 hover:border-indigo-400 transition cursor-pointer relative">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" disabled={uploading}/>
                    <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1"/>
                    <p className="text-xs text-slate-500">Drag & drop atau klik untuk upload</p>
                  </div>
                  {uploading && <p className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1"><CloudLightning className="w-3.5 h-3.5"/>Mengunggah...</p>}
                  {attachmentUrl && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-indigo-600"/><span className="font-semibold truncate max-w-[200px]">{attachmentName}</span></div>
                      <button onClick={() => { setAttachmentUrl(''); setAttachmentName(''); }} className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigasi Antar Step + Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => { resetForm(); setActiveTab('history'); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase">Batal</button>
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep(s => s - 1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase transition">← Kembali</button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => handleSaveRPP('Draft')} disabled={isAutosaving}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50">
                  <Save className="w-4 h-4"/><span>Simpan Draft</span>
                </button>
                {currentStep < STEPS.length ? (
                  <button type="button" onClick={() => setCurrentStep(s => s + 1)}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition">
                    Lanjut →
                  </button>
                ) : (
                  <button type="button" onClick={() => handleSaveRPP('Menunggu Persetujuan')} disabled={isAutosaving}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50">
                    <Send className="w-4 h-4"/><span>Kirim RPP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
