import React from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  X, 
  AlertCircle,
  Key,
  Mail,
  User,
  CheckCircle
} from 'lucide-react';
import { Teacher } from '../types';
import { api } from '../api';

interface MasterTeachersProps {
  teachers: Teacher[];
  onRefresh: () => void;
}

export default function MasterTeachers({ teachers, onRefresh }: MasterTeachersProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null);
  
  // Form state
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setSelectedTeacher(null);
    setName('');
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email);
    setPassword(''); // blank means do not change password
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || !email) {
      setErrorMessage('Nama dan email harus diisi.');
      return;
    }

    try {
      if (selectedTeacher) {
        // Edit mode
        await api.updateTeacher(selectedTeacher.id, { 
          name, 
          email, 
          ...(password ? { password } : {}) 
        });
        setSuccessMessage('Berhasil mengubah data guru.');
      } else {
        // Add mode
        await api.createTeacher({ name, email, password });
        setSuccessMessage('Berhasil menambahkan guru baru.');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses data.');
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus guru "${teacher.name}"?\nSemua akun login terkait akan dihapus secara permanen.`)) {
      try {
        await api.deleteTeacher(teacher.id);
        alert('Guru berhasil dihapus dari sistem.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus guru. Mungkin terikat jadwal mengajar.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Data Master Guru
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Total terdaftar {teachers.length} guru di Markaz Qur'an dan Bahasa Arab Isy Karima.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru Baru</span>
        </button>
      </div>

      {/* Search and Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari guru berdasarkan nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Nama Pengajar</th>
                <th className="p-4">Email / Username</th>
                <th className="p-4 w-40 text-center">Akun Login</th>
                <th className="p-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                          {teacher.name.replace(/Ust\.\s*|Usth\.\s*/g, '').charAt(0)}
                        </div>
                        <span>{teacher.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium font-mono text-xs">
                      {teacher.email}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">
                        Aktif
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                          title="Edit Guru"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition"
                          title="Hapus Guru"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ditemukan guru yang cocok dengan pencarian Anda.
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-indigo-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {selectedTeacher ? 'Edit Informasi Guru' : 'Tambah Guru Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-indigo-700/85 transition"
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
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap (Sertakan Gelar Ust./Usth.)</label>
                <div className="relative">
                  <User className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ust. Abdurrahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Resmi MQBA</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: abdurrahman@mqba.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {selectedTeacher ? 'Ganti Password (Kosongkan jika tetap)' : 'Kata Sandi Akun'}
                </label>
                <div className="relative">
                  <Key className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder={selectedTeacher ? 'Minimal 6 karakter' : 'Default: guru123'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!selectedTeacher && (
                  <p className="text-[10px] text-slate-400 italic">Jika dikosongkan, sandi otomatis diset ke "guru123".</p>
                )}
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
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {selectedTeacher ? 'Simpan Perubahan' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
