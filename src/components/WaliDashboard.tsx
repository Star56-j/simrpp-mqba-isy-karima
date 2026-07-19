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
    const count = [n.harian, n.bulanan, n.uts, n.uas].filter(v => v > 0).length;
    if (count === 0) return 0;
    return Math.round((n.harian + n.bulanan + n.uts + n.uas) / count);
  };

  const avg = nilaiList.length > 0 
    ? Math.round(nilaiList.reduce((a, b) => a + getAverage(b), 0) / nilaiList.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f3ead7] dark:bg-[#17120f] font-sans selection:bg-[#6f2f22] selection:text-white pb-12">
      {/* Navbar */}
      <nav className="bg-[#402654] text-[#fff8e8] shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo-mqba.png" alt="Logo" className="h-8 w-8 bg-white/10 rounded p-1" />
            <div>
              <h1 className="font-black text-sm uppercase tracking-widest text-[#dfc88f]">Portal Wali Santri</h1>
              <p className="text-[10px] text-[#efe2c5]/70">Akademik MQBA Isy Karima</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition text-xs font-bold uppercase tracking-wider">
            <LogOut className="w-3.5 h-3.5" /><span>Keluar</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#fffdf8] dark:bg-[#251c18] border border-[#c7a86a]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#402654]/5 rounded-bl-full" />
          <div className="flex items-start space-x-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c7a86a] to-[#8f6b39] flex items-center justify-center shadow-lg text-white">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#79462e] dark:text-[#dfc88f] mb-1">
                Data Santri
              </p>
              <h2 className="text-2xl font-black text-[#30211b] dark:text-[#fff8e8]">{santri?.name}</h2>
              <div className="flex items-center space-x-4 mt-2 text-xs font-semibold text-[#826f64] dark:text-[#bdaea4]">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6f2f22] dark:bg-[#c7a86a]" />
                  <span>NIS: {santri?.nis}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6f2f22] dark:bg-[#c7a86a]" />
                  <span>Kelas: {santri?.class?.name || santri?.classId}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="space-y-1 w-40">
            <label className="text-[10px] font-bold text-[#79462e] dark:text-[#dfc88f] uppercase tracking-wider block">Tahun Ajaran</label>
            <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#c7a86a]/50 bg-[#fffdf8] dark:bg-[#251c18] dark:text-[#fff8e8] text-xs focus:outline-none focus:ring-2 focus:ring-[#8f6b39]">
              {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-40">
            <label className="text-[10px] font-bold text-[#79462e] dark:text-[#dfc88f] uppercase tracking-wider block">Semester</label>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#c7a86a]/50 bg-[#fffdf8] dark:bg-[#251c18] dark:text-[#fff8e8] text-xs focus:outline-none focus:ring-2 focus:ring-[#8f6b39]">
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Rapor Section */}
        <div className="bg-[#fffdf8] dark:bg-[#251c18] rounded-3xl border border-[#c7a86a]/30 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c7a86a]/20 bg-gradient-to-r from-[#402654]/5 to-transparent flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-sm font-extrabold text-[#30211b] dark:text-[#dfc88f] uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#8f6b39]" />
              <span>Rapor Hasil Belajar</span>
            </h3>
            {nilaiList.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#826f64] dark:text-[#bdaea4]">Rata-rata</p>
                  <p className="text-xl font-black text-[#6f2f22] dark:text-[#c7a86a]">{avg}</p>
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
                  className="px-4 py-2 bg-[#402654] hover:bg-[#2c1a3b] text-[#dfc88f] rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
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
              <Calendar className="w-12 h-12 mx-auto text-[#c7a86a]/50" />
              <p className="text-sm font-bold">Belum ada nilai untuk semester ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[10px] font-black text-[#79462e] dark:text-[#dfc88f] uppercase tracking-[0.1em] bg-[#f8eed9] dark:bg-[#342720]">
                  <tr>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-2 py-3 text-center">Harian</th>
                    <th className="px-2 py-3 text-center">Bulanan</th>
                    <th className="px-2 py-3 text-center">UTS</th>
                    <th className="px-2 py-3 text-center">UAS</th>
                    <th className="px-3 py-3 text-center">Rata²</th>
                    <th className="px-4 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c7a86a]/10 text-xs sm:text-sm">
                  {nilaiList.map(n => {
                    const studentAvg = getAverage(n);
                    return (
                      <tr key={n.id} className="hover:bg-[#402654]/5 transition-colors">
                        <td className="px-4 py-4 font-bold text-[#30211b] dark:text-[#fff8e8]">
                          {(n as any).subject?.name || n.subjectId}
                        </td>
                        <td className="px-2 py-4 text-center font-semibold text-[#826f64] dark:text-[#bdaea4]">{n.harian || '-'}</td>
                        <td className="px-2 py-4 text-center font-semibold text-[#826f64] dark:text-[#bdaea4]">{n.bulanan || '-'}</td>
                        <td className="px-2 py-4 text-center font-semibold text-[#826f64] dark:text-[#bdaea4]">{n.uts || '-'}</td>
                        <td className="px-2 py-4 text-center font-semibold text-[#826f64] dark:text-[#bdaea4]">{n.uas || '-'}</td>
                        <td className="px-3 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black ${studentAvg < 75 ? 'bg-rose-100 text-rose-700' : 'bg-[#e9dcc5] text-[#402654] dark:bg-[#473428] dark:text-[#dfc88f]'}`}>
                            {studentAvg}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs leading-5 text-[#826f64] dark:text-[#bdaea4]">
                          {n.notes || <span className="italic opacity-50">Tidak ada catatan</span>}
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
