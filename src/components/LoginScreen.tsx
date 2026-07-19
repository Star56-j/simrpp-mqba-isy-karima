import React from 'react';
import {
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  GraduationCap
} from 'lucide-react';
import { api } from '../api';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const [loginType, setLoginType] = React.useState<'guru' | 'wali'>('guru');
  const [nis, setNis] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'guru') {
        try {
          const res = await api.login(email, password);
          onLoginSuccess(res.user);
        } catch (err: any) {
          setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
        }
      } else {
        try {
          const res = await api.waliLogin(nis);
          onLoginSuccess(res.user);
        } catch (err: any) {
          setError(err.message || 'Data wali santri tidak ditemukan.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 font-sans selection:bg-blue-600 selection:text-white dark:bg-slate-950 sm:px-6">
      <div className="login-batik-pattern absolute inset-0 opacity-55 dark:opacity-20" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.94)_0%,rgba(226,232,240,0.74)_46%,rgba(30,58,138,0.12)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9)_0%,rgba(2,6,23,0.92)_65%,rgba(0,0,0,0.98)_100%)]" aria-hidden="true" />
      <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-blue-900 via-indigo-600 to-blue-900" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
        <section className="grid w-full max-w-3xl overflow-hidden rounded-[2rem] border border-blue-500/50 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm dark:border-blue-700/30 dark:bg-slate-900/95 md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex min-h-60 flex-col justify-between overflow-hidden bg-blue-950 px-6 py-7 sm:px-8 sm:py-8 text-white md:min-h-[500px]">
            <div className="login-batik-pattern absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-blue-900/70" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full border-[30px] border-blue-400/10" aria-hidden="true" />
 
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-100/50 bg-white p-1.5 shadow-md">
                  <img src="/logo-mqba.png" alt="Logo MQBA Isy Karima" className="h-full w-full object-contain" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-300 to-transparent" />
              </div>
              <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-blue-300">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Sistem Akademik Digital
              </p>
              <h1 className="max-w-sm text-xl font-black leading-tight sm:text-2xl">
                Akademik MQBA<br />Isy Karima
              </h1>
              <p className="mt-3 max-w-xs text-[11px] leading-5 text-blue-100/70">
                Ruang terpadu untuk mengelola pembelajaran dengan semangat pendidikan.
              </p>
            </div>
 
            <div className="relative mt-8 border-l-2 border-blue-400 pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-300">Motif Kawung Solo</p>
              <p className="mt-0.5 text-[10px] leading-4 text-blue-100/60">Melambangkan kesucian niat, keteraturan, dan kebijaksanaan.</p>
            </div>
          </div>
 
          <div className="flex items-center bg-white px-6 py-7 dark:bg-slate-900 sm:px-8 sm:py-8">
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
              <div>
                <span className="inline-block rounded-full border border-indigo-200/30 bg-indigo-50 px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.2em] text-indigo-700 dark:bg-indigo-950 dark:text-blue-300">
                  Selamat Datang
                </span>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white">Silakan Masuk</h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Masukkan akun Anda untuk mengakses sistem pembelajaran MQBA.</p>
              </div>
 
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="h-1.5 w-1.5 rotate-45 border border-slate-300 dark:border-slate-600" />
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
 
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}
 
              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => { setLoginType('guru'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-[9px] font-extrabold uppercase tracking-wider transition ${loginType === 'guru' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-blue-300'}`}
                >
                  <Users className="inline-block h-3 w-3 mr-1 -mt-0.5" />
                  Ustadz dan Ustadzah
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginType('wali'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-[9px] font-extrabold uppercase tracking-wider transition ${loginType === 'wali' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-blue-300'}`}
                >
                  <GraduationCap className="inline-block h-3 w-3 mr-1 -mt-0.5" />
                  Wali Santri
                </button>
              </div>
 
              {loginType === 'guru' ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="pengajar@isykarima.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Kata Sandi</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="nis" className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Nama Lengkap Santri</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                    <input
                      id="nis"
                      name="nis"
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Abdullah"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                    Masukkan nama lengkap anak Anda untuk melihat nilai dan rapor. Hubungi bagian akademik jika nama tidak ditemukan.
                  </p>
                </div>
              )}
 
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
              >
                <span>{loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
 
              <p className="pt-1.5 text-center text-[9px] leading-4 text-slate-400 dark:text-slate-500">
                Akademik MQBA Isy Karima · Karanganyar<br />
                © 2026 Sistem Manajemen Pembelajaran Terpadu
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
