import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  X, 
  AlertCircle,
  Tag,
  CheckCircle
} from 'lucide-react';
import { Subject } from '../types';
import { api } from '../api';

interface MasterSubjectsProps {
  subjects: Subject[];
  onRefresh: () => void;
}

type CategoryType = 'Al-Qur\'an' | 'Diniyah' | 'Bahasa' | 'Umum';

export default function MasterSubjects({ subjects, onRefresh }: MasterSubjectsProps) {
  const [activeTab, setActiveTab] = React.useState<CategoryType | 'Semua'>('Semua');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);

  // Form State
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState<CategoryType>('Al-Qur\'an');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'Semua' || sub.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const openAddModal = () => {
    setSelectedSubject(null);
    setName('');
    setCategory('Al-Qur\'an');
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setName(subject.name);
    setCategory(subject.category);
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || !category) {
      setErrorMessage('Semua kolom harus diisi.');
      return;
    }

    try {
      if (selectedSubject) {
        await api.updateSubject(selectedSubject.id, { name, category });
        setSuccessMessage('Mata pelajaran berhasil diperbarui.');
      } else {
        await api.createSubject({ name, category });
        setSuccessMessage('Mata pelajaran baru berhasil ditambahkan.');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${subject.name}"?`)) {
      try {
        await api.deleteSubject(subject.id);
        alert('Mata pelajaran berhasil dihapus.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Mata pelajaran ini tidak bisa dihapus karena telah terikat dengan jadwal KBM.');
      }
    }
  };

  const categories: (CategoryType | 'Semua')[] = ['Semua', 'Al-Qur\'an', 'Diniyah', 'Bahasa', 'Umum'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Data Master Mata Pelajaran
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Daftar kurikulum pelajaran di Markaz Qur'an dan Bahasa Arab Isy Karima.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mapel Baru</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`
              px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap
              ${activeTab === cat 
                ? 'bg-emerald-700 text-white shadow-md' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Subjects Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Nama Mata Pelajaran</th>
                <th className="p-4 w-52">Kategori Kurikulum</th>
                <th className="p-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      {subject.name}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border
                        ${subject.category === 'Al-Qur\'an' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30' : ''}
                        ${subject.category === 'Diniyah' ? 'bg-teal-50 text-teal-800 border-teal-100 dark:bg-teal-950/25 dark:text-teal-400 dark:border-teal-900/30' : ''}
                        ${subject.category === 'Bahasa' ? 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/25 dark:text-indigo-400 dark:border-indigo-900/30' : ''}
                        ${subject.category === 'Umum' ? 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : ''}
                      `}>
                        {subject.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                          title="Edit Mapel"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition"
                          title="Hapus Mapel"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Tidak ditemukan mata pelajaran yang cocok dengan kriteria Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {selectedSubject ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-700/85 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aqidah / Fiqih / Muroja'ah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kategori Kurikulum</label>
                <div className="relative">
                  <Tag className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="Al-Qur'an">Al-Qur'an</option>
                    <option value="Diniyah">Diniyah</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {selectedSubject ? 'Simpan Perubahan' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
