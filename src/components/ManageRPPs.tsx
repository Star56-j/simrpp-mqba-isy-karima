import React from 'react';
import { 
  FileText, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileEdit,
  Download,
  Printer,
  ChevronDown,
  ThumbsUp,
  RotateCcw,
  Check,
  Eye,
  Filter,
  Trash2
} from 'lucide-react';
import { RPP } from '../types';
import { api } from '../api';

interface ManageRPPsProps {
  rpps: RPP[];
  onRefresh: () => void;
}

export default function ManageRPPs({ rpps, onRefresh }: ManageRPPsProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Semua');
  const [selectedRpp, setSelectedRpp] = React.useState<RPP | null>(null);
  
  // Review Forms
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [reviewStatus, setReviewStatus] = React.useState<'Disetujui' | 'Revisi'>('Disetujui');
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Delete confirmation
  const [deleteConfirmRpp, setDeleteConfirmRpp] = React.useState<RPP | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredRpps = rpps.filter(r => {
    const teacherName = r.teacher?.name || '';
    const subjectName = r.subject?.name || '';
    const className = r.class?.name || '';
    const matchesSearch = 
      teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Semua' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetailModal = (rpp: RPP) => {
    setSelectedRpp(rpp);
    setIsReviewMode(false);
    setRevisionNotes('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRpp) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (reviewStatus === 'Revisi' && !revisionNotes.trim()) {
      setErrorMessage('Harap isi catatan revisi agar pengajar tahu bagian mana yang harus diperbaiki.');
      return;
    }

    try {
      await api.reviewRPP(selectedRpp.id, reviewStatus, revisionNotes);
      setSuccessMessage(`RPP berhasil diberi status: ${reviewStatus}`);
      setTimeout(() => {
        setSelectedRpp(null);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan hasil review.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRpp) return;
    setIsDeleting(true);
    try {
      await api.deleteRPP(deleteConfirmRpp.id);
      setDeleteConfirmRpp(null);
      setSelectedRpp(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus RPP.');
    } finally {
      setIsDeleting(false);
    }
  };

  const printSingleRPP = (rpp: RPP) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const style = `
      <style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; padding: 40px; color: #111; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 18px; margin: 0; uppercase; font-weight: bold; }
        .header h2 { font-size: 16px; margin: 5px 0 0 0; font-weight: normal; }
        .header p { font-size: 11px; margin: 2px 0 0 0; color: #444; }
        
        .title-rpp { text-align: center; font-weight: bold; font-size: 15px; text-transform: uppercase; margin-bottom: 25px; text-decoration: underline; }
        
        .identity-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .identity-table td { padding: 4px 0; font-size: 13px; vertical-align: top; }
        .identity-table td.label { width: 180px; }
        .identity-table td.colon { width: 20px; text-align: center; }

        .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .section-content { font-size: 13px; margin-left: 15px; text-align: justify; white-space: pre-wrap; margin-bottom: 15px; }
        
        .footer-signatures { width: 100%; margin-top: 50px; border-collapse: collapse; }
        .footer-signatures td { text-align: center; font-size: 13px; width: 50%; }
        .signature-space { height: 75px; }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>RPP - ${rpp.subject?.name} Kelas ${rpp.class?.name}</title>
          ${style}
        </head>
        <body>
          <div class="header">
            <h1>MARKAZ QUR'AN DAN BAHASA ARAB (MQBA) ISY KARIMA</h1>
            <h2>YAYASAN SOSIAL DAN PENDIDIKAN ISY KARIMA</h2>
            <p>Karanganyar, Jawa Tengah, Indonesia | info@isykarima.id</p>
          </div>

          <div class="title-rpp">RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</div>

          <table class="identity-table">
            <tr>
              <td class="label">Mata Pelajaran</td>
              <td class="colon">:</td>
              <td><strong>${rpp.subject?.name} (${rpp.subject?.category})</strong></td>
            </tr>
            <tr>
              <td class="label">Kelas / Jenjang</td>
              <td class="colon">:</td>
              <td>Kelas ${rpp.class?.name} (${rpp.class?.level})</td>
            </tr>
            <tr>
              <td class="label">Nama Pengajar</td>
              <td class="colon">:</td>
              <td>${rpp.teacher?.name}</td>
            </tr>
            <tr>
              <td class="label">Tahun Ajaran / Semester</td>
              <td class="colon">:</td>
              <td>Tahun Pelajaran ${rpp.academicYear?.name} | Semester ${rpp.semester?.name}</td>
            </tr>
            <tr>
              <td class="label">Tanggal Pelaksanaan</td>
              <td class="colon">:</td>
              <td>${new Date(rpp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td class="label">Pertemuan Ke-</td>
              <td class="colon">:</td>
              <td>Sesi ${rpp.meetingNo}</td>
            </tr>
          </table>

          <div class="section-title">I. Tujuan Pembelajaran</div>
          <div class="section-content">${rpp.learningObjectives || '-'}</div>

          <div class="section-title">II. Materi Pembelajaran</div>
          <div class="section-content">${rpp.materials || '-'}</div>

          <div class="section-title">III. Metode Pembelajaran</div>
          <div class="section-content">${rpp.method || '-'}</div>

          <div class="section-title">IV. Media dan Alat Pembelajaran</div>
          <div class="section-content">${rpp.media || '-'}</div>

          <div class="section-title">V. Langkah-Langkah Pembelajaran</div>
          <div class="section-content">${rpp.learningSteps || '-'}</div>

          <div class="section-title">VI. Penilaian (Asesmen)</div>
          <div class="section-content">${rpp.assessment || '-'}</div>

          ${rpp.notes ? `
            <div class="section-title">Catatan Tambahan</div>
            <div class="section-content">${rpp.notes}</div>
          ` : ''}

          <table class="footer-signatures">
            <tr>
              <td>
                Menyetujui,<br/>
                <strong>Kepala Kurikulum MQBA</strong>
                <div class="signature-space"></div>
                ( .................................................. )
              </td>
              <td>
                Karanganyar, ${new Date(rpp.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                <strong>Guru Pengajar</strong>
                <div class="signature-space"></div>
                <strong>( ${rpp.teacher?.name} )</strong>
              </td>
            </tr>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Persetujuan Rencana Pembelajaran (RPP)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Lakukan review, bimbingan, revisi, atau persetujuan instan terhadap rencana pembelajaran guru.
        </p>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari RPP berdasarkan pengajar, kelas, atau mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-2" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer w-full md:w-auto"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Revisi">Revisi</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* RPP Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Tanggal KBM</th>
                <th className="p-4">Guru Pengajar</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4">Kelas</th>
                <th className="p-4 w-16 text-center">Pertemuan</th>
                <th className="p-4 w-36 text-center">Status</th>
                <th className="p-4 w-32 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {filteredRpps.length > 0 ? (
                filteredRpps.map((rpp, index) => (
                  <tr key={rpp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {new Date(rpp.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      {rpp.teacher?.name}
                    </td>
                    <td className="p-4 font-semibold text-emerald-800 dark:text-emerald-400">
                      {rpp.subject?.name}
                    </td>
                    <td className="p-4 font-bold uppercase text-slate-600 dark:text-slate-300">
                      Kelas {rpp.class?.name}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-500">
                      {rpp.meetingNo}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border
                        ${rpp.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' : ''}
                        ${rpp.status === 'Menunggu Persetujuan' ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' : ''}
                        ${rpp.status === 'Revisi' ? 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' : ''}
                        ${rpp.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
                      `}>
                        {rpp.status === 'Menunggu Persetujuan' ? 'Antrean Review' : rpp.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openDetailModal(rpp)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRpp(rpp)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 transition"
                          title="Hapus RPP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ditemukan dokumen RPP yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RPP Detail & Review Modal */}
      {selectedRpp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Review RPP - {selectedRpp.teacher?.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => printSingleRPP(selectedRpp)}
                  className="p-1.5 rounded-lg hover:bg-emerald-700/80 text-emerald-100 hover:text-white transition"
                  title="Cetak RPP Resmi"
                >
                  <Printer className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => setSelectedRpp(null)} className="p-1 rounded-lg hover:bg-emerald-700/85 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Top Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">{selectedRpp.subject?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelas</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">Kelas {selectedRpp.class?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sesi Pertemuan</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">Pertemuan {selectedRpp.meetingNo}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal KBM</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {new Date(selectedRpp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* RPP Contents */}
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">I. Tujuan Pembelajaran</h4>
                  <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.learningObjectives || '-'}</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">II. Materi Pembelajaran</h4>
                  <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.materials || '-'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">III. Metode</h4>
                    <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.method || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">IV. Media & Alat</h4>
                    <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.media || '-'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">V. Langkah-Langkah Pembelajaran</h4>
                  <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.learningSteps || '-'}</p>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">VI. Penilaian (Asesmen)</h4>
                  <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.assessment || '-'}</p>
                </div>

                {selectedRpp.notes && (
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider">Catatan Pengajar</h4>
                    <p className="mt-2 pl-3 whitespace-pre-wrap leading-relaxed">{selectedRpp.notes}</p>
                  </div>
                )}

                {/* Attachment Section */}
                {selectedRpp.attachmentUrl && (
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{selectedRpp.attachmentName}</span>
                        <span className="text-[10px] text-slate-400">Berkas lampiran kurikulum</span>
                      </div>
                    </div>
                    <a 
                      href={selectedRpp.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold uppercase transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Status & Feedback History */}
              {selectedRpp.status === 'Revisi' && (
                <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 text-rose-800 dark:text-rose-400 space-y-1">
                  <span className="font-extrabold uppercase tracking-wide">Status Revisi Aktif</span>
                  <p className="font-medium">Catatan Review Sebelumnya: <em className="italic font-normal">"{selectedRpp.revisionNotes}"</em></p>
                </div>
              )}
            </div>

            {/* Review Action Form (Footer) */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-950/15 flex-shrink-0">
              {!isReviewMode ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase">Status RPP Saat Ini:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-[10px] border
                      ${selectedRpp.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20' : ''}
                      ${selectedRpp.status === 'Menunggu Persetujuan' ? 'bg-amber-50 text-amber-800 border-amber-100' : ''}
                      ${selectedRpp.status === 'Revisi' ? 'bg-rose-50 text-rose-800 border-rose-100' : ''}
                      ${selectedRpp.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                    `}>
                      {selectedRpp.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDeleteConfirmRpp(selectedRpp)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus RPP</span>
                    </button>

                    {selectedRpp.status === 'Menunggu Persetujuan' && (
                      <button
                        onClick={() => setIsReviewMode(true)}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition"
                      >
                        Mulai Penilaian (Review)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs">
                      <Check className="w-4 h-4" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Review:</span>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="reviewStatus"
                          checked={reviewStatus === 'Disetujui'}
                          onChange={() => setReviewStatus('Disetujui')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Setujui RPP</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="reviewStatus"
                          checked={reviewStatus === 'Revisi'}
                          onChange={() => setReviewStatus('Revisi')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Minta Revisi</span>
                      </label>
                    </div>
                  </div>

                  {reviewStatus === 'Revisi' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Catatan Bimbingan / Revisi Kurikulum</label>
                      <textarea
                        required
                        placeholder="Contoh: Harap lengkapi instrumen asesmen dan perbaiki metode pembelajaran agar sesuai dengan kelas wustho."
                        rows={3}
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReviewMode(false)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition
                        ${reviewStatus === 'Disetujui' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-600 hover:bg-rose-700'}
                      `}
                    >
                      Kirim Keputusan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmRpp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl animate-scale-up p-6 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus RPP?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <p className="text-slate-500">Guru: <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirmRpp.teacher?.name}</span></p>
              <p className="text-slate-500">Mata Pelajaran: <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirmRpp.subject?.name}</span></p>
              <p className="text-slate-500">Kelas: <span className="font-bold text-slate-700 dark:text-slate-200">Kelas {deleteConfirmRpp.class?.name}</span></p>
              <p className="text-slate-500">Pertemuan Ke-: <span className="font-bold text-slate-700 dark:text-slate-200">{deleteConfirmRpp.meetingNo}</span></p>
              <p className="text-slate-500">Status: <span className={`font-bold ${
                deleteConfirmRpp.status === 'Disetujui' ? 'text-emerald-600' :
                deleteConfirmRpp.status === 'Menunggu Persetujuan' ? 'text-amber-600' :
                deleteConfirmRpp.status === 'Revisi' ? 'text-rose-600' : 'text-slate-500'
              }`}>{deleteConfirmRpp.status}</span></p>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setDeleteConfirmRpp(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
