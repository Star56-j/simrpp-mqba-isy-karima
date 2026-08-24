import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Send, CheckCircle2, Clock, 
  Trash2, Edit3, Search, Image as ImageIcon, X, ZoomIn,
  Paperclip, FileText, Download, ExternalLink, GraduationCap,
  Users2, UserCheck, ShieldCheck, CornerDownRight, Filter
} from 'lucide-react';
import { User, TanyaWaliKelas as TTanyaWaliKelas, SchoolClass, WaliKelas as TWaliKelas } from '../types';
import { api } from '../api';

interface TanyaWaliKelasProps {
  currentUser: User;
}

export default function TanyaWaliKelas({ currentUser }: TanyaWaliKelasProps) {
  const isAdmin = currentUser.role === 'Admin';
  const isWaliKelas = currentUser.role === 'WaliKelas' || currentUser.role === 'Guru';

  const [messages, setMessages] = useState<TTanyaWaliKelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Dijawab'>('All');
  const [filterClassId, setFilterClassId] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [myWaliClasses, setMyWaliClasses] = useState<TWaliKelas[]>([]);

  // Reply state
  const [replyingItem, setReplyingItem] = useState<TTanyaWaliKelas | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState('');
  const [replyError, setReplyError] = useState('');

  // Lightbox preview
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [msgData, clsData, wkData] = await Promise.all([
        api.getTanyaWaliKelas().catch(() => []),
        api.getClasses().catch(() => []),
        api.getWaliKelas().catch(() => [])
      ]);
      setMessages(msgData);
      setClasses(clsData);

      // Determine which classes this teacher manages
      const myId = currentUser.teacherId || (currentUser as any).teacher_id || currentUser.id;
      const myClasses = wkData.filter(w => w.teacherId === myId || (w as any).teacher_id === myId);
      setMyWaliClasses(myClasses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter messages based on teacher scope and filters
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      // Scope filter: If not admin, only show messages for classes this teacher is Wali Kelas of, or addressed to this teacher
      if (!isAdmin) {
        const myTeacherId = currentUser.teacherId || (currentUser as any).teacher_id || currentUser.id;
        const myAssignedClassIds = myWaliClasses.map(w => w.classId || (w as any).class_id);
        const matchesClass = m.classId && myAssignedClassIds.includes(m.classId);
        const matchesTeacher = m.waliKelasId && (m.waliKelasId === myTeacherId || m.waliKelasId === currentUser.id);
        if (!matchesClass && !matchesTeacher) {
          return false;
        }
      }

      // Status filter
      if (filterStatus === 'Pending' && m.status !== 'Pending') return false;
      if (filterStatus === 'Dijawab' && m.status !== 'Dijawab') return false;

      // Class filter
      if (filterClassId !== 'All' && m.classId !== filterClassId) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSantri = (m.santriName || '').toLowerCase().includes(q);
        const matchWali = (m.waliSantriName || '').toLowerCase().includes(q);
        const matchSubject = (m.subject || '').toLowerCase().includes(q);
        const matchMessage = (m.message || '').toLowerCase().includes(q);
        const matchReply = (m.waliReply || '').toLowerCase().includes(q);
        const matchClass = (m.className || '').toLowerCase().includes(q);
        return matchSantri || matchWali || matchSubject || matchMessage || matchReply || matchClass;
      }

      return true;
    });
  }, [messages, isAdmin, currentUser, myWaliClasses, filterStatus, filterClassId, searchTerm]);

  const handleOpenReply = (item: TTanyaWaliKelas) => {
    setReplyingItem(item);
    setReplyText(item.waliReply || '');
    setReplyError('');
    setReplySuccess('');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingItem) return;
    if (!replyText.trim()) {
      setReplyError('Balasan tidak boleh kosong.');
      return;
    }

    setSubmittingReply(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const updated = await api.updateTanyaWaliKelas(replyingItem.id, {
        waliReply: replyText.trim(),
        replyAt: new Date().toISOString(),
        status: 'Dijawab',
        waliKelasName: currentUser.name || replyingItem.waliKelasName
      });

      setMessages(prev => prev.map(m => m.id === replyingItem.id ? { ...m, ...updated, status: 'Dijawab', waliReply: replyText.trim(), replyAt: new Date().toISOString() } : m));
      setReplySuccess('Balasan berhasil dikirimkan kepada Wali Santri.');
      setTimeout(() => {
        setReplyingItem(null);
        setReplySuccess('');
      }, 1000);
    } catch (err: any) {
      setReplyError(err.message || 'Gagal menyimpan balasan.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTanyaWaliKelas(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      setDeleteId(null);
    } catch (err: any) {
      alert('Gagal menghapus pesan: ' + (err.message || 'Error'));
    }
  };

  const pendingCount = useMemo(() => {
    return filteredMessages.filter(m => m.status === 'Pending').length;
  }, [filteredMessages]);

  const answeredCount = useMemo(() => {
    return filteredMessages.filter(m => m.status === 'Dijawab').length;
  }, [filteredMessages]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
              <MessageSquare className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/30 text-sky-200 border border-sky-400/30">
                  {isAdmin ? 'Panel Admin' : 'Panel Wali Kelas'}
                </span>
                <span className="text-xs text-sky-200/70 font-medium">Konsultasi Wali Santri</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Konsultasi & Tanya Wali Kelas
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-xl">
                Wadah komunikasi langsung antara Wali Santri dengan Wali Kelas mengenai perkembangan akhlaq, KBM, hafalan, dan adab santri.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300">Menunggu</p>
              <p className="text-2xl font-black text-white mt-0.5">{pendingCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">Dibalas</p>
              <p className="text-2xl font-black text-white mt-0.5">{answeredCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari santri, wali, topik pesan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Class Filter */}
          {isAdmin && classes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => setFilterStatus('All')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterStatus === 'All'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Semua ({filteredMessages.length})
            </button>
            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending ({pendingCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('Dijawab')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Dijawab'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Dijawab ({answeredCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat data konsultasi wali santri...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada pesan konsultasi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {filterStatus === 'Pending' 
              ? 'Alhamdulillah! Semua pesan dan pertanyaan dari Wali Santri telah Anda jawab.' 
              : 'Belum ada pesan atau pertanyaan konsultasi yang dikirimkan oleh Wali Santri.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredMessages.map((msg) => {
            const isPending = msg.status === 'Pending';
            return (
              <div 
                key={msg.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition shadow-sm overflow-hidden ${
                  isPending 
                    ? 'border-amber-200/90 dark:border-amber-900/40 hover:border-amber-300' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Message Header Banner */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                      isPending ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-sky-500 to-sky-700'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                          {msg.santriName || 'Santri'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60">
                          {msg.className || 'Kelas Binaan'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          isPending 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200' 
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                        }`}>
                          {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{isPending ? 'Menunggu Balasan' : 'Sudah Dibalas'}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Pengirim: <strong className="text-slate-800 dark:text-slate-200 font-bold">{msg.waliSantriName || 'Wali Santri'}</strong> · <span className="opacity-80">Dikirim: {new Date(msg.createdAt || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenReply(msg)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isPending 
                          ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isPending ? 'Balas Pesan' : 'Edit Balasan'}</span>
                    </button>
                    {(isAdmin || isWaliKelas) && (
                      <button
                        onClick={() => setDeleteId(msg.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Hapus Pesan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Topic / Subject */}
                  {msg.subject && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Topik:</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{msg.subject}</h4>
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </div>

                  {/* Attachment if any */}
                  {(msg.imageUrl || msg.fileUrl) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {msg.imageUrl && (
                        <div 
                          onClick={() => setModalImage(msg.imageUrl || null)}
                          className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                        >
                          <img src={msg.imageUrl} alt="Lampiran" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || 'Dokumen_Lampiran'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200/70 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition"
                        >
                          <FileText className="w-4 h-4 text-sky-600" />
                          <span className="truncate max-w-[200px]">{msg.fileName || 'Download Lampiran'}</span>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Wali Kelas Reply Box */}
                  {msg.waliReply && (
                    <div className="mt-4 p-4.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                          <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Balasan Wali Kelas ({msg.waliKelasName || 'Ustadz / Ustadzah'}):</span>
                        </div>
                        {msg.replyAt && (
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {new Date(msg.replyAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed pl-6">
                        {msg.waliReply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Balas Pesan Wali Santri
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Santri: <strong>{replyingItem.santriName}</strong> ({replyingItem.className})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setReplyingItem(null)} 
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReply} className="p-6 space-y-4">
              {/* Question Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Pertanyaan dari {replyingItem.waliSantriName}:
                </p>
                {replyingItem.subject && (
                  <p className="font-semibold text-sky-700 dark:text-sky-400">Topik: {replyingItem.subject}</p>
                )}
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{replyingItem.message}"
                </p>
              </div>

              {replyError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {replyError}
                </div>
              )}

              {replySuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {replySuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tuliskan Balasan Anda kepada Wali Santri:
                </label>
                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tuliskan jawaban penjelasan, arahan, atau tindak lanjut untuk wali santri..."
                  required
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingItem(null)}
                  disabled={submittingReply}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Mengirim...' : 'Kirim Balasan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {modalImage && (
        <div 
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={modalImage} alt="Lampiran Besar" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Hapus Pesan Konsultasi?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pesan ini akan dihapus secara permanen dari sistem.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
