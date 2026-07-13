import React from 'react';
import {
  FileText, Plus, Edit, Trash, Search, X, AlertCircle,
  CheckCircle, Upload, CloudLightning, Check, Send, Save,
  ChevronDown, ChevronUp, PlusCircle, Trash2, BookOpen
} from 'lucide-react';
import { RPP, Subject, SchoolClass, AcademicYear, SyllabusItem } from '../types';
import { api } from '../api';

interface MyRPPsProps {
  rpps: RPP[];
  subjects: Subject[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  onRefresh: () => void;
}

export default function MyRPPs({ rpps, subjects, classes, academicYears, onRefresh }: MyRPPsProps) {
  const [activeTab, setActiveTab] = React.useState<'history' | 'create'>('history');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const myRpps = rpps.filter(r => r.teacherId === myUser.teacherId);

  // Form state
  const [editingRppId, setEditingRppId] = React.useState<string | null>(null);
  const [subjectId, setSubjectId] = React.useState('');
  const [classId, setClassId] = React.useState('');
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [kompetensiInti, setKompetensiInti] = React.useState('');
  const [kompetensiDasar, setKompetensiDasar] = React.useState('');

  // Semester Ganjil
  const [objectivesGanjil, setObjectivesGanjil] = React.useState('');
  const [totalMeetingsGanjil, setTotalMeetingsGanjil] = React.useState<number>(16);
  const [materialsGanjil, setMaterialsGanjil] = React.useState('');

  // Semester Genap
  const [objectivesGenap, setObjectivesGenap] = React.useState('');
  const [totalMeetingsGenap, setTotalMeetingsGenap] = React.useState<number>(16);
  const [materialsGenap, setMaterialsGenap] = React.useState('');

  // Komponen umum
  const [method, setMethod] = React.useState('');
  const [media, setMedia] = React.useState('');
  const [assessment, setAssessment] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [attachmentUrl, setAttachmentUrl] = React.useState('');
  const [attachmentName, setAttachmentName] = React.useState('');

  // Silabus items
  const [syllabusItems, setSyllabusItems] = React.useState<SyllabusItem[]>([]);
  const [syllabusTab, setSyllabusTab] = React.useState<'Ganjil' | 'Genap'>('Ganjil');

  // UI state
  const [uploading, setUploading] = React.useState(false);
  const [isAutosaving, setIsAutosaving] = React.useState(false);
  const [lastAutosave, setLastAutosave] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [expandedRppId, setExpandedRppId] = React.useState<string | null>(null);

  // Autosave draft
  React.useEffect(() => {
    if (activeTab !== 'create' || !subjectId || !classId || !academicYearId) return;
    const timer = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        const payload = buildPayload('Draft');
        if (editingRppId) {
          await api.updateRPP(editingRppId, payload);
        } else {
          const res = await api.createRPP(payload);
          setEditingRppId(res.id);
        }
        setLastAutosave(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch { /* silent */ } finally {
        setIsAutosaving(false);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [subjectId, classId, academicYearId, kompetensiInti, kompetensiDasar,
      objectivesGanjil, totalMeetingsGanjil, materialsGanjil,
      objectivesGenap, totalMeetingsGenap, materialsGenap,
      method, media, assessment, notes, syllabusItems, activeTab]);

  const buildPayload = (status: 'Draft' | 'Menunggu Persetujuan') => ({
    subjectId, classId, academicYearId,
    kompetensiInti, kompetensiDasar,
    objectivesGanjil, totalMeetingsGanjil: Number(totalMeetingsGanjil), materialsGanjil,
    objectivesGenap, totalMeetingsGenap: Number(totalMeetingsGenap), materialsGenap,
    method, media, assessment, notes,
    syllabusItems,
    attachmentUrl, attachmentName,
    status
  });

  const resetForm = () => {
    setEditingRppId(null); setSubjectId(''); setClassId(''); setAcademicYearId('');
    setKompetensiInti(''); setKompetensiDasar('');
    setObjectivesGanjil(''); setTotalMeetingsGanjil(16); setMaterialsGanjil('');
    setObjectivesGenap(''); setTotalMeetingsGenap(16); setMaterialsGenap('');
    setMethod(''); setMedia(''); setAssessment(''); setNotes('');
    setSyllabusItems([]); setAttachmentUrl(''); setAttachmentName('');
    setErrorMessage(''); setSuccessMessage(''); setLastAutosave(null);
  };

  const handleEditClick = (rpp: RPP) => {
    setEditingRppId(rpp.id);
    setSubjectId(rpp.subjectId); setClassId(rpp.classId); setAcademicYearId(rpp.academicYearId);
    setKompetensiInti(rpp.kompetensiInti); setKompetensiDasar(rpp.kompetensiDasar);
    setObjectivesGanjil(rpp.objectivesGanjil); setTotalMeetingsGanjil(rpp.totalMeetingsGanjil); setMaterialsGanjil(rpp.materialsGanjil);
    setObjectivesGenap(rpp.objectivesGenap); setTotalMeetingsGenap(rpp.totalMeetingsGenap); setMaterialsGenap(rpp.materialsGenap);
    setMethod(rpp.method); setMedia(rpp.media); setAssessment(rpp.assessment); setNotes(rpp.notes);
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
      setErrorMessage('Mata pelajaran, kelas, dan tahun ajaran wajib dipilih.');
      return;
    }
    if (targetStatus === 'Menunggu Persetujuan') {
      if (!kompetensiInti.trim() || !objectivesGanjil.trim() || !objectivesGenap.trim()) {
        setErrorMessage('Harap lengkapi Kompetensi Inti, Tujuan Semester Ganjil, dan Tujuan Semester Genap sebelum mengirim.');
        return;
      }
    }
    try {
      const payload = buildPayload(targetStatus);
      if (editingRppId) { await api.updateRPP(editingRppId, payload); }
      else { await api.createRPP(payload); }
      setSuccessMessage(targetStatus === 'Draft' ? 'RPP berhasil disimpan sebagai draft.' : 'RPP berhasil dikirim untuk persetujuan.');
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
    const updated = [...syllabusItems];
    (updated[idx] as any)[field] = value;
    setSyllabusItems(updated);
  };

  const removeSyllabusItem = (idx: number) => {
    setSyllabusItems(syllabusItems.filter((_, i) => i !== idx));
  };

  const filteredMyRpps = myRpps.filter(r => {
    const matchSearch =
      (r.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.academicYear?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const ganjilItems = syllabusItems.filter(s => s.semester === 'Ganjil').map((s, i) => ({ ...s, _idx: syllabusItems.indexOf(s) }));
  const genapItems  = syllabusItems.filter(s => s.semester === 'Genap').map((s, i) => ({ ...s, _idx: syllabusItems.indexOf(s) }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Tab */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Penyusunan RPP Tahunan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Susun RPP per mata pelajaran untuk satu tahun pembelajaran (Ganjil & Genap).</p>
        </div>
        <div className="flex items-center space-x-1 border border-slate-100 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${activeTab === 'history' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            Riwayat RPP
          </button>
          <button onClick={() => { resetForm(); setActiveTab('create'); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${activeTab === 'create' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            Buat RPP Baru
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari berdasarkan mata pelajaran, kelas, atau tahun ajaran..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/25 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Revisi">Revisi</option>
            </select>
          </div>

          {/* RPP cards */}
          {filteredMyRpps.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
              <p className="text-sm font-medium">Belum ada RPP tahunan terdaftar.</p>
              <p className="text-xs">Klik "Buat RPP Baru" untuk mulai menyusun.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyRpps.map(rpp => (
                <div key={rpp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs overflow-hidden transition
                  ${rpp.status === 'Revisi' ? 'border-rose-200 dark:border-rose-900/40' : 'border-slate-100 dark:border-slate-800'}`}>
                  {/* Card header row */}
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{rpp.subject?.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kelas {rpp.class?.name} &bull; TA {rpp.academicYear?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border
                        ${rpp.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : ''}
                        ${rpp.status === 'Menunggu Persetujuan' ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400' : ''}
                        ${rpp.status === 'Revisi' ? 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400' : ''}
                        ${rpp.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' : ''}`}>
                        {rpp.status}
                      </span>
                      {rpp.status !== 'Disetujui' && (
                        <button onClick={() => handleEditClick(rpp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Edit RPP">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {rpp.status === 'Draft' && (
                        <button onClick={() => handleDelete(rpp)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition" title="Hapus Draft">
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setExpandedRppId(expandedRppId === rpp.id ? null : rpp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        {expandedRppId === rpp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Revision notes */}
                  {rpp.status === 'Revisi' && rpp.revisionNotes && (
                    <div className="mx-5 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                      <span className="font-bold">Catatan Revisi: </span><em>"{rpp.revisionNotes}"</em>
                    </div>
                  )}
                  {/* Expandable detail */}
                  {expandedRppId === rpp.id && (
                    <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Kompetensi Inti</p><p className="whitespace-pre-wrap">{rpp.kompetensiInti || '-'}</p></div>
                        <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Kompetensi Dasar</p><p className="whitespace-pre-wrap">{rpp.kompetensiDasar || '-'}</p></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                          <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-2">Semester Ganjil ({rpp.totalMeetingsGanjil} pertemuan)</p>
                          <p className="font-semibold mb-1">Tujuan:</p><p className="whitespace-pre-wrap mb-2">{rpp.objectivesGanjil || '-'}</p>
                          <p className="font-semibold mb-1">Materi:</p><p className="whitespace-pre-wrap">{rpp.materialsGanjil || '-'}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                          <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-2">Semester Genap ({rpp.totalMeetingsGenap} pertemuan)</p>
                          <p className="font-semibold mb-1">Tujuan:</p><p className="whitespace-pre-wrap mb-2">{rpp.objectivesGenap || '-'}</p>
                          <p className="font-semibold mb-1">Materi:</p><p className="whitespace-pre-wrap">{rpp.materialsGenap || '-'}</p>
                        </div>
                      </div>
                      {rpp.syllabusItems && rpp.syllabusItems.length > 0 && (
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Silabus Pertemuan</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {['Ganjil','Genap'].map(sem => (
                              <div key={sem}>
                                <p className="font-semibold text-slate-500 mb-1">{sem}</p>
                                {rpp.syllabusItems.filter(s => s.semester === sem).map(s => (
                                  <div key={s.meetingNo} className="flex space-x-2 py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="w-6 text-center font-mono font-bold text-emerald-600">{s.meetingNo}</span>
                                    <span className="flex-1">{s.topic || '-'}</span>
                                    {s.date && <span className="font-mono text-slate-400">{s.date}</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (
        /* ===== FORM CREATE/EDIT ===== */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
            {/* Form header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {editingRppId ? 'Edit RPP Tahunan' : 'Form Penyusunan RPP Tahunan'}
              </h3>
              <div className="text-[10px] text-slate-400">
                {isAutosaving ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CloudLightning className="w-3 h-3 animate-bounce"/>Auto-saving...</span>
                  : lastAutosave ? <span className="text-emerald-500 italic">Draft tersimpan ({lastAutosave})</span>
                  : <span>Auto-save aktif</span>}
              </div>
            </div>

            {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs"><AlertCircle className="w-4 h-4"/><span>{errorMessage}</span></div>}
            {successMessage && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs"><CheckCircle className="w-4 h-4"/><span>{successMessage}</span></div>}

            {/* Identitas RPP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mata Pelajaran</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!!editingRppId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-800">
                  <option value="" disabled>Pilih mata pelajaran...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                <select value={classId} onChange={e => setClassId(e.target.value)} disabled={!!editingRppId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-800">
                  <option value="" disabled>Pilih kelas...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name} ({c.level})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                <select value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} disabled={!!editingRppId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-800">
                  <option value="" disabled>Pilih tahun ajaran...</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                </select>
              </div>
            </div>

            {/* KI & KD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kompetensi Inti (KI)</label>
                <textarea rows={3} placeholder="Deskripsikan kompetensi inti yang ingin dicapai..."
                  value={kompetensiInti} onChange={e => setKompetensiInti(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kompetensi Dasar (KD)</label>
                <textarea rows={3} placeholder="Deskripsikan kompetensi dasar yang akan dicapai..."
                  value={kompetensiDasar} onChange={e => setKompetensiDasar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>
            </div>

            {/* Semester Ganjil */}
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">Semester Ganjil</h4>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-500 font-semibold">Jumlah Pertemuan:</label>
                  <input type="number" min={1} max={50} value={totalMeetingsGanjil} onChange={e => setTotalMeetingsGanjil(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tujuan Pembelajaran Semester Ganjil</label>
                <textarea rows={2} placeholder="Tujuan yang ingin dicapai sepanjang semester ganjil..."
                  value={objectivesGanjil} onChange={e => setObjectivesGanjil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ringkasan Materi Semester Ganjil</label>
                <textarea rows={2} placeholder="Daftar bab, kitab, surat, atau topik utama semester ganjil..."
                  value={materialsGanjil} onChange={e => setMaterialsGanjil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              </div>
            </div>

            {/* Semester Genap */}
            <div className="p-4 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-violet-700 dark:text-violet-400 text-xs uppercase tracking-wider">Semester Genap</h4>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-500 font-semibold">Jumlah Pertemuan:</label>
                  <input type="number" min={1} max={50} value={totalMeetingsGenap} onChange={e => setTotalMeetingsGenap(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tujuan Pembelajaran Semester Genap</label>
                <textarea rows={2} placeholder="Tujuan yang ingin dicapai sepanjang semester genap..."
                  value={objectivesGenap} onChange={e => setObjectivesGenap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ringkasan Materi Semester Genap</label>
                <textarea rows={2} placeholder="Daftar bab, kitab, surat, atau topik utama semester genap..."
                  value={materialsGenap} onChange={e => setMaterialsGenap(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"/>
              </div>
            </div>

            {/* Metode, Media, Asesmen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Metode Pembelajaran</label>
                <input type="text" placeholder="Talaqqi, Ceramah, Diskusi, dll."
                  value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Media & Alat Pembelajaran</label>
                <input type="text" placeholder="Mushaf, Papan Tulis, Proyektor, dll."
                  value={media} onChange={e => setMedia(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Penilaian / Asesmen</label>
              <textarea rows={2} placeholder="Metode penilaian: kuis lisan, setoran hafalan, tugas tertulis, dll."
                value={assessment} onChange={e => setAssessment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Catatan Tambahan</label>
              <textarea rows={2} placeholder="Catatan khusus untuk kelas ini sepanjang tahun..."
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>

            {/* Silabus per pertemuan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Silabus Rincian Per Pertemuan (Opsional)</label>
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  {(['Ganjil','Genap'] as const).map(s => (
                    <button key={s} onClick={() => setSyllabusTab(s)} type="button"
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${syllabusTab === s ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {(syllabusTab === 'Ganjil' ? ganjilItems : genapItems).map(item => (
                <div key={item._idx} className="flex items-center space-x-2">
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">{item.meetingNo}</span>
                  <input type="text" placeholder={`Topik pertemuan ${item.meetingNo}...`}
                    value={item.topic} onChange={e => updateSyllabusItem(item._idx, 'topic', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                  <input type="date" value={item.date || ''} onChange={e => updateSyllabusItem(item._idx, 'date', e.target.value)}
                    className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                  <button onClick={() => removeSyllabusItem(item._idx)} type="button"
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ))}
              <button onClick={() => addSyllabusItem(syllabusTab)} type="button"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-dashed border-emerald-300 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition">
                <PlusCircle className="w-3.5 h-3.5"/><span>Tambah Pertemuan {syllabusTab}</span>
              </button>
            </div>

            {/* Upload lampiran */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Lampiran Pendukung (PDF/Gambar, maks. 5MB)</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center bg-slate-50/25 hover:border-emerald-400 transition cursor-pointer relative">
                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" disabled={uploading}/>
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1"/>
                <p className="text-xs text-slate-500">Drag & drop atau klik untuk upload</p>
              </div>
              {uploading && <p className="text-xs text-emerald-600 font-bold animate-pulse flex items-center gap-1"><CloudLightning className="w-3.5 h-3.5"/>Mengunggah...</p>}
              {attachmentUrl && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-emerald-600"/><span className="font-semibold truncate max-w-[200px]">{attachmentName}</span></div>
                  <button onClick={() => { setAttachmentUrl(''); setAttachmentName(''); }} className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition"><X className="w-3.5 h-3.5"/></button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => { resetForm(); setActiveTab('history'); }}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider">Batal</button>
              <button type="button" onClick={() => handleSaveRPP('Draft')} disabled={isAutosaving}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50">
                <Save className="w-4 h-4"/><span>Simpan Draft</span>
              </button>
              <button type="button" onClick={() => handleSaveRPP('Menunggu Persetujuan')} disabled={isAutosaving}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50">
                <Send className="w-4 h-4"/><span>Kirim RPP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
