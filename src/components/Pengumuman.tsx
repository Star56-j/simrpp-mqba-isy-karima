import React from 'react';
import { Megaphone, Trash2, Calendar, User, Send, Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { Pengumuman as PengumumanType } from '../types';

interface PengumumanProps {
  currentUser: any;
}

export default function Pengumuman({ currentUser }: PengumumanProps) {
  const [announcements, setAnnouncements] = React.useState<PengumumanType[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Form State (Admin)
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });
  
  // Notification Permission State
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  
  // Read tracking
  const [readIds, setReadIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Load read announcements from localStorage
    const saved = localStorage.getItem('simrpp_read_announcements');
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        setReadIds([]);
      }
    }

    // Set permission state
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
        body: 'Anda akan menerima pemberitahuan otomatis untuk pengumuman baru.',
        icon: '/logo-mqba.png'
      });
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMsg({ type: 'error', text: 'Judul dan isi pengumuman wajib diisi.' });
      return;
    }

    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const newAnn = await api.createPengumuman({
        title: title.trim(),
        content: content.trim()
      });
      
      // Auto-read own announcement
      const updatedRead = [...readIds, newAnn.id];
      setReadIds(updatedRead);
      localStorage.setItem('simrpp_read_announcements', JSON.stringify(updatedRead));

      setMsg({ type: 'success', text: 'Pengumuman berhasil diterbitkan!' });
      setTitle('');
      setContent('');
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menerbitkan pengumuman.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    
    try {
      await api.deletePengumuman(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman.');
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
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Banner for Notifications */}
      {('Notification' in window) && permission !== 'granted' && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500 text-white">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Aktifkan Notifikasi Perangkat</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Dapatkan notifikasi otomatis secara langsung di HP atau laptop ketika ada pengumuman baru.</p>
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

      {/* Grid: Form (Admin) & List */}
      <div className={`grid grid-cols-1 ${currentUser.role === 'Admin' ? 'lg:grid-cols-5' : ''} gap-6`}>
        
        {/* Form Pembuatan (Hanya Admin) */}
        {currentUser.role === 'Admin' && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 sticky top-24 self-start">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-50 dark:border-slate-800">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              <h2 className="font-black text-base text-slate-800 dark:text-white">Tulis Pengumuman</h2>
            </div>

            {msg.text && (
              <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-bold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'}`}>
                {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Judul Pengumuman</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Evaluasi RPP"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Isi Pengumuman</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tuliskan detail pengumuman di sini..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition hover:from-indigo-700 hover:to-violet-700 flex items-center justify-center space-x-2 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Mengirim...' : 'Kirim Pengumuman'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Daftar Pengumuman */}
        <div className={currentUser.role === 'Admin' ? 'lg:col-span-3' : 'w-full'}>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-800">
              <h2 className="font-black text-base text-slate-800 dark:text-white">Daftar Pengumuman</h2>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                {announcements.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-400">Memuat pengumuman...</div>
            ) : announcements.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300">
                  <Megaphone className="w-8 h-8" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Belum ada pengumuman untuk saat ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(ann => {
                  const isRead = readIds.includes(ann.id);
                  return (
                    <div
                      key={ann.id}
                      onClick={() => markAsRead(ann.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 group relative ${
                        isRead
                          ? 'bg-slate-50/50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800'
                          : 'bg-indigo-50/20 dark:bg-indigo-950/5 border-indigo-100/50 dark:border-indigo-900/10 shadow-xs'
                      }`}
                    >
                      {/* Unread Dot Badge */}
                      {!isRead && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span>
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {!isRead && (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300 rounded">
                                  Baru
                                </span>
                              )}
                              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {ann.title}
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5" />
                                <span>{ann.authorName}</span>
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Hapus Pengumuman"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
