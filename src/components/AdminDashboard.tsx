import React from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileEdit,
  ArrowRight,
  Activity,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Bell,
  LayoutGrid
} from 'lucide-react';
import { AdminStats, RPP } from '../types';
import { api } from '../api';
import RealTimeClock from './RealTimeClock';

interface AdminDashboardProps {
  stats: AdminStats;
  onNavigate: (view: string) => void;
  rpps: RPP[];
}

const HADITH = [
  { text: '"Tuntutlah ilmu walau sampai ke negeri Tiongkok."', src: 'HR. Ibnu Majah' },
  { text: '"Barang siapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan jalannya menuju surga."', src: 'HR. Muslim' },
  { text: '"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."', src: 'HR. Ahmad' },
];

export default function AdminDashboard({ stats, onNavigate, rpps }: AdminDashboardProps) {
  const pendingRpps = rpps.filter(r => r.status === 'Menunggu Persetujuan').slice(0, 5);
  const hadith = HADITH[new Date().getDate() % HADITH.length];

  const statCards = [
    { label: 'Data Guru', val: stats.teachers, icon: Users,          color: '#0ea5e9', bg: '#e0f2fe', view: 'master-teachers',  desc: 'Pengajar aktif', trend: '+2 bulan ini' },
    { label: 'Data Santri', val: stats.santri, icon: GraduationCap,  color: '#8b5cf6', bg: '#ede9fe', view: 'master-santri',   desc: 'Santri terdaftar', trend: `${stats.santri} total` },
    { label: 'Mata Pelajaran', val: stats.subjects, icon: BookOpen,  color: '#10b981', bg: '#d1fae5', view: 'master-subjects', desc: 'Mapel terdaftar', trend: 'I\'dad & Wustho' },
    { label: 'Data Kelas', val: stats.classes, icon: LayoutGrid,     color: '#f59e0b', bg: '#fef3c7', view: 'master-classes',  desc: 'Kelas aktif', trend: '7 kelas' },
    { label: 'Jadwal KBM', val: stats.schedules, icon: Calendar,     color: '#ef4444', bg: '#fee2e2', view: 'master-schedules',desc: 'Sesi mengajar', trend: 'Semester ini' },
  ];

  const quickActions = [
    { label: 'RPP Masuk', val: stats.rpp.pending, color: '#f59e0b', view: 'manage-rpps', icon: Clock },
    { label: 'Disetujui', val: stats.rpp.approved, color: '#10b981', view: 'manage-rpps', icon: CheckCircle },
    { label: 'Perlu Revisi', val: stats.rpp.revision, color: '#ef4444', view: 'manage-rpps', icon: AlertCircle },
    { label: 'Total RPP', val: stats.rpp.total, color: '#0ea5e9', view: 'manage-rpps', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl" style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0ea5e9 100%)',
        minHeight: 200
      }}>
        {/* Islamic geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 61,35 93,35 68,57 79,88 50,70 21,88 32,57 7,35 39,35' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)', transform: 'translate(30%, -30%)'}} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15" style={{background: 'radial-gradient(circle, #0c4a6e 0%, transparent 70%)', transform: 'translate(-30%, 30%)'}} />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse" />
                <span className="text-sky-100 text-xs font-bold uppercase tracking-widest">Akademik MQBA Isy Karima</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Dashboard Administrasi
                </h1>
                <p className="text-sky-200/80 text-sm mt-2 leading-relaxed">
                  Kelola seluruh data akademik, RPP, dan aktivitas pembelajaran secara terpusat.
                </p>
              </div>

              {/* Hadith */}
              <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10 max-w-lg">
                <Sparkles className="w-3.5 h-3.5 text-sky-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sky-100/80 text-xs italic leading-relaxed">{hadith.text}</p>
                  <p className="text-sky-300/60 text-[10px] mt-1 font-semibold">— {hadith.src}</p>
                </div>
              </div>
            </div>

            {/* Right Side: Clock */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4 hidden sm:flex">
              <RealTimeClock />
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((item, i) => (
          <button
            key={i}
            onClick={() => onNavigate(item.view)}
            className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden cursor-pointer"
          >
            {/* Glow bg */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`, transform: 'translate(30%, -30%)'}} />

            {/* Icon */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110" style={{background: item.bg}}>
              <item.icon className="w-5 h-5" style={{color: item.color}} />
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{item.val}</p>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 group-hover:gap-2" style={{color: item.color}}>
              <span>Kelola</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RPP Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Status RPP</h3>
              <p className="text-slate-400 text-xs mt-0.5">Rencana Pelaksanaan Pembelajaran</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#e0f2fe'}}>
              <FileText className="w-4 h-4" style={{color: '#0284c7'}} />
            </div>
          </div>

          {/* Donut chart */}
          <div className="px-6 py-6 flex items-center justify-center">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#0ea5e9" strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (stats.rpp.approved / (stats.rpp.total || 1)))}`}
                  style={{transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)'}}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.rpp.total}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total RPP</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-2.5">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.view)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all hover:opacity-80 cursor-pointer text-left"
                style={{background: `${a.color}10`, borderColor: `${a.color}25`}}
              >
                <a.icon className="w-4 h-4 flex-shrink-0" style={{color: a.color}} />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{color: a.color}}>{a.label}</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{a.val}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pending RPP list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Antrean Persetujuan RPP</h3>
              <p className="text-slate-400 text-xs mt-0.5">RPP baru dari guru yang menunggu review</p>
            </div>
            <button
              onClick={() => onNavigate('manage-rpps')}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition"
            >
              <span>Semua</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-6">
            {pendingRpps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: '#e0f2fe'}}>
                  <CheckCircle className="w-8 h-8" style={{color: '#0284c7'}} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Semua RPP telah direview!</p>
                  <p className="text-xs text-slate-400 mt-1">Tidak ada pengajuan RPP baru yang masuk.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRpps.map((rpp) => (
                  <div key={rpp.id}
                    className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-900/50 hover:bg-sky-50/30 dark:hover:bg-sky-950/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'}}>
                        {(rpp.teacher?.name || 'U').replace(/Ust\.?\s*|Usth\.?\s*/g, '').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{rpp.teacher?.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-semibold text-sky-600 dark:text-sky-400">{rpp.subject?.name}</span>
                          <span>·</span>
                          <span>{rpp.class?.name}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('manage-rpps')}
                      className="ml-3 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold tracking-wide uppercase transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
                      style={{background: 'linear-gradient(135deg, #0284c7, #0369a1)'}}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingRpps.length > 0 && (
            <div className="px-6 pb-4 pt-0 text-center">
              <p className="text-xs text-slate-400">
                Menampilkan {Math.min(pendingRpps.length, 5)} dari {stats.rpp.pending} antrean
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVITY LOG ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Log Aktivitas Terbaru</h3>
            <p className="text-slate-400 text-xs mt-0.5">Rekam jejak tindakan admin & pengajar secara realtime</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#e0f2fe'}}>
            <Activity className="w-4 h-4" style={{color: '#0284c7'}} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                {['Waktu', 'Pengguna', 'Tindakan', 'Keterangan'].map((h) => (
                  <th key={h} className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {stats.activityLogs && stats.activityLogs.length > 0 ? (
                stats.activityLogs.slice(0, 6).map((log) => {
                  const actionColor = log.action.includes('Buat') || log.action.includes('Tambah')
                    ? { bg: '#e0f2fe', text: '#0284c7' }
                    : log.action.includes('Hapus')
                    ? { bg: '#fee2e2', text: '#dc2626' }
                    : log.action.includes('Review') || log.action.includes('Salin')
                    ? { bg: '#fef3c7', text: '#d97706' }
                    : { bg: '#f1f5f9', text: '#64748b' };

                  const formatLogTime = (ts: string | number) => {
                    if (!ts) return '-';
                    let date: Date;
                    if (typeof ts === 'number') {
                      date = new Date(ts > 1e11 ? ts : ts * 1000);
                    } else if (!isNaN(Number(ts))) {
                      const num = Number(ts);
                      date = new Date(num > 1e11 ? num : num * 1000);
                    } else {
                      date = new Date(ts);
                    }
                    if (isNaN(date.getTime())) return String(ts);
                    return date.toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    });
                  };

                  const roleDotColor = 
                    log.userRole === 'Admin' ? 'bg-amber-500' :
                    log.userRole === 'WaliKelas' ? 'bg-emerald-500' :
                    log.userRole === 'WaliSantri' ? 'bg-purple-500' :
                    'bg-sky-500';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatLogTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${roleDotColor}`} />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{background: actionColor.bg, color: actionColor.text}}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{log.details}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                    Belum ada log aktivitas terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
