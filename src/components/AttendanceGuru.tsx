import React from 'react';
import { ClipboardList, Plus, CheckCircle, AlertCircle, X, Download, BookOpen, Edit, Trash2, Printer, Calendar, BarChart3, Filter } from 'lucide-react';
import { Attendance, AttendanceSummary, AcademicYear, Semester, Subject, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { printRekapKehadiran } from '../utils/printRekapKehadiran';
import { downloadRekapKehadiranPdf, downloadRekapSantriPdf } from '../utils/pdfDownloader';
import { printGenericTable } from '../utils/printUtils';

interface AttendanceGuruProps {
  academicYears: AcademicYear[];
  semesters: Semester[];
  subjects?: Subject[];
  schedules?: TeachingSchedule[];
}

const STATUS_COLORS: Record<string, string> = {
  Hadir: 'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
  Izin:  'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Sakit: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Alpha: 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AttendanceGuru({ academicYears, semesters, subjects = [], schedules = [] }: AttendanceGuruProps) {
  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const todayStr     = new Date().toISOString().split('T')[0];

  const myUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('simrpp_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const teacherIds = React.useMemo(() => {
    return [
      myUser.teacherId,
      myUser.teacher_id,
      (myUser.teacher && myUser.teacher.id),
      myUser.id
    ].filter(Boolean);
  }, [myUser]);

  const myTeacherId = React.useMemo(() => {
    return myUser.teacherId || myUser.teacher_id || (myUser.teacher && myUser.teacher.id) || myUser.id || 't-12';
  }, [myUser]);

  // Filter subjects taught by this teacher
  const myTeacherSubjectObjects = React.useMemo(() => {
    if (schedules.length === 0 || subjects.length === 0) return subjects;
    const mySchedules = schedules.filter(s => teacherIds.includes(s.teacherId) || teacherIds.includes((s as any).teacher_id));
    const subjIds = Array.from(new Set(mySchedules.map(s => s.subjectId || (s as any).subject_id).filter(Boolean)));
    const filtered = subjects.filter(s => subjIds.includes(s.id));
    return filtered.length > 0 ? filtered : subjects;
  }, [teacherIds, schedules, subjects]);

  const [activeTab, setActiveTab] = React.useState<'isi' | 'list' | 'rekap'>('isi');

  // Filter untuk riwayat & rekap
  const [filterAY,      setFilterAY]      = React.useState(academicYears[0]?.id || '');
  const [filterSem,     setFilterSem]     = React.useState(semesters[0]?.id || '');
  const [filterYear,    setFilterYear]    = React.useState(currentYear);
  const [filterMonth,   setFilterMonth]   = React.useState(currentMonth);
  const [filterSubject, setFilterSubject] = React.useState('Semua');
  const [rekapMode,     setRekapMode]     = React.useState<'bulan'|'semester'|'tahun'>('bulan');

  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [summary,     setSummary]     = React.useState<AttendanceSummary | null>(null);
  const [loading,     setLoading]     = React.useState(false);

  // Form isi absensi mandiri
  const [fDate,      setFDate]      = React.useState(todayStr);
  const [fStatus,    setFStatus]    = React.useState<'Hadir'|'Izin'|'Sakit'>('Hadir');
  const [fSubjectId, setFSubjectId] = React.useState('');
  const [fNotes,     setFNotes]     = React.useState('');
  const [fAY,        setFAY]        = React.useState(academicYears[0]?.id || '');
  const [fSem,       setFSem]       = React.useState(semesters[0]?.id || '');
  const [submitting, setSubmitting]  = React.useState(false);
  const [formError,   setFormError]   = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [editingId,   setEditingId]   = React.useState<string | null>(null);

  React.useEffect(() => {
    if (myTeacherSubjectObjects.length > 0 && !fSubjectId) {
      setFSubjectId(myTeacherSubjectObjects[0].id);
    }
  }, [myTeacherSubjectObjects, fSubjectId]);

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = { 
      academicYearId: filterAY, 
      semesterId: filterSem, 
      year: filterYear,
      teacherId: myTeacherId
    };
    if (rekapMode === 'bulan') p.month = filterMonth;
    if (filterSubject && filterSubject !== 'Semua') p.subjectId = filterSubject;
    return p;
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode, myTeacherId, filterSubject]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const params = buildParams();
    try {
      const [list, sumList] = await Promise.all([
        api.getAttendances(params),
        api.getAttendanceSummary(params),
      ]);
      // Filter strictly for this teacher
      const myRecords = (list || []).filter(a => {
        const tId = a.teacherId || (a as any).teacher_id || (a.teacher && a.teacher.id);
        return teacherIds.length === 0 || teacherIds.includes(tId);
      });
      setAttendances(myRecords);

      // Compute summary strictly for current teacher
      const targetSum = (sumList || []).find(s => teacherIds.includes(s.teacherId));
      if (targetSum) {
        setSummary(targetSum);
      } else {
        const h = myRecords.filter(a => a.status === 'Hadir').length;
        const i = myRecords.filter(a => a.status === 'Izin').length;
        const s = myRecords.filter(a => a.status === 'Sakit').length;
        const a = myRecords.filter(a => a.status === 'Alpha').length;
        const tot = myRecords.length;
        setSummary({
          teacherId: myTeacherId,
          teacherName: myUser.name || 'Guru',
          hadir: h,
          izin: i,
          sakit: s,
          alpha: a,
          total: tot,
          persentaseHadir: tot > 0 ? Math.round((h / tot) * 100) : 0
        });
      }
    } catch (err) { 
      console.error('Failed to load teacher attendances:', err);
      setAttendances([]); 
      setSummary(null); 
    } finally {
      setLoading(false);
    }
  }, [buildParams, teacherIds, myTeacherId, myUser.name]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // Per-Subject Summary breakdown for Rekap Tab
  const perSubjectSummary = React.useMemo(() => {
    const subMap = new Map<string, { subjectId: string; subjectName: string; hadir: number; izin: number; sakit: number; alpha: number; total: number; persentaseHadir: number }>();
    
    // Initialize with teacher's assigned subjects
    myTeacherSubjectObjects.forEach(s => {
      subMap.set(s.id, {
        subjectId: s.id,
        subjectName: s.name,
        hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, persentaseHadir: 0
      });
    });

    // Populate from active attendances
    attendances.forEach(a => {
      const sId = a.subjectId || (a as any).subject_id || 'unknown';
      const sName = subjects.find(s => s.id === sId)?.name || (a as any).subjectName || 'Mata Pelajaran Umum';
      if (!subMap.has(sId)) {
        subMap.set(sId, {
          subjectId: sId,
          subjectName: sName,
          hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, persentaseHadir: 0
        });
      }
      const entry = subMap.get(sId)!;
      if (a.status === 'Hadir') entry.hadir++;
      else if (a.status === 'Izin') entry.izin++;
      else if (a.status === 'Sakit') entry.sakit++;
      else if (a.status === 'Alpha') entry.alpha++;
      entry.total++;
    });

    return Array.from(subMap.values()).map(entry => {
      entry.persentaseHadir = entry.total > 0 ? Math.round((entry.hadir / entry.total) * 100) : 0;
      return entry;
    });
  }, [attendances, myTeacherSubjectObjects, subjects]);

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s => s.id === filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  const handleExport = () => {
    if (activeTab === 'list') {
      const dataToExport = attendances.map((a, idx) => {
        const subjName = subjects.find(s => s.id === a.subjectId)?.name || (a as any).subjectName || 'Pengajar MQBA';
        return {
          'No': idx + 1,
          'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
          'Mata Pelajaran': subjName,
          'Status': a.status,
          'Keterangan': a.notes || '-'
        };
      });
      exportToExcel(dataToExport, `Riwayat_Absensi_Saya_${rekapLabel.replace(/\s+/g, '_')}`);
    } else if (activeTab === 'rekap') {
      const dataToExport = perSubjectSummary.map((s, idx) => ({
        'No': idx + 1,
        'Mata Pelajaran': s.subjectName,
        'Hadir': s.hadir,
        'Izin': s.izin,
        'Sakit': s.sakit,
        'Alpha': s.alpha,
        'Total Jam Sesi': s.total,
        '% Kehadiran': `${s.persentaseHadir}%`
      }));
      exportToExcel(dataToExport, `Rekap_Absensi_Saya_${rekapLabel.replace(/\s+/g, '_')}`);
    }
  };

  const handleSelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    setSubmitting(true);
    try {
      const selectedSubj = subjects.find(s => s.id === fSubjectId);
      const subjName = selectedSubj ? selectedSubj.name : '';

      if (editingId) {
        await api.updateAttendance(editingId, { 
          date: fDate, 
          status: fStatus, 
          notes: fNotes, 
          academicYearId: fAY, 
          semesterId: fSem,
          subjectId: fSubjectId,
          teacherId: myTeacherId
        });
        setFormSuccess(`Absensi berhasil diperbarui.`);
        setEditingId(null);
      } else {
        await api.selfAttendance({ 
          date: fDate, 
          status: fStatus, 
          notes: fNotes, 
          academicYearId: fAY, 
          semesterId: fSem,
          subjectId: fSubjectId,
          teacherId: myTeacherId
        });
        setFormSuccess(`Absensi ${fDate} untuk mapel "${subjName || 'Pengajar'}" berhasil dicatat sebagai "${fStatus}".`);
      }
      setFNotes('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAttendance = (a: Attendance) => {
    setEditingId(a.id);
    setFDate(a.date);
    setFStatus(a.status as any);
    setFNotes(a.notes || '');
    setFAY(a.academicYearId);
    setFSem(a.semesterId);
    if (a.subjectId) setFSubjectId(a.subjectId);
    setActiveTab('isi');
  };

  const handleDeleteAttendance = async (id: string, dateStr: string, subjName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan absensi tanggal ${dateStr} (${subjName})?`)) {
      try {
        await api.deleteAttendance(id);
        loadData();
      } catch (err: any) {
        alert('Gagal menghapus absensi: ' + err.message);
      }
    }
  };

  const handlePrint = () => {
    if (activeTab === 'list') {
      const title = 'Riwayat Absensi Kehadiran Mengajar Guru';
      const subtitle = `Nama Guru: ${myUser.name || 'Ustadz MQBA'} | Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Mata Pelajaran', 'Status Kehadiran', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => {
        const subjName = subjects.find(s => s.id === a.subjectId)?.name || (a as any).subjectName || 'Pengajar MQBA';
        return [
          idx + 1,
          new Date(a.date).toLocaleDateString('id-ID'),
          subjName,
          a.status,
          a.notes || '-'
        ];
      });
      printGenericTable(title, subtitle, headers, dataRows);
    } else {
      const periodTitle = rekapMode === 'bulan' ? MONTHS[parseInt(filterMonth) - 1] || '' : rekapLabel;
      const items = summary ? [summary] : [];
      printRekapKehadiran(items as any, academicYears, filterAY, periodTitle, filterYear);
    }
  };

  const handleDownloadPDF = () => {
    if (activeTab === 'list') {
      const title = 'Riwayat Absensi Kehadiran Mengajar Guru';
      const subtitle = `Nama Guru: ${myUser.name || 'Ustadz MQBA'} | Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Mata Pelajaran', 'Status Kehadiran', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => {
        const subjName = subjects.find(s => s.id === a.subjectId)?.name || (a as any).subjectName || 'Pengajar MQBA';
        return [
          idx + 1,
          new Date(a.date).toLocaleDateString('id-ID'),
          subjName,
          a.status,
          a.notes || '-'
        ];
      });
      downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Riwayat_Absensi_Saya_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
    } else {
      const periodTitle = rekapMode === 'bulan' ? MONTHS[parseInt(filterMonth) - 1] || '' : rekapLabel;
      const items = summary ? [summary] : [];
      downloadRekapKehadiranPdf(items as any, academicYears, filterAY, periodTitle, filterYear);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Saya</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Isi kehadiran harian per mata pelajaran yang Anda ampu dan pantau rekapitulasi kehadiran Anda secara mandiri.
        </p>
      </div>

      {/* Tabs & Export */}
      <div className="flex items-center gap-2">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {([
            { id: 'isi',   label: editingId ? 'Edit Absensi' : 'Isi Absensi' },
            { id: 'list',  label: 'Riwayat' },
            { id: 'rekap', label: 'Rekap' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer
                ${activeTab === t.id ? 'bg-[#0f2942] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab !== 'isi' && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title="Print Cetak Fisik">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
              title="Download File PDF">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button onClick={handleExport}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB: ISI / EDIT ABSENSI MANDIRI ===== */}
      {activeTab === 'isi' && (
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-[#0f2942] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                  {editingId ? 'Form Edit Absensi Kehadiran Mengajar' : 'Form Absensi Kehadiran Mengajar Guru'}
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">Pilih mata pelajaran & tanggal jam mengajar Anda hari ini.</p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFNotes('');
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition"
                >
                  Batal Edit
                </button>
              )}
            </div>
            <form onSubmit={handleSelfSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-start space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Tanggal & Mata Pelajaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal Jam Mengajar</label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setFDate(todayStr)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition cursor-pointer"
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 1);
                          setFDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition cursor-pointer"
                      >
                        Kemarin
                      </button>
                    </div>
                  </div>

                  {/* 3 Dropdown Mudah: Tanggal, Bulan, Tahun */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <select
                      value={fDate ? parseInt(fDate.split('-')[2], 10) : new Date().getDate()}
                      onChange={(e) => {
                        const [y, m] = (fDate || todayStr).split('-');
                        const d = String(e.target.value).padStart(2, '0');
                        setFDate(`${y}-${m}-${d}`);
                      }}
                      className="px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>Tgl {d}</option>
                      ))}
                    </select>

                    <select
                      value={fDate ? parseInt(fDate.split('-')[1], 10) : (new Date().getMonth() + 1)}
                      onChange={(e) => {
                        const [y, _, d] = (fDate || todayStr).split('-');
                        const m = String(e.target.value).padStart(2, '0');
                        setFDate(`${y}-${m}-${d}`);
                      }}
                      className="px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={fDate ? fDate.split('-')[0] : new Date().getFullYear().toString()}
                      onChange={(e) => {
                        const [_, m, d] = (fDate || todayStr).split('-');
                        setFDate(`${e.target.value}-${m}-${d}`);
                      }}
                      className="px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {['2024', '2025', '2026', '2027', '2028'].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kalender interaktif tambahan */}
                  <input
                    type="date"
                    value={fDate}
                    onChange={e => setFDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Mata Pelajaran (Jam Sesi)</label>
                  <select
                    value={fSubjectId}
                    onChange={e => setFSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {myTeacherSubjectObjects.map(s => (
                      <option key={s.id} value={s.id}>📖 {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status Kehadiran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hadir', 'Izin', 'Sakit'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setFStatus(s)}
                      className={`py-3 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer
                        ${fStatus === s
                          ? s === 'Hadir' ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-500'
                          : s === 'Izin' ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-500'
                          : 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Keterangan {fStatus !== 'Hadir' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={fStatus !== 'Hadir'}
                  placeholder={
                    fStatus === 'Izin' ? 'Contoh: Izin keperluan keluarga / acara pesantren...'
                    : fStatus === 'Sakit' ? 'Contoh: Demam, surat keterangan dokter...'
                    : 'Keterangan tambahan (opsional)...'
                  }
                  value={fNotes} onChange={e => setFNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* Tahun Ajaran & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select required value={fAY} onChange={e => setFAY(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select required value={fSem} onChange={e => setFSem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className={`w-full py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider text-white shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer
                  ${fStatus === 'Hadir' ? 'bg-[#0f2942] hover:bg-[#1e3a5f]' : fStatus === 'Izin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}
                  disabled:opacity-60 disabled:cursor-not-allowed`}>
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan...' : editingId ? 'Perbarui Catatan Absensi' : `Simpan Absensi Mapel — ${fStatus}`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== FILTER BAR (Riwayat & Rekap) ===== */}
      {(activeTab === 'list' || activeTab === 'rekap') && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
            <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 min-w-[120px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 min-w-[100px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rentang</label>
            <select value={rekapMode} onChange={e => setRekapMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="bulan">Per Bulan</option>
              <option value="semester">Per Semester</option>
              <option value="tahun">Per Tahun</option>
            </select>
          </div>
          {rekapMode === 'bulan' && (
            <div className="space-y-1 min-w-[130px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Semua">Semua Mata Pelajaran</option>
              {myTeacherSubjectObjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== TAB: RIWAYAT MANDIRI ===== */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Riwayat Kehadiran Saya — {rekapLabel} {filterSubject !== 'Semua' ? `(${subjects.find(s => s.id === filterSubject)?.name || ''})` : ''}
            </span>
            <span className="text-xs text-slate-400 font-bold">{attendances.length} catatan</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada catatan absensi untuk periode ini.</p>
              <button onClick={() => setActiveTab('isi')} className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                + Isi Absensi Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Mata Pelajaran (Jam Mengajar)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center" style={{ width: '18%' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {attendances.map((a, idx) => {
                    const subjName = subjects.find(s => s.id === a.subjectId)?.name || (a as any).subjectName || 'Pengajar MQBA';
                    const dateFormatted = new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {dateFormatted}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center space-x-1.5 text-xs text-indigo-700 dark:text-indigo-300">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{subjName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_COLORS[a.status]}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 italic">{a.notes || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleEditAttendance(a)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Edit Absensi Ini"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAttendance(a.id, dateFormatted, subjName)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Hapus Catatan Absensi Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: REKAP MANDIRI ===== */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          {summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Hadir', val: summary.hadir, cls: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
                { label: 'Izin',  val: summary.izin,  cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
                { label: 'Sakit', val: summary.sakit, cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
                { label: 'Alpha', val: summary.alpha, cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
                { label: '% Hadir', val: `${summary.persentaseHadir}%`, cls: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' }
              ].map(c => (
                <div key={c.label} className={`p-5 rounded-2xl border ${c.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                  <p className="text-3xl font-black mt-1">{c.val}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-12 text-center border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada data rekap untuk periode ini.</p>
            </div>
          )}

          {/* Rincian Per-Mata Pelajaran */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Rincian Kehadiran Per-Mata Pelajaran
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Periode: {rekapLabel}</span>
            </div>

            {perSubjectSummary.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Belum ada mata pelajaran terdaftar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 text-center w-12 border border-[#1e3a5f]">No</th>
                      <th className="px-4 py-2.5 border border-[#1e3a5f]">Mata Pelajaran</th>
                      <th className="px-3 py-2.5 text-center w-16 border border-[#1e3a5f] bg-[#16365c]">Hadir</th>
                      <th className="px-3 py-2.5 text-center w-16 border border-[#1e3a5f] bg-[#16365c]">Izin</th>
                      <th className="px-3 py-2.5 text-center w-16 border border-[#1e3a5f] bg-[#16365c]">Sakit</th>
                      <th className="px-3 py-2.5 text-center w-16 border border-[#1e3a5f] bg-[#16365c]">Alpha</th>
                      <th className="px-4 py-2.5 text-center w-28 border border-[#1e3a5f] bg-[#0d2847]">Total Sesi</th>
                      <th className="px-4 py-2.5 text-center w-28 border border-[#1e3a5f] bg-[#0b2545]">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {perSubjectSummary.map((sub, idx) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{sub.subjectName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-indigo-600 border-r border-slate-100 dark:border-slate-800">{sub.hadir}</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-blue-600 border-r border-slate-100 dark:border-slate-800">{sub.izin}</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-amber-600 border-r border-slate-100 dark:border-slate-800">{sub.sakit}</td>
                        <td className={`px-3 py-3 text-center font-mono border-r border-slate-100 dark:border-slate-800 ${sub.alpha > 0 ? 'text-rose-600 font-black' : 'font-bold text-slate-500'}`}>{sub.alpha}</td>
                        <td className="px-4 py-3 text-center font-mono font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">{sub.total}</td>
                        <td className="px-4 py-3 text-center bg-[#0f2942] text-white font-extrabold">
                          <div className="flex items-center justify-center space-x-1.5">
                            <div className="w-10 bg-slate-700 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sub.persentaseHadir}%` }} />
                            </div>
                            <span>{sub.persentaseHadir}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
