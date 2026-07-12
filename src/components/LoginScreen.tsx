import React from 'react';
import { 
  KeyRound, 
  Mail, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight
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

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      const response = await api.login(demoEmail, demoPass);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans selection:bg-emerald-700 selection:text-white">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] bg-emerald-800/10 dark:bg-emerald-800/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] bg-emerald-900/10 dark:bg-emerald-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Main Logo Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Emerald Brand Header */}
          <div className="bg-emerald-900 px-8 py-10 text-white relative overflow-hidden text-center">
            {/* Geometric Subtle Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div className="inline-flex p-3 rounded-2xl bg-emerald-800/75 border border-emerald-700/60 shadow-inner mb-4">
              <BookOpen className="w-7 h-7 text-emerald-300" />
            </div>

            <h2 className="text-xl font-black tracking-tight uppercase">SIMRPP MQBA</h2>
            <p className="text-emerald-300/90 text-xs font-bold uppercase tracking-widest mt-1">
              Isy Karima Karanganyar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Silakan Masuk</h3>
              <p className="text-slate-400 text-xs mt-0.5">Akses rencana pelaksanaan pembelajaran digital MQBA.</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start space-x-2.5 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="pengajar@isykarima.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Kata Sandi</label>
                <span className="text-[10px] text-slate-400 cursor-help hover:underline">Lupa Sandi?</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 disabled:bg-emerald-800/50"
            >
              <span>{loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Click Demo Box */}
          <div className="border-t border-slate-50 dark:border-slate-800/60 p-6 bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-3">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="font-extrabold uppercase tracking-wide text-[10px]">Uji Coba Demo Akun (Satu-Klik)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@isykarima.id', 'admin123')}
                className="p-3 text-left border border-amber-200 bg-amber-50/30 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/10 rounded-xl transition cursor-pointer"
              >
                <span className="block font-black text-amber-800 dark:text-amber-400 text-[11px]">Role Admin</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">admin@isykarima.id</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('ustadz.malik@isykarima.id', 'guru123')}
                className="p-3 text-left border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/10 rounded-xl transition cursor-pointer"
              >
                <span className="block font-black text-emerald-800 dark:text-emerald-400 text-[11px]">Role Guru</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block truncate">ustadz.malik@isykarima.id</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-[10px] text-slate-400 leading-normal">
          SIMRPP MQBA Isy Karima — Sistem Manajemen Pembelajaran Terpadu<br/>
          Copyright © 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}
