import React from 'react';
import {
  FileText, Search, X, AlertCircle, Check, Eye,
  Filter, Trash2, Printer, Download, BookOpen,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { RPP } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';

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

    w.document.write(`<!DOCTYPE html><html><head><title>RPP - ${rpp.subject?.name}</title>
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
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
      .box{border:1px solid #bbb;border-radius:4px;padding:10px;}
      .box-title{font-weight:bold;font-size:11px;text-transform:uppercase;margin-bottom:6px;}
      .box-blue .box-title{color:#1d4ed8;}
      .box-violet .box-title{color:#7c3aed;}
      .box-amber .box-title{color:#b45309;}
      .box-indigo .box-title{color:#065f46;}
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
    <div class="title">Rencana Pelaksanaan Pembelajaran (RPP) Kurikulum Merdeka</div>
    <table class="id">
      <tr><td class="lbl">Mata Pelajaran</td><td class="col">:</td><td><strong>${rpp.subject?.name} (${rpp.subject?.category})</strong></td></tr>
      <tr><td class="lbl">Kelas / Jenjang</td><td class="col">:</td><td>Kelas ${rpp.class?.name} (${rpp.class?.level})</td></tr>
      <tr><td class="lbl">Nama Pengajar</td><td class="col">:</td><td>${rpp.teacher?.name}</td></tr>
      <tr><td class="lbl">Tahun Ajaran</td><td class="col">:</td><td>Tahun Pelajaran ${rpp.academicYear?.name}</td></tr>
      <tr><td class="lbl">Jumlah Pertemuan</td><td class="col">:</td><td>Ganjil: ${rpp.totalMeetingsGanjil} &nbsp;|&nbsp; Genap: ${rpp.totalMeetingsGenap} pertemuan</td></tr>
      <tr><td class="lbl">Profil Pelajar</td><td class="col">:</td><td>${rpp.profilPelajar || '-'}</td></tr>
      <tr><td class="lbl">Sarana & Prasarana</td><td class="col">:</td><td>${rpp.sarana || '-'}</td></tr>
    </table>
    <div class="sec">I. Capaian Pembelajaran (CP)</div><div class="cnt">${rpp.capaiPembelajaran || '-'}</div>
    <div class="sec">II. Tujuan Pembelajaran (TP)</div><div class="cnt">${rpp.tujuanPembelajaran || '-'}</div>
    <div class="sec">III. Alur Tujuan Pembelajaran (ATP)</div><div class="cnt">${rpp.alurTP || '-'}</div>
    <div class="sec">IV. Materi Pembelajaran</div>
    <div class="grid2">
      <div class="box box-blue"><div class="box-title">Semester Ganjil (${rpp.totalMeetingsGanjil} pertemuan)</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.materiGanjil || '-'}</div></div>
      <div class="box box-violet"><div class="box-title">Semester Genap (${rpp.totalMeetingsGenap} pertemuan)</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.materiGenap || '-'}</div></div>
    </div>
    <div class="sec">V. Kegiatan Pembelajaran</div>
    <div class="box box-amber" style="margin-bottom:8px;"><div class="box-title">Pendahuluan</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.pendahuluan || '-'}</div></div>
    <div class="box box-indigo" style="margin-bottom:8px;"><div class="box-title">Kegiatan Inti</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.kegiatanInti || '-'}</div></div>
    <div class="box" style="margin-bottom:14px;"><div class="box-title" style="color:#1d4ed8;">Penutup</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.penutup || '-'}</div></div>
    <div class="sec">VI. Metode & Media</div>
    <div class="grid2">
      <div class="box"><div class="box-title">Metode / Model Pembelajaran</div><div style="font-size:12px;">${rpp.metode || '-'}</div></div>
      <div class="box"><div class="box-title">Media & Alat</div><div style="font-size:12px;">${rpp.media || '-'}</div></div>
    </div>
    <div class="sec">VII. Asesmen</div>
    <div class="grid3">
      <div class="box"><div class="box-title">Diagnostik</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenDiagnostik || '-'}</div></div>
      <div class="box box-blue"><div class="box-title">Formatif</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenFormatif || '-'}</div></div>
      <div class="box box-indigo"><div class="box-title">Sumatif</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.asesmenSumatif || '-'}</div></div>
    </div>
    <div class="sec">VIII. Diferensiasi & Pengayaan</div>
    <div class="grid2">
      <div class="box"><div class="box-title">Pembelajaran Berdiferensiasi</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.diferensiasi || '-'}</div></div>
      <div class="box"><div class="box-title">Pengayaan & Remedial</div><div style="white-space:pre-wrap;font-size:12px;">${rpp.pengayaan || '-'}</div></div>
    </div>
    ${rpp.catatan ? `<div class="sec">Catatan Guru</div><div class="cnt">${rpp.catatan}</div>` : ''}
    ${ganjilRows || genapRows ? `
    <div class="sec">IX. Silabus Rincian Per Pertemuan</div>
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

  const handleExport = () => {
    const dataToExport = filteredRpps.map((r, idx) => ({
      'No': idx + 1,
      'Guru Pengajar': r.teacher?.name || r.teacherId,
      'Mata Pelajaran': r.subject?.name || r.subjectId,
      'Kelas': r.class?.name || r.classId,
      'Tahun Ajaran': r.academicYear?.name || r.academicYearId,
      'Fase / Semester': '-',
      'Status': r.status,
      'Tgl Dibuat': new Date(r.createdAt).toLocaleDateString('id-ID'),
      'Catatan Revisi': r.revisionNotes || '-'
    }));
    exportToExcel(dataToExport, `Data_Persetujuan_RPP`);
  };

  const statusBadge = (status: string) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border';
    if (status === 'Disetujui') return `${base} bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30`;
    if (status === 'Menunggu Persetujuan') return `${base} bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400`;
    if (status === 'Revisi') return `${base} bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400`;
    return `${base} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Persetujuan RPP Tahunan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review dan setujui RPP Kurikulum Merdeka yang diajukan oleh guru.</p>
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
            <option value="Menunggu Persetujuan">Menunggu</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Revisi">Revisi</option>
          </select>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 whitespace-nowrap">
          <Download className="w-4 h-4" /><span>Export</span>
        </button>
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
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">{rpp.subject?.name}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-500">Kelas {rpp.class?.name}</span>
                    <span className="text-xs text-slate-400 font-mono">TA {rpp.academicYear?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>Ganjil: <strong>{rpp.totalMeetingsGanjil}</strong> ptm</span>
                    <span>Genap: <strong>{rpp.totalMeetingsGenap}</strong> ptm</span>
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

            {/* Quick expand preview — format Kurikulum Merdeka */}
            {expandedRppId === rpp.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-3">
                {rpp.capaiPembelajaran && (
                  <div>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Capaian Pembelajaran</p>
                    <p className="whitespace-pre-wrap">{rpp.capaiPembelajaran}</p>
                  </div>
                )}
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

      {/* ===== MODAL DETAIL & REVIEW ===== */}
      {selectedRpp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="bg-indigo-800 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">{selectedRpp.subject?.name}</h3>
                  <p className="text-indigo-300 text-xs">{selectedRpp.teacher?.name} &bull; Kelas {selectedRpp.class?.name} &bull; TA {selectedRpp.academicYear?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => printRPP(selectedRpp)} className="p-1.5 rounded-lg hover:bg-indigo-700/80 text-indigo-100 transition" title="Cetak RPP">
                  <Printer className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => setSelectedRpp(null)} className="p-1.5 rounded-lg hover:bg-indigo-700/80 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">

              {/* A. Identitas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedRpp.subject?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Kelas {selectedRpp.class?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">TA {selectedRpp.academicYear?.name}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pertemuan</span><p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">G: {selectedRpp.totalMeetingsGanjil} &bull; Gnp: {selectedRpp.totalMeetingsGenap}</p></div>
                <div className="md:col-span-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profil Pelajar</span><p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedRpp.profilPelajar || '-'}</p></div>
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
                    <p className="font-extrabold text-blue-700 dark:text-blue-400 mb-1">Semester Ganjil ({selectedRpp.totalMeetingsGanjil} pertemuan)</p>
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRpp.materiGanjil || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/20">
                    <p className="font-extrabold text-violet-700 dark:text-violet-400 mb-1">Semester Genap ({selectedRpp.totalMeetingsGenap} pertemuan)</p>
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
                        className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
                        Mulai Review
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {errorMessage && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs"><AlertCircle className="w-4 h-4"/><span>{errorMessage}</span></div>}
                  {successMessage && <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs"><Check className="w-4 h-4"/><span>{successMessage}</span></div>}
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Review:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="rv" checked={reviewStatus === 'Disetujui'} onChange={() => setReviewStatus('Disetujui')} className="text-indigo-600"/>
                      <span className="text-xs font-bold text-indigo-700 uppercase">Setujui</span>
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
                      className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition ${reviewStatus === 'Disetujui' ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-rose-600 hover:bg-rose-700'}`}>
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
              <p className="text-slate-500">Status: <span className={`font-bold ${deleteConfirmRpp.status==='Disetujui'?'text-indigo-600':deleteConfirmRpp.status==='Menunggu Persetujuan'?'text-amber-600':deleteConfirmRpp.status==='Revisi'?'text-rose-600':'text-slate-500'}`}>{deleteConfirmRpp.status}</span></p>
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
