import React from 'react';
import { 
  Users, Plus, Edit, Trash2, X, AlertCircle, CheckCircle, GraduationCap, Search 
} from 'lucide-react';
import { Santri, SchoolClass } from '../types';
import { api } from '../api';

interface MasterSantriProps {
  classes: SchoolClass[];
  onRefresh: () => void;
}

export default function MasterSantri({ classes, onRefresh }: MasterSantriProps) {
  const [santriList, setSantriList] = React.useState<Santri[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Filter & Search
  const [filterClass, setFilterClass] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  
  // Form State
  const [nis, setNis] = React.useState('');
  const [name, setName] = React.useState('');
  const [classId, setClassId] = React.useState('');
  
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchSantri = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSantri();
      setSantriList(data);
    } catch (err) {
      console.error('Failed to fetch santri:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSantri();
  }, [fetchSantri]);

  const openAdd = () => {
    setEditId(null);
    setNis('');
    setName('');
    setClassId(classes[0]?.id || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (s: Santri) => {
    setEditId(s.id);
    setNis(s.nis);
    setName(s.name);
    setClassId(s.classId);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    setSubmitting(true);

    try {
      if (editId) {
        await api.updateSantri(editId, { nis, name, classId });
        setSuccessMsg('Data santri berhasil diperbarui.');
      } else {
        await api.createSantri({ nis, name, classId });
        setSuccessMsg('Santri berhasil ditambahkan.');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchSantri();
        onRefresh();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteSantri(deleteId);
      setDeleteId(null);
      fetchSantri();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredList = santriList.filter(s => {
    const matchClass = filterClass === 'all' || s.classId === filterClass;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Data Santri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola data induk santri dan penempatan kelas.</p>
        </div>
        <button onClick={openAdd} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /><span>Tambah Santri</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-1.5 min-w-[160px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Kelas</label>
          <select 
            value={filterClass} 
            onChange={e => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Daftar Santri</span>
          </span>
          <span className="text-xs text-slate-400">{filteredList.length} santri</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data santri...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800" />
            <p className="text-sm font-semibold">Tidak ada santri ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                <tr>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {filteredList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.nis}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {classes.find(c => c.id === s.classId)?.name || s.classId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-1.5">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition" title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                {editId ? 'Edit Santri' : 'Tambah Santri'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /><span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">NIS (Nomor Induk Santri)</label>
                <input required type="text" value={nis} onChange={e => setNis(e.target.value)} placeholder="Contoh: 2026001"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama santri..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                <select required value={classId} onChange={e => setClassId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="" disabled>Pilih kelas...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus Data Santri?</h3>
            <p className="text-xs text-slate-500">Nilai yang terkait dengan santri ini juga mungkin ikut terhapus. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60">
                <Trash2 className="w-3.5 h-3.5" /><span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
