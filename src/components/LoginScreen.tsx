import React from 'react';
import {
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  GraduationCap,
  X,
  BookOpen,
  Eye,
  EyeOff
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
  const [showPassword, setShowPassword] = React.useState(false);

  const [loginType, setLoginType] = React.useState<'guru' | 'walikelas' | 'walisantri'>('guru');
  const [nis, setNis] = React.useState('');

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = React.useState(false);
  const [resetStep, setResetStep] = React.useState<number>(1);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotQuestion, setForgotQuestion] = React.useState('');
  const [hasQuestion, setHasQuestion] = React.useState(false);
  const [forgotAnswer, setForgotAnswer] = React.useState('');
  const [forgotNewPass, setForgotNewPass] = React.useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = React.useState('');
  
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotError, setForgotError] = React.useState('');
  const [forgotSuccess, setForgotSuccess] = React.useState('');

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await api.getResetQuestion(forgotEmail);
      setHasQuestion(res.hasQuestion);
      if (res.hasQuestion) {
        setForgotQuestion(res.question || '');
        setResetStep(2);
      } else {
        setResetStep(3);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Akun tidak ditemukan.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    
    if (!forgotAnswer) {
      setForgotError('Jawaban keamanan harus diisi.');
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotError('Kata sandi baru minimal terdiri dari 6 karakter.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.resetSelf(forgotEmail, forgotAnswer, forgotNewPass);
      setForgotSuccess(res.message || 'Kata sandi berhasil diperbarui.');
      setTimeout(() => {
        setShowForgotModal(false);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.message || 'Terjadi kesalahan saat mereset kata sandi.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRequestAdmin = async () => {
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await api.requestAdminReset(forgotEmail);
      setForgotSuccess(res.message || 'Permintaan reset sandi berhasil dikirim.');
    } catch (err: any) {
      setForgotError(err.message || 'Gagal mengirim permintaan reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'guru' || loginType === 'walikelas') {
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
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 sm:px-6 font-sans text-slate-800  selection:bg-sky-500 selection:text-white" style={{background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)'}}>
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpolygon points='40,4 50,30 77,30 55,47 63,73 40,57 17,73 25,47 3,30 30,30' fill='none' stroke='%230369a1' stroke-width='1.5' opacity='0.3'/%3E%3C/svg%3E")`, backgroundSize: '80px 80px'}} aria-hidden="true" />
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)', transform: 'translate(-40%, -40%)'}} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15" style={{background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', transform: 'translate(40%, 40%)'}} />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col md:flex-row rounded-3xl overflow-hidden animate-fade-in shadow-2xl" style={{boxShadow: '0 20px 60px rgba(3,105,161,0.22)'}}>
        
        {/* Left Side - Illustration Panel */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-white p-5 sm:p-6 relative overflow-hidden">
          {/* Islamic Geometric Overlay (light) */}
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%230284c7' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%230284c7' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '60px 60px'}} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)', transform: 'translate(30%, -30%)'}} />

          {/* Logo & Title */}
          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-100 p-1.5 shadow-sm mb-3">
              <img src="/logo-mqba.png" alt="Logo MQBA Isy Karima" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-black leading-tight tracking-tight mb-1 text-slate-800">
              Akademik MQBA<br/>
              <span className="text-sky-600">Isy Karima</span>
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Platform terpadu mengelola pembelajaran dengan semangat pendidikan Qur'ani.
            </p>

          </div>

          {/* Illustration - Simple Islamic Flat */}
          <div className="relative z-10 flex items-center justify-center my-2 flex-1">
            <div className="relative">
              <div className="flex items-center justify-center">
                <img
                  src="/islamic_login_simple.png"
                  alt="Ilustrasi Ustadz dan Santri Belajar Qur'an"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain mix-blend-multiply"
                />
              </div>
              {/* Floating Islamic stars */}
              <div className="absolute top-1 -right-4 text-sky-400/40 text-2xl animate-float">✦</div>
              <div className="absolute bottom-4 -left-4 text-sky-500/30 text-xl" style={{animationDelay: '1s'}}>✦</div>
            </div>
          </div>

        </div>

        {/* Right Side - Form */}
        <div className="relative w-full md:w-7/12 p-5 sm:p-6 flex flex-col justify-center text-white overflow-hidden" style={{background: 'linear-gradient(160deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)'}}>
          {/* Form Islamic Ornament Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`, 
            backgroundSize: '60px 60px'
          }} />
          
          <div className="relative z-10 mb-4">
            <div className="md:hidden flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-2 shadow-lg mb-4">
              <img src="/logo-mqba.png" alt="Logo MQBA" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 text-sky-100 text-[10px] font-bold mb-3">
              <span className="w-1.5 h-1.5 bg-sky-300 rounded-full animate-pulse"></span>
              SISTEM AKADEMIK ONLINE
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Ahlan wa Sahlan</h2>
            <p className="mt-0.5 text-xs text-sky-200/80">Masukkan kredensial Anda untuk mengakses sistem.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700   ">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login Type Toggle */}
          <div className="flex rounded-xl bg-sky-900/40 p-1 mb-5 border border-white/10 relative z-10 backdrop-blur-sm overflow-x-auto whitespace-nowrap">
            <button
              type="button"
              onClick={() => { setLoginType('guru'); setError(''); }}
              className={`flex-1 min-w-[100px] rounded-lg py-2.5 px-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900 ${loginType === 'guru' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-200 hover:text-white'}`}
            >
              <Users className="h-4 w-4 shrink-0" />Pengajar
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('walikelas'); setError(''); }}
              className={`flex-1 min-w-[100px] rounded-lg py-2.5 px-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900 ${loginType === 'walikelas' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-200 hover:text-white'}`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />Wali Kelas
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('walisantri'); setError(''); }}
              className={`flex-1 min-w-[100px] rounded-lg py-2.5 px-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900 ${loginType === 'walisantri' ? 'bg-white text-sky-800 shadow-sm' : 'text-sky-200 hover:text-white'}`}
            >
              <Users className="h-4 w-4 shrink-0" />Wali Santri
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === 'guru' || loginType === 'walikelas' ? (
              <>
                <div className="space-y-2 relative z-10">
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-sky-200">Username / Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-sky-300/70" />
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder={loginType === 'walikelas' ? "contoh: wali.hasri" : "contoh: ustadz.aidil"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/10 backdrop-blur-sm py-3 pl-11 pr-4 text-sm text-white focus:border-white focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-1 focus-visible:ring-offset-sky-900 transition placeholder:text-sky-200/50"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-sky-200">Kata Sandi</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotModal(true); setForgotEmail(''); setForgotError(''); setForgotSuccess(''); setForgotAnswer(''); setForgotNewPass(''); setForgotConfirmPass(''); setResetStep(1); }}
                      className="text-xs font-bold text-sky-300 hover:text-white cursor-pointer transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900 rounded-sm"
                    >Lupa Sandi?</button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-sky-300/70" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/10 backdrop-blur-sm py-3 pl-11 pr-10 text-sm text-white focus:border-white focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-1 focus-visible:ring-offset-sky-900 transition placeholder:text-sky-200/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-300/70 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2 relative z-10">
                <label htmlFor="nis" className="block text-xs font-bold uppercase tracking-wide text-sky-200">Nama Lengkap Santri</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-sky-300/70" />
                  <input
                    id="nis"
                    name="nis"
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Abdullah"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/10 backdrop-blur-sm py-3 pl-11 pr-4 text-sm text-white focus:border-white focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-1 focus-visible:ring-offset-sky-900 transition placeholder:text-sky-200/50"
                  />
                </div>
                <p className="text-xs text-sky-200/60 pt-1">Masukkan nama lengkap santri untuk mengakses portal wali.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-md shadow-sky-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900"
              style={{background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'}}
            >
              <span>{loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-xs font-medium text-white">
              © {new Date().getFullYear()} Akademik MQBA Isy Karima · Powered by <span className="text-white font-bold">Active Node</span>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white  rounded-3xl shadow-xl overflow-hidden border border-slate-200 ">
            <div className="relative px-6 py-5 border-b border-slate-100  bg-slate-50 ">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100  text-indigo-600 ">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 ">Lupa Kata Sandi</h3>
                  <p className="text-xs text-slate-500">Khusus Pengajar</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-200  transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700    animate-fade-in">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="font-medium">{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700    animate-fade-in">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-medium">{forgotSuccess}</span>
                </div>
              )}

              {resetStep === 1 && (
                <form onSubmit={handleCheckEmail} className="space-y-4">
                  <p className="text-sm text-slate-600  leading-relaxed">
                    Masukkan username atau email Anda untuk mereset kata sandi.
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ">Username / Email</label>
                    <input
                      type="text"
                      required
                      placeholder="contoh: ustadz.aidil"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300  bg-white  text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-slate-800 "
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition shadow-md disabled:opacity-70 cursor-pointer"
                  >
                    {forgotLoading ? 'Memeriksa...' : 'Lanjutkan'}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetSelf} className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-slate-50  rounded-xl border border-slate-200 ">
                    <p className="text-xs text-slate-500 mb-1">Pertanyaan Keamanan:</p>
                    <p className="text-sm font-bold text-slate-800 ">{forgotQuestion}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ">Jawaban Anda</label>
                      <input
                        type="text"
                        required
                        placeholder="Ketik jawaban di sini"
                        value={forgotAnswer}
                        onChange={(e) => setForgotAnswer(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300  bg-white  text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ">Kata Sandi Baru</label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 6 karakter"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300  bg-white  text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ">Konfirmasi Sandi</label>
                      <input
                        type="password"
                        required
                        placeholder="Ketik ulang kata sandi baru"
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300  bg-white  text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700    rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-[2] py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition shadow-md disabled:opacity-70 cursor-pointer"
                    >
                      {forgotLoading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                    </button>
                  </div>
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleRequestAdmin}
                      disabled={forgotLoading}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-500 cursor-pointer transition hover:underline"
                    >
                      Lupa jawaban? Ajukan reset ke Admin
                    </button>
                  </div>
                </form>
              )}

              {resetStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-sm text-slate-600 ">
                    Akun <span className="font-bold text-slate-800 ">{forgotEmail}</span> belum mengatur pertanyaan keamanan.
                  </p>
                  <div className="p-4 bg-amber-50  border border-amber-200  rounded-xl text-sm text-amber-800  font-medium">
                    Silakan ajukan permohonan reset sandi ke Admin. Setelah disetujui, sandi Anda akan diatur ke sandi default (<span className="font-bold">guru123</span>).
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700    rounded-xl text-sm font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestAdmin}
                      disabled={forgotLoading}
                      className="flex-[2] py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition shadow-md disabled:opacity-70 cursor-pointer"
                    >
                      {forgotLoading ? 'Mengirim...' : 'Ajukan Reset ke Admin'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
