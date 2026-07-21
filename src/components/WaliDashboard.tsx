import React from 'react';
import { BookOpen, LogOut, GraduationCap, Calendar, Printer } from 'lucide-react';
import { User, Santri, Nilai, AcademicYear, Semester } from '../types';
import { api } from '../api';
import { printRapor } from '../utils/printRapor';

interface WaliDashboardProps {
  user: User;
  academicYears: AcademicYear[];
  semesters: Semester[];
  onLogout: () => void;
}

export default function WaliDashboard({ user, academicYears, semesters, onLogout }: WaliDashboardProps) {
  const [santri, setSantri] = React.useState<Santri | null>(null);
  const [nilaiList, setNilaiList] = React.useState<Nilai[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [printing, setPrinting] = React.useState(false);

  // Filter
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');

  React.useEffect(() => {
    // Current user for WaliSantri has santriId set.
    const santriId = user.santriId;
    if (!santriId) return;

    setLoading(true);
    // Kita panggil getNilai dan getSantri
    Promise.all([
      api.getSantri().then(list => list.find(s => s.id === santriId)),
      api.getNilai({ santriId, academicYearId: filterAY, semesterId: filterSem })
    ]).then(([sData, nData]) => {
      if (sData) setSantri(sData);
      setNilaiList(nData);
      setLoading(false);
    }).catch(() => setLoading(false));

  }, [user.santriId, filterAY, filterSem]);

  if (loading && !santri) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f3ead7] dark:bg-[#17120f]">
        <div className="text-[#6f2f22] dark:text-[#dfc88f] animate-pulse font-bold tracking-widest uppercase">
          Memuat Data Santri...
        </div>
      </div>
    );
  }

  const getAverage = (n: Nilai): number => {
    const count = [n.harian, n.bulanan, n.uts, n.uas, n.uasLisan || 0].filter(v => v > 0).length;
    if (count === 0) return 0;
    return Math.round((n.harian + n.bulanan + n.uts + n.uas + (n.uasLisan || 0)) / count);
  };

  const avg = nilaiList.length > 0 
    ? Math.round(nilaiList.reduce((a, b) => a + getAverage(b), 0) / nilaiList.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0f0b09] font-sans selection:bg-[#6f2f22] selection:text-white pb-16 transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-[#331c44] text-[#fff8e8] shadow-md sticky top-0 z-50 border-b border-[#dfc88f]/20 backdrop-blur-md bg-opacity-95">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo-mqba.png" alt="Logo" className="h-9 w-9 bg-white/10 rounded-xl p-1.5 shadow-inner border border-white/5" />
            <div>
              <h1 className="font-black text-sm uppercase tracking-widest text-[#dfc88f]">Portal Wali Santri</h1>
              <p className="text-[9px] text-[#efe2c5]/75 font-bold uppercase tracking-wider mt-0.5">Akademik MQBA Isy Karima</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-200 transition text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 border border-rose-500/10">
            <LogOut className="w-3.5 h-3.5" /><span>Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#fffdf8] dark:bg-[#1a1310] border border-[#c7a86a]/20 dark:border-[#c7a86a]/10 rounded-[2rem] p-6 shadow-lg shadow-[#79462e]/5 dark:shadow-black/40 relative overflow-hidden premium-card">
          <div className="absolute right-0 top-0 w-36 h-36 bg-[#331c44]/5 dark:bg-[#dfc88f]/5 rounded-bl-full" />
          <div className="flex items-start space-x-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c7a86a] to-[#8f6b39] flex items-center justify-center shadow-lg shadow-[#8f6b39]/20 text-white animate-float">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#79462e] dark:text-[#dfc88f]">
                Santri Terdaftar
              </p>
              <h2 className="text-2xl font-black text-[#30211b] dark:text-[#fff8e8] tracking-tight">{santri?.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#826f64] dark:text-[#bdaea4]">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6f2f22] dark:bg-[#c7a86a]" />
                  <span>NIS: {santri?.nis}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6f2f22] dark:bg-[#c7a86a]" />
                  <span>Kelas: {santri?.class?.name || santri?.classId}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1 w-44">
            <label className="text-[9px] font-black text-[#79462e] dark:text-[#dfc88f] uppercase tracking-wider block">Tahun Ajaran</label>
            <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7a86a]/40 dark:border-[#c7a86a]/20 bg-white dark:bg-[#1a1310] dark:text-[#fff8e8] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#8f6b39]/20 transition-all cursor-pointer">
              {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-44">
            <label className="text-[9px] font-black text-[#79462e] dark:text-[#dfc88f] uppercase tracking-wider block">Semester</label>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7a86a]/40 dark:border-[#c7a86a]/20 bg-white dark:bg-[#1a1310] dark:text-[#fff8e8] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#8f6b39]/20 transition-all cursor-pointer">
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Rapor Section */}
        <div className="bg-[#fffdf8] dark:bg-[#1a1310] rounded-[2rem] border border-[#c7a86a]/20 dark:border-[#c7a86a]/15 shadow-xl shadow-[#79462e]/5 dark:shadow-black/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-[#c7a86a]/10 bg-gradient-to-r from-[#331c44]/5 to-transparent flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xs font-black text-[#30211b] dark:text-[#dfc88f] uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#8f6b39]" />
              <span>Rapor Hasil Belajar</span>
            </h3>
            {nilaiList.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#826f64] dark:text-[#bdaea4] leading-none">Rata-rata</p>
                  <p className="text-2xl font-black text-[#6f2f22] dark:text-[#dfc88f] mt-1 tracking-tight">{avg}</p>
                </div>
                <button
                  onClick={async () => {
                    if (!santri) return;
                    setPrinting(true);
                    try {
                      const [classes, subjects, waliKelasList, raporDetails] = await Promise.all([
                        api.getClasses(),
                        api.getSubjects(),
                        api.getWaliKelas(),
                        api.getRaporDetail({ santriId: santri.id, academicYearId: filterAY, semesterId: filterSem })
                      ]);
                      const cls = classes.find(c => c.id === santri.classId);
                      const ay = academicYears.find(a => a.id === filterAY);
                      const sem = semesters.find(s => s.id === filterSem);
                      const raporDetail = raporDetails.length > 0 ? raporDetails[0] : null;
                      const wali = waliKelasList.find(w => w.classId === santri.classId && w.academicYearId === filterAY && w.semesterId === filterSem);
                      const waliName = wali?.teacher?.name || "Wali Kelas";
                      
                      if (cls && ay && sem) {
                        printRapor(santri, cls, ay, sem, nilaiList, subjects, raporDetail, waliName);
                      }
                    } catch (err) {
                      alert("Gagal menyiapkan data cetak rapor.");
                    } finally {
                      setPrinting(false);
                    }
                  }}
                  disabled={printing}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#4d3266] to-[#331c44] hover:from-[#3f2555] hover:to-[#221030] text-[#dfc88f] rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-[#331c44]/10 hover:shadow-[#331c44]/20 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 border border-[#dfc88f]/10"
                >
                  <Printer className="w-4 h-4"/> {printing ? 'Menyiapkan...' : 'Cetak Rapor'}
                </button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-[#826f64] text-sm animate-pulse">Memuat nilai...</div>
          ) : nilaiList.length === 0 ? (
            <div className="p-16 text-center text-[#826f64] space-y-3">
              <Calendar className="w-12 h-12 mx-auto text-[#c7a86a]/50 animate-float" />
              <p className="text-sm font-bold">Belum ada nilai untuk semester ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[9px] font-black text-[#79462e] dark:text-[#dfc88f] uppercase tracking-widest bg-[#f6ebdc]/80 dark:bg-[#271e19]/80 border-b border-[#c7a86a]/15">
                  <tr>
                    <th className="px-6 py-3.5">Mata Pelajaran</th>
                    <th className="px-3 py-3.5 text-center">Harian</th>
                    <th className="px-3 py-3.5 text-center">Bulanan</th>
                    <th className="px-3 py-3.5 text-center">UTS</th>
                    <th className="px-3 py-3.5 text-center">UAS Tulis</th>
                    <th className="px-3 py-3.5 text-center">UAS Lisan</th>
                    <th className="px-4 py-3.5 text-center">Rata²</th>
                    <th className="px-6 py-3.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c7a86a]/10 text-xs sm:text-sm">
                  {nilaiList.map(n => {
                    const studentAvg = getAverage(n);
                    return (
                      <tr key={n.id} className="hover:bg-[#331c44]/5 dark:hover:bg-[#dfc88f]/5 transition-colors duration-200">
                        <td className="px-6 py-4.5 font-bold text-[#30211b] dark:text-[#fff8e8]">
                          {(n as any).subject?.name || n.subjectId}
                        </td>
                        <td className="px-3 py-4.5 text-center font-bold text-[#826f64] dark:text-[#bdaea4]">{n.harian || '-'}</td>
                        <td className="px-3 py-4.5 text-center font-bold text-[#826f64] dark:text-[#bdaea4]">{n.bulanan || '-'}</td>
                        <td className="px-3 py-4.5 text-center font-bold text-[#826f64] dark:text-[#bdaea4]">{n.uts || '-'}</td>
                        <td className="px-3 py-4.5 text-center font-bold text-[#826f64] dark:text-[#bdaea4]">{n.uas || '-'}</td>
                        <td className="px-3 py-4.5 text-center font-bold text-[#826f64] dark:text-[#bdaea4]">{n.uasLisan || '-'}</td>
                        <td className="px-4 py-4.5 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${studentAvg < 75 ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-200/50' : 'bg-[#e9dcc5] text-[#402654] dark:bg-[#2c2018] dark:text-[#dfc88f] border border-[#c7a86a]/20'}`}>
                            {studentAvg}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs leading-relaxed text-[#826f64] dark:text-[#bdaea4] max-w-xs truncate">
                          {n.notes || <span className="italic opacity-45">Tidak ada catatan</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
