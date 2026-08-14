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
  FileWarning,
  Crown,
  Sparkles
} from 'lucide-react';
import { GuruStats, RPP, TeachingSchedule, WaliKelas, Subject, SchoolClass } from '../types';
import RealTimeClock from './RealTimeClock';

interface GuruDashboardProps {
  stats: GuruStats;
  schedules: TeachingSchedule[];
  rpps: RPP[];
  waliKelas: WaliKelas[];
  subjects: Subject[];
  classes: SchoolClass[];
  onNavigate: (view: string, targetTab?: string) => void;
}

export default function GuruDashboard({ 
  stats, 
  schedules, 
  rpps,
  waliKelas,
  subjects,
  classes,
  onNavigate,
}: GuruDashboardProps) {
  // Get schedules for current teacher
  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const activeTeacherId = myUser.teacherId || myUser.teacher_id;
  const mySchedules = schedules.filter(s => s.teacherId === activeTeacherId);
  const myRpps = rpps.filter(r => r.teacherId === activeTeacherId);
  
  // Wali kelas untuk guru ini
  const myWaliKelas = waliKelas.filter(w => w.teacherId === activeTeacherId);

  // Find RPPs in "Revisi" state
  const revisionRpps = myRpps.filter(r => r.status === 'Revisi');

  const hadith = { text: '"Barang siapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan jalannya menuju surga."', src: 'HR. Muslim' };

  const statCards = [
    { label: 'Draft RPP', val: stats.rpp.draft, icon: FileEdit, color: '#64748b', bg: '#f1f5f9', view: 'my-rpps', desc: 'Belum diajukan' },
    { label: 'Menunggu', val: stats.rpp.pending, icon: Clock, color: '#f59e0b', bg: '#fef3c7', view: 'my-rpps', desc: 'Proses review' },
    { label: 'Disetujui', val: stats.rpp.approved, icon: CheckCircle, color: '#10b981', bg: '#d1fae5', view: 'my-rpps', desc: 'RPP aktif' },
    { label: 'Perlu Revisi', val: stats.rpp.revision, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2', view: 'my-rpps', desc: 'Harus diperbaiki' },
    { label: 'Total RPP', val: stats.rpp.total, icon: FileText, color: '#0ea5e9', bg: '#e0f2fe', view: 'my-rpps', desc: 'Semua RPP saya' },
  ];

  const isWaliRole = myUser.role === 'WaliKelas';

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
                  {isWaliRole ? 'Dashboard Wali Kelas' : 'Dashboard Pengajar'}
                </h1>
                <p className="text-sky-200/80 text-sm mt-2 leading-relaxed">
                  Ahlan wa sahlan, <strong className="text-white">{myUser.name}</strong>. {isWaliRole ? 'Kelola kelas bimbingan dan nilai santri Anda dengan mudah.' : 'Kelola dan susun rencana pembelajaran (RPP) harian Anda dengan mudah.'}
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

            {/* Clock */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4 hidden sm:flex">
              <RealTimeClock />
            </div>
          </div>
        </div>
      </div>

      {/* ── WIDGET WALI KELAS ── */}
      {myWaliKelas.length > 0 && (
        <div className="space-y-4">
          {myWaliKelas.map(w => (
            <div key={w.id} className="relative overflow-hidden flex items-center space-x-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-sky-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wali Kelas</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-semibold text-slate-500">
                    TA {(w as any).academicYear?.name} — Semester {(w as any).semester?.name}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {(w as any).class?.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button onClick={() => onNavigate('my-santri-attendance')}
                  className="px-4 py-2 bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 uppercase tracking-wide cursor-pointer">
                  <span>Absensi Santri</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onNavigate('rekap-rapor-wali-kelas')}
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center space-x-1.5 uppercase tracking-wide cursor-pointer">
                  <span>Rekap Rapor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STAT CARDS (HANYA GURU PENGAJAR) ── */}
      {!isWaliRole && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.view)}
              className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`, transform: 'translate(30%, -30%)'}} />
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
      )}

      {/* ═══════════ REVISION ACTION ═══════════ */}
      {!isWaliRole && revisionRpps.length > 0 && (
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
                    {rpp.subject?.name} - Kelas {rpp.class?.name}
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

      {/* ═══════════ JADWAL MENGAJAR ═══════════ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Jadwal KBM</h3>
          <p className="text-slate-400 text-xs mt-0.5">Mata pelajaran dan jadwal mengajar terdaftar.</p>
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
              const hasRpp = myRpps.some(r => r.classId === sch.classId && r.subjectId === sch.subjectId && r.academicYearId === sch.academicYearId);
              
              return (
                <div 
                  key={sch.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 uppercase tracking-wide">
                        {sch.day}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{sch.time}</span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {sch.subject?.name || subjects?.find(s => s.id === sch.subjectId)?.name || 'Mata Pelajaran'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                        Kelas {sch.class?.name || classes?.find(c => c.id === sch.classId)?.name || sch.classId}
                      </p>
                    </div>
                  </div>

                  {!isWaliRole && (
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${hasRpp ? 'text-sky-600' : 'text-slate-500'}`}>
                        {hasRpp ? '● RPP Terbuat' : '○ Belum Ada RPP'}
                      </span>
                      <button
                        onClick={() => onNavigate('my-rpps')}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Buat RPP</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
