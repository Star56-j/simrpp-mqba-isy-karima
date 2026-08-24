import React from 'react';
import {
  FileText, Search, X, AlertCircle, Check, CheckCircle2, Eye,
  Filter, Trash2, Printer, Download, BookOpen,
  ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import { RPP } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { printRPP } from '../utils/printRPP';
import { downloadRPPPdf, downloadRekapSantriPdf } from '../utils/pdfDownloader';
import { printGenericTable } from '../utils/printUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';

interface ManageRPPsProps {
  rpps: RPP[];
  onRefresh: () => void;
}

export default function ManageRPPs({ rpps, onRefresh }: ManageRPPsProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');
  const [selectedRpp, setSelectedRpp] = React.useState<RPP | null>(null);
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [reviewStatus, setReviewStatus] = React.useState<'Disetujui' | 'Revisi'>('Disetujui');
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  
  // Quick Actions Modals State
  const [approveConfirmRpp, setApproveConfirmRpp] = React.useState<RPP | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);
  const [revisionModalRpp, setRevisionModalRpp] = React.useState<RPP | null>(null);
  const [quickRevisionNotes, setQuickRevisionNotes] = React.useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = React.useState(false);
  
  const [deleteConfirmRpp, setDeleteConfirmRpp] = React.useState<RPP | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [expandedRppId, setExpandedRppId] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredRpps = rpps.filter(r => {
    const matchSearch =
      (r.teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.class?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.academicYear?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetailModal = (rpp: RPP) => {
    setSelectedRpp(rpp);
    setIsReviewMode(false);
    setRevisionNotes(rpp.revisionNotes || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRpp) return;
    setErrorMessage(''); setSuccessMessage('');
    if (reviewStatus === 'Revisi' && !revisionNotes.trim()) {
      setErrorMessage('Harap isi catatan revisi untuk guru.');
      return;
    }
    try {
      await api.reviewRPP(selectedRpp.id, reviewStatus, revisionNotes);
      setSuccessMessage(`RPP berhasil diberi status: ${reviewStatus}`);
      showToast(`Status RPP ${selectedRpp.subject?.name} berhasil diubah menjadi "${reviewStatus}"`);
      setTimeout(() => { setSelectedRpp(null); onRefresh(); }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan hasil review.');
    }
  };

  // Quick direct approve action
  const handleDirectApprove = async () => {
    if (!approveConfirmRpp) return;
    setIsApproving(true);
    try {
      await api.reviewRPP(approveConfirmRpp.id, 'Disetujui', '');
      showToast(`RPP ${approveConfirmRpp.subject?.name} (${approveConfirmRpp.teacher?.name || 'Guru'}) berhasil disetujui!`);
      setApproveConfirmRpp(null);
      if (selectedRpp?.id === approveConfirmRpp.id) setSelectedRpp(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyetujui RPP.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Quick direct revision action
  const handleDirectRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalRpp) return;
    if (!quickRevisionNotes.trim()) {
      alert('Harap tuliskan catatan revisi agar guru mengetahui bagian mana yang perlu diperbaiki.');
      return;
    }
    setIsSubmittingRevision(true);
    try {
      await api.reviewRPP(revisionModalRpp.id, 'Revisi', quickRevisionNotes);
      showToast(`Catatan revisi berhasil dikirim ke guru (${revisionModalRpp.teacher?.name || 'Guru'})!`);
      setRevisionModalRpp(null);
      setQuickRevisionNotes('');
      if (selectedRpp?.id === revisionModalRpp.id) setSelectedRpp(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim catatan revisi.', 'error');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRpp) return;
    setIsDeleting(true);
    try {
      await api.deleteRPP(deleteConfirmRpp.id);
      showToast('RPP berhasil dihapus.');
      setDeleteConfirmRpp(null);
      setSelectedRpp(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus RPP.', 'error');
    } finally { setIsDeleting(false); }
  };

  const handleExport = () => {
    const dataToExport = filteredRpps.map((r, idx) => ({
      'No': idx + 1,
      'Guru Pengajar': r.teacher?.name || r.teacherId,
      'Mata Pelajaran': r.subject?.name || r.subjectId,
      'Kelas': r.class?.name || r.classId,
      'Tahun Ajaran': r.academicYear?.name || r.academicYearId,
      'Pertemuan Ganjil': r.totalMeetingsGanjil || 16,
      'Pertemuan Genap': r.totalMeetingsGenap || 16,
      'Status': r.status,
      'Tgl Dibuat': new Date(r.createdAt).toLocaleDateString('id-ID'),
      'Catatan Revisi': r.revisionNotes || '-'
    }));
    exportToExcel(dataToExport, `Data_Persetujuan_RPP`);
  };

  const handlePrint = () => {
    const title = 'Data Persetujuan RPP Tahunan';
    const subtitle = 'Semua Status';
    const headers = ['No', 'Guru Pengajar', 'Mata Pelajaran', 'Kelas', 'Tahun Ajaran', 'Status'];
    const dataRows = filteredRpps.map((r, idx) => [
      idx + 1, r.teacher?.name || r.teacherId, r.subject?.name || r.subjectId, r.class?.name || r.classId, r.academicYear?.name || r.academicYearId, r.status
    ]);
    printGenericTable(title, subtitle, headers, dataRows);
  };

  const handleDownloadPDFTable = () => {
    const title = 'Data Persetujuan RPP Tahunan';
    const subtitle = `Total: ${filteredRpps.length} Dokumen RPP Kurikulum Merdeka`;
    const headers = ['No', 'Guru Pengajar', 'Mata Pelajaran', 'Kelas', 'Tahun Ajaran', 'Pertemuan', 'Status'];
    const dataRows = filteredRpps.map((r, idx) => [
      idx + 1,
      r.teacher?.name || r.teacherId,
      r.subject?.name || r.subjectId,
      `Kelas ${r.class?.name || r.classId}`,
      `TA ${r.academicYear?.name || r.academicYearId}`,
      `G: ${r.totalMeetingsGanjil || 16} | Gn: ${r.totalMeetingsGenap || 16}`,
      r.status
    ]);
    downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Rekap_Persetujuan_RPP_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleWhatsApp = () => {
    const title = 'Laporan Status Persetujuan RPP';
    let text = ``;
    text += filteredRpps.slice(0, 50).map(r => `- ${r.teacher?.name || r.teacherId} (${r.subject?.name || r.subjectId}, Kelas ${r.class?.name || r.classId}): *${r.status}*`).join('\n');
    if (filteredRpps.length > 50) text += `\n...dan ${filteredRpps.length - 50} data lainnya.`;
    shareToWhatsApp(title, text);
  };

  const statusBadge = (status: string) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border';
    if (status === 'Disetujui') return `${base} bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40`;
    if (status === 'Menunggu Persetujuan') return `${base} bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40`;
    if (status === 'Revisi') return `${base} bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40`;
    return `${base} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-[90] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all transform animate-bounce-short ${toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Persetujuan RPP Tahunan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, setujui, beri catatan revisi, dan unduh dokumen RPP Kurikulum Merdeka para guru.</p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari berdasarkan guru, mata pelajaran, kelas, atau tahun ajaran..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full md:w-auto gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none">
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Revisi">Perlu Revisi</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      <ExportBar 
        onExportExcel={handleExport}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDFTable}
        onWhatsApp={handleWhatsApp}
        itemName="Persetujuan RPP"
      />

      {/* RPP list */}
      <div className="space-y-3">
        {filteredRpps.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
            <p className="text-sm font-medium">Tidak ada RPP yang sesuai filter.</p>
          </div>
        ) : filteredRpps.map((rpp, index) => (
          <div key={rpp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs overflow-hidden transition hover:shadow-md ${rpp.status === 'Revisi' ? 'border-rose-200 dark:border-rose-900/40' : rpp.status === 'Disetujui' ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-slate-100 dark:border-slate-800/80'}`}>
            {/* Row */}
            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-500 flex-shrink-0 mt-0.5 sm:mt-0">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{rpp.teacher?.name || rpp.teacherId}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">{rpp.subject?.name || rpp.subjectId}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Kelas {rpp.class?.name || rpp.classId}</span>
                    <span className="text-xs text-slate-400 font-mono">TA {rpp.academicYear?.name || rpp.academicYearId}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                    <span>Ganjil: <strong>{rpp.totalMeetingsGanjil || 16}</strong> ptm</span>
                    <span>Genap: <strong>{rpp.totalMeetingsGenap || 16}</strong> ptm</span>
                    <span>Silabus: <strong>{(rpp.syllabusItems || []).length}</strong> entri</span>
                    {rpp.updatedAt && <span className="text-slate-400">&bull; Update: {new Date(rpp.updatedAt).toLocaleDateString('id-ID')}</span>}
                  </div>
                  {rpp.status === 'Revisi' && rpp.revisionNotes && (
                    <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 inline-flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Catatan: <em>"{rpp.revisionNotes}"</em></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0 self-end lg:self-center">
                <span className={statusBadge(rpp.status)}>
                  {rpp.status === 'Menunggu Persetujuan' ? 'Antrean' : rpp.status}
                </span>

                {/* Tombol Download PDF Langsung */}
                <button
                  onClick={() => downloadRPPPdf(rpp)}
                  title="Download File RPP PDF"
                  className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* Tombol Terima RPP */}
                {rpp.status !== 'Disetujui' && (
                  <button
                    onClick={() => setApproveConfirmRpp(rpp)}
                    title="Terima & Setujui RPP ini"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Terima RPP</span>
                  </button>
                )}

                {/* Tombol Minta Revisi */}
                <button
                  onClick={() => {
                    setRevisionModalRpp(rpp);
                    setQuickRevisionNotes(rpp.revisionNotes || '');
                  }}
                  title="Kirim Catatan Revisi ke Guru"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Perlu Revisi</span>
                </button>

                {/* Tombol Review Detail */}
                <button
                  onClick={() => openDetailModal(rpp)}
                  title="Lihat Rincian RPP Lengkap"
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Review</span>
                </button>

                {/* Tombol Hapus */}
                <button
                  onClick={() => setDeleteConfirmRpp(rpp)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                  title="Hapus RPP"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Tombol Accordion */}
                <button
                  onClick={() => setExpandedRppId(expandedRppId === rpp.id ? null : rpp.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Tampilkan ringkasan isi"
                >
                  {expandedRppId === rpp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick expand preview — format Kurikulum Merdeka */}
            {expandedRppId === rpp.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50/40 dark:bg-slate-950/20">
                {rpp.capaiPembelajaran && (
                  <div>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Capaian Pembelajaran (CP)</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{rpp.capaiPembelajaran}</p>
                  </div>
                )}
                {rpp.tujuanPembelajaran && (
                  <div>
                    <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">Tujuan Pembelajaran (TP)</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{rpp.tujuanPembelajaran}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Materi Ganjil ({rpp.totalMeetingsGanjil || 16} pertemuan)</p>
                    <p className="whitespace-pre-wrap">{rpp.materiGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Materi Genap ({rpp.totalMeetingsGenap || 16} pertemuan)</p>
                    <p className="whitespace-pre-wrap">{rpp.materiGenap || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== MODAL DETAIL & REVIEW ===== */}
      {selectedRpp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="bg-indigo-800 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{selectedRpp.subject?.name}</h3>
                  <p className="text-indigo-300 text-xs">{selectedRpp.teacher?.name} &bull; Kelas {selectedRpp.class?.name} &bull; TA {selectedRpp.academicYear?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => printRPP(selectedRpp)}
                  className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Print Cetak Fisik"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => downloadRPPPdf(selectedRpp)}
                  className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                  title="Download File PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedRpp(null)}
                  className="p-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">

              {/* A. Identitas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedRpp.subject?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Kelas {selectedRpp.class?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">TA {selectedRpp.academicYear?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pertemuan</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Ganjil: {selectedRpp.totalMeetingsGanjil || 16} &bull; Genap: {selectedRpp.totalMeetingsGenap || 16}</p></div>
                <div className="md:col-span-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profil Pelajar Pancasila</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedRpp.profilPelajar || '-'}</p></div>
                <div className="col-span-2 md:col-span-3"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sarana & Prasarana</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedRpp.sarana || '-'}</p></div>
              </div>

              {/* B. CP & TP */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">I. Capaian & Tujuan Pembelajaran</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10">
                    <p className="font-extrabold text-indigo-700 dark:text-indigo-400 mb-1">Capaian Pembelajaran (CP)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.capaiPembelajaran || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/10">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Tujuan Pembelajaran (TP)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.tujuanPembelajaran || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/10">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Alur Tujuan Pembelajaran (ATP)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.alurTP || '-'}</p>
                  </div>
                </div>
              </div>

              {/* C. Materi per Semester */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">II. Materi Pembelajaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Semester Ganjil ({selectedRpp.totalMeetingsGanjil || 16} pertemuan)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.materiGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Semester Genap ({selectedRpp.totalMeetingsGenap || 16} pertemuan)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.materiGenap || '-'}</p>
                  </div>
                </div>
              </div>

              {/* D. Kegiatan Pembelajaran */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">III. Kegiatan Pembelajaran</h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/10">
                    <p className="font-extrabold text-amber-700 dark:text-amber-400 mb-1">Pendahuluan</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.pendahuluan || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10">
                    <p className="font-extrabold text-indigo-700 dark:text-indigo-400 mb-1">Kegiatan Inti</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.kegiatanInti || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/10">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Penutup</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.penutup || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Metode / Model</p><p className="text-slate-600 dark:text-slate-400">{selectedRpp.metode || '-'}</p></div>
                  <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Media & Alat</p><p className="text-slate-600 dark:text-slate-400">{selectedRpp.media || '-'}</p></div>
                </div>
              </div>

              {/* E. Asesmen */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">IV. Asesmen</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20">
                    <p className="font-extrabold text-slate-600 dark:text-slate-300 mb-1">Diagnostik</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.asesmenDiagnostik || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/10">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Formatif</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.asesmenFormatif || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10">
                    <p className="font-extrabold text-indigo-700 dark:text-indigo-400 mb-1">Sumatif</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.asesmenSumatif || '-'}</p>
                  </div>
                </div>
              </div>

              {/* F. Diferensiasi & Pengayaan */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">V. Diferensiasi & Pengayaan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20">
                    <p className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">Pembelajaran Berdiferensiasi</p>
                    <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRpp.diferensiasi || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20">
                    <p className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">Pengayaan & Remedial</p>
                    <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRpp.pengayaan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* G. Catatan */}
              {selectedRpp.catatan && (
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">Catatan Guru</h4>
                  <p className="pl-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedRpp.catatan}</p>
                </div>
              )}

              {/* H. Silabus */}
              {selectedRpp.syllabusItems && selectedRpp.syllabusItems.length > 0 && (
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">VI. Silabus Rincian Per Pertemuan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['Ganjil','Genap'] as const).map(sem => {
                      const items = selectedRpp.syllabusItems!.filter(s => s.semester === sem);
                      if (!items.length) return null;
                      return (
                        <div key={sem} className={`p-3 rounded-xl border ${sem==='Ganjil'?'border-blue-100 dark:border-blue-900/30 bg-blue-50/20':'border-violet-100 dark:border-violet-900/30 bg-violet-50/20'}`}>
                          <p className={`font-extrabold mb-2 ${sem==='Ganjil'?'text-blue-700 dark:text-blue-400':'text-violet-700 dark:text-violet-400'}`}>Semester {sem}</p>
                          {items.map(s => (
                            <div key={s.meetingNo} className="flex space-x-2 py-1 border-b border-white/50 dark:border-slate-700/50 last:border-0">
                              <span className="w-5 text-center font-mono font-bold text-slate-500">{s.meetingNo}</span>
                              <span className="flex-1 text-slate-700 dark:text-slate-300">{s.topic || '-'}</span>
                              {s.date && <span className="font-mono text-slate-400">{s.date}</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lampiran */}
              {selectedRpp.attachmentUrl && (
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2"><FileText className="w-5 h-5 text-indigo-600"/><span className="font-bold text-slate-800 dark:text-slate-200">{selectedRpp.attachmentName}</span></div>
                  <a href={selectedRpp.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100 text-xs font-bold uppercase">
                    <Download className="w-3.5 h-3.5"/><span>Unduh</span>
                  </a>
                </div>
              )}

              {/* Revisi info */}
              {selectedRpp.status === 'Revisi' && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                  <span className="font-extrabold uppercase tracking-wide block mb-1">Catatan Revisi Saat Ini</span>
                  <p className="italic font-medium">"{selectedRpp.revisionNotes}"</p>
                </div>
              )}
            </div>

            {/* Modal footer — review form */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-950/15 flex-shrink-0">
              {!isReviewMode ? (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase">Status Saat Ini:</span>
                    <span className={statusBadge(selectedRpp.status)}>{selectedRpp.status}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <button
                      onClick={() => setDeleteConfirmRpp(selectedRpp)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5"/><span>Hapus</span>
                    </button>
                    
                    {/* Tombol Terima RPP langsung */}
                    {selectedRpp.status !== 'Disetujui' && (
                      <button
                        onClick={() => {
                          setApproveConfirmRpp(selectedRpp);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Terima RPP</span>
                      </button>
                    )}

                    {/* Tombol Minta Revisi */}
                    <button
                      onClick={() => {
                        setReviewStatus('Revisi');
                        setIsReviewMode(true);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Minta Revisi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 animate-fade-in">
                  {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs"><AlertCircle className="w-4 h-4"/><span>{errorMessage}</span></div>}
                  {successMessage && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs"><Check className="w-4 h-4"/><span>{successMessage}</span></div>}
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Review:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="rv" checked={reviewStatus === 'Disetujui'} onChange={() => setReviewStatus('Disetujui')} className="text-emerald-600 focus:ring-emerald-500"/>
                      <span className="text-xs font-bold text-emerald-700 uppercase">Setujui RPP</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="rv" checked={reviewStatus === 'Revisi'} onChange={() => setReviewStatus('Revisi')} className="text-rose-600 focus:ring-rose-500"/>
                      <span className="text-xs font-bold text-rose-700 uppercase">Minta Revisi Guru</span>
                    </label>
                  </div>
                  {reviewStatus === 'Revisi' && (
                    <textarea required rows={3} placeholder="Tuliskan catatan detail revisi yang perlu diperbaiki oleh guru..."
                      value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"/>
                  )}
                  <div className="flex justify-end space-x-2 pt-1">
                    <button type="button" onClick={() => setIsReviewMode(false)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer">Batal</button>
                    <button type="submit"
                      className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer ${reviewStatus === 'Disetujui' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                      Kirim Keputusan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL QUICK KONFIRMASI TERIMA RPP ===== */}
      {approveConfirmRpp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Terima & Setujui RPP?</h3>
                <p className="text-xs text-slate-500 mt-0.5">RPP akan resmi disetujui untuk pelaksanaan KBM.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <p className="text-slate-500">Guru: <span className="font-bold text-slate-700 dark:text-slate-200">{approveConfirmRpp.teacher?.name || approveConfirmRpp.teacherId}</span></p>
              <p className="text-slate-500">Mata Pelajaran: <span className="font-bold text-slate-700 dark:text-slate-200">{approveConfirmRpp.subject?.name || approveConfirmRpp.subjectId}</span></p>
              <p className="text-slate-500">Kelas: <span className="font-bold text-slate-700 dark:text-slate-200">Kelas {approveConfirmRpp.class?.name || approveConfirmRpp.classId}</span></p>
              <p className="text-slate-500">Tahun Ajaran: <span className="font-bold text-slate-700 dark:text-slate-200">TA {approveConfirmRpp.academicYear?.name || approveConfirmRpp.academicYearId}</span></p>
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button onClick={() => setApproveConfirmRpp(null)} disabled={isApproving}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer">Batal</button>
              <button onClick={handleDirectApprove} disabled={isApproving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer">
                <Check className="w-3.5 h-3.5"/><span>{isApproving ? 'Menyetujui...' : 'Ya, Terima & Setujui'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL QUICK MINTA REVISI RPP ===== */}
      {revisionModalRpp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400"/>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Instruksi Revisi RPP</h3>
                <p className="text-xs text-slate-500 mt-0.5">Catatan ini akan langsung tampil di akun Guru terkait.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                <strong>{revisionModalRpp.subject?.name}</strong> &bull; Kelas {revisionModalRpp.class?.name} &bull; Guru: <strong>{revisionModalRpp.teacher?.name}</strong>
              </p>
            </div>

            <form onSubmit={handleDirectRevisionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Catatan / Bagian yang Perlu Diperbaiki: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Contoh: Harap lengkapi tujuan pembelajaran pertemuan 3-6, sesuaikan asesmen formatif, dan perjelas silabus semester genap..."
                  value={quickRevisionNotes}
                  onChange={e => setQuickRevisionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setRevisionModalRpp(null); setQuickRevisionNotes(''); }}
                  disabled={isSubmittingRevision}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5"/>
                  <span>{isSubmittingRevision ? 'Mengirim...' : 'Kirim Catatan Revisi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL KONFIRMASI HAPUS ===== */}
      {deleteConfirmRpp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400"/>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus RPP Tahunan?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <p className="text-slate-500">Guru: <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirmRpp.teacher?.name}</span></p>
              <p className="text-slate-500">Mata Pelajaran: <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirmRpp.subject?.name}</span></p>
              <p className="text-slate-500">Kelas: <span className="font-bold text-slate-700 dark:text-slate-200">Kelas {deleteConfirmRpp.class?.name}</span></p>
              <p className="text-slate-500">Tahun Ajaran: <span className="font-bold text-slate-700 dark:text-slate-200">TA {deleteConfirmRpp.academicYear?.name}</span></p>
              <p className="text-slate-500">Status: <span className={`font-bold ${deleteConfirmRpp.status==='Disetujui'?'text-emerald-600':deleteConfirmRpp.status==='Menunggu Persetujuan'?'text-amber-600':deleteConfirmRpp.status==='Revisi'?'text-rose-600':'text-slate-500'}`}>{deleteConfirmRpp.status}</span></p>
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button onClick={() => setDeleteConfirmRpp(null)} disabled={isDeleting}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer">Batal</button>
              <button onClick={handleDeleteConfirm} disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5"/><span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

