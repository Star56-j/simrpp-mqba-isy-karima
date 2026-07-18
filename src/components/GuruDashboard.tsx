import React from 'react';
import { 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileEdit,
  ArrowRight,
  PlusCircle,
  FileWarning
} from 'lucide-react';
import { GuruStats, RPP, TeachingSchedule } from '../types';
import RealTimeClock from './RealTimeClock';

interface GuruDashboardProps {
  stats: GuruStats;
  schedules: TeachingSchedule[];
  rpps: RPP[];
  onNavigate: (view: string, targetTab?: string) => void;
}

export default function GuruDashboard({ 
  stats, 
  schedules, 
  rpps, 
  onNavigate,
}: GuruDashboardProps) {
  // Get schedules for current teacher
  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const mySchedules = schedules.filter(s => s.teacherId === myUser.teacherId);
  const myRpps = rpps.filter(r => r.teacherId === myUser.teacherId);
  
  // Find RPPs in "Revisi" state
  const revisionRpps = myRpps.filter(r => r.status === 'Revisi');

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
              Dashboard Pengajar
            </h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-lg leading-relaxed">
              Ahlan wa sahlan, <strong className="text-amber-400 font-extrabold">{myUser.name}</strong>. Kelola dan susun rencana pembelajaran (RPP) harian Anda dengan mudah.
            </p>
          </div>
          
          <RealTimeClock />
        </div>
      </div>

      {/* RPP Dashboard Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { 
            label: 'Draft RPP', 
            val: stats.rpp.draft, 
            icon: FileEdit, 
            color: 'bg-slate-500',
            bg: 'bg-slate-50 dark:bg-slate-900/40',
            border: 'border-slate-100 dark:border-slate-800',
            textColor: 'text-slate-700 dark:text-slate-300'
          },
          { 
            label: 'Menunggu Review', 
            val: stats.rpp.pending, 
            icon: Clock, 
            color: 'bg-amber-500',
            bg: 'bg-amber-50/40 dark:bg-amber-950/20',
            border: 'border-amber-100/50 dark:border-amber-900/30',
            textColor: 'text-amber-700 dark:text-amber-400'
          },
          { 
            label: 'Disetujui', 
            val: stats.rpp.approved, 
            icon: CheckCircle, 
            color: 'bg-indigo-600',
            bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
            border: 'border-indigo-100/50 dark:border-indigo-900/30',
            textColor: 'text-indigo-700 dark:text-indigo-400'
          },
          { 
            label: 'Perlu Revisi', 
            val: stats.rpp.revision, 
            icon: AlertCircle, 
            color: 'bg-rose-500',
            bg: 'bg-rose-50/40 dark:bg-rose-950/20',
            border: 'border-rose-100/50 dark:border-rose-900/30',
            textColor: 'text-rose-700 dark:text-rose-400'
          },
          { 
            label: 'Total RPP Saya', 
            val: stats.rpp.total, 
            icon: FileText, 
            color: 'bg-indigo-800',
            bg: 'bg-indigo-900/10 dark:bg-indigo-950/20',
            border: 'border-indigo-800/20 dark:border-indigo-900/30',
            textColor: 'text-indigo-800 dark:text-indigo-400'
          },
        ].map((item, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border ${item.border} ${item.bg} shadow-xs flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <item.icon className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{item.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Items: Revisions and Pending Work */}
      {revisionRpps.length > 0 && (
        <div className="p-5 rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 space-y-4">
          <div className="flex items-center space-x-3 text-rose-800 dark:text-rose-400">
            <FileWarning className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider leading-none">Aksi Diperlukan: RPP Perlu Direvisi</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-1">Ditemukan {revisionRpps.length} RPP yang dikembalikan oleh Kurikulum untuk diperbaiki.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {revisionRpps.map((rpp) => (
              <div 
                key={rpp.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {rpp.subject?.name} - Kelas {rpp.class?.name} (Pertemuan ke-{rpp.meetingNo})
                  </span>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    Catatan Revisi: <em className="italic font-normal">"{rpp.revisionNotes}"</em>
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('my-rpps', 'history')}
                  className="self-end md:self-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] tracking-wide uppercase shadow-sm transition flex-shrink-0 flex items-center space-x-1.5"
                >
                  <span>Revisi Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Schedules Quick-add Module */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Jadwal Mengajar Saya</h3>
          <p className="text-slate-400 text-xs mt-0.5">Pilih jadwal mengajar aktif untuk membuat RPP pembelajaran.</p>
        </div>

        {mySchedules.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">Tidak ada jadwal mengajar terdaftar.</p>
            <p className="text-xs">Hubungi Bagian Kurikulum untuk menetapkan jadwal KBM Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySchedules.map((sch) => {
              // Find if RPP already exists for this schedule to show indicator
              const hasRpp = myRpps.some(r => r.scheduleId === sch.id);
              
              return (
                <div 
                  key={sch.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wide">
                        {sch.day}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{sch.time}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">{sch.subject?.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Kelas {sch.class?.name}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase ${hasRpp ? 'text-indigo-600' : 'text-amber-500'}`}>
                      {hasRpp ? '● RPP Terbuat' : '○ Belum Ada RPP'}
                    </span>
                    <button
                      onClick={() => onNavigate('my-rpps')}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Buat RPP</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
