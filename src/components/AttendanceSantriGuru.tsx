import React from 'react';
import { ClipboardList, Plus, CheckCircle, AlertCircle, Download, Upload, Calendar, Printer, BookOpen, FileText, Filter, Users } from 'lucide-react';
import { Santri, SantriAttendance, SantriAttendanceSummary, SchoolClass, AcademicYear, Semester, TeachingSchedule, Subject, WaliKelas as TWaliKelas } from '../types';
import { api } from '../api';
import { exportToExcel, exportRekapSantriExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printRekapKehadiranSantri } from '../utils/printRekapKehadiran';
import { downloadRekapSantriPdf } from '../utils/pdfDownloader';
import { printGenericTable } from '../utils/printUtils';
import BulkMonthlySantriModal from './BulkMonthlySantriModal';

interface AttendanceSantriGuruProps {
  academicYears: AcademicYear[];
  semesters: Semester[];
  classes: SchoolClass[];
  schedules: TeachingSchedule[];
  santriList: Santri[];
  subjects?: Subject[];
  waliKelas?: TWaliKelas[];
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function AttendanceSantriGuru({
  academicYears,
  semesters,
  classes,
  schedules = [],
  santriList,
  subjects = [],
  waliKelas = []
}: AttendanceSantriGuruProps) {
  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const todayStr     = new Date().toISOString().split('T')[0];

  const myUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}');
  const currentUser = myUser;
  const isWaliRole = myUser.role === 'WaliKelas';
  const isAdminRole = myUser.role === 'Admin';

  const teacherIds = React.useMemo(() => {
    return [
      myUser.teacherId,
      myUser.teacher_id,
      (myUser.teacher && myUser.teacher.id),
      myUser.id
    ].filter(Boolean);
  }, [myUser]);
  const myTeacherId = myUser.teacherId || myUser.teacher_id || (myUser.teacher && myUser.teacher.id) || myUser.id || 't-12';

  // Jadwal mengajar guru yang login
  const mySchedules = React.useMemo(() => {
    if (isAdminRole) return schedules;
    return schedules.filter(s => teacherIds.includes(s.teacherId) || teacherIds.includes((s as any).teacher_id));
  }, [isAdminRole, schedules, teacherIds]);

  const myScheduleSubjectIds = React.useMemo(() => {
    return Array.from(new Set(mySchedules.map(s => s.subjectId || (s as any).subject_id).filter(Boolean)));
  }, [mySchedules]);

  const myScheduleClassIds = React.useMemo(() => {
    return Array.from(new Set(mySchedules.map(s => s.classId || (s as any).class_id).filter(Boolean)));
  }, [mySchedules]);

  const myWaliClassIds = React.useMemo(() => {
    return waliKelas
      .filter(w => teacherIds.includes(w.teacherId) || teacherIds.includes((w as any).teacher_id))
      .map(w => w.classId || (w as any).class_id)
      .filter(Boolean);
  }, [waliKelas, teacherIds]);

  // Mata pelajaran yang diampu oleh guru ini
  const availableSubjects = React.useMemo(() => {
    if (isAdminRole) return subjects;
    const filtered = subjects.filter(s => myScheduleSubjectIds.includes(s.id));
    return filtered.length > 0 ? filtered : (isWaliRole ? subjects : subjects);
  }, [isAdminRole, isWaliRole, subjects, myScheduleSubjectIds]);

  // Kelas yang diampu oleh guru ini (atau dibimbing jika Wali Kelas)
  const availableClasses = React.useMemo(() => {
    if (isAdminRole) return classes;
    if (isWaliRole) {
      const combined = classes.filter(c => myWaliClassIds.includes(c.id) || myScheduleClassIds.includes(c.id));
      return combined.length > 0 ? combined : classes;
    }
    const filtered = classes.filter(c => myScheduleClassIds.includes(c.id));
    return filtered.length > 0 ? filtered : classes;
  }, [isAdminRole, isWaliRole, classes, myWaliClassIds, myScheduleClassIds]);

  const [activeTab, setActiveTab] = React.useState<'isi' | 'riwayat' | 'rekap'>('isi');
  const [rekapSubTab, setRekapSubTab] = React.useState<'kelas' | 'santri'>('kelas');

  // Filter riwayat & rekap
  const [filterAY,      setFilterAY]      = React.useState(academicYears[0]?.id || '');
  const [filterSem,     setFilterSem]     = React.useState(semesters[0]?.id || '');
  const [filterYear,    setFilterYear]    = React.useState(currentYear);
  const [filterMonth,   setFilterMonth]   = React.useState(currentMonth);
  const [filterClass,   setFilterClass]   = React.useState('Semua');
  const [filterSubject, setFilterSubject] = React.useState('Semua');
  const [rekapMode,     setRekapMode]     = React.useState<'bulan'|'semester'|'tahun'>('bulan');

  const [attendances, setAttendances] = React.useState<SantriAttendance[]>([]);
  const [summary,     setSummary]     = React.useState<SantriAttendanceSummary[]>([]);
  const [loading,     setLoading]     = React.useState(false);

  // Form isi absensi
  const [fClass,     setFClass]     = React.useState(availableClasses[0]?.id || '');
  const [fSubjectId, setFSubjectId] = React.useState(availableSubjects[0]?.id || '');
  const [fDate,      setFDate]      = React.useState(todayStr);
  const [fNotes,     setFNotes]     = React.useState('');
  const [fAY,        setFAY]        = React.useState(academicYears[0]?.id || '');
  const [fSem,       setFSem]       = React.useState(semesters[0]?.id || '');
  const [santriStatuses, setSantriStatuses] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    if (availableClasses.length > 0 && (!fClass || !availableClasses.some(c => c.id === fClass))) {
      setFClass(availableClasses[0].id);
    }
  }, [availableClasses, fClass]);

  React.useEffect(() => {
    if (availableSubjects.length > 0 && (!fSubjectId || !availableSubjects.some(s => s.id === fSubjectId))) {
      setFSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, fSubjectId]);

  // When class changes in form, auto-sync subject if taught by this teacher in that class
  const handleFormClassChange = (selectedCId: string) => {
    setFClass(selectedCId);
    const schedInClass = mySchedules.filter(s => (s.classId || (s as any).class_id) === selectedCId);
    if (schedInClass.length > 0) {
      const matchSubjId = schedInClass[0].subjectId || (schedInClass[0] as any).subject_id;
      if (matchSubjId) setFSubjectId(matchSubjId);
    }
  };

  // When subject changes in form, auto-sync class if scheduled
  const handleFormSubjectChange = (selectedSId: string) => {
    setFSubjectId(selectedSId);
    const schedForSubj = mySchedules.filter(s => (s.subjectId || (s as any).subject_id) === selectedSId);
    if (schedForSubj.length > 0) {
      const matchClassId = schedForSubj[0].classId || (schedForSubj[0] as any).class_id;
      if (matchClassId && availableClasses.some(c => c.id === matchClassId)) {
        setFClass(matchClassId);
      }
    }
  };

  React.useEffect(() => {
    const classSantris = santriList.filter(s => s.classId === fClass);
    const initialStatuses: Record<string, string> = {};
    classSantris.forEach(s => initialStatuses[s.id] = 'Hadir');
    setSantriStatuses(initialStatuses);
  }, [fClass, santriList]);
  
  const [submitting,  setSubmitting]  = React.useState(false);
  const [formError,   setFormError]   = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [editingId,   setEditingId]   = React.useState<string | null>(null);
  const [showBulkSantriModal, setShowBulkSantriModal] = React.useState(false);

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = { 
      academicYearId: filterAY, 
      semesterId: filterSem, 
      year: filterYear 
    };
    if (rekapMode === 'bulan') p.month = filterMonth;
    if (filterClass !== 'Semua') p.classId = filterClass;
    if (filterSubject !== 'Semua') p.subjectId = filterSubject;
    return p;
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode, filterClass, filterSubject]);

  const loadData = React.useCallback(() => {
    setLoading(true);
    const params = buildParams();
    Promise.all([
      api.getSantriAttendances(params),
      api.getSantriAttendanceSummary(params),
    ]).then(([list, sumList]) => {
      // Filter list strictly based on teacher scope
      const scopedList = list.filter(a => {
        if (isAdminRole) return true;
        const recTid = (a as any).teacherId || (a as any).teacher_id;
        if (recTid && teacherIds.includes(recTid)) return true;
        if (myScheduleSubjectIds.includes(a.subjectId) && myScheduleClassIds.includes(a.classId)) return true;
        if (isWaliRole && myWaliClassIds.includes(a.classId)) return true;
        return false;
      });
      setAttendances(scopedList);

      // Filter summary for available classes only
      const validClassIds = availableClasses.map(c => c.id);
      const scopedSummary = sumList.filter(s => validClassIds.includes(s.classId));
      setSummary(scopedSummary);
    }).catch(() => { 
      setAttendances([]); 
      setSummary([]); 
    }).finally(() => setLoading(false));
  }, [buildParams, isAdminRole, isWaliRole, teacherIds, myScheduleSubjectIds, myScheduleClassIds, myWaliClassIds, availableClasses]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // Calculations for Per-Santri (Individu) Summary Array with % Hadir
  const perSantriSummary = React.useMemo(() => {
    const targetClassId = filterClass !== 'Semua' ? filterClass : (availableClasses[0]?.id || '');
    const classSantris = santriList
      .filter(s => !targetClassId || s.classId === targetClassId)
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
    
    return classSantris.map(s => {
      const clsObj = classes.find(c => c.id === s.classId);
      const clsName = clsObj ? clsObj.name : s.classId;
      const myAtts = attendances.filter(a => (a as any).santriId === s.id);
      
      let hadir = 0, izin = 0, sakit = 0, alpha = 0;
      if (myAtts.length > 0) {
        hadir = myAtts.filter(a => a.status === 'Hadir').length;
        izin  = myAtts.filter(a => a.status === 'Izin').length;
        sakit = myAtts.filter(a => a.status === 'Sakit').length;
        alpha = myAtts.filter(a => a.status === 'Alpha').length;
      }

      const total = hadir + izin + sakit + alpha;
      const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

      return {
        santriId: s.id,
        santriName: s.name,
        nis: s.nis || '-',
        classId: s.classId,
        className: `Kelas ${clsName}`,
        hadir,
        izin,
        sakit,
        alpha,
        total,
        persentaseHadir
      };
    });
  }, [santriList, filterClass, availableClasses, classes, attendances]);

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s => s.id === filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  const handleExport = () => {
    if (activeTab === 'riwayat') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Kelas': classes.find(c => c.id === a.classId)?.name || a.classId,
        'Mata Pelajaran': a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        'Hadir': a.jumlahHadir,
        'Izin': a.jumlahIzin,
        'Sakit': a.jumlahSakit,
        'Alpha': a.jumlahAlpha,
        'Total': a.jumlahTotal,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Santri_Guru_${rekapLabel.replace(/ /g, '_')}`);
    } else if (activeTab === 'rekap') {
      if (rekapSubTab === 'santri') {
        exportRekapSantriExcel(perSantriSummary, rekapLabel, `Rekap_Kehadiran_Santri_Individu_${rekapLabel.replace(/ /g, '_')}`);
      } else {
        const enrichedClassSummary = summary.map(s => ({
          ...s,
          santriName: `Kelas ${classes.find(c => c.id === s.classId)?.name || s.classId}`,
          nis: `Per Kelas`,
          persentaseHadir: s.rataHadir !== undefined ? s.rataHadir : 0
        }));
        exportRekapSantriExcel(enrichedClassSummary, rekapLabel, `Rekap_Kehadiran_Santri_Kelas_${rekapLabel.replace(/ /g, '_')}`);
      }
    }
  };

  const handlePrint = () => {
    if (activeTab === 'riwayat') {
      const title = 'Data Riwayat Absensi Santri';
      const subtitle = `Nama Guru: ${myUser.name || 'Pengajar MQBA'} | Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Kelas', 'Mata Pelajaran', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1, 
        new Date(a.date).toLocaleDateString('id-ID'), 
        classes.find(c => c.id === a.classId)?.name || a.classId, 
        a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        a.jumlahHadir, a.jumlahIzin, a.jumlahSakit, a.jumlahAlpha, a.jumlahTotal, a.notes || '-'
      ]);
      printGenericTable(title, subtitle, headers, dataRows);
    } else {
      if (rekapSubTab === 'santri') {
        printRekapKehadiranSantri(perSantriSummary, academicYears, filterAY, `Santri (Individu) - ${rekapLabel}`);
      } else {
        const enrichedClassSummary = summary.map(s => ({
          ...s,
          santriName: `Kelas ${classes.find(c => c.id === s.classId)?.name || s.classId}`,
          nis: `Per Kelas`,
          persentaseHadir: s.rataHadir !== undefined ? s.rataHadir : 0
        }));
        printRekapKehadiranSantri(enrichedClassSummary, academicYears, filterAY, `Per Kelas - ${rekapLabel}`);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (activeTab === 'riwayat') {
      const title = 'Data Riwayat Absensi Santri';
      const subtitle = `Nama Guru: ${myUser.name || 'Pengajar MQBA'} | Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Kelas', 'Mata Pelajaran', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1, 
        new Date(a.date).toLocaleDateString('id-ID'), 
        classes.find(c => c.id === a.classId)?.name || a.classId, 
        a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        a.jumlahHadir, a.jumlahIzin, a.jumlahSakit, a.jumlahAlpha, a.jumlahTotal, a.notes || '-'
      ]);
      downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Riwayat_Absensi_Santri_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
    } else {
      if (rekapSubTab === 'santri') {
        const title = `Rekap Kehadiran Santri Individu - ${rekapLabel}`;
        const subtitle = `Tahun Pelajaran: ${academicYears.find(a => a.id === filterAY)?.name || '-'}`;
        const headers = ['No', 'NIS', 'Nama Santri', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', '% Hadir'];
        const dataRows = perSantriSummary.map((s, idx) => [
          idx + 1,
          s.nis || '-',
          s.santriName,
          classes.find(c => c.id === s.classId)?.name || s.classId,
          s.hadir,
          s.izin,
          s.sakit,
          s.alpha,
          s.total,
          `${s.persentaseHadir}%`
        ]);
        downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Rekap_Absensi_Santri_Individu_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
      } else {
        const title = `Rekap Kehadiran Santri Per Kelas - ${rekapLabel}`;
        const subtitle = `Tahun Pelajaran: ${academicYears.find(a => a.id === filterAY)?.name || '-'}`;
        const headers = ['No', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', '% Rata Hadir'];
        const dataRows = summary.map((s, idx) => [
          idx + 1,
          classes.find(c => c.id === s.classId)?.name || s.classId,
          s.hadir,
          s.izin,
          s.sakit,
          s.alpha,
          s.total,
          `${s.rataHadir || 0}%`
        ]);
        downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Rekap_Absensi_Santri_Kelas_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
      }
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile<any>(file);
      if (data.length === 0) throw new Error("File kosong");
      setSubmitting(true);
      const attendancesToSave = data.map(row => {
        const clsName = String(row['Kelas']).replace('Kelas ', '');
        const cls = availableClasses.find(c => c.name === clsName || c.id === clsName);
        if (!cls) return null;
        return {
          classId: cls.id,
          subjectId: fSubjectId,
          date: row['Tanggal'] || new Date().toISOString().split('T')[0],
          jumlahHadir: Number(row['Hadir'] || 0),
          jumlahIzin: Number(row['Izin'] || 0),
          jumlahSakit: Number(row['Sakit'] || 0),
          jumlahAlpha: Number(row['Alpha'] || 0),
          jumlahTotal: Number(row['Total'] || 0),
          notes: row['Keterangan'] || '',
          academicYearId: filterAY,
          semesterId: filterSem,
          teacherId: myTeacherId
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      alert(`Berhasil mengimport data absensi santri.`);
      loadData();
    } catch (err: any) {
      alert("Gagal mengimport: " + err.message);
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fClass || !fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    
    const classSantris = santriList.filter(s => s.classId === fClass);
    if (classSantris.length === 0) { setFormError('Tidak ada santri di kelas ini.'); return; }
    
    setSubmitting(true);
    try {
      const cls = availableClasses.find(c => c.id === fClass);
      const selectedSubj = subjects.find(s => s.id === fSubjectId);
      const subjName = selectedSubj ? selectedSubj.name : '';
      
      if (editingId) {
        const recordsToDelete = attendances.filter(rec => rec.date === fDate && rec.classId === fClass && (rec.subjectId === fSubjectId || !rec.subjectId));
        for (const rec of recordsToDelete) {
          await api.deleteSantriAttendance(rec.id).catch(() => {});
        }
      }
      
      const attendancesToSave = classSantris.map(santri => ({
        classId: fClass,
        subjectId: fSubjectId,
        subjectName: subjName,
        date: fDate,
        santriId: santri.id,
        status: santriStatuses[santri.id] || 'Hadir',
        jumlahHadir: 0, jumlahIzin: 0, jumlahSakit: 0, jumlahAlpha: 0, jumlahTotal: 1,
        notes: fNotes,
        academicYearId: fAY,
        semesterId: fSem,
        teacherId: myTeacherId,
        recordedBy: currentUser.name || (currentUser.teacher ? currentUser.teacher.name : 'Ust. Aidil Aqli, S.Ag.')
      }));

      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      setFormSuccess(`Absensi santri Kelas ${cls?.name} mapel "${subjName || 'Umum'}" tanggal ${fDate} berhasil ${editingId ? 'diperbarui' : 'dicatat'}.`);
      setEditingId(null);
      
      const initialStatuses: Record<string, string> = {};
      classSantris.forEach(s => initialStatuses[s.id] = 'Hadir');
      setSantriStatuses(initialStatuses);
      setFNotes('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan absensi santri.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Santri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Catat dan pantau kehadiran santri pada mata pelajaran yang Anda ampu secara presisi.
          </p>
        </div>
        <button onClick={() => setShowBulkSantriModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer">
          <Calendar className="w-4 h-4"/><span>⚡ Input Rekap Bulanan Santri Massal</span>
        </button>
      </div>

      {/* Tab & Export */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {([
            { id: 'isi', label: editingId ? 'Edit Absensi' : 'Isi Absensi' },
            { id: 'riwayat', label: 'Riwayat' },
            { id: 'rekap', label: 'Rekapitulasi & Persentase' }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer
                ${activeTab === t.id ? 'bg-[#0f2942] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        
        {activeTab !== 'isi' && (
          <div className="flex items-center space-x-2">
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer" title="Import Excel">
              <Upload className="w-3.5 h-3.5" /><span>Import</span>
            </button>
            <button onClick={handleExport} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" title="Export Excel">
              <Download className="w-3.5 h-3.5" /><span>Excel</span>
            </button>
            <button onClick={handlePrint} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer" title="Print Cetak Fisik">
              <Printer className="w-3.5 h-3.5" /><span>Print</span>
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition bg-[#0f2942] text-white hover:bg-[#1e3a5f] cursor-pointer" title="Download File PDF">
              <Download className="w-3.5 h-3.5" /><span>Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB: ISI ABSENSI ===== */}
      {activeTab === 'isi' && (
        <div className="w-full max-w-4xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-[#0f2942] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                  {editingId ? 'Form Edit Absensi Santri' : 'Form Pengisian Absensi Santri (Per Kelas & Mapel)'}
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">Pilih kelas, mata pelajaran & tanggal, lalu tandai dan simpan kehadiran santri.</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Kelas</label>
                  <select
                    value={fClass}
                    onChange={e => handleFormClassChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableClasses.map(c => (
                      <option key={c.id} value={c.id}>Kelas {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Mata Pelajaran</label>
                  <select
                    value={fSubjectId}
                    onChange={e => handleFormSubjectChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>📖 {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal Absensi</label>
                  <input
                    type="date"
                    value={fDate}
                    max={todayStr}
                    onChange={e => setFDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tahun Ajaran & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select value={fAY} onChange={e => setFAY(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select value={fSem} onChange={e => setFSem(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Daftar Santri */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Daftar Santri Kelas {classes.find(c => c.id === fClass)?.name} ({subjects.find(s => s.id === fSubjectId)?.name || 'Mapel'})
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg">
                    {santriList.filter(s => s.classId === fClass).length} Santri
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f2942] text-white">
                      <tr>
                        <th className="px-4 py-2.5 font-bold uppercase w-12 text-center">No</th>
                        <th className="px-4 py-2.5 font-bold uppercase">Nama Santri</th>
                        <th className="px-4 py-2.5 font-bold uppercase text-center w-20">Hadir</th>
                        <th className="px-4 py-2.5 font-bold uppercase text-center w-20">Izin</th>
                        <th className="px-4 py-2.5 font-bold uppercase text-center w-20">Sakit</th>
                        <th className="px-4 py-2.5 font-bold uppercase text-center w-20">Alpha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {santriList.filter(s => s.classId === fClass).map((santri, idx) => (
                        <tr key={santri.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100">{santri.name}</td>
                          {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(st => (
                            <td key={st} className="px-4 py-2.5 text-center">
                              <input
                                type="radio"
                                name={`st-${santri.id}`}
                                checked={santriStatuses[santri.id] === st}
                                onChange={() => setSantriStatuses(p => ({ ...p, [santri.id]: st }))}
                                className="w-4 h-4 cursor-pointer accent-indigo-600"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Catatan / Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Opsional: Keterangan materi / kegiatan..."
                  value={fNotes}
                  onChange={e => setFNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#0f2942] hover:bg-[#1e3a5f] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Perbarui Absensi Santri' : 'Simpan Absensi Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== FILTER BAR (Riwayat & Rekap) ===== */}
      {(activeTab === 'riwayat' || activeTab === 'rekap') && (
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
            <div className="space-y-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Kelas</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Semua">Semua Kelas</option>
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Mapel</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Semua">Semua Mapel</option>
              {availableSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== TAB: RIWAYAT ===== */}
      {activeTab === 'riwayat' && (() => {
        const groupedAttendances = Object.values(
          attendances.reduce((acc, a) => {
            const subjName = a.subjectName || (a as any).subject?.name || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum';
            const key = `${a.date}-${a.classId}-${a.subjectId || 'gen'}`;
            if (!acc[key]) {
              acc[key] = {
                id: key,
                date: a.date,
                classId: a.classId,
                subjectId: a.subjectId,
                subjectName: subjName,
                className: (a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId,
                teacherName: (a as any).teacher?.name || a.recordedBy || currentUser.name || 'Pengajar',
                teacherId: (a as any).teacherId || (a as any).teacher_id,
                hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, notes: a.notes,
                absentees: []
              };
            }
            if (a.status) {
              acc[key].total++;
              if (a.status === 'Hadir') acc[key].hadir++;
              else if (a.status === 'Izin') { acc[key].izin++; acc[key].absentees.push(`${(a as any).santri?.name || 'Santri'} (I)`); }
              else if (a.status === 'Sakit') { acc[key].sakit++; acc[key].absentees.push(`${(a as any).santri?.name || 'Santri'} (S)`); }
              else if (a.status === 'Alpha') { acc[key].alpha++; acc[key].absentees.push(`${(a as any).santri?.name || 'Santri'} (A)`); }
            } else {
              acc[key].hadir += (a.jumlahHadir || 0);
              acc[key].izin += (a.jumlahIzin || 0);
              acc[key].sakit += (a.jumlahSakit || 0);
              acc[key].alpha += (a.jumlahAlpha || 0);
              acc[key].total = acc[key].hadir + acc[key].izin + acc[key].sakit + acc[key].alpha;
            }
            return acc;
          }, {} as Record<string, any>)
        ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Daftar Absensi Harian Santri — {rekapLabel}
              </span>
              <span className="text-xs text-slate-400 font-bold">{groupedAttendances.length} sesi pertemuan</span>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
            ) : groupedAttendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800" />
              <p className="text-sm font-medium">Belum ada data absensi santri untuk periode ini.</p>
              <button onClick={() => setActiveTab('isi')}
                className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                + Isi Absensi Santri Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Pengabsen</th>
                    <th className="px-4 py-3 text-center">Hadir</th>
                    <th className="px-4 py-3 text-center">Izin</th>
                    <th className="px-4 py-3 text-center">Sakit</th>
                    <th className="px-4 py-3 text-center">Alpha</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {groupedAttendances.map((a: any, idx) => {
                    const classDisplayName = String(a.className).startsWith('Kelas') ? a.className : `Kelas ${a.className}`;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-semibold text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                          {classDisplayName}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-xs text-indigo-700 dark:text-indigo-300">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{a.subjectName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {a.teacherName || 'Pengajar'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{a.hadir}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{a.izin}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{a.sakit}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{a.alpha}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">{a.total}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 italic">
                          {a.notes || '-'}
                          {a.absentees.length > 0 && (
                            <div className="mt-1 text-[10px] text-rose-500 font-semibold">{a.absentees.join(', ')}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button onClick={() => {
                              setFClass(a.classId);
                              setFDate(a.date);
                              if (a.subjectId) setFSubjectId(a.subjectId);
                              const sessionRecords = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId && (rec.subjectId === a.subjectId || !rec.subjectId));
                              const existingStatuses: Record<string, string> = {};
                              sessionRecords.forEach(rec => {
                                existingStatuses[rec.santriId] = rec.status;
                              });
                              setSantriStatuses(existingStatuses);
                              if (a.notes) setFNotes(a.notes);
                              setEditingId(a.id);
                              setActiveTab('isi');
                            }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                              title="Edit Absensi Sesi Ini"
                            >
                              Edit
                            </button>
                            <button onClick={async () => {
                              if (window.confirm(`Hapus seluruh absensi ${classDisplayName} tanggal ${a.date} (${a.subjectName})?`)) {
                                setLoading(true);
                                const recordsToDelete = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId && (rec.subjectId === a.subjectId || !rec.subjectId));
                                try {
                                  for (const rec of recordsToDelete) {
                                    await api.deleteSantriAttendance(rec.id);
                                  }
                                  loadData();
                                } catch (e) {
                                  alert('Gagal menghapus data.');
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                              className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus Sesi Ini"
                            >
                              Hapus
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
        );
      })()}

      {/* ===== TAB: REKAPITULASI & PERSENTASE ===== */}
      {activeTab === 'rekap' && (
        <div className="space-y-5">
          {summary.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Hadir', val: summary.reduce((s,r)=>s+r.hadir,0), cls: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
                { label: 'Izin',  val: summary.reduce((s,r)=>s+r.izin,0),  cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
                { label: 'Sakit', val: summary.reduce((s,r)=>s+r.sakit,0), cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
                { label: 'Alpha', val: summary.reduce((s,r)=>s+r.alpha,0), cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
              ].map(c => (
                <div key={c.label} className={`p-5 rounded-2xl border ${c.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                  <p className="text-4xl font-black mt-1">{c.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab Selection: Per-Kelas vs Per-Santri */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setRekapSubTab('kelas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                rekapSubTab === 'kelas' ? 'bg-[#0f2942] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              🏢 Rekapitulasi Per-Kelas
            </button>
            <button
              onClick={() => setRekapSubTab('santri')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                rekapSubTab === 'santri' ? 'bg-[#0f2942] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              👦 Rekapitulasi Per-Santri (Individu)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  {rekapSubTab === 'kelas' ? 'Rekap Kehadiran Santri Per-Kelas' : 'Rekapitulasi Kehadiran Individu Santri (% Hadir)'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Periode: {rekapLabel}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </button>
              </div>
            </div>

            {/* TABEL REKAP KELAS */}
            {rekapSubTab === 'kelas' && (
              summary.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">Belum ada data kehadiran untuk periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-10">No</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f]">Nama Kelas</th>
                        <th colSpan={4} className="px-3 py-1.5 text-center border border-[#1e3a5f] bg-[#0b2545]">Kehadiran Santri</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-32 bg-[#0d2847]">Total Hari Sesi</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-28">% Hadir Kelas</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">H</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">S</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">I</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {summary.map((r, idx) => {
                        const pct = r.rataHadir !== undefined ? r.rataHadir : 0;
                        return (
                        <tr key={r.classId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">Kelas {r.className}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">{r.hadir}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{r.sakit}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{r.izin}</td>
                          <td className={`px-3 py-3 text-center font-mono border-r border-slate-200 dark:border-slate-800 ${r.alpha > 0 ? 'text-rose-600 font-black' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{r.alpha}</td>
                          <td className="px-3 py-3 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">{r.total}</td>
                          <td className="px-3 py-3 text-center bg-[#0f2942] text-white font-extrabold">
                            <div className="flex items-center justify-center space-x-1.5">
                              <div className="w-12 bg-slate-700 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                <div className="bg-emerald-400 h-full rounded-full" style={{width:`${pct}%`}}/>
                              </div>
                              <span>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TABEL REKAP INDIVIDU SANTRI */}
            {rekapSubTab === 'santri' && (
              perSantriSummary.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">Belum ada data santri untuk kelas terpilih.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-10">No</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f]">Nama Santri</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f] bg-[#0d2847]">NIS / Kelas</th>
                        <th colSpan={4} className="px-3 py-1.5 text-center border border-[#1e3a5f] bg-[#0b2545]">Status Kehadiran</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-28 bg-[#0d2847]">Total Hari</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-28">% Hadir Santri</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">H</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">S</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">I</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {perSantriSummary.map((s, idx) => (
                        <tr key={s.santriId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{s.santriName}</td>
                          <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            <div>
                              <span>NIS: {s.nis}</span>
                              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{s.className}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">{s.hadir}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{s.sakit}</td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{s.izin}</td>
                          <td className={`px-3 py-3 text-center font-mono border-r border-slate-200 dark:border-slate-800 ${s.alpha > 0 ? 'text-rose-600 font-black' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{s.alpha}</td>
                          <td className="px-3 py-3 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">{s.total}</td>
                          <td className="px-3 py-3 text-center bg-[#0f2942] text-white font-extrabold">
                            <div className="flex items-center justify-center space-x-1.5">
                              <div className="w-12 bg-slate-700 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                <div className="bg-emerald-400 h-full rounded-full" style={{width:`${s.persentaseHadir}%`}}/>
                              </div>
                              <span>{s.persentaseHadir}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* BULK MONTHLY SANTRI MODAL */}
      <BulkMonthlySantriModal
        isOpen={showBulkSantriModal}
        onClose={() => setShowBulkSantriModal(false)}
        classes={availableClasses}
        academicYears={academicYears}
        semesters={semesters}
        santriList={santriList}
        onSuccess={() => loadData()}
        defaultClassId={fClass}
      />
    </div>
  );
}
