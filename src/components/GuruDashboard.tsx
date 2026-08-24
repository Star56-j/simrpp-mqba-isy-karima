import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Award,
  BookOpen,
  Users,
  UserCheck,
  Activity,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  PieChart,
  BarChart3,
  TrendingUp,
  Layers,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { GuruStats, RPP, TeachingSchedule, WaliKelas, Subject, SchoolClass, Santri, AcademicYear, Semester, SantriAttendance, Nilai, AkhlaqSantri, EvaluasiPembelajaran, EvaluasiWaliKelas, Attendance } from '../types';
import { api } from '../api';
import RealTimeClock from './RealTimeClock';

interface GuruDashboardProps {
  stats: GuruStats;
  schedules: TeachingSchedule[];
  rpps: RPP[];
  waliKelas: WaliKelas[];
  subjects: Subject[];
  classes: SchoolClass[];
  santriList?: Santri[];
  academicYears?: AcademicYear[];
  semesters?: Semester[];
  onNavigate: (view: string, targetTab?: string) => void;
}

export default function GuruDashboard({ 
  stats, 
  schedules, 
  rpps,
  waliKelas,
  subjects,
  classes,
  santriList = [],
  academicYears = [],
  semesters = [],
  onNavigate,
}: GuruDashboardProps) {
  // Real data states from database
  const [realSantriAttendances, setRealSantriAttendances] = useState<SantriAttendance[]>([]);
  const [realNilaiList, setRealNilaiList] = useState<Nilai[]>([]);
  const [realAkhlaqList, setRealAkhlaqList] = useState<AkhlaqSantri[]>([]);
  const [realTeacherAttendances, setRealTeacherAttendances] = useState<Attendance[]>([]);
  const [realEvaluasiList, setRealEvaluasiList] = useState<EvaluasiPembelajaran[]>([]);
  const [realEvaluasiWaliList, setRealEvaluasiWaliList] = useState<EvaluasiWaliKelas[]>([]);
  const [isLoadingRealData, setIsLoadingRealData] = useState(true);

  // Get current logged-in user
  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const teacherIds = [
    myUser.teacherId,
    myUser.teacher_id,
    myUser.teacher?.id,
    myUser.id
  ].filter(Boolean);

  const teacherNames = [
    myUser.name,
    myUser.teacher?.name
  ].filter(Boolean).map((n: string) => n.trim().toLowerCase());

  // Fetch real data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDashboardRealData() {
      try {
        setIsLoadingRealData(true);
        const [sAttendances, nilaiData, akhlaqData, tAttendances, evalData, evalWaliData] = await Promise.all([
          api.getSantriAttendances().catch(() => []),
          api.getNilai().catch(() => []),
          api.getAkhlaqSantri().catch(() => []),
          api.getAttendances().catch(() => []),
          api.getEvaluasi().catch(() => []),
          api.getEvaluasiWaliKelas().catch(() => [])
        ]);

        if (isMounted) {
          setRealSantriAttendances(sAttendances);
          setRealNilaiList(nilaiData);
          setRealAkhlaqList(akhlaqData);
          setRealTeacherAttendances(tAttendances);
          setRealEvaluasiList(evalData);
          setRealEvaluasiWaliList(evalWaliData);
        }
      } catch (err) {
        console.error('Error fetching dashboard real data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingRealData(false);
        }
      }
    }

    loadDashboardRealData();
    return () => { isMounted = false; };
  }, []);

  const mySchedules = schedules.filter(s => teacherIds.includes(s.teacherId) || teacherIds.includes((s as any).teacher_id));

  const myRpps = rpps.filter(r => {
    if (myUser.role === 'Admin') return true;

    const rTid = r.teacherId || (r as any).teacher_id || (r.teacher && r.teacher.id);
    if (rTid && teacherIds.includes(rTid)) {
      return true;
    }

    const rTeacherName = (r.teacher?.name || (r as any).teacher_name || (r as any).teacherName || '').trim().toLowerCase();
    if (rTeacherName && teacherNames.some(tn => tn === rTeacherName || tn.includes(rTeacherName) || rTeacherName.includes(tn))) {
      return true;
    }

    return false;
  });
  
  // Wali kelas untuk guru ini
  const myWaliKelas = waliKelas.filter(w => teacherIds.includes(w.teacherId) || teacherIds.includes((w as any).teacher_id));

  // Find RPPs in "Revisi" state
  const revisionRpps = myRpps.filter(r => r.status === 'Revisi' || (r as any).status === 'Perlu Revisi' || (r as any).status === 'Revision');

  const hadith = { text: '"Barang siapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan jalannya menuju surga."', src: 'HR. Muslim' };

  // Calculate dynamic stats accurately per logged-in teacher
  const myRppStats = {
    total: myRpps.length,
    draft: myRpps.filter(r => r.status === 'Draft').length,
    pending: myRpps.filter(r => r.status === 'Menunggu Persetujuan' || (r as any).status === 'Pending').length,
    approved: myRpps.filter(r => r.status === 'Disetujui' || (r as any).status === 'Approved').length,
    revision: myRpps.filter(r => r.status === 'Revisi' || (r as any).status === 'Perlu Revisi' || (r as any).status === 'Revision').length,
  };

  const totalMyRpp = myRppStats.total > 0 ? myRppStats.total : 1;
  const approvedPct = myRppStats.total > 0 ? Math.round((myRppStats.approved / totalMyRpp) * 100) : 0;
  const pendingPct = myRppStats.total > 0 ? Math.round((myRppStats.pending / totalMyRpp) * 100) : 0;
  const revisionPct = myRppStats.total > 0 ? Math.round((myRppStats.revision / totalMyRpp) * 100) : 0;
  const draftPct = myRppStats.total > 0 ? Math.max(0, 100 - approvedPct - pendingPct - revisionPct) : 0;

  const statCards = [
    { label: 'Draft RPP', val: myRppStats.draft, icon: FileEdit, color: '#64748b', bg: '#f1f5f9', view: 'my-rpps', filter: 'Draft', desc: 'Belum diajukan' },
    { label: 'Menunggu', val: myRppStats.pending, icon: Clock, color: '#f59e0b', bg: '#fef3c7', view: 'my-rpps', filter: 'Menunggu Persetujuan', desc: 'Proses review' },
    { label: 'Disetujui', val: myRppStats.approved, icon: CheckCircle, color: '#10b981', bg: '#d1fae5', view: 'my-rpps', filter: 'Disetujui', desc: 'RPP aktif' },
    { label: 'Perlu Revisi', val: myRppStats.revision, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2', view: 'my-rpps', filter: 'Revisi', desc: 'Harus diperbaiki' },
    { label: 'Total RPP', val: myRppStats.total, icon: FileText, color: '#0ea5e9', bg: '#e0f2fe', view: 'my-rpps', filter: 'Semua', desc: 'Semua RPP saya' },
  ];

  // Group wali kelas by classId so each handled class appears only once (combining Ganjil & Genap)
  const uniqueWaliKelasMap = new Map<string, { classId: string; className: string; academicYears: string[] }>();
  myWaliKelas.forEach(w => {
    const cId = w.classId || (w as any).class_id;
    const cName = (w as any).class?.name || classes.find(c => c.id === cId)?.name || 'Kelas';
    const ayName = (w as any).academicYear?.name || '';
    if (!uniqueWaliKelasMap.has(cId)) {
      uniqueWaliKelasMap.set(cId, {
        classId: cId,
        className: cName,
        academicYears: ayName ? [ayName] : []
      });
    } else if (ayName && !uniqueWaliKelasMap.get(cId)!.academicYears.includes(ayName)) {
      uniqueWaliKelasMap.get(cId)!.academicYears.push(ayName);
    }
  });
  const uniqueWaliClasses = Array.from(uniqueWaliKelasMap.values());

  const isWaliRole = myUser.role === 'WaliKelas';

  // Compute Wali Kelas santri stats from REAL database data
  const waliClassIds = uniqueWaliClasses.map(u => u.classId);
  const mySantriList = santriList.filter(s => waliClassIds.includes(s.classId || (s as any).class_id));
  const totalWaliSantri = mySantriList.length;

  // Real attendance calculations for Wali Kelas
  const waliSantriAttendances = realSantriAttendances.filter(a => waliClassIds.includes(a.classId || (a as any).class_id));
  let totalHadirCount = 0;
  let totalIzinCount = 0;
  let totalSakitCount = 0;
  let totalAlphaCount = 0;

  waliSantriAttendances.forEach(a => {
    if (a.status) {
      if (a.status === 'Hadir') totalHadirCount++;
      else if (a.status === 'Izin') totalIzinCount++;
      else if (a.status === 'Sakit') totalSakitCount++;
      else if (a.status === 'Alpha') totalAlphaCount++;
    } else {
      totalHadirCount += (a.jumlahHadir || 0);
      totalIzinCount += (a.jumlahIzin || 0);
      totalSakitCount += (a.jumlahSakit || 0);
      totalAlphaCount += (a.jumlahAlpha || 0);
    }
  });

  const totalAttendanceRecords = totalHadirCount + totalIzinCount + totalSakitCount + totalAlphaCount;
  const santriHadirPct = totalAttendanceRecords > 0 ? Math.round((totalHadirCount / totalAttendanceRecords) * 100) : (waliSantriAttendances.length === 0 ? 0 : 100);
  const santriIzinPct = totalAttendanceRecords > 0 ? Math.round((totalIzinCount / totalAttendanceRecords) * 100) : 0;
  const santriSakitPct = totalAttendanceRecords > 0 ? Math.round((totalSakitCount / totalAttendanceRecords) * 100) : 0;
  const santriAlphaPct = totalAttendanceRecords > 0 ? Math.max(0, 100 - santriHadirPct - santriIzinPct - santriSakitPct) : 0;

  // Real grades calculation for Wali Kelas
  const waliNilaiRecords = realNilaiList.filter(n => waliClassIds.includes(n.classId || (n as any).class_id));
  const totalPossibleGrades = (totalWaliSantri * Math.max(1, subjects.length)) || 1;
  const nilaiKelengkapanPct = totalWaliSantri > 0 ? Math.min(100, Math.round((waliNilaiRecords.length / totalPossibleGrades) * 100)) : 0;

  // Real akhlaq calculation for Wali Kelas
  const waliAkhlaqRecords = realAkhlaqList.filter(a => waliClassIds.includes(a.classId || (a as any).class_id));
  const akhlaqKelengkapanPct = totalWaliSantri > 0 ? Math.min(100, Math.round((waliAkhlaqRecords.length / totalWaliSantri) * 100)) : 0;

  // Real presensi kelengkapan
  const presensiKelengkapanPct = totalWaliSantri > 0 ? (totalAttendanceRecords > 0 ? Math.min(100, Math.round((totalAttendanceRecords / (totalWaliSantri * 20)) * 100)) : 0) : 0;

  // Real Overall Kesiapan Rapor Kelas Binaan
  const kesiapanRaporRealPct = totalWaliSantri > 0 
    ? Math.round((nilaiKelengkapanPct * 0.5) + (akhlaqKelengkapanPct * 0.3) + ((totalAttendanceRecords > 0 ? santriHadirPct : 0) * 0.2))
    : 0;

  // Real stats for Regular Teacher
  const myTeacherAttendances = realTeacherAttendances.filter(a => teacherIds.includes(a.teacherId));
  const myTeacherHadirCount = myTeacherAttendances.filter(a => a.status === 'Hadir').length;
  const guruPresensiPct = myTeacherAttendances.length > 0 ? Math.round((myTeacherHadirCount / myTeacherAttendances.length) * 100) : 100;

  const myTeacherNilaiRecords = realNilaiList.filter(n => teacherIds.includes(n.teacherId || (n as any).teacher_id));
  const expectedTeacherGrades = (mySchedules.length * 20) || 1;
  const guruNilaiPct = Math.min(100, Math.round((myTeacherNilaiRecords.length / expectedTeacherGrades) * 100));

  const myEvaluasiList = realEvaluasiList.filter(e => teacherIds.includes((e as any).teacherId || (e as any).guru_id));
  const guruEvaluasiPct = myEvaluasiList.length > 0 ? 100 : 0;

  const myEvaluasiWaliList = realEvaluasiWaliList.filter(e => teacherIds.includes(e.guruId || (e as any).guru_id));
  const waliEvaluasiPct = myEvaluasiWaliList.length > 0 ? 100 : 0;

  // Day distribution for teaching schedules
  const daysOrder = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayScheduleStats = daysOrder.map(day => {
    const count = mySchedules.filter(s => s.day?.toLowerCase() === day.toLowerCase()).length;
    return { day, count };
  }).filter(d => d.count > 0);

  // Features for Wali Kelas
  const waliFeatureModules = [
    {
      title: '1. Absensi Santri Binaan',
      desc: `${totalAttendanceRecords} catatan presensi tersimpan`,
      icon: UserCheck,
      color: '#0ea5e9',
      bg: '#e0f2fe',
      pct: santriHadirPct,
      status: totalAttendanceRecords > 0 ? `${santriHadirPct}% Kehadiran` : 'Belum Ada Input',
      action: () => onNavigate('my-santri-attendance')
    },
    {
      title: '2. Nilai Seluruh Mata Pelajaran',
      desc: `${waliNilaiRecords.length} nilai mapel terdata`,
      icon: BookOpen,
      color: '#10b981',
      bg: '#d1fae5',
      pct: nilaiKelengkapanPct,
      status: `${nilaiKelengkapanPct}% Terisi`,
      action: () => onNavigate('nilai-santri')
    },
    {
      title: '3. Penilaian Akhlaq Keseharian (20%)',
      desc: `${waliAkhlaqRecords.length} dari ${totalWaliSantri} santri dinilai`,
      icon: Sparkles,
      color: '#8b5cf6',
      bg: '#ede9fe',
      pct: akhlaqKelengkapanPct,
      status: `${akhlaqKelengkapanPct}% Selesai`,
      action: () => onNavigate('nilai-santri')
    },
    {
      title: '4. Rekap & Cetak Rapor Kelas',
      desc: `Kesiapan rapor kelas: ${kesiapanRaporRealPct}%`,
      icon: Award,
      color: '#f59e0b',
      bg: '#fef3c7',
      pct: kesiapanRaporRealPct,
      status: `${kesiapanRaporRealPct}% Siap`,
      action: () => onNavigate('rekap-rapor-wali-kelas')
    },
    {
      title: '5. Evaluasi Wali Kelas ke Kurikulum',
      desc: `${myEvaluasiWaliList.length} laporan evaluasi diserahkan`,
      icon: FileText,
      color: '#ec4899',
      bg: '#fce7f3',
      pct: waliEvaluasiPct,
      status: myEvaluasiWaliList.length > 0 ? 'Sudah Lapor' : 'Belum Lapor',
      action: () => onNavigate('evaluasi-wali-kelas')
    },
    {
      title: '6. Konsultasi & Pengumuman',
      desc: 'Hubungi admin madrasah dan lihat informasi terbaru',
      icon: HelpCircle,
      color: '#6366f1',
      bg: '#e0e7ff',
      pct: 100,
      status: 'Layanan Terbuka',
      action: () => onNavigate('tanya-admin')
    },
  ];

  // Features for Regular Teacher
  const guruFeatureModules = [
    {
      title: '1. Rencana Pembelajaran (RPP)',
      desc: `${myRppStats.approved} dari ${myRppStats.total} RPP disetujui`,
      icon: FileText,
      color: '#0ea5e9',
      bg: '#e0f2fe',
      pct: approvedPct,
      status: `${approvedPct}% Disetujui`,
      action: () => onNavigate('my-rpps')
    },
    {
      title: '2. Presensi Mengajar Guru',
      desc: `${myTeacherHadirCount} sesi hadir tercatat`,
      icon: UserCheck,
      color: '#10b981',
      bg: '#d1fae5',
      pct: guruPresensiPct,
      status: `${guruPresensiPct}% Kehadiran`,
      action: () => onNavigate('my-attendance')
    },
    {
      title: '3. Presensi Santri Per-Sesi KBM',
      desc: 'Catat kehadiran santri saat jam tatap muka pelajaran',
      icon: Users,
      color: '#8b5cf6',
      bg: '#ede9fe',
      pct: santriHadirPct,
      status: 'Sesuai Jadwal KBM',
      action: () => onNavigate('my-santri-attendance')
    },
    {
      title: '4. Input Nilai & Ujian Santri',
      desc: `${myTeacherNilaiRecords.length} nilai telah diinput`,
      icon: BookOpen,
      color: '#f59e0b',
      bg: '#fef3c7',
      pct: guruNilaiPct,
      status: `${guruNilaiPct}% Terisi`,
      action: () => onNavigate('nilai-santri')
    },
    {
      title: '5. Evaluasi Pembelajaran Bulanan',
      desc: `${myEvaluasiList.length} laporan bulanan diserahkan`,
      icon: Activity,
      color: '#ec4899',
      bg: '#fce7f3',
      pct: guruEvaluasiPct,
      status: myEvaluasiList.length > 0 ? 'Sudah Diserahkan' : 'Belum Diserahkan',
      action: () => onNavigate('evaluasi-pembelajaran')
    },
    {
      title: '6. Konsultasi Admin & Pengumuman',
      desc: 'Pusat komunikasi internal pengajar dengan manajemen ma\'had',
      icon: HelpCircle,
      color: '#6366f1',
      bg: '#e0e7ff',
      pct: 100,
      status: 'Layanan Terbuka',
      action: () => onNavigate('tanya-admin')
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
                  {isWaliRole ? 'Dashboard Wali Kelas' : 'Dashboard Guru Pengajar'}
                </h1>
                <p className="text-sky-200/80 text-sm mt-2 leading-relaxed">
                  Ahlan wa sahlan, <strong className="text-white">{myUser.name}</strong>. {isWaliRole ? 'Kelola kelas bimbingan, absensi santri, kelengkapan nilai mata pelajaran, dan cetak rapor secara mandiri.' : 'Kelola rencana pelaksanaan pembelajaran (RPP), presensi kelas, dan rekap penilaian santri secara terpadu.'}
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

      {/* ── WIDGET WALI KELAS (SATU KARTU TERPADU PER KELAS BINAAN) ── */}
      {uniqueWaliClasses.length > 0 && (
        <div className="space-y-4">
          {uniqueWaliClasses.map(uw => (
            <div key={uw.classId} className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500" />
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-7 h-7 text-sky-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Wali Kelas Terdaftar</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {uw.academicYears.length > 0 ? `TA ${uw.academicYears.join(', ')}` : 'Tahun Ajaran Aktif'} • Semester Ganjil & Genap
                    </span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                    {uw.className}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total {mySantriList.length} Santri Binaan Terdata
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button onClick={() => onNavigate('my-santri-attendance')}
                  className="px-4 py-2.5 bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-xs font-extrabold rounded-xl hover:bg-sky-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 uppercase tracking-wide cursor-pointer">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Absensi Santri</span>
                </button>
                <button onClick={() => onNavigate('nilai-santri')}
                  className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex items-center space-x-1.5 uppercase tracking-wide cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Input Nilai Mapel</span>
                </button>
                <button onClick={() => onNavigate('rekap-rapor-wali-kelas')}
                  className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center space-x-1.5 uppercase tracking-wide cursor-pointer">
                  <Award className="w-3.5 h-3.5" />
                  <span>Rekap Rapor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STAT CARDS (GURU PENGAJAR) ── */}
      {!isWaliRole && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.view, item.filter)}
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

      {/* ═══════════ REVISION ACTION (GURU PENGAJAR) ═══════════ */}
      {!isWaliRole && revisionRpps.length > 0 && (
        <div className="p-5 rounded-3xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/15 space-y-4">
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
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                  className="self-end md:self-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] tracking-wide uppercase shadow-sm transition flex-shrink-0 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Revisi Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DIAGRAM & PERSENTASE STATUS (UNTUK PENGAJAR ATAU WALI KELAS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. DIAGRAM STATUS & KESIAPAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-500" />
                  <span>{isWaliRole ? 'Diagram Kesiapan Rapor Kelas Binaan' : 'Diagram Persentase RPP Saya'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isWaliRole ? `Kelengkapan data santri (${totalWaliSantri} santri binaan)` : `Distribusi status dari ${myRppStats.total} total RPP Anda`}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                {isWaliRole ? `Kesiapan ${kesiapanRaporRealPct}%` : `${approvedPct}% Disetujui`}
              </span>
            </div>

            {/* Circular Donut Visualizer */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="12" className="dark:stroke-slate-800" />
                  <circle 
                    cx="60" cy="60" r="48" fill="none" stroke={isWaliRole ? '#0ea5e9' : '#10b981'} strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - ((isWaliRole ? kesiapanRaporRealPct : approvedPct) / 100))}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {isWaliRole ? `${kesiapanRaporRealPct}%` : `${approvedPct}%`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {isWaliRole ? 'Siap Rapor' : 'Disetujui'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Segment Bars */}
            {!isWaliRole ? (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui ({myRppStats.approved})
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
                      <Clock className="w-3.5 h-3.5" /> Menunggu Review ({myRppStats.pending})
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
                      <AlertCircle className="w-3.5 h-3.5" /> Perlu Revisi ({myRppStats.revision})
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
                      <FileEdit className="w-3.5 h-3.5" /> Draft ({myRppStats.draft})
                    </span>
                    <span className="text-sky-700 font-mono">{draftPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${draftPct}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Kelengkapan Nilai Mapel ({waliNilaiRecords.length}/{totalPossibleGrades})
                    </span>
                    <span className="text-emerald-700 font-mono">{nilaiKelengkapanPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${nilaiKelengkapanPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Penilaian Akhlaq Keseharian 20% ({waliAkhlaqRecords.length}/{totalWaliSantri})
                    </span>
                    <span className="text-purple-700 font-mono">{akhlaqKelengkapanPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${akhlaqKelengkapanPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-sky-600 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Rekapitulasi Presensi Santri ({totalAttendanceRecords} log)
                    </span>
                    <span className="text-sky-700 font-mono">{santriHadirPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${santriHadirPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate(isWaliRole ? 'rekap-rapor-wali-kelas' : 'my-rpps')}
            className="mt-5 w-full py-2.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isWaliRole ? 'Buka Rekap Rapor Kelas' : 'Buka Manajemen RPP Saya'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. DIAGRAM ALOKASI MENGAJAR / STATUS SANTRI */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>{isWaliRole ? 'Status Kehadiran Santri Kelas' : 'Distribusi Sesi KBM Mingguan'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isWaliRole ? `Total ${totalAttendanceRecords} catatan presensi santri` : `Total ${mySchedules.length} sesi tatap muka mengajar`}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-200 uppercase">
                {isWaliRole ? `Kehadiran ${santriHadirPct}%` : `${mySchedules.length} Sesi KBM`}
              </span>
            </div>

            <div className="py-5 space-y-4">
              {!isWaliRole ? (
                dayScheduleStats.length > 0 ? (
                  dayScheduleStats.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-200">{item.day}</span>
                        <span className="font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded font-black text-[11px]">
                          {item.count} Sesi Mengajar
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-2.5 rounded-full"
                          style={{ 
                            width: `${Math.min(100, item.count * 30)}%`,
                            background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' 
                          }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Belum ada jadwal KBM yang ditetapkan untuk Anda.
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700 dark:text-emerald-300">Hadir ({santriHadirPct}%)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">{totalHadirCount} sesi</span>
                        <span className="font-mono text-emerald-600 font-black">{santriHadirPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${santriHadirPct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-sky-700 dark:text-sky-300">Izin ({santriIzinPct}%)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">{totalIzinCount} sesi</span>
                        <span className="font-mono text-sky-600 font-black">{santriIzinPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${santriIzinPct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-700 dark:text-amber-300">Sakit ({santriSakitPct}%)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">{totalSakitCount} sesi</span>
                        <span className="font-mono text-amber-600 font-black">{santriSakitPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${santriSakitPct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-rose-700 dark:text-rose-300">Alpha / Tanpa Keterangan ({santriAlphaPct}%)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">{totalAlphaCount} sesi</span>
                        <span className="font-mono text-rose-600 font-black">{santriAlphaPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${santriAlphaPct}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('my-santri-attendance')}
            className="mt-4 w-full py-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Presensi Santri</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── MATRIKS SELURUH FITUR (DIAGRAM / PERSEN & NAVIGASI CEPAT) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            <span>Matriks Fitur & Capaian Kinerja {isWaliRole ? 'Wali Kelas' : 'Guru Pengajar'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Navigasi langsung dan persentase kesiapan modul kerja Anda</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isWaliRole ? waliFeatureModules : guruFeatureModules).map((mod, i) => (
            <div 
              key={i} 
              onClick={mod.action}
              className="group bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105" style={{ background: mod.bg }}>
                    <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm group-hover:text-sky-600 transition-colors">{mod.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{mod.desc}</p>
                  </div>
                </div>

                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">{mod.status}</span>
                    <span className="font-mono font-black" style={{ color: mod.color }}>{mod.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${mod.pct}%`, background: mod.color }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider" style={{ color: mod.color }}>
                <span>Akses Fitur</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ JADWAL MENGAJAR (HANYA GURU PENGAJAR) ═══════════ */}
      {!isWaliRole && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" />
              <span>Jadwal KBM & Sesi Mengajar Terdaftar</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Mata pelajaran dan jadwal mengajar mingguan Anda</p>
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
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-700 transition shadow-xs"
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

                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${hasRpp ? 'text-sky-600' : 'text-slate-500'}`}>
                        {hasRpp ? '● RPP Terbuat' : '○ Belum Ada RPP'}
                      </span>
                      <button
                        onClick={() => onNavigate('my-rpps')}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
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
      )}
    </div>
  );
}
