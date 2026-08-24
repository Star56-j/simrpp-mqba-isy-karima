import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  LayoutGrid, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Activity, 
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Sparkles,
  PieChart,
  BarChart3,
  TrendingUp,
  Layers,
  UserCheck,
  Award,
  ShieldCheck,
  FileEdit,
  CheckCircle2
} from 'lucide-react';
import { AdminStats, RPP, Teacher, Santri, Subject, SchoolClass, TeachingSchedule, AcademicYear, Semester, WaliKelas, SantriAttendance, Attendance, Nilai, EvaluasiPembelajaran, EvaluasiWaliKelas } from '../types';
import { api } from '../api';
import RealTimeClock from './RealTimeClock';

interface AdminDashboardProps {
  stats: AdminStats;
  onNavigate: (view: string) => void;
  rpps: RPP[];
  teachers?: Teacher[];
  santriList?: Santri[];
  subjects?: Subject[];
  classes?: SchoolClass[];
  schedules?: TeachingSchedule[];
  academicYears?: AcademicYear[];
  semesters?: Semester[];
  waliKelas?: WaliKelas[];
}

const HADITH = [
  { text: '"Menuntut ilmu itu wajib atas setiap muslim."', src: 'HR. Ibnu Majah' },
  { text: '"Sebaik-baik kalian adalah orang yang belajar Al-Qur\'an dan mengajarkannya."', src: 'HR. Bukhari' },
  { text: '"Barang siapa yang menempuh jalan untuk menuntut ilmu, Allah akan memudahkan jalannya menuju surga."', src: 'HR. Muslim' },
  { text: '"Sesungguhnya para malaikat meletakkan sayap-sayapnya untuk penuntut ilmu karena ridha terhadap apa yang ia cari."', src: 'HR. Abu Dawud & Tirmidzi' },
  { text: '"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."', src: 'HR. Ahmad' },
];

export default function AdminDashboard({ 
  stats, 
  onNavigate, 
  rpps,
  teachers = [],
  santriList = [],
  subjects = [],
  classes = [],
  schedules = [],
  academicYears = [],
  semesters = [],
  waliKelas = []
}: AdminDashboardProps) {
  // Real data state
  const [realSantriAttendances, setRealSantriAttendances] = useState<SantriAttendance[]>([]);
  const [realTeacherAttendances, setRealTeacherAttendances] = useState<Attendance[]>([]);
  const [realNilaiList, setRealNilaiList] = useState<Nilai[]>([]);
  const [realEvaluasiList, setRealEvaluasiList] = useState<EvaluasiPembelajaran[]>([]);
  const [realEvaluasiWaliList, setRealEvaluasiWaliList] = useState<EvaluasiWaliKelas[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminRealData() {
      try {
        const [sAttendances, tAttendances, nilaiData, evalData, evalWaliData] = await Promise.all([
          api.getSantriAttendances().catch(() => []),
          api.getAttendances().catch(() => []),
          api.getNilai().catch(() => []),
          api.getEvaluasi().catch(() => []),
          api.getEvaluasiWaliKelas().catch(() => [])
        ]);

        if (isMounted) {
          setRealSantriAttendances(sAttendances);
          setRealTeacherAttendances(tAttendances);
          setRealNilaiList(nilaiData);
          setRealEvaluasiList(evalData);
          setRealEvaluasiWaliList(evalWaliData);
        }
      } catch (err) {
        console.error('Error fetching admin real data:', err);
      }
    }
    loadAdminRealData();
    return () => { isMounted = false; };
  }, []);

  const pendingRpps = rpps.filter(r => r.status === 'Menunggu Persetujuan' || (r as any).status === 'Pending').slice(0, 5);
  const hadith = HADITH[new Date().getDate() % HADITH.length];

  const totalRpp = stats.rpp.total > 0 ? stats.rpp.total : (rpps.length > 0 ? rpps.length : 1);
  const approvedCount = stats.rpp.approved || rpps.filter(r => r.status === 'Disetujui').length;
  const pendingCount = stats.rpp.pending || rpps.filter(r => r.status === 'Menunggu Persetujuan' || (r as any).status === 'Pending').length;
  const revisionCount = stats.rpp.revision || rpps.filter(r => r.status === 'Revisi' || (r as any).status === 'Perlu Revisi').length;
  
  const approvedPct = Math.round((approvedCount / totalRpp) * 100);
  const pendingPct = Math.round((pendingCount / totalRpp) * 100);
  const revisionPct = Math.round((revisionCount / totalRpp) * 100);
  const draftPct = Math.max(0, 100 - approvedPct - pendingPct - revisionPct);

  const totalSantri = santriList.length || stats.santri || 1;

  // Real attendance computation for school
  const totalTAttendances = realTeacherAttendances.length;
  const totalTHadir = realTeacherAttendances.filter(a => a.status === 'Hadir').length;
  const teacherPresensiPct = totalTAttendances > 0 ? Math.round((totalTHadir / totalTAttendances) * 100) : 100;

  let sHadir = 0;
  let sTotal = 0;
  realSantriAttendances.forEach(a => {
    if (a.status) {
      if (a.status === 'Hadir') sHadir++;
      sTotal++;
    } else {
      sHadir += (a.jumlahHadir || 0);
      sTotal += (a.jumlahHadir || 0) + (a.jumlahIzin || 0) + (a.jumlahSakit || 0) + (a.jumlahAlpha || 0);
    }
  });
  const santriPresensiPct = sTotal > 0 ? Math.round((sHadir / sTotal) * 100) : (realSantriAttendances.length > 0 ? 100 : 0);
  const schoolPresensiPct = Math.round((teacherPresensiPct + santriPresensiPct) / 2);

  // Real grades computation
  const totalExpectedSchoolGrades = (totalSantri * Math.max(1, subjects.length)) || 1;
  const schoolNilaiPct = Math.min(100, Math.round((realNilaiList.length / totalExpectedSchoolGrades) * 100));

  // Real evaluation submission
  const totalExpectedEval = Math.max(1, teachers.length + waliKelas.length);
  const totalActualEval = realEvaluasiList.length + realEvaluasiWaliList.length;
  const schoolEvalPct = Math.min(100, Math.round((totalActualEval / totalExpectedEval) * 100));

  // Compute distribution of santri per class
  const classSantriStats = classes.map(c => {
    const count = santriList.filter(s => s.classId === c.id || (s as any).class_id === c.id).length;
    const pct = Math.round((count / totalSantri) * 100);
    return { id: c.id, name: c.name, count, pct };
  });

  const statCards = [
    { label: 'Data Guru', val: teachers.length || stats.teachers, icon: Users, color: '#0ea5e9', bg: '#e0f2fe', view: 'master-teachers', desc: 'Pengajar aktif', trend: `${teachers.length} guru` },
    { label: 'Data Santri', val: santriList.length || stats.santri, icon: GraduationCap, color: '#8b5cf6', bg: '#ede9fe', view: 'master-santri', desc: 'Santri terdaftar', trend: `${totalSantri} santri` },
    { label: 'Mata Pelajaran', val: subjects.length || stats.subjects, icon: BookOpen, color: '#10b981', bg: '#d1fae5', view: 'master-subjects', desc: 'Mapel kurikulum', trend: `${subjects.length} mapel` },
    { label: 'Data Kelas', val: classes.length || stats.classes, icon: LayoutGrid, color: '#f59e0b', bg: '#fef3c7', view: 'master-classes', desc: 'Kelas aktif', trend: `${classes.length} rombel` },
    { label: 'Jadwal KBM', val: schedules.length || stats.schedules, icon: Calendar, color: '#ef4444', bg: '#fee2e2', view: 'master-schedules', desc: 'Sesi mengajar', trend: `${schedules.length} jadwal` },
  ];

  const featureModules = [
    {
      title: '1. Master Data Akademik',
      desc: `${teachers.length} Guru, ${totalSantri} Santri, ${classes.length} Kelas`,
      icon: Layers,
      color: '#0ea5e9',
      bg: '#e0f2fe',
      pct: 100,
      status: 'Lengkap & Aktif',
      links: [
        { label: 'Data Guru', view: 'master-teachers' },
        { label: 'Data Santri', view: 'master-santri' },
        { label: 'Data Mapel', view: 'master-subjects' },
        { label: 'Data Kelas', view: 'master-classes' },
        { label: 'Jadwal KBM', view: 'master-schedules' },
        { label: 'Wali Kelas', view: 'wali-kelas' },
      ]
    },
    {
      title: '2. Kelola & Verifikasi RPP',
      desc: `${approvedCount} Disetujui, ${pendingCount} Menunggu Review`,
      icon: FileText,
      color: '#10b981',
      bg: '#d1fae5',
      pct: approvedPct,
      status: `${approvedPct}% Terverifikasi`,
      links: [
        { label: 'Verifikasi RPP Masuk', view: 'manage-rpps' },
        { label: 'Daftar Semua RPP', view: 'manage-rpps' },
      ]
    },
    {
      title: '3. Presensi Guru & Santri',
      desc: `${totalTAttendances} Log Guru • ${sTotal} Log Santri`,
      icon: UserCheck,
      color: '#8b5cf6',
      bg: '#ede9fe',
      pct: schoolPresensiPct,
      status: `${schoolPresensiPct}% Kehadiran`,
      links: [
        { label: 'Presensi Pengajar', view: 'attendance' },
        { label: 'Presensi Santri', view: 'santri-attendance' },
      ]
    },
    {
      title: '4. Nilai & Rapor Santri',
      desc: `${realNilaiList.length} Total Nilai Terdata di Sistem`,
      icon: Award,
      color: '#f59e0b',
      bg: '#fef3c7',
      pct: schoolNilaiPct,
      status: `${schoolNilaiPct}% Terisi`,
      links: [
        { label: 'Input Nilai Mapel', view: 'nilai-santri' },
        { label: 'Akhlaq Keseharian', view: 'nilai-santri' },
        { label: 'Rekap Rapor Santri', view: 'nilai-santri' },
      ]
    },
    {
      title: '5. Evaluasi & Pertanggungjawaban',
      desc: `${realEvaluasiList.length} Evaluasi Guru • ${realEvaluasiWaliList.length} Wali Kelas`,
      icon: Activity,
      color: '#ec4899',
      bg: '#fce7f3',
      pct: schoolEvalPct,
      status: `${totalActualEval} Laporan Masuk`,
      links: [
        { label: 'Evaluasi Mapel Guru', view: 'evaluasi-pembelajaran' },
        { label: 'Evaluasi Wali Kelas', view: 'evaluasi-wali-kelas' },
      ]
    },
    {
      title: '6. Komunikasi & Audit Sistem',
      desc: 'Pusat pengumuman ma\'had, konsultasi admin, dan log audit',
      icon: ShieldCheck,
      color: '#6366f1',
      bg: '#e0e7ff',
      pct: 100,
      status: 'Sistem Terlindungi',
      links: [
        { label: 'Tanya Admin', view: 'tanya-admin' },
        { label: 'Pengumuman Ma\'had', view: 'pengumuman' },
        { label: 'Log Aktivitas', view: 'activity-logs' },
      ]
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0ea5e9 100%)',
        minHeight: 200
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 61,35 93,35 68,57 79,88 50,70 21,88 32,57 7,35 39,35' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)', transform: 'translate(30%, -30%)'}} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15" style={{background: 'radial-gradient(circle, #0c4a6e 0%, transparent 70%)', transform: 'translate(-30%, 30%)'}} />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse" />
                <span className="text-sky-100 text-xs font-bold uppercase tracking-widest">Akademik MQBA Isy Karima</span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Dashboard Administrasi & Eksekutif
                </h1>
                <p className="text-sky-200/80 text-sm mt-2 leading-relaxed">
                  Monitoring terpusat seluruh indikator performa akademik, verifikasi RPP, presensi, penilaian rapor, dan tata kelola madrasah.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10 max-w-lg">
                <Sparkles className="w-3.5 h-3.5 text-sky-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sky-100/80 text-xs italic leading-relaxed">{hadith.text}</p>
                  <p className="text-sky-300/60 text-[10px] mt-1 font-semibold">— {hadith.src}</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <RealTimeClock />
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS RINGKASAN DATA ── */}
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
              <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide" style={{color: item.color}}>
              <span>{item.trend}</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      {/* ── DIAGRAM & VISUALISASI PERSENTASE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. DIAGRAM STATUS & VERIFIKASI RPP */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-500" />
                  <span>Diagram Status RPP Sekolah</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribusi persentase dari {stats.rpp.total} total RPP</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                {approvedPct}% Disetujui
              </span>
            </div>

            {/* Donut Chart Visualizer */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />
                  {/* Approved segment */}
                  <circle 
                    cx="60" cy="60" r="48" fill="none" stroke="#10b981" strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - (approvedPct / 100))}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                  />
                  {/* Pending segment indicator */}
                  <circle 
                    cx="60" cy="60" r="34" fill="none" stroke="#f59e0b" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - (pendingPct / 100))}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.rpp.total}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total RPP</span>
                  <span className="text-[11px] font-black text-emerald-600">{approvedPct}% Approved</span>
                </div>
              </div>
            </div>

            {/* Progress Segment Bars */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui ({stats.rpp.approved})
                  </span>
                  <span className="text-emerald-700 font-mono">{approvedPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${approvedPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Review ({stats.rpp.pending})
                  </span>
                  <span className="text-amber-700 font-mono">{pendingPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${pendingPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Perlu Revisi ({stats.rpp.revision})
                  </span>
                  <span className="text-rose-700 font-mono">{revisionPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${revisionPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-sky-600 flex items-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5" /> Draft Pengajar ({stats.rpp.draft})
                  </span>
                  <span className="text-sky-700 font-mono">{draftPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-sky-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${draftPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('manage-rpps')}
            className="mt-5 w-full py-2.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Panel Manajemen RPP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. DIAGRAM SEBARAN SANTRI PER KELAS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>Sebaran Santri per Rombel Kelas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Proporsi santri di setiap tingkatan kelas</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-200 uppercase">
                {totalSantri} Santri
              </span>
            </div>

            <div className="py-4 space-y-3.5">
              {classSantriStats.length > 0 ? (
                classSantriStats.map((item, idx) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{item.name}</span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-normal">{item.count} santri</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded font-black">
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-2.5 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.max(item.pct, 4)}%`,
                          background: idx % 2 === 0 ? 'linear-gradient(90deg, #8b5cf6, #a855f7)' : 'linear-gradient(90deg, #0ea5e9, #38bdf8)'
                        }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada data rombel kelas terdaftar.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('master-santri')}
            className="mt-4 w-full py-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Kelola Master Santri</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. ANTREAN VERIFIKASI RPP TERBARU */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Antrean Review RPP</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Pengajuan dari guru yang belum direview</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 uppercase">
                {stats.rpp.pending} Antrean
              </span>
            </div>

            <div className="py-4 space-y-2.5">
              {pendingRpps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Semua RPP Terverifikasi!</p>
                  <p className="text-[11px] text-slate-400">Tidak ada pengajuan RPP baru yang tertunda.</p>
                </div>
              ) : (
                pendingRpps.map((rpp) => (
                  <div key={rpp.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{rpp.teacher?.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                        {rpp.subject?.name} • Kelas {rpp.class?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('manage-rpps')}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition flex-shrink-0 cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('manage-rpps')}
            className="mt-4 w-full py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Antrean RPP Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── MATRIKS SELURUH FITUR ADMIN & TINGKAT KESIAPAN (%) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <span>Matriks Layanan & Fitur Sistem Akademik</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Navigasi langsung dan ringkasan persentase kesiapan modul sistem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureModules.map((mod, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: mod.bg }}>
                      <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{mod.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{mod.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar module */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">{mod.status}</span>
                    <span className="font-mono font-black" style={{ color: mod.color }}>{mod.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${mod.pct}%`, background: mod.color }} />
                  </div>
                </div>

                {/* Sub-links */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-800">
                  {mod.links.map((link, lIdx) => (
                    <button
                      key={lIdx}
                      onClick={() => onNavigate(link.view)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-slate-100 dark:border-slate-700"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVITY LOG REALTIME ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              <span>Log Aktivitas & Audit Sistem Realtime</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Rekam jejak tindakan admin, pengajar, dan wali kelas</p>
          </div>
          <button
            onClick={() => onNavigate('activity-logs')}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition cursor-pointer"
          >
            <span>Buka Semua Log</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
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
                [...stats.activityLogs]
                  .sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime() || 0;
                    const timeB = new Date(b.timestamp).getTime() || 0;
                    return timeB - timeA;
                  })
                  .slice(0, 6)
                  .map((log) => {
                  const userName = log.userName || (log as any).user_name || (log.userId === 'system' ? 'Sistem Utama' : 'Pengguna SIM RPP');
                  const userRole = log.userRole || (log as any).user_role || 'Admin';
                  const actionColor = log.action.includes('Buat') || log.action.includes('Tambah') || log.action.includes('Login')
                    ? { bg: '#e0f2fe', text: '#0284c7' }
                    : log.action.includes('Hapus')
                    ? { bg: '#fee2e2', text: '#dc2626' }
                    : log.action.includes('Review') || log.action.includes('Salin') || log.action.includes('Presensi')
                    ? { bg: '#fef3c7', text: '#d97706' }
                    : { bg: '#f1f5f9', text: '#64748b' };

                  const formatLogTime = (rawTs: any) => {
                    if (!rawTs) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    let date: Date;
                    if (rawTs instanceof Date) {
                      date = rawTs;
                    } else if (typeof rawTs === 'number') {
                      date = new Date(rawTs > 1e11 ? rawTs : rawTs * 1000);
                    } else {
                      const str = String(rawTs).trim();
                      if (!isNaN(Number(str)) && str.length > 0) {
                        const num = Number(str);
                        date = new Date(num > 1e11 ? num : num * 1000);
                      } else {
                        date = new Date(str);
                      }
                    }

                    if (isNaN(date.getTime())) {
                      date = new Date();
                    }

                    return date.toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).replace('.', ':');
                  };

                  const roleDotColor = 
                    userRole === 'Admin' ? 'bg-amber-500' :
                    userRole === 'WaliKelas' ? 'bg-emerald-500' :
                    userRole === 'WaliSantri' ? 'bg-purple-500' :
                    'bg-sky-500';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatLogTime(log.timestamp)}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${roleDotColor}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200" title={userName}>{userName}</span>
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
