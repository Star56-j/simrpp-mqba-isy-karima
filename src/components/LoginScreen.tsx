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
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 font-sans selection:bg-indigo-600 selection:text-white dark:bg-slate-950 sm:px-6">
      <div className="login-batik-pattern absolute inset-0 opacity-55 dark:opacity-20" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.92)_0%,rgba(226,232,240,0.7)_46%,rgba(79,70,229,0.08)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9)_0%,rgba(2,6,23,0.95)_65%,rgba(0,0,0,0.98)_100%)]" aria-hidden="true" />
      <div className="absolute left-0 top-0 h-2.5 w-full bg-gradient-to-r from-indigo-900 via-indigo-500 to-indigo-900 shadow-sm" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
        <section className="grid w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-indigo-500/20 dark:border-indigo-500/10 bg-white/70 dark:bg-slate-900/60 shadow-[0_25px_70px_-15px_rgba(31,38,135,0.12)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl md:grid-cols-[0.85fr_1.15fr] glass-panel">
          <div className="relative flex min-h-60 flex-col justify-between overflow-hidden bg-indigo-950 px-6 py-8 sm:px-8 sm:py-9 text-white md:min-h-[520px]">
            <div className="login-batik-pattern absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-indigo-900/80" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full border-[30px] border-indigo-500/10" aria-hidden="true" />
 
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100/30 bg-white p-1.5 shadow-lg shadow-indigo-950/20">
                  <img src="/logo-mqba.png" alt="Logo MQBA Isy Karima" className="h-full w-full object-contain" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-400/50 to-transparent" />
              </div>
              <p className="mb-2.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Sistem Akademik Digital
              </p>
              <h1 className="max-w-sm text-2xl font-black leading-tight sm:text-3xl tracking-tight">
                Akademik MQBA<br /><span className="bg-gradient-to-r from-amber-200 to-indigo-200 bg-clip-text text-transparent">Isy Karima</span>
              </h1>
              <p className="mt-3.5 max-w-xs text-[11px] leading-5 text-indigo-200/70">
                Ruang terpadu untuk mengelola pembelajaran dengan semangat pendidikan qur'ani.
              </p>
            </div>
 
            <div className="relative mt-8 border-l-2 border-amber-400/80 pl-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-amber-400">Motif Kawung Solo</p>
              <p className="mt-1 text-[10px] leading-4 text-indigo-100/60 font-medium">Melambangkan kesucian niat, keteraturan, dan kebijaksanaan.</p>
            </div>
          </div>
 
          <div className="flex items-center px-6 py-8 sm:px-10 sm:py-10 bg-transparent">
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
              <div>
                <span className="inline-block rounded-full border border-indigo-200/30 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                  Selamat Datang
                </span>
                <h2 className="mt-2.5 text-2xl font-black tracking-tight text-slate-800 dark:text-white">Silakan Masuk</h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Masukkan kredensial Anda untuk mengakses sistem pembelajaran MQBA.</p>
              </div>
 
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800/80" />
                <span className="h-1.5 w-1.5 rotate-45 border border-slate-300 dark:border-slate-700" />
                <span className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800/80" />
              </div>
 
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/30 dark:bg-rose-950/20 p-3 text-[11px] text-rose-700 dark:text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="leading-relaxed font-semibold">{error}</span>
                </div>
              )}
 
              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-950/80 p-1 border border-slate-200/30 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => { setLoginType('guru'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${loginType === 'guru' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-white shadow-md' : 'text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  <Users className="inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Asatidzah
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginType('wali'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${loginType === 'wali' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-white shadow-md' : 'text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  <GraduationCap className="inline-block h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                  Wali Santri
                </button>
              </div>
 
              {loginType === 'guru' ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="pengajar@isykarima.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 input-premium"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Kata Sandi</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 input-premium"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="nis" className="block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Nama Lengkap Santri</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" aria-hidden="true" />
                    <input
                      id="nis"
                      name="nis"
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Abdullah"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pl-10 pr-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600 input-premium"
                    />
                  </div>
                  <p className="text-[10px] leading-4 text-slate-400 dark:text-slate-500">
                    Masukkan nama lengkap anak Anda untuk melihat nilai dan rapor. Hubungi bagian akademik jika nama tidak ditemukan.
                  </p>
                </div>
              )}
 
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-750 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-indigo-950/20 hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-350 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
              >
                <span>{loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
 
              <p className="pt-1.5 text-center text-[9px] leading-4 text-slate-400 dark:text-slate-500 font-medium">
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
