import React from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  X, 
  AlertCircle,
  CheckCircle,
  Upload,
  Copy,
  Layout,
  Clock,
  Printer,
  ChevronDown,
  CloudLightning,
  Check,
  Send,
  Save,
  FileDown
} from 'lucide-react';
import { RPP, TeachingSchedule } from '../types';
import { api } from '../api';

interface MyRPPsProps {
  rpps: RPP[];
  schedules: TeachingSchedule[];
  onRefresh: () => void;
  initialCreateSchedule?: TeachingSchedule | null;
  clearInitialCreateSchedule?: () => void;
}

// Templates configuration
const RPP_TEMPLATES = [
  {
    name: "Template Halaqah Al-Qur'an (Setoran/Tahsin)",
    objectives: "Mampu menyetorkan hafalan surat [NAMA SURAT] ayat [MULAI-SELESAI] secara lancar dengan makhraj dan tajwid yang sempurna.",
    materials: "Hafalan Baru / Muroja'ah surat [NAMA SURAT] ayat [MULAI-SELESAI]",
    method: "Talaqqi, Tikrar (Pengulangan), Sima'i (Mendengarkan)",
    media: "Mushaf Al-Qur'an Pojok, Lembar Monitor Hafalan Santri, Papan Tulis",
    steps: "1. Mukaddimah: Doa bersama, motivasi adab menghafal Al-Qur'an (10 menit).\n2. Talaqqi: Pengajar mencontohkan bacaan ayat baru yang akan dihafal (15 menit).\n3. Tikrar: Santri mengulang bacaan mandiri/kelompok sebanyak 5-10 kali (30 menit).\n4. Setoran Hafalan: Santri maju menyetorkan hafalan satu per satu kepada pengajar (30 menit).\n5. Penutup: Evaluasi tajwid umum, doa penutup majelis (5 menit).",
    assessment: "Ketepatan makharijul huruf, kelancaran hafalan (tashih), tajwid.",
    notes: "Fokus pada kelancaran makhraj huruf hams & syiddah."
  },
  {
    name: "Template Diniyah (Kitab/Teori)",
    objectives: "Santri memahami konsep dasar [NAMA MATERI] dari Kitab [NAMA KITAB] serta mampu menjelaskan implementasinya dalam kehidupan sehari-hari.",
    materials: "Bab [NAMA BAB] Kitab [NAMA KITAB] Halaman [MULAI-SELESAI]",
    method: "Ceramah Interaktif, Tanya Jawab, Syarah (Penjelasan Kitab)",
    media: "Kitab Kuning / Buku Panduan, Slide Proyektor, Papan Tulis",
    steps: "1. Pendahuluan: Mengulang materi minggu lalu, apersepsi keterkaitan materi baru (10 menit).\n2. Pembacaan Kitab: Membaca teks kitab beserta terjemah harfiah (15 menit).\n3. Penjelasan (Syarah): Menjabarkan makna syariat, memberikan contoh riil (30 menit).\n4. Diskusi/Tanya Jawab: Interaksi santri mengajukan masalah kontemporer terkait (25/10 menit).\n5. Kesimpulan: Rangkuman ringkas dan penugasan (10 menit).",
    assessment: "Keaktifan menjawab pertanyaan lisan, tugas rangkuman tertulis santri.",
    notes: "Gunakan analogi sederhana untuk memudahkan pemahaman adab."
  },
  {
    name: "Template Pembelajaran Bahasa Arab (ABY)",
    objectives: "Santri menguasai mufrodat baru terkait tema [NAMA TEMA] dan mempraktikkan percakapan (hiwar) secara berpasangan.",
    materials: "Kitab Arabiyah Baina Yadaik (ABY) - Tema [NAMA TEMA]",
    method: "Hiwar Direct Method, Drill Mufrodat, Role Play",
    media: "Kitab ABY, Flashcards Mufrodat, Audio Speaker",
    steps: "1. Pembukaan: Sapaan dalam Bahasa Arab, ulasan singkat kata benda dasar (10 menit).\n2. Pengenalan Mufrodat: Drill pelafalan kosakata baru diikuti makna gambar (15 menit).\n3. Praktik Percakapan: Membaca teks hiwar berpasangan, bergantian peran (25 menit).\n4. Role Play: Santri membuat skenario percakapan mandiri berdasarkan tema (30 menit).\n5. Penutup: Kuis kosakata, koreksi intonasi vokal arab (10/5 menit).",
    assessment: "Keberanian berbicara (Kalam), ketepatan struktur kalimat, hafalan mufrodat.",
    notes: "Wajib menggunakan bahasa pengantar arab penuh (bilingual jika sangat terpaksa)."
  }
];

export default function MyRPPs({ 
  rpps, 
  schedules, 
  onRefresh, 
  initialCreateSchedule,
  clearInitialCreateSchedule 
}: MyRPPsProps) {
  const [activeTab, setActiveTab] = React.useState<'history' | 'create'>('history');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const mySchedules = schedules.filter(s => s.teacherId === myUser.teacherId);
  const myRpps = rpps.filter(r => r.teacherId === myUser.teacherId);

  // Form State
  const [editingRppId, setEditingRppId] = React.useState<string | null>(null);
  const [scheduleId, setScheduleId] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [meetingNo, setMeetingNo] = React.useState('1');
  const [learningObjectives, setLearningObjectives] = React.useState('');
  const [materials, setMaterials] = React.useState('');
  const [method, setMethod] = React.useState('');
  const [media, setMedia] = React.useState('');
  const [learningSteps, setLearningSteps] = React.useState('');
  const [assessment, setAssessment] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [attachmentUrl, setAttachmentUrl] = React.useState('');
  const [attachmentName, setAttachmentName] = React.useState('');

  // UI Utilities
  const [uploading, setUploading] = React.useState(false);
  const [isAutosaving, setIsAutosaving] = React.useState(false);
  const [lastAutosave, setLastAutosave] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Handle outside dashboard triggers to create RPP
  React.useEffect(() => {
    if (initialCreateSchedule) {
      handlePrepareCreateFromSchedule(initialCreateSchedule);
      if (clearInitialCreateSchedule) clearInitialCreateSchedule();
    }
  }, [initialCreateSchedule]);

  // Debounced Autosave for Drafts
  React.useEffect(() => {
    // Only autosave if we are in "create" tab, have selected a schedule, and are not currently saving or sending
    if (activeTab !== 'create' || !scheduleId) return;

    const delayDebounceFn = setTimeout(async () => {
      // Trigger silent draft autosave
      setIsAutosaving(true);
      try {
        const payload = {
          scheduleId,
          date,
          meetingNo,
          learningObjectives,
          materials,
          method,
          media,
          learningSteps,
          assessment,
          notes,
          attachmentUrl,
          attachmentName,
          status: 'Draft' as const
        };

        if (editingRppId) {
          await api.updateRPP(editingRppId, payload);
        } else {
          const res = await api.createRPP(payload);
          setEditingRppId(res.id); // Secure the ID so future keystrokes update the same record
        }
        setLastAutosave(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn("Autosave draft failed quietly:", err);
      } finally {
        setIsAutosaving(false);
      }
    }, 4000); // Trigger autosave 4 seconds after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [
    scheduleId, date, meetingNo, learningObjectives, materials, method, media,
    learningSteps, assessment, notes, attachmentUrl, attachmentName, activeTab
  ]);

  const handlePrepareCreateFromSchedule = (sch: TeachingSchedule) => {
    setEditingRppId(null);
    setScheduleId(sch.id);
    setDate(new Date().toISOString().split('T')[0]);
    setMeetingNo('1');
    setLearningObjectives('');
    setMaterials('');
    setMethod('');
    setMedia('');
    setLearningSteps('');
    setAssessment('');
    setNotes('');
    setAttachmentUrl('');
    setAttachmentName('');
    setErrorMessage('');
    setSuccessMessage('');
    setLastAutosave(null);
    setActiveTab('create');
  };

  const handleEditClick = (rpp: RPP) => {
    setEditingRppId(rpp.id);
    setScheduleId(rpp.scheduleId);
    setDate(rpp.date);
    setMeetingNo(rpp.meetingNo);
    setLearningObjectives(rpp.learningObjectives);
    setMaterials(rpp.materials);
    setMethod(rpp.method);
    setMedia(rpp.media);
    setLearningSteps(rpp.learningSteps);
    setAssessment(rpp.assessment);
    setNotes(rpp.notes);
    setAttachmentUrl(rpp.attachmentUrl || '');
    setAttachmentName(rpp.attachmentName || '');
    setErrorMessage('');
    setSuccessMessage('');
    setLastAutosave(null);
    setActiveTab('create');
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tIndex = parseInt(e.target.value);
    if (isNaN(tIndex)) return;

    const template = RPP_TEMPLATES[tIndex];
    if (window.confirm("Menggunakan template ini? Seluruh kolom teks RPP saat ini akan diganti.")) {
      setLearningObjectives(template.objectives);
      setMaterials(template.materials);
      setMethod(template.method);
      setMedia(template.media);
      setLearningSteps(template.steps);
      setAssessment(template.assessment);
      setNotes(template.notes);
      e.target.value = ""; // reset dropdown selection
    }
  };

  const handleCopyFromPrevious = (prevRppId: string) => {
    if (!prevRppId) return;
    const prev = myRpps.find(r => r.id === prevRppId);
    if (prev && window.confirm(`Salin teks RPP sebelumnya (${prev.subject?.name} - Pertemuan ${prev.meetingNo})?`)) {
      setLearningObjectives(prev.learningObjectives);
      setMaterials(prev.materials);
      setMethod(prev.method);
      setMedia(prev.media);
      setLearningSteps(prev.learningSteps);
      setAssessment(prev.assessment);
      setNotes(prev.notes);
    }
  };

  // Upload attachment file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Maksimal ukuran berkas lampiran adalah 5MB");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadAttachment(file);
      setAttachmentUrl(res.url);
      setAttachmentName(res.name);
    } catch (err: any) {
      alert("Gagal mengunggah lampiran: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Drag-and-drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Maksimal ukuran berkas lampiran adalah 5MB");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadAttachment(file);
      setAttachmentUrl(res.url);
      setAttachmentName(res.name);
    } catch (err: any) {
      alert("Gagal mengunggah lampiran: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Submit Form: Save Draft or Send for Approval
  const handleSaveRPP = async (targetStatus: 'Draft' | 'Menunggu Persetujuan') => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!scheduleId) {
      setErrorMessage("Silakan pilih jadwal mengajar terlebih dahulu.");
      return;
    }
    if (!date || !meetingNo) {
      setErrorMessage("Tanggal pelaksanaan dan Pertemuan ke- wajib diisi.");
      return;
    }

    // If sending for review, perform light validation of academic inputs
    if (targetStatus === 'Menunggu Persetujuan') {
      if (!learningObjectives.trim() || !materials.trim() || !learningSteps.trim()) {
        setErrorMessage("Harap lengkapi Tujuan Pembelajaran, Materi, dan Langkah Pembelajaran sebelum mengirim untuk persetujuan.");
        return;
      }
    }

    try {
      const payload = {
        scheduleId,
        date,
        meetingNo,
        learningObjectives,
        materials,
        method,
        media,
        learningSteps,
        assessment,
        notes,
        attachmentUrl,
        attachmentName,
        status: targetStatus
      };

      if (editingRppId) {
        await api.updateRPP(editingRppId, payload);
      } else {
        await api.createRPP(payload);
      }

      setSuccessMessage(
        targetStatus === 'Draft' 
          ? 'RPP berhasil disimpan sebagai draft.' 
          : 'RPP berhasil dikirim ke Kurikulum untuk ditinjau.'
      );

      setTimeout(() => {
        setEditingRppId(null);
        onRefresh();
        setActiveTab('history');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan rencana pembelajaran.");
    }
  };

  const handleDelete = async (rpp: RPP) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus RPP ini?")) {
      try {
        await api.deleteRPP(rpp.id);
        alert('RPP berhasil dihapus.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || "Gagal menghapus RPP.");
      }
    }
  };

  const selectedScheduleObj = mySchedules.find(s => s.id === scheduleId);

  // Filters for History list
  const filteredMyRpps = myRpps.filter(r => {
    const matchesSearch = 
      (r.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Selectors Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Penyusunan Rencana Pembelajaran (RPP)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tulis RPP harian sesuai jadwal mengajar Anda secara terpadu.
          </p>
        </div>

        <div className="flex items-center space-x-1 border border-slate-100 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition
              ${activeTab === 'history' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }
            `}
          >
            Riwayat RPP Saya
          </button>
          <button
            onClick={() => {
              setEditingRppId(null);
              setScheduleId(mySchedules.length > 0 ? mySchedules[0].id : '');
              setDate(new Date().toISOString().split('T')[0]);
              setMeetingNo('1');
              setLearningObjectives('');
              setMaterials('');
              setMethod('');
              setMedia('');
              setLearningSteps('');
              setAssessment('');
              setNotes('');
              setAttachmentUrl('');
              setAttachmentName('');
              setErrorMessage('');
              setSuccessMessage('');
              setLastAutosave(null);
              setActiveTab('create');
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition
              ${activeTab === 'create' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }
            `}
          >
            Buat RPP Baru
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        // RPP LIST TAB
        <div className="space-y-5">
          {/* Search bar and Status filter */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari RPP berdasarkan mata pelajaran atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full md:w-auto">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer w-full md:w-auto"
              >
                <option value="Semua">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Revisi">Revisi</option>
              </select>
            </div>
          </div>

          {/* RPP History Feed */}
          {filteredMyRpps.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 text-slate-400">
              <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
              <p className="text-sm font-medium">Belum ada dokumen RPP terdaftar.</p>
              <p className="text-xs">Klik tab "Buat RPP Baru" di atas untuk mulai mendokumentasikan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyRpps.map((rpp) => (
                <div 
                  key={rpp.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition hover:shadow-md
                    ${rpp.status === 'Revisi' ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10' : 'border-slate-100 dark:border-slate-800'}
                  `}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border
                        ${rpp.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20' : ''}
                        ${rpp.status === 'Menunggu Persetujuan' ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20' : ''}
                        ${rpp.status === 'Revisi' ? 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20' : ''}
                        ${rpp.status === 'Draft' ? 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
                      `}>
                        {rpp.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(rpp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{rpp.subject?.name}</h3>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Kelas {rpp.class?.name} • Pertemuan ke-{rpp.meetingNo}
                      </p>
                    </div>

                    {/* Show Admin review feedback if any */}
                    {rpp.status === 'Revisi' && rpp.revisionNotes && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 font-medium">
                        Catatan Revisi: <em className="italic font-normal">"{rpp.revisionNotes}"</em>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Diperbarui: {new Date(rpp.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center space-x-1">
                      {/* Guru can only edit Drafts, Pending (before approval), and Revisions */}
                      {rpp.status !== 'Disetujui' ? (
                        <>
                          <button
                            onClick={() => handleEditClick(rpp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                            title="Edit RPP"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {rpp.status === 'Draft' && (
                            <button
                              onClick={() => handleDelete(rpp)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Hapus Draft"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sudah Disetujui</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // RPP FORM CREATOR/EDITOR TAB
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
            {/* Header / Autosave Notification bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {editingRppId ? 'Edit Rencana Pelaksanaan Pembelajaran' : 'Form Penyusunan RPP'}
              </h3>
              
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                {isAutosaving ? (
                  <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                    <CloudLightning className="w-3.5 h-3.5 animate-bounce" />
                    <span>Auto-saving draft...</span>
                  </div>
                ) : lastAutosave ? (
                  <span className="italic text-emerald-500">Draft tersimpan otomatis ({lastAutosave})</span>
                ) : (
                  <span>Auto-save aktif</span>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Sesi Jadwal</label>
                <select
                  required
                  value={scheduleId}
                  onChange={(e) => setScheduleId(e.target.value)}
                  disabled={!!editingRppId} // Locked in edit mode
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-850"
                >
                  <option value="" disabled>Pilih jadwal KBM...</option>
                  {mySchedules.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      [{sch.day} - {sch.time}] {sch.subject?.name} (Kelas {sch.class?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pertemuan Ke- (Sesi)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={meetingNo}
                  onChange={(e) => setMeetingNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Auto-filled details from schedule selection */}
            {selectedScheduleObj && (
              <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Mata Pelajaran</span>
                  <span className="font-extrabold text-emerald-800">{selectedScheduleObj.subject?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Kelas</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">Kelas {selectedScheduleObj.class?.name} ({selectedScheduleObj.class?.level})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tahun Ajaran</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">{selectedScheduleObj.academicYear?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Semester</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedScheduleObj.semester?.name}</span>
                </div>
              </div>
            )}

            {/* Core RPP Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">I. Tujuan Pembelajaran</label>
                <textarea
                  placeholder="Deskripsikan kompetensi atau hasil yang ingin dicapai santri..."
                  rows={3}
                  value={learningObjectives}
                  onChange={(e) => setLearningObjectives(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">II. Materi Pembelajaran</label>
                <textarea
                  placeholder="Sebutkan kitab, surat, bab, atau topik bahasan pertemuan ini..."
                  rows={2}
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">III. Metode Pembelajaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Talaqqi dan Tikrar / Ceramah Interaktif"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">IV. Media Pembelajaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Mushaf, Slide, Papan Tulis, Speaker"
                    value={media}
                    onChange={(e) => setMedia(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">V. Langkah-Langkah Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)</label>
                <textarea
                  placeholder="Jabarkan rincian durasi atau langkah pengajaran (Mukaddimah, Penyampaian, Evaluasi)..."
                  rows={6}
                  value={learningSteps}
                  onChange={(e) => setLearningSteps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">VI. Penilaian (Asesmen)</label>
                <textarea
                  placeholder="Contoh: Kelancaran hafalan makhraj, keaktifan kalam Arab, kuis lisan..."
                  rows={2}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Catatan Tambahan (Khusus Kelas ini)</label>
                <textarea
                  placeholder="Masukan opsional jika ada santri lamban, kelas gaduh, atau saran tindak lanjut..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Upload Drag-and-drop Attachment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Upload Lampiran Pendukung (PDF/Gambar/Dokumen)</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center bg-slate-50/25 dark:bg-slate-950/10 hover:border-emerald-400 transition cursor-pointer relative"
                >
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={uploading}
                  />
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Drag & drop file di sini, atau klik untuk memilih</p>
                    <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DOCX (Maks. 5MB)</p>
                  </div>
                </div>

                {uploading && (
                  <div className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-pulse">
                    <CloudLightning className="w-4 h-4" />
                    <span>Sedang mengunggah lampiran...</span>
                  </div>
                )}

                {attachmentUrl && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{attachmentName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl('');
                        setAttachmentName('');
                      }}
                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="Hapus berkas"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action submit buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingRppId(null);
                  setActiveTab('history');
                }}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveRPP('Draft')}
                disabled={isAutosaving}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveRPP('Menunggu Persetujuan')}
                disabled={isAutosaving}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Kirim RPP</span>
              </button>
            </div>
          </div>

          {/* RPP Tools Side Panel */}
          <div className="space-y-6">
            {/* 1. Template RPP Selector */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3.5">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                <Layout className="w-4.5 h-4.5 text-emerald-600" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Gunakan Template RPP</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Muat draf cepat RPP menggunakan format akademik terstandarisasi untuk Halaqah, Diniyah, atau Bahasa.
              </p>
              <select
                onChange={handleTemplateSelect}
                defaultValue=""
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Pilih template pengajaran...</option>
                {RPP_TEMPLATES.map((t, idx) => (
                  <option key={idx} value={idx}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Copy Previous RPP Selector */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3.5">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                <Copy className="w-4.5 h-4.5 text-emerald-600" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Copy RPP Sebelumnya</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Salin seluruh isian teks dari dokumen RPP yang pernah Anda buat sebelumnya untuk mempercepat penginputan.
              </p>
              
              {myRpps.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic block">Anda belum memiliki riwayat RPP untuk disalin.</span>
              ) : (
                <select
                  onChange={(e) => {
                    handleCopyFromPrevious(e.target.value);
                    e.target.value = "";
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>Pilih dokumen RPP lalu...</option>
                  {myRpps.slice(0, 10).map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      [{r.subject?.name}] Sesi {r.meetingNo} - Kelas {r.class?.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
