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
import { GuruStats, RPP, TeachingSchedule, WaliKelas } from '../types';
import RealTimeClock from './RealTimeClock';

interface GuruDashboardProps {
  stats: GuruStats;
  schedules: TeachingSchedule[];
  rpps: RPP[];
  waliKelas: WaliKelas[];
  onNavigate: (view: string, targetTab?: string) => void;
}

/* ═══ SVG Ornamen Bintang Octagonal Abbasiyah ═══ */
function OctagonalStar({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none">
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

/* ═══ Dekoratif border emas ═══ */
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

// Array kutipan ulama / ilmuwan era Abbasiyah
const ABBASID_QUOTES = [
  { text: "Barang siapa menempuh jalan untuk menuntut ilmu, Allah memudahkan baginya jalan menuju surga.", source: "HR. Muslim" },
  { text: "Ilmu itu lebih baik daripada harta. Ilmu menjaga engkau dan engkau menjaga harta.", source: "Ali bin Abi Thalib" },
  { text: "Tinta para ulama lebih berharga dari darah para syuhada.", source: "Pepatah Islam" },
  { text: "Belajarlah, karena seseorang tidak dilahirkan dalam keadaan berilmu.", source: "Imam Al-Bukhari" },
];

export default function GuruDashboard({ 
  stats, 
  schedules, 
  rpps,
  waliKelas,
  onNavigate,
}: GuruDashboardProps) {
  // Get schedules for current teacher
  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const mySchedules = schedules.filter(s => s.teacherId === myUser.teacherId);
  const myRpps = rpps.filter(r => r.teacherId === myUser.teacherId);
  
  // Wali kelas untuk guru ini
  const myWaliKelas = waliKelas.filter(w => w.teacherId === myUser.teacherId);
  
  // Find RPPs in "Revisi" state
  const revisionRpps = myRpps.filter(r => r.status === 'Revisi');

  // Pilih kutipan berdasarkan hari
  const todayQuote = ABBASID_QUOTES[new Date().getDay() % ABBASID_QUOTES.length];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ═══════════ HERO HEADER — Tema Dinasti Abbasiyah ═══════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-2xl shadow-2xl shadow-indigo-950/40 border border-indigo-800/40">
        {/* Layer 1: Background Image */}
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
                Dashboard Pengajar
              </h1>

              {/* Sapaan */}
              <p className="text-indigo-200/80 text-sm max-w-lg leading-relaxed">
                Ahlan wa sahlan, <strong className="text-amber-400 font-extrabold">{myUser.name}</strong>. 
                Kelola dan susun rencana pembelajaran (RPP) harian Anda dengan mudah.
              </p>

              {/* Quote Inspiratif era Abbasiyah */}
              <div className="flex items-start space-x-2 mt-1 pt-3 border-t border-amber-400/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-200/50 italic leading-relaxed max-w-md font-arabic">
                  "{todayQuote.text}"
                  <span className="not-italic text-[10px] text-amber-400/40 ml-1.5 font-sans">— {todayQuote.source}</span>
                </p>
              </div>
            </div>
            
            <RealTimeClock />
          </div>

          {/* Gold Divider */}
          <div className="mt-6">
            <GoldDivider />
          </div>
        </div>
      </div>

      {/* ═══════════ WIDGET WALI KELAS ═══════════ */}
      {myWaliKelas.length > 0 && (
        <div className="space-y-2">
          {myWaliKelas.map(w => (
            <div key={w.id}
              className="relative overflow-hidden flex items-center space-x-4 bg-gradient-to-r from-amber-50 to-amber-50/40 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 shadow-xs abbasid-border-top">
              {/* Glow accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl" />
              <div className="ml-2 w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-0.5">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Wali Kelas</span>
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-500 dark:text-amber-500">
                    TA {(w as any).academicYear?.name} — Semester {(w as any).semester?.name}
                  </span>
                </div>
                <p className="text-base font-extrabold text-amber-800 dark:text-amber-200 tracking-tight">
                  Kelas {(w as any).class?.name}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <button onClick={() => onNavigate('my-santri-attendance')}
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 uppercase tracking-wider transition flex items-center space-x-1">
                  <span>Absensi Santri</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ RPP METRICS — Aksen Emas ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { 
            label: 'Draft RPP', 
            val: stats.rpp.draft, 
            icon: FileEdit, 
            gradient: 'from-slate-500 to-slate-600',
            bg: 'bg-slate-50 dark:bg-slate-900/40',
            border: 'border-slate-100 dark:border-slate-800',
          },
          { 
            label: 'Menunggu Review', 
            val: stats.rpp.pending, 
            icon: Clock, 
            gradient: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50/40 dark:bg-amber-950/20',
            border: 'border-amber-100/50 dark:border-amber-900/30',
          },
          { 
            label: 'Disetujui', 
            val: stats.rpp.approved, 
            icon: CheckCircle, 
            gradient: 'from-indigo-600 to-indigo-700',
            bg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
            border: 'border-indigo-100/50 dark:border-indigo-900/30',
          },
          { 
            label: 'Perlu Revisi', 
            val: stats.rpp.revision, 
            icon: AlertCircle, 
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50/40 dark:bg-rose-950/20',
            border: 'border-rose-100/50 dark:border-rose-900/30',
          },
          { 
            label: 'Total RPP Saya', 
            val: stats.rpp.total, 
            icon: FileText, 
            gradient: 'from-indigo-800 to-indigo-900',
            bg: 'bg-indigo-900/10 dark:bg-indigo-950/20',
            border: 'border-indigo-800/20 dark:border-indigo-900/30',
          },
        ].map((item, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border ${item.border} ${item.bg} shadow-sm flex flex-col justify-between abbasid-border-top premium-card`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{item.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ REVISION ACTION ═══════════ */}
      {revisionRpps.length > 0 && (
        <div className="p-5 rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 space-y-4 abbasid-border-top">
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs abbasid-border-top">
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
              const hasRpp = myRpps.some(r => r.classId === sch.classId && r.subjectId === sch.subjectId && r.academicYearId === sch.academicYearId);
              
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
