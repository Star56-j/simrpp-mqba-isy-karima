import React from 'react';
import {
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Alamat email atau kata sandi Anda salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3ead7] px-4 py-8 font-sans selection:bg-[#6f2f22] selection:text-white dark:bg-[#17120f] sm:px-6">
      <div className="login-batik-pattern absolute inset-0 opacity-55 dark:opacity-20" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,251,235,0.94)_0%,rgba(243,234,215,0.74)_46%,rgba(77,31,22,0.12)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(44,31,25,0.9)_0%,rgba(23,18,15,0.92)_65%,rgba(10,8,7,0.98)_100%)]" aria-hidden="true" />
      <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-[#35204f] via-[#b88a44] to-[#6f2f22]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#c7a86a]/50 bg-[#fffdf7]/95 shadow-[0_30px_90px_rgba(67,35,22,0.22)] backdrop-blur-sm dark:border-[#8f6b39]/30 dark:bg-[#251c18]/95 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[#402654] px-7 py-8 text-[#fff8e8] sm:px-10 sm:py-10 md:min-h-[610px]">
            <div className="login-batik-pattern absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#231434]/20 via-transparent to-[#6f2f22]/70" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full border-[36px] border-[#d0a85d]/10" aria-hidden="true" />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e1c889]/50 bg-[#fffaf0] p-2 shadow-lg">
                  <img src="/logo-mqba.png" alt="Logo MQBA Isy Karima" className="h-full w-full object-contain" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#d9bd78] to-transparent" />
              </div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#dfc88f]">
                <Sparkles className="h-3.5 w-3.5" />
                Sistem Akademik Digital
              </p>
              <h1 className="max-w-sm text-2xl font-black leading-tight sm:text-3xl">
                Akademik MQBA<br />Isy Karima
              </h1>
              <p className="mt-4 max-w-xs text-xs leading-6 text-[#efe2c5]/80">
                Ruang terpadu untuk mengelola pembelajaran dengan semangat pendidikan dan kearifan budaya Nusantara.
              </p>
            </div>

            <div className="relative mt-10 border-l-2 border-[#cfa95f] pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dfc88f]">Motif Kawung Solo</p>
              <p className="mt-1 text-xs leading-5 text-[#efe2c5]/70">Melambangkan kesucian niat, keteraturan, dan kebijaksanaan.</p>
            </div>
          </div>

          <div className="flex items-center bg-[#fffdf8] px-6 py-9 dark:bg-[#251c18] sm:px-10 sm:py-12">
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-6">
              <div>
                <span className="inline-block rounded-full border border-[#b88a44]/30 bg-[#f8eed9] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#79462e] dark:bg-[#392a21] dark:text-[#dfc88f]">
                  Selamat Datang
                </span>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-[#30211b] dark:text-[#fff8e8]">Silakan Masuk</h2>
                <p className="mt-1.5 text-xs leading-5 text-[#826f64] dark:text-[#bdaea4]">Masukkan akun Anda untuk mengakses sistem pembelajaran MQBA.</p>
              </div>

              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-px flex-1 bg-[#ddcba5] dark:bg-[#594536]" />
                <span className="h-2 w-2 rotate-45 border border-[#a9783c]" />
                <span className="h-px flex-1 bg-[#ddcba5] dark:bg-[#594536]" />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#725b4e] dark:text-[#c5b2a5]">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c7650]" aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="pengajar@isykarima.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#d8c6a5] bg-[#fffcf5] py-3.5 pl-11 pr-4 text-xs text-[#30211b] outline-none transition placeholder:text-[#aa9a8d] focus:border-[#7a4931] focus:ring-4 focus:ring-[#b88a44]/15 dark:border-[#584437] dark:bg-[#30251f] dark:text-[#fff8e8]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#725b4e] dark:text-[#c5b2a5]">Kata Sandi</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c7650]" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#d8c6a5] bg-[#fffcf5] py-3.5 pl-11 pr-4 text-xs text-[#30211b] outline-none transition placeholder:text-[#aa9a8d] focus:border-[#7a4931] focus:ring-4 focus:ring-[#b88a44]/15 dark:border-[#584437] dark:bg-[#30251f] dark:text-[#fff8e8]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a285e] to-[#6f2f22] py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg shadow-[#5b3024]/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#b88a44]/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span>{loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>

              <p className="pt-2 text-center text-[10px] leading-5 text-[#9a887b] dark:text-[#9f8e83]">
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
