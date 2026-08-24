import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, LogOut, GraduationCap, Calendar, Printer, HelpCircle, 
  CheckCircle2, AlertTriangle, XCircle, Clock, Award, FileText, 
  TrendingUp, Download, Check, ShieldCheck, Sparkles, UserCheck,
  MessageSquare, Send, Paperclip, Image as ImageIcon, X, ZoomIn,
  CornerDownRight, ChevronRight
} from 'lucide-react';
import { 
  User, Santri, Nilai, AcademicYear, Semester, SchoolClass, 
  Subject, RaporDetail, SantriAttendance, WaliKelas as TWaliKelas, AkhlaqSantri,
  TanyaWaliKelas as TTanyaWaliKelas
} from '../types';
import { api } from '../api';
import { printRapor } from '../utils/printRapor';
import { downloadRaporPdf } from '../utils/pdfDownloader';
import TanyaAdmin from './TanyaAdmin';
import { computeRaporScore } from '../utils/nilaiWeights';

interface WaliDashboardProps {
  user: User;
  academicYears: AcademicYear[];
  semesters: Semester[];
  onLogout: () => void;
}

export default function WaliDashboard({ user, academicYears, semesters, onLogout }: WaliDashboardProps) {
  const [santri, setSantri] = useState<Santri | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [waliKelasList, setWaliKelasList] = useState<TWaliKelas[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [raporDetail, setRaporDetail] = useState<RaporDetail | null>(null);
  const [akhlaq, setAkhlaq] = useState<AkhlaqSantri | null>(null);
  const [attendances, setAttendances] = useState<SantriAttendance[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Tab State: 'rapor' | 'absensi' | 'tanyaWali' | 'tanyaAdmin'
  const [activeTab, setActiveTab] = useState<'rapor' | 'absensi' | 'tanyaWali' | 'tanyaAdmin'>('rapor');

  // Filter
  const [filterAY, setFilterAY] = useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = useState(semesters[0]?.id || '');

  // Tanya Wali Kelas State
  const [tanyaWaliList, setTanyaWaliList] = useState<TTanyaWaliKelas[]>([]);
  const [tanyaSubject, setTanyaSubject] = useState('');
  const [tanyaMessage, setTanyaMessage] = useState('');
  const [tanyaImagePreview, setTanyaImagePreview] = useState<string | null>(null);
  const [tanyaAttachedFile, setTanyaAttachedFile] = useState<{
    url: string;
    name: string;
    type: string;
    isImage: boolean;
  } | null>(null);
  const [submittingTanya, setSubmittingTanya] = useState(false);
  const [tanyaSuccess, setTanyaSuccess] = useState('');
  const [tanyaError, setTanyaError] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [santriList, clsList, subjList, waliList, twData] = await Promise.all([
        api.getSantri().catch(() => []),
        api.getClasses().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getWaliKelas().catch(() => []),
        api.getTanyaWaliKelas().catch(() => [])
      ]);

      setClasses(clsList);
      setSubjects(subjList);
      setWaliKelasList(waliList);

      // Robust Santri Resolution
      const rawName = (user.name || '').replace(/^Wali\s+dari\s+/i, '').trim().toLowerCase();
      const sName = (user.santriName || '').trim().toLowerCase();
      const sNis = (user.nis || '').trim();
      const sId = user.santriId;

      let foundSantri: Santri | null = null;

      // 1. Match by ID (if not demo ID)
      if (sId && sId !== 'santri-demo') {
        foundSantri = santriList.find(s => s.id === sId) || null;
      }

      // 2. Match by NIS
      if (!foundSantri && sNis && sNis !== '-') {
        foundSantri = santriList.find(s => s.nis && s.nis.trim() === sNis) || null;
      }

      // 3. Match by Name (Exact or Substring)
      if (!foundSantri && (sName || rawName)) {
        const targetSearch = sName || rawName;
        foundSantri = santriList.find(s => s.name.toLowerCase().trim() === targetSearch)
          || santriList.find(s => s.name.toLowerCase().includes(targetSearch) || targetSearch.includes(s.name.toLowerCase().trim()))
          || null;
      }

      // Fallback if still not found, take first matching from class or list[0]
      if (!foundSantri && santriList.length > 0) {
        foundSantri = santriList[0];
      }

      if (foundSantri) {
        setSantri(foundSantri);
        // Self-heal localStorage session if needed
        if (user.santriId !== foundSantri.id || !user.nis || user.nis === '-') {
          const updatedUser = {
            ...user,
            santriId: foundSantri.id,
            santriName: foundSantri.name,
            nis: foundSantri.nis || '-',
            classId: foundSantri.classId,
            className: (foundSantri as any).className || clsList.find(c => c.id === foundSantri?.classId)?.name || 'Kelas'
          };
          localStorage.setItem('simrpp_user', JSON.stringify(updatedUser));
        }

        const effectiveSantriId = foundSantri.id;
        const [nData, rDetails, akhlaqData, attData] = await Promise.all([
          api.getNilai({ santriId: effectiveSantriId, academicYearId: filterAY, semesterId: filterSem }).catch(() => []),
          api.getRaporDetail({ santriId: effectiveSantriId, academicYearId: filterAY, semesterId: filterSem }).catch(() => []),
          api.getAkhlaqSantri({ santriId: effectiveSantriId, academicYearId: filterAY, semesterId: filterSem }).catch(() => []),
          api.getSantriAttendances({ santriId: effectiveSantriId, academicYearId: filterAY, semesterId: filterSem }).catch(() => [])
        ]);

        setNilaiList(nData);
        setRaporDetail(rDetails.length > 0 ? rDetails[0] : null);
        setAkhlaq(akhlaqData.length > 0 ? akhlaqData[0] : null);
        setAttendances(attData);

        // Filter konsultasi santri ini
        const myTanya = twData.filter(t => 
          t.santriId === effectiveSantriId || 
          t.waliSantriId === user.id || 
          (t.santriName && foundSantri && t.santriName.toLowerCase() === foundSantri.name.toLowerCase())
        );
        setTanyaWaliList(myTanya);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.santriId, user.name, filterAY, filterSem]);

  const akhlaqScore = akhlaq && typeof akhlaq.nilaiAkhlaq === 'number' ? akhlaq.nilaiAkhlaq : 90;

  const getAverage = (n: Nilai): number => {
    return computeRaporScore(n, akhlaqScore).nilaiAkhirTulis;
  };

  const hasGrades = nilaiList.length > 0;

  const avg = hasGrades 
    ? Math.round(nilaiList.reduce((a, b) => a + getAverage(b), 0) / nilaiList.length) 
    : 0;

  const highestScore = hasGrades 
    ? Math.max(...nilaiList.map(n => getAverage(n))) 
    : 0;

  const targetClassId = santri?.classId || user.classId;
  const currentClass = classes.find(c => c.id === targetClassId) || (santri?.class as SchoolClass) || { id: targetClassId || '', name: user.className || santri?.class?.name || (santri as any)?.className || 'Kelas', level: 'I\'dad' };
  const currentAY = academicYears.find(a => a.id === filterAY) || { id: filterAY, name: '2026/2027' };
  const currentSem = semesters.find(s => s.id === filterSem) || { id: filterSem, name: 'Ganjil' };

  // Resolve assigned Wali Kelas
  const assignedWali = waliKelasList.find(w => w.classId === targetClassId && (w.academicYearId === filterAY || !w.academicYearId) && (w.semesterId === filterSem || !w.semesterId))
    || waliKelasList.find(w => w.classId === targetClassId);
  const waliName = assignedWali?.teacher?.name || (assignedWali as any)?.teacher_name || user.waliKelasName || 'Wali Kelas';
  const waliTeacherId = assignedWali?.teacherId || (assignedWali as any)?.teacher_id || user.waliKelasTeacherId || '';

  // Attendance stats calculation
  const raporAbsen = raporDetail?.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 };
  
  let dailyHadir = 0;
  let dailyIzin = 0;
  let dailySakit = 0;
  let dailyAlpha = 0;

  attendances.forEach(a => {
    dailyHadir += a.jumlahHadir || 0;
    dailyIzin += a.jumlahIzin || 0;
    dailySakit += a.jumlahSakit || 0;
    dailyAlpha += a.jumlahAlpha || 0;
  });

  const totalSakit = Math.max(raporAbsen.sakit || 0, dailySakit);
  const totalIzin = Math.max(raporAbsen.izin || 0, dailyIzin);
  const totalAlpha = Math.max(raporAbsen.tanpaKeterangan || 0, dailyAlpha);
  const totalTidakHadir = totalSakit + totalIzin + totalAlpha;
  
  const totalHariEfektif = Math.max(100, dailyHadir + totalTidakHadir);
  const totalHadir = dailyHadir > 0 ? dailyHadir : Math.max(0, totalHariEfektif - totalTidakHadir);
  const persentaseHadir = totalHariEfektif > 0 ? Math.min(100, Math.round((totalHadir / totalHariEfektif) * 100)) : 100;

  const handlePrint = () => {
    if (!santri) return;
    setPrinting(true);
    try {
      printRapor(santri, currentClass as any, currentAY as any, currentSem as any, nilaiList, subjects, raporDetail, waliName, 'Ust. Aidil Aqli, S.Ag.');
    } catch (err: any) {
      alert('Gagal mencetak rapor: ' + (err.message || 'Error'));
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!santri) return;
    setDownloading(true);
    try {
      downloadRaporPdf(santri, currentClass as any, currentAY as any, currentSem as any, nilaiList, subjects, raporDetail, waliName, 'Ust. Aidil Aqli, S.Ag.', akhlaqScore);
    } catch (err: any) {
      alert('Gagal mengunduh file PDF rapor: ' + (err.message || 'Error'));
    } finally {
      setDownloading(false);
    }
  };

  // Helper compression for file attachments
  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Gagal memuat file gambar.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 10MB.');
      return;
    }

    const isImg = file.type.startsWith('image/');
    if (isImg) {
      try {
        const base64 = await compressImageToBase64(file);
        setTanyaImagePreview(base64);
        setTanyaAttachedFile({
          url: base64,
          name: file.name,
          type: file.type,
          isImage: true
        });
      } catch (err) {
        alert('Gagal memproses file gambar.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setTanyaImagePreview(null);
        setTanyaAttachedFile({
          url: base64,
          name: file.name,
          type: file.type,
          isImage: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTanyaWali = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanyaMessage.trim()) {
      setTanyaError('Pesan pertanyaan tidak boleh kosong.');
      return;
    }

    setSubmittingTanya(true);
    setTanyaError('');
    setTanyaSuccess('');

    try {
      const payload: Partial<TTanyaWaliKelas> = {
        santriId: santri?.id || user.santriId,
        santriName: santri?.name || user.santriName || 'Santri',
        classId: targetClassId || '',
        className: currentClass.name || 'Kelas',
        waliSantriId: user.id,
        waliSantriName: user.name,
        waliKelasId: waliTeacherId || '',
        waliKelasName: waliName,
        subject: tanyaSubject.trim() || 'Konsultasi Santri',
        message: tanyaMessage.trim(),
        imageUrl: tanyaAttachedFile?.isImage ? tanyaAttachedFile.url : (tanyaImagePreview || ''),
        fileUrl: !tanyaAttachedFile?.isImage && tanyaAttachedFile ? tanyaAttachedFile.url : '',
        fileName: tanyaAttachedFile ? tanyaAttachedFile.name : '',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const res = await api.createTanyaWaliKelas(payload);
      setTanyaWaliList(prev => [res, ...prev]);
      setTanyaSubject('');
      setTanyaMessage('');
      setTanyaImagePreview(null);
      setTanyaAttachedFile(null);
      setTanyaSuccess('Pesan konsultasi Anda telah berhasil dikirimkan kepada Wali Kelas.');
      setTimeout(() => setTanyaSuccess(''), 4000);
    } catch (err: any) {
      setTanyaError(err.message || 'Gagal mengirimkan pesan konsultasi.');
    } finally {
      setSubmittingTanya(false);
    }
  };

  const santriDisplayName = santri?.name || user.santriName || user.name?.replace('Wali dari ', '') || 'Nama Santri';
  const santriDisplayNis = santri?.nis || user.nis || '-';
  const santriDisplayClass = currentClass.name || user.className || 'Kelas';

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0b1329] font-sans selection:bg-[#6f2f22] selection:text-white pb-16 transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-[#331c44] dark:bg-[#070d1e] text-[#fff8e8] shadow-md sticky top-0 z-50 border-b border-[#dfc88f]/20 dark:border-sky-500/20 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <img src="/logo-mqba.png" alt="Logo" className="h-9 w-9 bg-white/10 rounded-xl p-1.5 shadow-inner border border-white/5 shrink-0" />
            <div>
              <h1 className="font-black text-xs sm:text-sm uppercase tracking-widest text-[#dfc88f]">Portal Wali Santri</h1>
              <p className="text-[9px] text-[#efe2c5]/75 font-bold uppercase tracking-wider mt-0.5">Akademik MQBA Isy Karima</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/20 dark:bg-slate-900/60 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('rapor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'rapor' 
                  ? 'bg-[#dfc88f] text-[#331c44] shadow-xs' 
                  : 'text-[#efe2c5]/80 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nilai & Rapor</span>
              <span className="sm:hidden">Nilai</span>
            </button>

            <button
              onClick={() => setActiveTab('absensi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'absensi' 
                  ? 'bg-[#dfc88f] text-[#331c44] shadow-xs' 
                  : 'text-[#efe2c5]/80 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Absensi Belajar</span>
              <span className="sm:hidden">Absensi</span>
            </button>

            <button
              onClick={() => setActiveTab('tanyaWali')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'tanyaWali' 
                  ? 'bg-[#dfc88f] text-[#331c44] shadow-xs' 
                  : 'text-[#efe2c5]/80 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Tanya Wali Kelas</span>
              <span className="sm:hidden">Wali Kelas</span>
            </button>

            <button
              onClick={() => setActiveTab('tanyaAdmin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'tanyaAdmin' 
                  ? 'bg-[#dfc88f] text-[#331c44] shadow-xs' 
                  : 'text-[#efe2c5]/80 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tanya Admin</span>
            </button>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-200 transition text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 border border-rose-500/20 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {/* Santri Profile Hero Card (Gambar 2 Solved: Lengkap Nama, NIS, Kelas, Wali Kelas) */}
        <div className="bg-[#fffdf8] dark:bg-[#0f172a] border border-[#c7a86a]/30 dark:border-slate-800 rounded-3xl p-6 shadow-md shadow-[#79462e]/5 dark:shadow-black/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-44 h-44 bg-[#331c44]/5 dark:bg-sky-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c7a86a] via-[#8f6b39] to-[#6f2f22] dark:from-sky-600 dark:to-sky-800 flex items-center justify-center shadow-lg shadow-[#8f6b39]/20 text-white shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#79462e] dark:text-sky-400 bg-[#dfc88f]/20 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-[#c7a86a]/30 dark:border-sky-800/60">
                    Santri MQBA
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#30211b] dark:text-white tracking-tight">
                  {santriDisplayName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#826f64] dark:text-slate-300">
                  <span>NIS: <strong className="text-[#30211b] dark:text-white">{santriDisplayNis}</strong></span>
                  <span>•</span>
                  <span>Kelas: <strong className="text-[#30211b] dark:text-white">{santriDisplayClass}</strong></span>
                  <span>•</span>
                  <span>Wali Kelas: <strong className="text-[#30211b] dark:text-white">{waliName}</strong></span>
                </div>
              </div>
            </div>

            {/* Filter Academic Year & Semester */}
            <div className="flex items-center gap-3 bg-[#f6ebdc]/60 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-[#c7a86a]/20 dark:border-slate-700">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#79462e] dark:text-slate-300 uppercase tracking-wider block">Tahun Ajaran</label>
                <select 
                  value={filterAY} 
                  onChange={e => setFilterAY(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#c7a86a]/40 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8f6b39] cursor-pointer"
                >
                  {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#79462e] dark:text-slate-300 uppercase tracking-wider block">Semester</label>
                <select 
                  value={filterSem} 
                  onChange={e => setFilterSem(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#c7a86a]/40 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8f6b39] cursor-pointer"
                >
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT TABS */}
        {activeTab === 'tanyaAdmin' ? (
          <div className="bg-[#fffdf8] dark:bg-[#0f172a] border border-[#c7a86a]/20 dark:border-slate-800 rounded-3xl p-6 shadow-md">
            <TanyaAdmin currentUser={user} />
          </div>
        ) : activeTab === 'tanyaWali' ? (
          /* TAB 3: TANYA WALI KELAS (KONSULTASI LANGSUNG DENGAN WALI KELAS) */
          <div className="space-y-6 animate-fade-in">
            {/* Header info card */}
            <div className="bg-gradient-to-r from-[#331c44] to-[#6f2f22] dark:from-slate-900 dark:to-sky-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#dfc88f] shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Konsultasi Langsung dengan Wali Kelas
                    </h3>
                    <p className="text-xs text-[#efe2c5]/80 mt-0.5">
                      Wali Kelas Binaan: <strong className="text-[#dfc88f]">{waliName}</strong> ({santriDisplayClass})
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/15 text-xs text-center">
                  <span className="block text-[10px] uppercase font-bold text-[#dfc88f]">Total Konsultasi</span>
                  <span className="text-lg font-black">{tanyaWaliList.length} Pesan</span>
                </div>
              </div>
            </div>

            {/* Form Input Pertanyaan Konsultasi */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/25 dark:border-slate-800 p-6 shadow-sm">
              <h4 className="text-sm font-black text-[#30211b] dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#8f6b39] dark:text-sky-400" />
                <span>Kirim Pesan / Pertanyaan ke Wali Kelas</span>
              </h4>

              {tanyaError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {tanyaError}
                </div>
              )}

              {tanyaSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {tanyaSuccess}
                </div>
              )}

              <form onSubmit={handleSubmitTanyaWali} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#79462e] dark:text-slate-300 mb-1">
                    Topik / Perihal Konsultasi:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Perkembangan Hafalan Al-Qur'an, Kondisi Kesehatan, Kedisiplinan Asrama..."
                    value={tanyaSubject}
                    onChange={(e) => setTanyaSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#faf8f5] dark:bg-slate-800 border border-[#c7a86a]/30 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8f6b39]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#79462e] dark:text-slate-300 mb-1">
                    Isi Pesan / Pertanyaan: *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan pertanyaan atau hal yang ingin dikonsultasikan kepada Wali Kelas santri..."
                    value={tanyaMessage}
                    onChange={(e) => setTanyaMessage(e.target.value)}
                    required
                    className="w-full p-4 rounded-2xl bg-[#faf8f5] dark:bg-slate-800 border border-[#c7a86a]/30 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8f6b39]"
                  />
                </div>

                {/* Attachments */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span>Lampirkan Foto / Dokumen</span>
                  </button>

                  {tanyaAttachedFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 text-xs font-bold text-sky-800 dark:text-sky-300">
                      <span className="truncate max-w-[180px]">{tanyaAttachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setTanyaAttachedFile(null); setTanyaImagePreview(null); }}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingTanya}
                    className="ml-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#8f6b39] to-[#6f2f22] text-[#dfc88f] hover:text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingTanya ? 'Mengirim...' : 'Kirim ke Wali Kelas'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Riwayat Konsultasi dengan Wali Kelas */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#8f6b39] dark:text-sky-400" />
                  <span>Riwayat Percakapan & Tanggapan Wali Kelas</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {tanyaWaliList.length} Catatan
                </span>
              </div>

              {tanyaWaliList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 animate-float" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat pesan konsultasi.</p>
                  <p className="text-xs text-slate-400">Silakan gunakan formulir di atas untuk mengirim pertanyaan kepada Wali Kelas.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
                  {tanyaWaliList.map((item) => {
                    const isPending = item.status === 'Pending';
                    return (
                      <div key={item.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-700/60">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#8f6b39] dark:text-sky-400 block">
                              {item.subject || 'Konsultasi Santri'}
                            </span>
                            <span className="text-xs text-slate-400">
                              Dikirim: {new Date(item.createdAt || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                            isPending 
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200' 
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                          }`}>
                            {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{isPending ? 'Menunggu Balasan' : 'Sudah Dibalas'}</span>
                          </span>
                        </div>

                        {/* Pesan dari Wali Santri */}
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {item.message}
                        </div>

                        {/* Attached media if any */}
                        {(item.imageUrl || item.fileUrl) && (
                          <div className="pt-1 flex items-center gap-2">
                            {item.imageUrl && (
                              <div 
                                onClick={() => setModalImage(item.imageUrl || null)}
                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
                              >
                                <img src={item.imageUrl} alt="Lampiran" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                download={item.fileName || 'Lampiran'}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 text-xs font-bold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Download File</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Jawaban Balasan Wali Kelas */}
                        {item.waliReply ? (
                          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                                <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Balasan Wali Kelas ({item.waliKelasName || waliName}):</span>
                              </div>
                              {item.replyAt && (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                  {new Date(item.replyAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed pl-5">
                              {item.waliReply}
                            </p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 text-[11px] text-amber-700 dark:text-amber-400 italic">
                            Pesan Anda sedang ditinjau oleh Wali Kelas ({waliName}). Notifikasi balasan akan muncul di sini.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'absensi' ? (
          /* TAB 2: ABSENSI & KEHADIRAN BELAJAR SANTRI */
          <div className="space-y-6 animate-fade-in">
            {/* Attendance Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Persentase Kehadiran */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-[#c7a86a]/25 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Persentase Hadir</span>
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#30211b] dark:text-white">{persentaseHadir}%</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${persentaseHadir}%` }} />
                </div>
              </div>

              {/* Card 2: Hadir */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Hadir</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">{totalHadir}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">Pertemuan Belajar</p>
              </div>

              {/* Card 3: Sakit & Izin */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-amber-200 dark:border-amber-900/40 shadow-sm">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Sakit / Izin</span>
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
                  {totalSakit + totalIzin} <span className="text-xs font-normal text-slate-500">Hari</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  S: {totalSakit} hr · I: {totalIzin} hr
                </p>
              </div>

              {/* Card 4: Alpha / Tanpa Keterangan */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-rose-200 dark:border-rose-900/40 shadow-sm">
                <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Tanpa Keterangan</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400">{totalAlpha}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalAlpha === 0 ? 'Disiplin Sangat Baik' : 'Perlu Perhatian'}
                </p>
              </div>
            </div>

            {/* Rapor Ketidakhadiran Resmi Box */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Rekapitulasi Kehadiran Semester ({currentSem.name} TA {currentAY.name})</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Data resmi catatan kehadiran dan kedisiplinan belajar santri di kelas</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-center">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block mb-1">Sakit (S)</span>
                  <p className="text-3xl font-black text-amber-800 dark:text-amber-300">{totalSakit}</p>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Hari Berhalangan Sakit</span>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 text-center">
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-300 block mb-1">Izin Resmi (I)</span>
                  <p className="text-3xl font-black text-sky-800 dark:text-sky-300">{totalIzin}</p>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold">Hari Izin Kepentingan</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 text-center">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300 block mb-1">Tanpa Keterangan (A)</span>
                  <p className="text-3xl font-black text-rose-800 dark:text-rose-300">{totalAlpha}</p>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold">Hari Alpa / Tanpa Surat</span>
                </div>
              </div>
            </div>

            {/* Riwayat Catatan Presensi Belajar Santri */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8f6b39] dark:text-sky-400" />
                  <span>Riwayat Presensi Pertemuan KBM</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {attendances.length} Catatan Terdata
                </span>
              </div>

              {attendances.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 animate-float" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat catatan harian yang diinput pengajar.</p>
                  <p className="text-xs text-slate-400">Rekapitulasi kehadiran semester tetap tercatat secara resmi di atas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-4 py-3">Mata Pelajaran</th>
                        <th className="px-4 py-3 text-center">Status Kehadiran</th>
                        <th className="px-5 py-3">Keterangan / Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendances.map(a => {
                        const isAlpha = a.jumlahAlpha > 0;
                        const isSakit = a.jumlahSakit > 0;
                        const isIzin = a.jumlahIzin > 0;
                        const statusLabel = isAlpha ? 'Alpha' : isSakit ? 'Sakit' : isIzin ? 'Izin' : 'Hadir';
                        const badgeColor = isAlpha ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200' :
                                           isSakit ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200' :
                                           isIzin  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200' :
                                                     'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200';
                        return (
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {a.date ? new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                              {a.subjectName || a.subject?.name || 'KBM Kelas'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                              {a.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 1: NILAI & RAPOR SANTRI */
          <div className="space-y-6 animate-fade-in">
            {/* Score Metric Cards (Gambar 1 Solved: Rapi & Akurat) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Card 1: Rata-Rata Nilai Akhir */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-[#c7a86a]/30 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-[#79462e] dark:text-sky-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Rata-Rata Rapor</span>
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-[#6f2f22] dark:text-[#dfc88f]">
                  {hasGrades ? avg : '-'}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  Predikat: <strong className="text-[#30211b] dark:text-white">
                    {hasGrades 
                      ? (avg >= 90 ? 'A (Mumtaz)' : avg >= 80 ? 'B (Jayyid Jiddan)' : avg >= 70 ? 'C (Jayyid)' : 'D (Perlu Bimbingan)')
                      : 'Sedang Proses'}
                  </strong>
                </p>
              </div>

              {/* Card 2: Jumlah Mata Pelajaran */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-[#c7a86a]/30 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-[#79462e] dark:text-sky-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Mapel</span>
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-[#30211b] dark:text-white">
                  {hasGrades ? nilaiList.length : (subjects.length > 0 ? subjects.length : '-')}
                </p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {hasGrades ? 'Nilai Mapel Terdata' : 'Mata Pelajaran Kurikulum'}
                </p>
              </div>

              {/* Card 3: Nilai Tertinggi */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Nilai Tertinggi</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {hasGrades ? highestScore : '-'}
                </p>
                <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                  {hasGrades ? 'Capaian Terbaik' : 'Menunggu Input Guru'}
                </p>
              </div>

              {/* Card 4: Nilai Akhlaq & Adab */}
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-purple-200 dark:border-purple-900/40 shadow-sm">
                <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Nilai Akhlaq / Adab</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-purple-700 dark:text-purple-400">{akhlaqScore}</p>
                <p className="text-[10px] font-bold text-purple-800 dark:text-purple-300 mt-1">
                  {akhlaqScore >= 90 ? 'A (Sangat Terpuji)' : 'B (Baik)'}
                </p>
              </div>
            </div>

            {/* Rapor Section Table */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#331c44]/5 dark:from-slate-800/40 to-transparent flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#dfc88f]/20 text-[#6f2f22] dark:text-[#dfc88f]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#30211b] dark:text-white uppercase tracking-wider">
                      Rincian Seluruh Nilai Akademik Santri
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Semester {currentSem.name} Tahun Ajaran {currentAY.name}</p>
                  </div>
                </div>

                {/* Print & Download Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    disabled={printing || !hasGrades}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{printing ? 'Menyiapkan...' : 'Print'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading || !hasGrades}
                    className="px-4 py-2 bg-[#331c44] hover:bg-[#241331] text-[#dfc88f] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? 'Mengunduh...' : 'Download Rapor PDF'}</span>
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 text-center text-slate-500 text-sm animate-pulse">Memuat data nilai...</div>
              ) : nilaiList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <Calendar className="w-12 h-12 mx-auto text-[#c7a86a]/50 animate-float" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nilai semester ini sedang dalam proses penginputan oleh Asatidz Pengampu Mapel.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Data nilai harian, bulanan, UTS, dan UAS akan otomatis tampil di tabel ini setelah disimpan oleh pengajar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] font-black text-[#79462e] dark:text-[#dfc88f] uppercase tracking-wider bg-[#f6ebdc]/80 dark:bg-slate-800/80 border-b border-[#c7a86a]/15 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3.5 text-center">No</th>
                        <th className="px-5 py-3.5">Mata Pelajaran</th>
                        <th className="px-3 py-3.5 text-center">Harian</th>
                        <th className="px-3 py-3.5 text-center">Bulanan / Tugas</th>
                        <th className="px-3 py-3.5 text-center">UTS</th>
                        <th className="px-3 py-3.5 text-center">UAS Tulis (60%)</th>
                        <th className="px-3 py-3.5 text-center">UAS Lisan</th>
                        <th className="px-4 py-3.5 text-center font-extrabold">Nilai Akhir</th>
                        <th className="px-3 py-3.5 text-center">Predikat</th>
                        <th className="px-5 py-3.5">Catatan / Evaluasi Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c7a86a]/10 dark:divide-slate-800">
                      {nilaiList.map((n, idx) => {
                        const studentAvg = getAverage(n);
                        const predikat = studentAvg >= 90 ? 'A' : studentAvg >= 80 ? 'B' : studentAvg >= 70 ? 'C' : 'D';
                        return (
                          <tr key={n.id} className="hover:bg-[#331c44]/5 dark:hover:bg-slate-800/50 transition">
                            <td className="px-4 py-4 text-center font-bold text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-5 py-4 font-bold text-[#30211b] dark:text-white">
                              {(n as any).subject?.name || subjects.find(s => s.id === n.subjectId)?.name || n.subjectId}
                            </td>
                            <td className="px-3 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{n.harian || '-'}</td>
                            <td className="px-3 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{n.bulanan || '-'}</td>
                            <td className="px-3 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{n.uts || '-'}</td>
                            <td className="px-3 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">{n.uas || '-'}</td>
                            <td className="px-3 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {n.uasLisan && n.uasLisan > 0 ? (
                                <span className="px-2 py-0.5 rounded bg-[#dfc88f]/20 text-[#6f2f22] dark:text-[#dfc88f] font-bold">{n.uasLisan}</span>
                              ) : (
                                <span className="italic opacity-40">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl font-black text-xs ${
                                studentAvg < 70 
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200' 
                                  : 'bg-[#e9dcc5] text-[#402654] dark:bg-slate-800 dark:text-[#dfc88f] border border-[#c7a86a]/30'
                              }`}>
                                {studentAvg}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                predikat === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                predikat === 'B' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                                predikat === 'C' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                                   'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {predikat}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-xs">
                              {n.notes || <span className="italic opacity-40">Sangat baik dalam proses KBM</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Additional Progress Sections: Kepribadian, Tahfizh & Catatan Wali Kelas */}
            {raporDetail && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Section 1: Kepribadian & Akhlaq */}
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#79462e] dark:text-sky-400 font-extrabold text-xs uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Perkembangan Kepribadian & Adab</span>
                  </div>
                  <div className="space-y-2">
                    {(raporDetail.kepribadian || [
                      { aspek: 'Kelakuan & Adab', predikat: 'A', deskripsi: 'Menunjukkan adab yang sangat santun kepada asatidz dan teman.' },
                      { aspek: 'Kerajinan Belajar', predikat: 'A', deskripsi: 'Disiplin dan aktif mengikuti seluruh halaqah pembelajaran.' },
                      { aspek: 'Kerapian & Kebersihan', predikat: 'A', deskripsi: 'Selalu menjaga kebersihan pakaian dan kamar asrama.' }
                    ]).map((k, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/60 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-xs text-slate-800 dark:text-white">{k.aspek}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{k.deskripsi || '-'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                          {k.predikat || 'A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Catatan Wali Kelas & Ketahfizhan */}
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-[#c7a86a]/20 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#79462e] dark:text-sky-400 font-extrabold text-xs uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                    <Sparkles className="w-4 h-4" />
                    <span>Catatan & Pesan Wali Kelas</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#fdfbf7] dark:bg-slate-800/50 border border-[#c7a86a]/25 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                    {raporDetail.catatanWaliKelas || 'Pertahankan semangat belajar dan hafalan Al-Qur\'an. Terus tingkatkan muraja\'ah dan adab mulia dalam keseharian di ma\'had.'}
                  </div>

                  {raporDetail.ketahfizhan && raporDetail.ketahfizhan.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Capaian Tahfizh Al-Qur'an:</p>
                      <div className="space-y-1.5">
                        {raporDetail.ketahfizhan.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/40">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{t.capaian || 'Tahfizh'}</span>
                            <span className="font-bold text-sky-800 dark:text-sky-300">{t.penilaian || 'Mutqin'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox for Images */}
      {modalImage && (
        <div 
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={modalImage} alt="Lampiran Besar" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
