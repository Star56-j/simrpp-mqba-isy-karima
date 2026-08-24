import React from 'react';
import { 
  Megaphone, Trash2, Calendar, User, Send, Bell, AlertCircle, CheckCircle, 
  Image as ImageIcon, FileText, Download, X, Eye, Paperclip, Users, UserCheck
} from 'lucide-react';
import { api } from '../api';
import { Pengumuman as PengumumanType, Teacher } from '../types';

interface PengumumanProps {
  currentUser: any;
  teachers?: Teacher[];
}

export default function Pengumuman({ currentUser, teachers = [] }: PengumumanProps) {
  const [announcements, setAnnouncements] = React.useState<PengumumanType[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Form State (Admin)
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [targetType, setTargetType] = React.useState<'semua' | 'guru' | 'wali_kelas' | 'perorangan'>('semua');
  const [targetId, setTargetId] = React.useState('');
  const [targetName, setTargetName] = React.useState('');
  
  // Attachment State
  const [imageUrl, setImageUrl] = React.useState('');
  const [fileUrl, setFileUrl] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [fileSize, setFileSize] = React.useState('');
  
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });
  
  // Lightbox Modal for Photo Preview
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  
  // Notification Permission State
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  
  // Read tracking
  const [readIds, setReadIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('simrpp_read_announcements');
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        setReadIds([]);
      }
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPengumuman();
      setAnnouncements(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notifications.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('Notifikasi Aktif', {
        body: 'Anda akan menerima pemberitahuan otomatis untuk pengumuman & pesan baru dari Admin.',
        icon: '/logo-mqba.png'
      });
    }
  };

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar (maksimal 10MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (maksimal 20MB).');
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileUrl(event.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  const handlePeroranganSelect = (tId: string) => {
    setTargetId(tId);
    const selected = teachers.find(t => t.id === tId);
    setTargetName(selected ? selected.name : '');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMsg({ type: 'error', text: 'Judul dan isi kalimat pesan wajib diisi.' });
      return;
    }

    if (targetType === 'perorangan' && !targetId) {
      setMsg({ type: 'error', text: 'Silakan pilih penerima pesan per orangan.' });
      return;
    }

    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const newAnn = await api.createPengumuman({
        title: title.trim(),
        content: content.trim(),
        targetType,
        targetId: targetType === 'perorangan' ? targetId : '',
        targetName: targetType === 'perorangan' ? targetName : '',
        imageUrl,
        fileUrl,
        fileName,
        fileSize,
        authorId: currentUser.id || currentUser.teacherId || 'admin',
        authorName: currentUser.name || 'Admin'
      });
      
      const updatedRead = [...readIds, newAnn.id];
      setReadIds(updatedRead);
      localStorage.setItem('simrpp_read_announcements', JSON.stringify(updatedRead));

      setMsg({ type: 'success', text: 'Pesan / pengumuman berhasil dikirim!' });
      setTitle('');
      setContent('');
      setImageUrl('');
      setFileUrl('');
      setFileName('');
      setFileSize('');
      setTargetType('semua');
      setTargetId('');
      setTargetName('');
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mengirim pesan.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan pengumuman ini?')) return;
    
    try {
      await api.deletePengumuman(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pesan.');
    }
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('simrpp_read_announcements', JSON.stringify(updated));
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter messages for current user
  const visibleAnnouncements = announcements.filter(ann => {
    if (currentUser.role === 'Admin') return true;
    
    const tType = ann.targetType || 'semua';
    if (tType === 'semua') return true;
    if (tType === 'guru') return currentUser.role === 'Guru' || currentUser.role === 'WaliKelas';
    if (tType === 'wali_kelas') return currentUser.role === 'WaliKelas';
    if (tType === 'perorangan') {
      const myId = currentUser.id || currentUser.teacherId || '';
      const myName = (currentUser.name || '').toLowerCase();
      const targetNameLower = (ann.targetName || '').toLowerCase();
      return ann.targetId === myId || (targetNameLower && myName.includes(targetNameLower));
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Notification Banner */}
      {('Notification' in window) && permission !== 'granted' && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500 text-white">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Aktifkan Notifikasi Pesan & Pengumuman</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Dapatkan notifikasi langsung di perangkat Anda ketika Admin mengirimkan pengumuman atau pesan per orangan.</p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            Aktifkan Sekarang
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className={`grid grid-cols-1 ${currentUser.role === 'Admin' ? 'lg:grid-cols-5' : ''} gap-6`}>
        
        {/* FORM KIRIM PESAN & BROADCAST (HANYA ADMIN) */}
        {currentUser.role === 'Admin' && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 sticky top-24 self-start">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-50 dark:border-slate-800">
              <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-black text-base text-slate-800 dark:text-white">Kirim Pesan / Pengumuman</h2>
            </div>

            {msg.text && (
              <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-bold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'}`}>
                {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-4">
              {/* TARGET PENERIMA */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Penerima Pesan</label>
                <select
                  value={targetType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setTargetType(val);
                    if (val !== 'perorangan') { setTargetId(''); setTargetName(''); }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="semua">📢 Kirim ke Semua Guru & Wali Kelas (Broadcast)</option>
                  <option value="guru">👨‍🏫 Kirim ke Semua Guru (Pengajar)</option>
                  <option value="wali_kelas">🏫 Kirim ke Semua Wali Kelas</option>
                  <option value="perorangan">👤 Kirim Per Orangan (Pesan Spesifik)</option>
                </select>
              </div>

              {/* JIKA TARGET PERORANGAN: PILIH GURU */}
              {targetType === 'perorangan' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Pilih Nama Penerima</label>
                  <select
                    required
                    value={targetId}
                    onChange={e => handlePeroranganSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>-- Pilih Ustadz / Ustazah --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (NIP/ID: {t.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* JUDUL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Judul / Subjek Pesan</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Undangan Rapat / Informasi Kurikulum..."
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* ISI KALIMAT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Isi Kalimat Pesan</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tuliskan kalimat pesan secara rinci di sini..."
                  rows={5}
                  className="w-full px-3 py-2 text-xs leading-relaxed rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              {/* LAMPIRAN FOTO / GAMBAR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lampiran Foto / Gambar (Opsional)</label>
                {imageUrl ? (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 flex items-center space-x-3">
                    <img src={imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Foto Lampiran</p>
                      <p className="text-[10px] text-slate-400">Siap dikirim</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition cursor-pointer text-xs font-bold">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>Upload Foto / Gambar</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* LAMPIRAN FILE / DOKUMEN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lampiran File / Dokumen (PDF, Word, Excel, ZIP)</label>
                {fileUrl ? (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
                      <p className="text-[10px] text-slate-400">{fileSize}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFileUrl(''); setFileName(''); setFileSize(''); }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center space-x-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition cursor-pointer text-xs font-bold">
                    <Paperclip className="w-4 h-4 text-indigo-500" />
                    <span>Upload File / Dokumen</span>
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#0f2942] hover:bg-[#1e3a5f] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Mengirim Pesan...' : 'Kirim Pesan Sekarang'}</span>
              </button>
            </form>
          </div>
        )}

        {/* DAFTAR PESAN & PENGUMUMAN FEED */}
        <div className={currentUser.role === 'Admin' ? 'lg:col-span-3' : 'w-full'}>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-800">
              <div>
                <h2 className="font-black text-base text-slate-800 dark:text-white">Pesan & Pengumuman Admin</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pemberitahuan resmi dan pesan dari Ketua Akademik MQBA Isy Karima.</p>
              </div>
              <span className="px-3 py-1 text-xs font-black bg-[#0f2942] text-white rounded-full">
                {visibleAnnouncements.length} Pesan
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-400">Memuat pesan & pengumuman...</div>
            ) : visibleAnnouncements.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300">
                  <Megaphone className="w-8 h-8" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Belum ada pesan atau pengumuman untuk Anda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleAnnouncements.map(ann => {
                  const isRead = readIds.includes(ann.id);
                  const targetType = ann.targetType || 'semua';
                  
                  return (
                    <div
                      key={ann.id}
                      onClick={() => markAsRead(ann.id)}
                      className={`p-5 rounded-2xl border transition-all duration-200 group relative ${
                        isRead
                          ? 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800'
                          : 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-900/30 shadow-xs'
                      }`}
                    >
                      {/* Unread Dot Badge */}
                      {!isRead && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-600"></span>
                        </span>
                      )}

                      <div className="space-y-3">
                        {/* Header: Title & Badges */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              {/* TARGET BADGE */}
                              {targetType === 'semua' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-full border border-amber-200">
                                  <Users className="w-3 h-3" />
                                  <span>Broadcast: Semua Guru & Wali Kelas</span>
                                </span>
                              )}
                              {targetType === 'guru' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 rounded-full border border-blue-200">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Broadcast: Semua Guru</span>
                                </span>
                              )}
                              {targetType === 'wali_kelas' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-full border border-emerald-200">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Broadcast: Semua Wali Kelas</span>
                                </span>
                              )}
                              {targetType === 'perorangan' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 rounded-full border border-purple-200">
                                  <User className="w-3 h-3" />
                                  <span>Pesan Langsung Kepada: {ann.targetName || 'Pengajar'}</span>
                                </span>
                              )}

                              {!isRead && (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300 rounded">
                                  Baru
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {ann.title}
                            </h3>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Pengirim: {ann.authorName || 'Ustadz. Aidil Aqli. S.Ag'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(ann.createdAt)}</span>
                              </span>
                            </div>
                          </div>

                          {currentUser.role === 'Admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(ann.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                              title="Hapus Pesan / Pengumuman"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* KALIMAT PESAN */}
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {ann.content}
                        </p>

                        {/* LAMPIRAN FOTO (JIKA ADA) */}
                        {ann.imageUrl && (
                          <div className="pt-2">
                            <div className="relative group/img inline-block max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs bg-slate-900">
                              <img 
                                src={ann.imageUrl} 
                                alt="Foto Lampiran" 
                                className="w-full max-h-72 object-cover cursor-pointer hover:scale-105 transition duration-300"
                                onClick={() => setLightboxImage(ann.imageUrl!)}
                              />
                              <div 
                                onClick={() => setLightboxImage(ann.imageUrl!)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center space-x-2 text-white font-extrabold text-xs cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Lihat Foto Penuh</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* LAMPIRAN FILE / DOKUMEN (JIKA ADA) */}
                        {ann.fileUrl && (
                          <div className="pt-2">
                            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-4 max-w-md">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{ann.fileName || 'Dokumen Lampiran'}</p>
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{ann.fileSize || 'Lampiran File'}</p>
                                </div>
                              </div>
                              <a
                                href={ann.fileUrl}
                                download={ann.fileName || 'Lampiran_Dokumen'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh File</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LIGHTBOX PHOTO MODAL */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[99]"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-slate-950">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Foto Penuh" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
