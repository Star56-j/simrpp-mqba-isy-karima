import React from 'react';
import { 
  User, 
  KeyRound, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../api';
import UnsavedBar from './UnsavedBar';

interface ProfileSettingsProps {
  onRefresh: () => void;
}

export default function ProfileSettings({ onRefresh }: ProfileSettingsProps) {
  const currentUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');

  const [name, setName] = React.useState(currentUser.name || '');
  const [email, setEmail] = React.useState(currentUser.email || '');

  // Track original values to detect changes
  const [origName, setOrigName] = React.useState(currentUser.name || '');
  const [origEmail, setOrigEmail] = React.useState(currentUser.email || '');
  
  // Password Change
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  const [showOld, setShowOld] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [errorProfile, setErrorProfile] = React.useState('');
  const [successProfile, setSuccessProfile] = React.useState('');
  const [errorPass, setErrorPass] = React.useState('');
  const [successPass, setSuccessPass] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Dirty detection
  const isProfileDirty = name !== origName || email !== origEmail;

  const handleProfileUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorProfile('');
    setSuccessProfile('');
    if (!name || !email) { setErrorProfile('Nama dan Email tidak boleh kosong.'); return; }
    setSavingProfile(true);
    try {
      await api.updateProfile(name, email);
      setSuccessProfile('Profil pribadi berhasil diperbarui.');
      const updatedUser = { ...currentUser, name, email };
      localStorage.setItem('simrpp_user', JSON.stringify(updatedUser));
      setOrigName(name);
      setOrigEmail(email);
      onRefresh();
    } catch (err: any) {
      setErrorProfile(err.message || 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDiscardProfile = () => {
    setName(origName);
    setEmail(origEmail);
    setErrorProfile('');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass(''); setSuccessPass('');
    if (!oldPassword || !newPassword || !confirmPassword) { setErrorPass('Seluruh kolom kata sandi wajib diisi.'); return; }
    if (newPassword !== confirmPassword) { setErrorPass('Kata sandi baru dan konfirmasi tidak cocok.'); return; }
    if (newPassword.length < 6) { setErrorPass('Kata sandi baru minimal harus terdiri dari 6 karakter.'); return; }
    try {
      await api.changePassword(oldPassword, newPassword);
      setSuccessPass('Kata sandi berhasil diubah.');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setErrorPass(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Pengaturan Akun & Profil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Kelola informasi nama pengajar, email login, serta pengaturan keamanan kata sandi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center space-x-2">
            <User className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">Informasi Pribadi</h3>
          </div>

          <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
            {errorProfile && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{errorProfile}</span>
              </div>
            )}
            {successProfile && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>{successProfile}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="nama@isykarima.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className={`text-xs font-semibold transition ${isProfileDirty ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>
                {isProfileDirty ? '● Ada perubahan belum disimpan' : '● Tersimpan'}
              </span>
              <div className="flex items-center space-x-2">
                {isProfileDirty && (
                  <button type="button" onClick={handleDiscardProfile}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition">
                    Batalkan
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingProfile || !isProfileDirty}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition"
                >
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Password Security Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">Ganti Kata Sandi</h3>
          </div>

          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
            {errorPass && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{errorPass}</span>
              </div>
            )}
            {successPass && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center space-x-2 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>{successPass}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi Saat Ini</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi lama Anda"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 karakter rahasia"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ulangi Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition"
              >
                Ganti Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating unsaved bar untuk profil */}
      <UnsavedBar
        isDirty={isProfileDirty}
        onSave={() => handleProfileUpdate()}
        onDiscard={handleDiscardProfile}
        saving={savingProfile}
        label="Simpan Profil"
      />
    </div>
  );
}
