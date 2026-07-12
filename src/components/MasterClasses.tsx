import React from 'react';
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash, 
  X, 
  AlertCircle,
  CheckCircle,
  Layers,
  CalendarDays
} from 'lucide-react';
import { SchoolClass, AcademicYear } from '../types';
import { api } from '../api';

interface MasterClassesProps {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  onRefresh: () => void;
}

export default function MasterClasses({ classes, academicYears, onRefresh }: MasterClassesProps) {
  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = React.useState(false);
  const [isAyModalOpen, setIsAyModalOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<SchoolClass | null>(null);
  const [selectedAy, setSelectedAy] = React.useState<AcademicYear | null>(null);

  // Forms
  const [className, setClassName] = React.useState('');
  const [classLevel, setClassLevel] = React.useState<'I\'dad' | 'Wustho'>('I\'dad');
  const [ayName, setAyName] = React.useState('');

  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Class Actions
  const openAddClassModal = () => {
    setSelectedClass(null);
    setClassName('');
    setClassLevel('I\'dad');
    setErrorMessage('');
    setSuccessMessage('');
    setIsClassModalOpen(true);
  };

  const openEditClassModal = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setClassLevel(cls.level);
    setErrorMessage('');
    setSuccessMessage('');
    setIsClassModalOpen(true);
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!className || !classLevel) {
      setErrorMessage('Semua kolom kelas wajib diisi.');
      return;
    }

    try {
      if (selectedClass) {
        await api.updateClass(selectedClass.id, { name: className, level: classLevel });
        setSuccessMessage('Kelas berhasil diperbarui.');
      } else {
        await api.createClass({ name: className, level: classLevel });
        setSuccessMessage('Kelas baru berhasil ditambahkan.');
      }
      setTimeout(() => {
        setIsClassModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleClassDelete = async (cls: SchoolClass) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kelas "${cls.name}"?\nSistem akan memvalidasi keterikatan jadwal.`)) {
      try {
        await api.deleteClass(cls.id);
        alert('Kelas berhasil dihapus.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Kelas tidak dapat dihapus karena telah terikat jadwal mengajar.');
      }
    }
  };

  // Academic Year Actions
  const openAddAyModal = () => {
    setSelectedAy(null);
    setAyName('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAyModalOpen(true);
  };

  const openEditAyModal = (ay: AcademicYear) => {
    setSelectedAy(ay);
    setAyName(ay.name);
    setErrorMessage('');
    setSuccessMessage('');
    setIsAyModalOpen(true);
  };

  const handleAySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!ayName) {
      setErrorMessage('Nama Tahun Ajaran wajib diisi.');
      return;
    }

    try {
      if (selectedAy) {
        await api.updateAcademicYear(selectedAy.id, ayName);
        setSuccessMessage('Tahun ajaran berhasil diperbarui.');
      } else {
        await api.createAcademicYear(ayName);
        setSuccessMessage('Tahun ajaran baru berhasil ditambahkan.');
      }
      setTimeout(() => {
        setIsAyModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleAyDelete = async (ay: AcademicYear) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Tahun Ajaran "${ay.name}"?\nSemua jadwal KBM pada tahun ajaran ini wajib dihapus terlebih dahulu.`)) {
      try {
        await api.deleteAcademicYear(ay.id);
        alert('Tahun ajaran berhasil dihapus.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Tahun ajaran tidak dapat dihapus karena terikat dengan KBM aktif.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Data Kelas & Tahun Ajaran
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Kelola jenjang kelas (I'dad & Wustho) beserta kalender tahun akademik aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">Daftar Kelas</h3>
            </div>
            <button
              onClick={openAddClassModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] uppercase tracking-wider transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">Nama Kelas</th>
                  <th className="p-4 w-40">Jenjang</th>
                  <th className="p-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {classes.length > 0 ? (
                  classes.map((cls, index) => (
                    <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                        Kelas {cls.name}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border
                          ${cls.level === 'I\'dad' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/35 dark:text-emerald-400' : 'bg-teal-50 border-teal-100 text-teal-800 dark:bg-teal-950/20 dark:border-teal-900/35 dark:text-teal-400'}
                        `}>
                          {cls.level}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditClassModal(cls)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClassDelete(cls)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition"
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
                      Belum ada kelas yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Years Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">Tahun Ajaran</h3>
            </div>
            <button
              onClick={openAddAyModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] uppercase tracking-wider transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah TA</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                  <th className="p-4 w-12 text-center font-bold">No</th>
                  <th className="p-4">Tahun Ajaran</th>
                  <th className="p-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {academicYears.length > 0 ? (
                  academicYears.map((ay, index) => (
                    <tr key={ay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                        {ay.name}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditAyModal(ay)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAyDelete(ay)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      Belum ada tahun ajaran terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Class Form Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {selectedClass ? 'Edit Informasi Kelas' : 'Tambah Kelas Baru'}
                </h3>
              </div>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1 rounded-lg hover:bg-emerald-700/85 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClassSubmit} className="p-6 space-y-4">
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PA / PI / 1 PA / 2 PI"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jenjang Akademik</label>
                <select
                  required
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as 'I\'dad' | 'Wustho')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="I'dad">I'dad</option>
                  <option value="Wustho">Wustho</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {selectedClass ? 'Simpan Perubahan' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AY Form Modal */}
      {isAyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {selectedAy ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                </h3>
              </div>
              <button onClick={() => setIsAyModalOpen(false)} className="p-1 rounded-lg hover:bg-emerald-700/85 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAySubmit} className="p-6 space-y-4">
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2026 / 2027"
                  value={ayName}
                  onChange={(e) => setAyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAyModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {selectedAy ? 'Simpan Perubahan' : 'Simpan TA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
