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
  ExternalLink
} from 'lucide-react';
import { AdminStats, RPP } from '../types';
import { api } from '../api';
import RealTimeClock from './RealTimeClock';

interface AdminDashboardProps {
  stats: AdminStats;
  onNavigate: (view: string) => void;
  rpps: RPP[];
}

export default function AdminDashboard({ stats, onNavigate, rpps }: AdminDashboardProps) {
  const pendingRpps = rpps.filter(r => r.status === 'Menunggu Persetujuan').slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header with Islamic Ornament & Clock */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-indigo-700/50">
        {/* Ornament Background: The 3 Holy Mosques */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
          <img 
            src="/mosques-bg.png" 
            alt="Masjidil Haram, Nabawi, Baitul Maqdis" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-screen"
          />
          {/* Gradient overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-8 h-1 bg-amber-400 rounded-full"></span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Akademik MQBA Isy Karima</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Dashboard Administrasi
            </h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-lg">
              Berikut adalah ringkasan data akademik dan status rencana pembelajaran.
            </p>
          </div>
          
          <RealTimeClock />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Data Guru', 
            val: stats.teachers, 
            icon: Users, 
            color: 'bg-indigo-500', 
            view: 'master-teachers',
            desc: 'Pengajar MQBA'
          },
          { 
            label: 'Mata Pelajaran', 
            val: stats.subjects, 
            icon: BookOpen, 
            color: 'bg-teal-500', 
            view: 'master-subjects',
            desc: 'Mapel terdaftar'
          },
          { 
            label: 'Data Kelas', 
            val: stats.classes, 
            icon: GraduationCap, 
            color: 'bg-indigo-600', 
            view: 'master-classes',
            desc: 'I\'dad & Wustho'
          },
          { 
            label: 'Jadwal KBM', 
            val: stats.schedules, 
            icon: Calendar, 
            color: 'bg-teal-600', 
            view: 'master-schedules',
            desc: 'Sesi aktif mengajar'
          },
        ].map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => onNavigate(item.view)}
            className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.color} opacity-5 blur-2xl rounded-full transition-all group-hover:scale-150`}></div>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{item.val}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{item.desc}</span>
              </div>
              <div className={`p-3 rounded-xl ${item.color} text-white shadow-sm shadow-indigo-950/10`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Kelola data</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* RPP Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RPP Overview Circular Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Alur Persetujuan RPP</h3>
            <p className="text-slate-400 text-xs mt-0.5">Statistik sebaran status RPP</p>
          </div>
          
          <div className="py-6 flex items-center justify-center relative">
            {/* Visual Progress Doughnut Ring using SVG */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
              {/* Approved (Green) */}
              <circle 
                cx="72" 
                cy="72" 
                r="60" 
                className="stroke-indigo-500 fill-none" 
                strokeWidth="12" 
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - (stats.rpp.approved / (stats.rpp.total || 1)))}`}
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
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
                        {rpp.teacher?.name.replace(/Ust\.\s*|Usth\.\s*/g, '').charAt(0)}
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

      {/* Activity Logs Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Log Aktivitas Terbaru</h3>
            <p className="text-slate-400 text-xs mt-0.5">Rekam jejak tindakan admin dan pengajar secara real-time</p>
          </div>
          <Activity className="w-5 h-5 text-indigo-600" />
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
