import React from 'react';
import { 
  HelpCircle, Send, MessageSquare, CheckCircle, Clock, 
  AlertCircle, Trash2, Edit3, User as UserIcon, Search, Filter
} from 'lucide-react';
import { User, TanyaAdmin as TanyaAdminType } from '../types';
import { api } from '../api';

interface TanyaAdminProps {
  currentUser: User;
}

export default function TanyaAdmin({ currentUser }: TanyaAdminProps) {
  const isAdmin = currentUser.role === 'Admin';

  const [messages, setMessages] = React.useState<TanyaAdminType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<'All' | 'Pending' | 'Dijawab'>('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Form for Guru / WaliKelas to ask question
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');

  // Admin reply state
  const [replyingId, setReplyingId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [replySubmitting, setReplySubmitting] = React.useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadMessages = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTanyaAdmin();
      // If regular teacher/walikelas, filter by senderId or email
      if (!isAdmin) {
        const myTeacherId = currentUser.teacherId || currentUser.id;
        const myEmail = (currentUser.email || '').toLowerCase();
        const filtered = data.filter(m => 
          (m.sender_id && m.sender_id === myTeacherId) ||
          (m.senderId && m.senderId === myTeacherId) ||
          (m.sender_email && m.sender_email.toLowerCase() === myEmail) ||
          (m.senderEmail && m.senderEmail.toLowerCase() === myEmail)
        );
        setMessages(filtered);
      } else {
        setMessages(data);
      }
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Submit question (Guru / WaliKelas)
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!subject.trim() || !message.trim()) {
      setFormError('Topik dan pesan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: `tanya-${crypto.randomUUID()}`,
        sender_id: currentUser.teacherId || currentUser.id,
        sender_name: currentUser.name,
        sender_email: currentUser.email,
        sender_role: currentUser.role,
        subject: subject.trim(),
        message: message.trim(),
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      await api.createTanyaAdmin(payload);
      setFormSuccess('Pertanyaan Anda telah berhasil dikirim ke Admin.');
      setSubject('');
      setMessage('');
      loadMessages();
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengirim pertanyaan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply (Admin)
  const handleAdminReply = async (id: string) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await api.updateTanyaAdmin(id, {
        admin_reply: replyText.trim(),
        adminReply: replyText.trim(),
        reply_at: new Date().toISOString(),
        replyAt: new Date().toISOString(),
        status: 'Dijawab'
      });
      setReplyingId(null);
      setReplyText('');
      loadMessages();
    } catch (err: any) {
      alert('Gagal mengirim balasan: ' + err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    try {
      await api.deleteTanyaAdmin(id);
      setDeleteId(null);
      loadMessages();
    } catch (err: any) {
      alert('Gagal menghapus pesan: ' + err.message);
    }
  };

  // Filter & search
  const filteredMessages = React.useMemo(() => {
    return messages.filter(m => {
      const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
      const sName = (m.sender_name || m.senderName || '').toLowerCase();
      const subj = (m.subject || '').toLowerCase();
      const msg = (m.message || '').toLowerCase();
      const sTerm = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || sName.includes(sTerm) || subj.includes(sTerm) || msg.includes(sTerm);
      return matchesStatus && matchesSearch;
    });
  }, [messages, filterStatus, searchTerm]);

  const pendingCount = messages.filter(m => m.status === 'Pending').length;
  const answeredCount = messages.filter(m => m.status === 'Dijawab').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{isAdmin ? 'Pesan & Pertanyaan Guru (Tanya Admin)' : 'Tanya Admin'}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isAdmin 
              ? 'Kelola dan jawab seluruh pertanyaan, kendala, atau masukan dari Asatidz & Ustadzah.'
              : 'Sampaikan pertanyaan, kendala KBM, atau masukan akademik secara langsung kepada Admin.'}
          </p>
        </div>
      </div>

      {/* Admin Summary Stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pertanyaan</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{messages.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Belum Dijawab (Pending)</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Sudah Dijawab</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{answeredCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Form Tanya Admin (Khusus Guru & Wali Kelas) */}
      {!isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between text-white">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>Kirim Pertanyaan / Pesan Baru</span>
              </h3>
              <p className="text-indigo-200 text-xs mt-0.5">Admin akan membalas pertanyaan Anda di halaman ini.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitQuestion} className="p-6 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Subjek / Topik Pertanyaan
              </label>
              <input 
                type="text" 
                required 
                placeholder="Contoh: Kendala Input Nilai Rapor / Pengajuan Perubahan Jadwal"
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Detail Pertanyaan atau Pesan
              </label>
              <textarea 
                rows={4} 
                required
                placeholder="Tuliskan pertanyaan, kendala, atau pesan Anda secara rinci di sini..."
                value={message} 
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition flex items-center space-x-2 disabled:opacity-60"
            >
              {submitting ? (
                <span>Mengirim...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim ke Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* List Messages & Filter Bar */}
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['All', 'Pending', 'Dijawab'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
                  filterStatus === st 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {st === 'All' ? 'Semua Pesan' : st === 'Pending' ? `Belum Dijawab (${pendingCount})` : `Sudah Dijawab (${answeredCount})`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari guru atau topik..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Message Feed */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat pertanyaan...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 py-16 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-medium">Belum ada pertanyaan atau pesan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map(msg => {
              const senderName = msg.sender_name || msg.senderName || 'Pengajar';
              const senderEmail = msg.sender_email || msg.senderEmail || '';
              const senderRole = msg.sender_role || msg.senderRole || 'Guru';
              const replyContent = msg.admin_reply || msg.adminReply || '';
              const replyTime = msg.reply_at || msg.replyAt || '';
              const createdAt = msg.created_at || msg.createdAt || '';

              return (
                <div 
                  key={msg.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition"
                >
                  {/* Question Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/20 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm">
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{senderName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {senderRole}
                          </span>
                        </div>
                        {senderEmail && <p className="text-xs text-slate-400 mt-0.5">{senderEmail}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        msg.status === 'Dijawab' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {msg.status === 'Dijawab' ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                        <span>{msg.status === 'Dijawab' ? 'Sudah Dijawab' : 'Menunggu Balasan'}</span>
                      </span>

                      {isAdmin && (
                        <button 
                          onClick={() => setDeleteId(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Hapus Pesan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{msg.subject}</h3>
                      {createdAt && (
                        <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      {msg.message}
                    </p>
                  </div>

                  {/* Admin Reply Box */}
                  {replyContent && (
                    <div className="mx-5 mb-5 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                          <span>Jawaban Admin:</span>
                        </span>
                        {replyTime && (
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono">
                            {new Date(replyTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                        {replyContent}
                      </p>
                    </div>
                  )}

                  {/* Admin Reply Form Button / Input */}
                  {isAdmin && (
                    <div className="p-4 bg-slate-50/60 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                      {replyingId === msg.id ? (
                        <div className="space-y-3">
                          <textarea
                            rows={3}
                            placeholder="Tuliskan jawaban Admin untuk guru ini..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => { setReplyingId(null); setReplyText(''); }}
                              className="px-4 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold uppercase"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminReply(msg.id)}
                              disabled={replySubmitting || !replyText.trim()}
                              className="px-5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{replySubmitting ? 'Mengirim...' : 'Kirim Balasan'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReplyingId(msg.id); setReplyText(replyContent); }}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{replyContent ? 'Edit Jawaban Admin' : 'Jawab Pertanyaan Ini'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus pesan ini?</h3>
            <p className="text-xs text-slate-500">Pertanyaan dan jawaban akan dihapus secara permanen.</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setDeleteId(null)} 
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase"
              >
                Batal
              </button>
              <button 
                onClick={() => handleDeleteMessage(deleteId)} 
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5"/>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
