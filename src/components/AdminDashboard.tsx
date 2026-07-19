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
  User,
  ExternalLink,
  Star,
  Sparkles
} from 'lucide-react';
import { AdminStats, RPP } from '../types';
import { api } from '../api';
import RealTimeClock from './RealTimeClock';

interface AdminDashboardProps {
  stats: AdminStats;
  onNavigate: (view: string) => void;
  rpps: RPP[];
}

/* ═══ SVG Ornamen Bintang Octagonal Abbasiyah ═══ */
function OctagonalStar({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none">
      {/* Bintang octagonal — simbol ilmu pengetahuan era Abbasiyah */}
      <polygon
        points="50,2 61,28 90,10 72,39 98,50 72,61 90,90 61,72 50,98 39,72 10,90 28,61 2,50 28,39 10,10 39,28"
        fill="currentColor"
        opacity="0.15"
      />
      <polygon
        points="50,15 58,35 80,22 67,42 85,50 67,58 80,78 58,65 50,85 42,65 20,78 33,58 15,50 33,42 20,22 42,35"
        fill="currentColor"
        opacity="0.25"
      />
    </svg>
  );
}

/* ═══ SVG Lengkungan Tapal Kuda (Horseshoe Arch) ═══ */
function HorseshoeArch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} fill="none" preserveAspectRatio="none">
      <path
        d="M0,60 L0,30 Q0,0 30,0 L170,0 Q200,0 200,30 L200,60"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.15"
      />
      <path
        d="M10,60 L10,32 Q10,8 35,8 L165,8 Q190,8 190,32 L190,60"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.08"
      />
    </svg>
  );
}

/* ═══ Dekoratif border emas di bawah header ═══ */
function GoldDivider() {
  return (
    <div className="flex items-center justify-center space-x-2 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <svg width="16" height="16" viewBox="0 0 100 100" className="text-amber-500/40 flex-shrink-0">
        <polygon
          points="50,0 61,28 93,10 72,39 100,50 72,61 93,90 61,72 50,100 39,72 7,90 28,61 0,50 28,39 7,10 39,28"
          fill="currentColor"
        />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
    </div>
  );
}

export default function AdminDashboard({ stats, onNavigate, rpps }: AdminDashboardProps) {
  const pendingRpps = rpps.filter(r => r.status === 'Menunggu Persetujuan').slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ═══════════ HERO HEADER — Tema Dinasti Abbasiyah ═══════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-2xl shadow-2xl shadow-indigo-950/40 border border-indigo-800/40">
        {/* Layer 1: Background Image — Baghdad / Baitul Hikmah */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
          <img 
            src="/abbasid-bg.png" 
            alt="Kejayaan Dinasti Abbasiyah — Baghdad" 
            className="w-full h-full object-cover object-center opacity-30 mix-blend-screen"
          />
        </div>

        {/* Layer 2: Pola Geometris Abbasiyah */}
        <div className="absolute inset-0 z-[1] abbasid-geometric pointer-events-none" />

        {/* Layer 3: Gradient Overlay */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-indigo-950/95 via-indigo-900/70 to-indigo-950/50 pointer-events-none" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Layer 4: Decorative Stars */}
        <OctagonalStar className="absolute top-3 right-8 z-[3] text-amber-400 animate-twinkle" size={32} />
        <OctagonalStar className="absolute top-12 right-32 z-[3] text-amber-400 animate-twinkle-delay" size={20} />
        <OctagonalStar className="absolute bottom-8 right-16 z-[3] text-amber-400 animate-twinkle-slow" size={24} />
        <OctagonalStar className="absolute top-6 right-56 z-[3] text-amber-300 animate-twinkle-slow" size={14} />

        {/* Gold shimmer line di atas */}
        <div className="absolute top-0 left-0 right-0 h-1 z-[4] gold-shimmer" />

        {/* Konten Header */}
        <div className="relative z-10 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              {/* Label & Ornamen */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <svg width="14" height="14" viewBox="0 0 100 100" className="text-amber-400">
                    <polygon points="50,0 61,28 93,10 72,39 100,50 72,61 93,90 61,72 50,100 39,72 7,90 28,61 0,50 28,39 7,10 39,28" fill="currentColor" />
                  </svg>
                  <span className="w-8 h-0.5 bg-amber-400 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
                  Akademik MQBA Isy Karima
                </span>
              </div>

              {/* Judul */}
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Dashboard Administrasi
              </h1>

              {/* Deskripsi */}
              <p className="text-indigo-200/80 text-sm max-w-lg leading-relaxed">
                Ringkasan data akademik dan status rencana pembelajaran
                Markaz Qur'an dan Bahasa Arab Isy Karima.
              </p>

              {/* Quote Inspiratif */}
              <div className="flex items-start space-x-2 mt-1 pt-3 border-t border-amber-400/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-200/50 italic leading-relaxed max-w-md font-arabic">
                  "Tuntutlah ilmu walau sampai ke negeri Tiongkok."
                  <span className="not-italic text-[10px] text-amber-400/40 ml-1.5 font-sans">— HR. Ibnu Majah</span>
                </p>
              </div>
            </div>
            
            <RealTimeClock />
          </div>

          {/* Gold Divider di bawah */}
          <div className="mt-6">
            <GoldDivider />
          </div>
        </div>
      </div>

      {/* ═══════════ STATS GRID — Aksen Emas Abbasiyah ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Data Guru', 
            val: stats.teachers, 
            icon: Users, 
            gradient: 'from-indigo-600 to-indigo-700',
            glow: 'bg-indigo-500',
            view: 'master-teachers',
            desc: 'Pengajar MQBA'
          },
          { 
            label: 'Mata Pelajaran', 
            val: stats.subjects, 
            icon: BookOpen, 
            gradient: 'from-teal-500 to-teal-600',
            glow: 'bg-teal-500',
            view: 'master-subjects',
            desc: 'Mapel terdaftar'
          },
          { 
            label: 'Data Kelas', 
            val: stats.classes, 
            icon: GraduationCap, 
            gradient: 'from-indigo-700 to-indigo-800',
            glow: 'bg-indigo-600',
            view: 'master-classes',
            desc: 'I\'dad & Wustho'
          },
          { 
            label: 'Jadwal KBM', 
            val: stats.schedules, 
            icon: Calendar, 
            gradient: 'from-teal-600 to-teal-700',
            glow: 'bg-teal-600',
            view: 'master-schedules',
            desc: 'Sesi aktif mengajar'
          },
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => onNavigate(item.view)}
            className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden abbasid-border-top"
          >
            {/* Decorative glow */}
            <div className={`absolute top-0 right-0 w-28 h-28 ${item.glow} opacity-[0.04] blur-2xl rounded-full transition-all duration-300 group-hover:scale-150 group-hover:opacity-[0.08]`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{item.val}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{item.desc}</span>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md shadow-indigo-950/10`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-200">
              <span>Kelola data</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ RPP STATUS — Alur Persetujuan ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RPP Overview Circular Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between abbasid-border-top">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Alur Persetujuan RPP</h3>
            <p className="text-slate-400 text-xs mt-0.5">Statistik sebaran status RPP</p>
          </div>
          
          <div className="py-6 flex items-center justify-center relative">
            {/* Visual Progress Doughnut Ring using SVG */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
              {/* Approved Arc */}
              <circle 
                cx="72" 
                cy="72" 
                r="60" 
                className="stroke-indigo-500 fill-none" 
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - (stats.rpp.approved / (stats.rpp.total || 1)))}`}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.rpp.total}</span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total RPP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100/55 dark:border-indigo-900/30 flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold leading-none uppercase">Disetujui</span>
                <span className="text-sm font-extrabold text-indigo-900 dark:text-white mt-0.5 block">{stats.rpp.approved}</span>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100/55 dark:border-amber-900/30 flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold leading-none uppercase">Menunggu</span>
                <span className="text-sm font-extrabold text-amber-900 dark:text-white mt-0.5 block">{stats.rpp.pending}</span>
              </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100/55 dark:border-rose-900/30 flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-rose-700 dark:text-rose-400 font-semibold leading-none uppercase">Revisi</span>
                <span className="text-sm font-extrabold text-rose-900 dark:text-white mt-0.5 block">{stats.rpp.revision}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center space-x-2.5">
              <FileEdit className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-none uppercase">Draft</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5 block">{stats.rpp.draft}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approval List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between abbasid-border-top">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Antrean Persetujuan RPP</h3>
                <p className="text-slate-400 text-xs mt-0.5">Rencana pembelajaran baru dari guru menunggu review</p>
              </div>
              <button 
                onClick={() => onNavigate('manage-rpps')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Semua</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingRpps.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle className="w-12 h-12 text-indigo-500/20 mx-auto" />
                <p className="text-sm font-medium">Bagus sekali! Semua RPP telah direview.</p>
                <p className="text-xs text-slate-400">Tidak ada pengajuan RPP baru yang masuk.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingRpps.map((rpp) => (
                  <div 
                    key={rpp.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                        {rpp.teacher?.name.replace(/Ust\.?\s*|Usth\.?\s*/g, '').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{rpp.teacher?.name}</span>
                        <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{rpp.subject?.name}</span>
                          <span>•</span>
                          <span>Kelas {rpp.class?.name}</span>
                          <span>•</span>
                          <span>TA {rpp.academicYear?.name || '-'}</span>
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate('manage-rpps')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] tracking-wide uppercase shadow-xs transition"
                    >
                      Proses
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <span className="text-xs text-slate-400">
              Menampilkan {Math.min(pendingRpps.length, 5)} dari {stats.rpp.pending} antrean persetujuan.
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════ ACTIVITY LOGS ═══════════ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs abbasid-border-top">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Log Aktivitas Terbaru</h3>
            <p className="text-slate-400 text-xs mt-0.5">Rekam jejak tindakan admin dan pengajar secara real-time</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 w-40">Waktu</th>
                <th className="pb-3 w-44">Pengguna</th>
                <th className="pb-3 w-40">Tindakan</th>
                <th className="pb-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
              {stats.activityLogs && stats.activityLogs.length > 0 ? (
                stats.activityLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${log.userRole === 'Admin' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                        <span className="truncate max-w-40">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${log.action.includes('Buat') || log.action.includes('Tambah') ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30' : ''}
                        ${log.action.includes('Hapus') ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' : ''}
                        ${log.action.includes('Review') || log.action.includes('Salin') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' : ''}
                        ${!log.action.includes('Buat') && !log.action.includes('Tambah') && !log.action.includes('Hapus') && !log.action.includes('Review') && !log.action.includes('Salin') ? 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-700' : ''}
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
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
