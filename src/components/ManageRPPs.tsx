import React from 'react';
import {
  FileText, Search, X, AlertCircle, Check, Eye,
  Filter, Trash2, Printer, Download, BookOpen,
  ChevronDown, ChevronUp
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
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [reviewStatus, setReviewStatus] = React.useState<'Disetujui' | 'Revisi'>('Disetujui');
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [deleteConfirmRpp, setDeleteConfirmRpp] = React.useState<RPP | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [expandedRppId, setExpandedRppId] = React.useState<string | null>(null);

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
    setRevisionNotes('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRpp) return;
    setErrorMessage(''); setSuccessMessage('');
    if (reviewStatus === 'Revisi' && !revisionNotes.trim()) {
      setErrorMessage('Harap isi catatan revisi.');
      return;
    }
    try {
      await api.reviewRPP(selectedRpp.id, reviewStatus, revisionNotes);
      setSuccessMessage(`RPP berhasil diberi status: ${reviewStatus}`);
      setTimeout(() => { setSelectedRpp(null); onRefresh(); }, 1200);
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
    } finally { setIsDeleting(false); }
  };

  const printRPP = (rpp: RPP) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const ganjilRows = (rpp.syllabusItems || []).filter(s => s.semester === 'Ganjil')
      .map(s => `<tr><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.meetingNo}</td><td style="padding:4px 8px;border:1px solid #ccc;">${s.topic}</td><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.date || '-'}</td></tr>`).join('');
    const genapRows = (rpp.syllabusItems || []).filter(s => s.semester === 'Genap')
      .map(s => `<tr><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.meetingNo}</td><td style="padding:4px 8px;border:1px solid #ccc;">${s.topic}</td><td style="text-align:center;padding:4px 8px;border:1px solid #ccc;">${s.date || '-'}</td></tr>`).join('');

    w.document.write(`<!DOCTYPE html><html><head><title>RPP Tahunan - ${rpp.subject?.name}</title>
    <style>
      body{font-family:'Times New Roman',serif;line-height:1.7;padding:40px;color:#111;font-size:13px;}
      .header{text-align:center;border-bottom:3px double #000;padding-bottom:14px;margin-bottom:22px;}
      .header h1{font-size:17px;margin:0;font-weight:bold;text-transform:uppercase;}
      .header h2{font-size:14px;margin:4px 0 0;font-weight:normal;}
      .header p{font-size:11px;margin:2px 0 0;color:#555;}
      .title{text-align:center;font-weight:bold;font-size:14px;text-transform:uppercase;margin-bottom:20px;text-decoration:underline;letter-spacing:1px;}
      table.id{width:100%;border-collapse:collapse;margin-bottom:18px;}
      table.id td{padding:3px 0;vertical-align:top;}
      table.id td.lbl{width:200px;}
      table.id td.col{width:16px;text-align:center;}
      .sec{font-weight:bold;font-size:12px;text-transform:uppercase;margin-top:16px;margin-bottom:6px;border-bottom:1px solid #000;padding-bottom:2px;letter-spacing:.5px;}
      .cnt{font-size:13px;margin-left:12px;white-space:pre-wrap;text-align:justify;margin-bottom:12px;}
      .sem-box{border:1px solid #bbb;border-radius:4px;padding:12px;margin-bottom:14px;}
      .sem-title{font-weight:bold;font-size:12px;margin-bottom:8px;text-transform:uppercase;}
      table.syl{width:100%;border-collapse:collapse;font-size:12px;}
      table.syl th{background:#f0f0f0;padding:5px 8px;border:1px solid #ccc;text-align:left;}
      .sigs{width:100%;border-collapse:collapse;margin-top:48px;}
      .sigs td{text-align:center;font-size:13px;width:50%;}
      .sig-space{height:70px;}
    </style></head><body>
    <div class="header">
      <h1>Markaz Qur'an dan Bahasa Arab (MQBA) Isy Karima</h1>
      <h2>Yayasan Sosial dan Pendidikan Isy Karima</h2>
      <p>Karanganyar, Jawa Tengah, Indonesia &nbsp;|&nbsp; info@isykarima.id</p>
    </div>
    <div class="title">Rencana Pelaksanaan Pembelajaran (RPP) Tahunan</div>
    <table class="id">
      <tr><td class="lbl">Mata Pelajaran</td><td class="col">:</td><td><strong>${rpp.subject?.name} (${rpp.subject?.category})</strong></td></tr>
      <tr><td class="lbl">Kelas / Jenjang</td><td class="col">:</td><td>Kelas ${rpp.class?.name} (${rpp.class?.level})</td></tr>
      <tr><td class="lbl">Nama Pengajar</td><td class="col">:</td><td>${rpp.teacher?.name}</td></tr>
      <tr><td class="lbl">Tahun Ajaran</td><td class="col">:</td><td>Tahun Pelajaran ${rpp.academicYear?.name}</td></tr>
      <tr><td class="lbl">Jumlah Pertemuan</td><td class="col">:</td><td>Ganjil: ${rpp.totalMeetingsGanjil} pertemuan &nbsp;|&nbsp; Genap: ${rpp.totalMeetingsGenap} pertemuan</td></tr>
    </table>
    <div class="sec">I. Kompetensi Inti (KI)</div><div class="cnt">${rpp.kompetensiInti || '-'}</div>
    <div class="sec">II. Kompetensi Dasar (KD)</div><div class="cnt">${rpp.kompetensiDasar || '-'}</div>
    <div class="sec">III. Tujuan Pembelajaran</div>
    <div class="sem-box"><div class="sem-title">A. Semester Ganjil</div><div class="cnt" style="margin-left:0">${rpp.objectivesGanjil || '-'}</div></div>
    <div class="sem-box"><div class="sem-title">B. Semester Genap</div><div class="cnt" style="margin-left:0">${rpp.objectivesGenap || '-'}</div></div>
    <div class="sec">IV. Materi Pembelajaran</div>
    <div class="sem-box"><div class="sem-title">A. Semester Ganjil</div><div class="cnt" style="margin-left:0">${rpp.materialsGanjil || '-'}</div></div>
    <div class="sem-box"><div class="sem-title">B. Semester Genap</div><div class="cnt" style="margin-left:0">${rpp.materialsGenap || '-'}</div></div>
    <div class="sec">V. Metode Pembelajaran</div><div class="cnt">${rpp.method || '-'}</div>
    <div class="sec">VI. Media dan Alat Pembelajaran</div><div class="cnt">${rpp.media || '-'}</div>
    <div class="sec">VII. Penilaian (Asesmen)</div><div class="cnt">${rpp.assessment || '-'}</div>
    ${rpp.notes ? `<div class="sec">Catatan</div><div class="cnt">${rpp.notes}</div>` : ''}
    ${ganjilRows || genapRows ? `
    <div class="sec">VIII. Silabus Rincian Per Pertemuan</div>
    ${ganjilRows ? `<div class="sem-box"><div class="sem-title">Semester Ganjil</div>
    <table class="syl"><tr><th style="width:40px;">No</th><th>Pokok Bahasan / Materi</th><th style="width:90px;">Tgl Rencana</th></tr>${ganjilRows}</table></div>` : ''}
    ${genapRows ? `<div class="sem-box"><div class="sem-title">Semester Genap</div>
    <table class="syl"><tr><th style="width:40px;">No</th><th>Pokok Bahasan / Materi</th><th style="width:90px;">Tgl Rencana</th></tr>${genapRows}</table></div>` : ''}
    ` : ''}
    <table class="sigs"><tr>
      <td>Menyetujui,<br/><strong>Kepala Kurikulum MQBA</strong><div class="sig-space"></div>( ................................................ )</td>
      <td>Karanganyar, ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}<br/><strong>Guru Pengajar</strong><div class="sig-space"></div><strong>( ${rpp.teacher?.name} )</strong></td>
    </tr></table>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
    </body></html>`);
    w.document.close();
  };

  const statusBadge = (status: string) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border';
    if (status === 'Disetujui') return `${base} bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30`;
    if (status === 'Menunggu Persetujuan') return `${base} bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400`;
    if (status === 'Revisi') return `${base} bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400`;
    return `${base} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Persetujuan RPP Tahunan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review dan setujui RPP per mata pelajaran yang diajukan oleh guru.</p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari berdasarkan guru, mata pelajaran, kelas, atau tahun ajaran..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full md:w-auto gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer w-full md:w-auto">
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Revisi">Revisi</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* RPP list */}
      <div className="space-y-3">
        {filteredRpps.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
            <p className="text-sm font-medium">Tidak ada RPP yang sesuai filter.</p>
          </div>
        ) : filteredRpps.map((rpp, index) => (
          <div key={rpp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
            {/* Row */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-500 flex-shrink-0">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{rpp.teacher?.name}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{rpp.subject?.name}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-500">Kelas {rpp.class?.name}</span>
                    <span className="text-xs text-slate-400 font-mono">TA {rpp.academicYear?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>Ganjil: <strong>{rpp.totalMeetingsGanjil}</strong> pertemuan</span>
                    <span>Genap: <strong>{rpp.totalMeetingsGenap}</strong> pertemuan</span>
                    <span>Silabus: <strong>{(rpp.syllabusItems || []).length}</strong> entri</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={statusBadge(rpp.status)}>{rpp.status === 'Menunggu Persetujuan' ? 'Antrean' : rpp.status}</span>
                <button onClick={() => openDetailModal(rpp)}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition">
                  <Eye className="w-3.5 h-3.5" /><span>Review</span>
                </button>
                <button onClick={() => setDeleteConfirmRpp(rpp)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 transition" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setExpandedRppId(expandedRppId === rpp.id ? null : rpp.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  {expandedRppId === rpp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Quick expand preview */}
            {expandedRppId === rpp.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Kompetensi Inti</p><p className="whitespace-pre-wrap">{rpp.kompetensiInti || '-'}</p></div>
                  <div><p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Kompetensi Dasar</p><p className="whitespace-pre-wrap">{rpp.kompetensiDasar || '-'}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Semester Ganjil ({rpp.totalMeetingsGanjil} pertemuan)</p>
                    <p className="font-semibold mb-0.5">Tujuan:</p><p className="whitespace-pre-wrap mb-1">{rpp.objectivesGanjil || '-'}</p>
                    <p className="font-semibold mb-0.5">Materi:</p><p className="whitespace-pre-wrap">{rpp.materialsGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Semester Genap ({rpp.totalMeetingsGenap} pertemuan)</p>
                    <p className="font-semibold mb-0.5">Tujuan:</p><p className="whitespace-pre-wrap mb-1">{rpp.objectivesGenap || '-'}</p>
                    <p className="font-semibold mb-0.5">Materi:</p><p className="whitespace-pre-wrap">{rpp.materialsGenap || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== MODAL DETAIL & REVIEW ===== */}
      {selectedRpp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{selectedRpp.subject?.name}</h3>
                  <p className="text-emerald-300 text-xs">{selectedRpp.teacher?.name} &bull; Kelas {selectedRpp.class?.name} &bull; TA {selectedRpp.academicYear?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => printRPP(selectedRpp)} className="p-1.5 rounded-lg hover:bg-emerald-700/80 text-emerald-100 transition" title="Cetak RPP">
                  <Printer className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => setSelectedRpp(null)} className="p-1.5 rounded-lg hover:bg-emerald-700/80 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Identitas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedRpp.subject?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Kelas {selectedRpp.class?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">TA {selectedRpp.academicYear?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pertemuan</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">G: {selectedRpp.totalMeetingsGanjil} &bull; G: {selectedRpp.totalMeetingsGenap}</p></div>
              </div>

              {/* KI & KD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">I. Kompetensi Inti</h4><p className="pl-2 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">{selectedRpp.kompetensiInti || '-'}</p></div>
                <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">II. Kompetensi Dasar</h4><p className="pl-2 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">{selectedRpp.kompetensiDasar || '-'}</p></div>
              </div>

              {/* Tujuan per semester */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">III. Tujuan Pembelajaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 space-y-1.5">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400">Semester Ganjil ({selectedRpp.totalMeetingsGanjil} pertemuan)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.objectivesGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20 space-y-1.5">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400">Semester Genap ({selectedRpp.totalMeetingsGenap} pertemuan)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.objectivesGenap || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Materi per semester */}
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">IV. Materi Pembelajaran</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/20">
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Semester Ganjil</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.materialsGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Semester Genap</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.materialsGenap || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Metode, Media, Asesmen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">V. Metode</h4><p className="pl-2 text-slate-700 dark:text-slate-300">{selectedRpp.method || '-'}</p></div>
                <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">VI. Media & Alat</h4><p className="pl-2 text-slate-700 dark:text-slate-300">{selectedRpp.media || '-'}</p></div>
              </div>
              <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">VII. Penilaian</h4><p className="pl-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedRpp.assessment || '-'}</p></div>
              {selectedRpp.notes && <div><h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-2">Catatan</h4><p className="pl-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedRpp.notes}</p></div>}

              {/* Silabus */}
              {selectedRpp.syllabusItems && selectedRpp.syllabusItems.length > 0 && (
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase tracking-wider mb-3">VIII. Silabus Rincian Per Pertemuan</h4>
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
                  <div className="flex items-center space-x-2"><FileText className="w-5 h-5 text-emerald-600"/><span className="font-bold text-slate-800 dark:text-slate-200">{selectedRpp.attachmentName}</span></div>
                  <a href={selectedRpp.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 text-xs font-bold uppercase">
                    <Download className="w-3.5 h-3.5"/><span>Unduh</span>
                  </a>
                </div>
              )}

              {/* Revisi info */}
              {selectedRpp.status === 'Revisi' && (
                <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 text-rose-800 dark:text-rose-400">
                  <span className="font-extrabold uppercase tracking-wide block mb-1">Catatan Revisi Aktif</span>
                  <p><em>"{selectedRpp.revisionNotes}"</em></p>
                </div>
              )}
            </div>

            {/* Modal footer — review form */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-950/15 flex-shrink-0">
              {!isReviewMode ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-semibold uppercase">Status:</span>
                    <span className={statusBadge(selectedRpp.status)}>{selectedRpp.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setDeleteConfirmRpp(selectedRpp)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition">
                      <Trash2 className="w-3.5 h-3.5"/><span>Hapus</span>
                    </button>
                    {selectedRpp.status === 'Menunggu Persetujuan' && (
                      <button onClick={() => setIsReviewMode(true)}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
                        Mulai Review
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs"><AlertCircle className="w-4 h-4"/><span>{errorMessage}</span></div>}
                  {successMessage && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs"><Check className="w-4 h-4"/><span>{successMessage}</span></div>}
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Review:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="rv" checked={reviewStatus === 'Disetujui'} onChange={() => setReviewStatus('Disetujui')} className="text-emerald-600"/>
                      <span className="text-xs font-bold text-emerald-700 uppercase">Setujui</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="rv" checked={reviewStatus === 'Revisi'} onChange={() => setReviewStatus('Revisi')} className="text-rose-600"/>
                      <span className="text-xs font-bold text-rose-700 uppercase">Minta Revisi</span>
                    </label>
                  </div>
                  {reviewStatus === 'Revisi' && (
                    <textarea required rows={3} placeholder="Tuliskan catatan revisi untuk guru..."
                      value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"/>
                  )}
                  <div className="flex justify-end space-x-2 pt-1">
                    <button type="button" onClick={() => setIsReviewMode(false)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider">Kembali</button>
                    <button type="submit"
                      className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition ${reviewStatus === 'Disetujui' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-600 hover:bg-rose-700'}`}>
                      Kirim Keputusan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL KONFIRMASI HAPUS ===== */}
      {deleteConfirmRpp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
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
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50">Batal</button>
              <button onClick={handleDeleteConfirm} disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60">
                <Trash2 className="w-3.5 h-3.5"/><span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
