import React from 'react';
import {
  ClipboardList, Plus, Search, Filter, Edit, Trash2, X,
  CheckCircle, AlertCircle, BarChart2, Calendar, Users, Download, Printer, BookOpen, FileText,
  School, GraduationCap
} from 'lucide-react';
import { Attendance, AttendanceSummary, Teacher, AcademicYear, Semester, TeachingSchedule, Subject, SchoolClass } from '../types';
import { api } from '../api';
import { exportToExcel, exportRekapGuruExcel } from '../utils/exportExcel';
import { printRekapKehadiran } from '../utils/printRekapKehadiran';
import { downloadRekapKehadiranPdf, downloadRekapSantriPdf } from '../utils/pdfDownloader';
import { printGenericTable } from '../utils/printUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';

interface AttendanceAdminProps {
  teachers: Teacher[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  schedules?: TeachingSchedule[];
  subjects?: Subject[];
  classes?: SchoolClass[];
}

const STATUS_COLORS: Record<string, string> = {
  Hadir:  'bg-indigo-50 text-indigo-800 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
  Izin:   'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Sakit:  'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Alpha:  'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export default function AttendanceAdmin({ teachers, academicYears, semesters, schedules = [], subjects = [], classes = [] }: AttendanceAdminProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [activeTab, setActiveTab] = React.useState<'input' | 'rekap'>('input');
  const [rekapViewType, setRekapViewType] = React.useState<'gabungan' | 'per-mapel' | 'per-kelas'>('gabungan');

  // Filter state
  const [filterTeacher, setFilterTeacher] = React.useState('');
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');
  const [filterYear, setFilterYear] = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode, setRekapMode] = React.useState<'bulan' | 'semester' | 'tahun'>('bulan');

  // Data
  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [summary, setSummary] = React.useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Helper: Dapatkan rincian lengkap mata pelajaran & kelas yang diampu guru
  const getTeacherTeachingDetails = React.useCallback((tId: string) => {
    const teacherObj = teachers.find(t => t.id === tId);
    const teacherName = teacherObj?.name || '';

    // Cari seluruh jadwal mengajar guru ini
    const mySchedules = (schedules || []).filter(s => {
      if (s.teacherId === tId || (s as any).teacher_id === tId || (s.teacher && s.teacher.id === tId)) return true;
      if (s.teacher?.name && teacherName && (s.teacher.name.toLowerCase() === teacherName.toLowerCase() || teacherName.toLowerCase().includes(s.teacher.name.toLowerCase()))) return true;
      return false;
    });

    const subjectMap = new Map<string, { subjectId: string; subjectName: string; classes: Set<string> }>();

    mySchedules.forEach(sch => {
      const sId = sch.subjectId || (sch as any).subject_id || (sch.subject && sch.subject.id);
      if (!sId) return;
      const subjObj = (subjects || []).find(s => s.id === sId) || sch.subject;
      const subjName = subjObj?.name || 'Mata Pelajaran';

      const cId = sch.classId || (sch as any).class_id || (sch.class && sch.class.id);
      const clsObj = (classes || []).find(c => c.id === cId) || sch.class;
      const rawClsName = clsObj?.name || (cId ? String(cId).replace(/^cls-/, 'Kelas ') : '');
      const clsLabel = rawClsName ? (rawClsName.toLowerCase().startsWith('kelas') ? rawClsName : `Kelas ${rawClsName}`) : '';

      if (!subjectMap.has(sId)) {
        subjectMap.set(sId, { subjectId: sId, subjectName: subjName, classes: new Set<string>() });
      }
      if (clsLabel) {
        subjectMap.get(sId)!.classes.add(clsLabel);
      }
    });

    // Periksa juga jika ada absensi yang tercatat dengan subjectId tertentu
    attendances.filter(a => (a.teacherId === tId || (a as any).teacher_id === tId) && a.subjectId).forEach(a => {
      const sId = a.subjectId!;
      if (!subjectMap.has(sId)) {
        const subjObj = (subjects || []).find(s => s.id === sId);
        const subjName = subjObj?.name || 'Mata Pelajaran';
        subjectMap.set(sId, { subjectId: sId, subjectName: subjName, classes: new Set<string>() });
      }
    });

    const details = Array.from(subjectMap.values()).map(item => {
      const classList = Array.from(item.classes).sort();
      const classText = classList.length > 0 ? ` (${classList.join(', ')})` : '';
      return {
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        classes: classList,
        formatted: `${item.subjectName}${classText}`
      };
    });

    return details;
  }, [teachers, schedules, subjects, classes, attendances]);

  // Helper: Get scheduled Subject objects for a teacher
  const getTeacherSubjectObjects = React.useCallback((tId: string): Subject[] => {
    const details = getTeacherTeachingDetails(tId);
    if (details.length === 0) return [];
    return details.map(d => ({
      id: d.subjectId,
      name: d.formatted,
      category: 'Umum' as const
    }));
  }, [getTeacherTeachingDetails]);

  // Helper: Get taught subjects formatted text string
  const getTeacherSubjects = React.useCallback((tId: string): string => {
    const details = getTeacherTeachingDetails(tId);
    return details.length > 0 ? details.map(d => d.formatted).join(' • ') : 'Pengajar MQBA';
  }, [getTeacherTeachingDetails]);

  // Helper: Dapatkan rincian per-kelas dan per-mapel yang diampu guru
  const getTeacherClassDetails = React.useCallback((tId: string) => {
    const teacherObj = teachers.find(t => t.id === tId);
    const teacherName = teacherObj?.name || '';

    const mySchedules = (schedules || []).filter(s => {
      if (s.teacherId === tId || (s as any).teacher_id === tId || (s.teacher && s.teacher.id === tId)) return true;
      if (s.teacher?.name && teacherName && (s.teacher.name.toLowerCase() === teacherName.toLowerCase() || teacherName.toLowerCase().includes(s.teacher.name.toLowerCase()))) return true;
      return false;
    });

    const list: { classId: string; className: string; subjectId: string; subjectName: string; formatted: string }[] = [];
    const seen = new Set<string>();

    mySchedules.forEach(sch => {
      const cId = sch.classId || (sch as any).class_id || (sch.class && sch.class.id);
      const sId = sch.subjectId || (sch as any).subject_id || (sch.subject && sch.subject.id);
      if (!cId || !sId) return;

      const key = `${cId}_${sId}`;
      if (seen.has(key)) return;
      seen.add(key);

      const clsObj = (classes || []).find(c => c.id === cId) || sch.class;
      const rawClsName = clsObj?.name || (cId ? String(cId).replace(/^cls-/, 'Kelas ') : '');
      const clsName = rawClsName ? (rawClsName.toLowerCase().startsWith('kelas') ? rawClsName : `Kelas ${rawClsName}`) : 'Kelas';

      const subjObj = (subjects || []).find(s => s.id === sId) || sch.subject;
      const subjName = subjObj?.name || 'Mata Pelajaran';

      list.push({
        classId: cId,
        className: clsName,
        subjectId: sId,
        subjectName: subjName,
        formatted: `${clsName} — ${subjName}`
      });
    });

    return list;
  }, [teachers, schedules, subjects, classes]);

  // 1. Per-Teacher & Per-Subject Summary Array (Dipisah per mapel & kelas)
  const subjectSummaryList = React.useMemo(() => {
    const result: (AttendanceSummary & { classId?: string; className?: string; subjectId?: string; subjectName: string; subjectsTaught: string; classesList?: string[] })[] = [];

    teachers.forEach(t => {
      const details = getTeacherTeachingDetails(t.id);

      if (details.length === 0) {
        const tAttendances = attendances.filter(a => a.teacherId === t.id);
        const hadir = tAttendances.filter(a => a.status === 'Hadir').length;
        const izin = tAttendances.filter(a => a.status === 'Izin').length;
        const sakit = tAttendances.filter(a => a.status === 'Sakit').length;
        const alpha = tAttendances.filter(a => a.status === 'Alpha').length;
        const total = tAttendances.length;
        const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

        result.push({
          teacherId: t.id,
          teacherName: t.name,
          subjectId: '',
          subjectName: 'Pengajar MQBA',
          subjectsTaught: 'Pengajar MQBA',
          classesList: [],
          hadir,
          izin,
          sakit,
          alpha,
          total,
          persentaseHadir
        });
      } else {
        // Dipisah satu-satu untuk setiap Mapel yang diampu beserta keterangan kelasnya
        details.forEach(item => {
          const tSubAttendances = attendances.filter(a => 
            a.teacherId === t.id && (a.subjectId === item.subjectId || (!a.subjectId && details.length === 1))
          );
          
          const targetRecords = (tSubAttendances.length > 0 || details.length === 1) 
            ? tSubAttendances 
            : attendances.filter(a => a.teacherId === t.id);

          const hadir = targetRecords.filter(a => a.status === 'Hadir').length;
          const izin = targetRecords.filter(a => a.status === 'Izin').length;
          const sakit = targetRecords.filter(a => a.status === 'Sakit').length;
          const alpha = targetRecords.filter(a => a.status === 'Alpha').length;
          const total = targetRecords.length;
          const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

          result.push({
            teacherId: t.id,
            teacherName: t.name,
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            subjectsTaught: item.formatted,
            classesList: item.classes,
            hadir,
            izin,
            sakit,
            alpha,
            total,
            persentaseHadir
          });
        });
      }
    });

    return result;
  }, [teachers, attendances, getTeacherTeachingDetails]);

  // 2. Per-Teacher & Per-Class Summary Array (Rincian Per-Kelas yang diampu)
  const classSummaryList = React.useMemo(() => {
    const result: (AttendanceSummary & { classId?: string; className?: string; subjectId?: string; subjectName: string; subjectsTaught: string; classesList?: string[] })[] = [];

    teachers.forEach(t => {
      const classDetails = getTeacherClassDetails(t.id);

      if (classDetails.length === 0) {
        const tAttendances = attendances.filter(a => a.teacherId === t.id);
        const hadir = tAttendances.filter(a => a.status === 'Hadir').length;
        const izin = tAttendances.filter(a => a.status === 'Izin').length;
        const sakit = tAttendances.filter(a => a.status === 'Sakit').length;
        const alpha = tAttendances.filter(a => a.status === 'Alpha').length;
        const total = tAttendances.length;
        const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

        result.push({
          teacherId: t.id,
          teacherName: t.name,
          classId: '',
          className: 'Semua Kelas',
          subjectId: '',
          subjectName: 'Pengajar MQBA',
          subjectsTaught: 'Pengajar MQBA',
          hadir,
          izin,
          sakit,
          alpha,
          total,
          persentaseHadir
        });
      } else {
        classDetails.forEach(item => {
          const tSubAttendances = attendances.filter(a => 
            a.teacherId === t.id && (a.subjectId === item.subjectId || (!a.subjectId && classDetails.length === 1))
          );
          
          const targetRecords = (tSubAttendances.length > 0 || classDetails.length === 1) 
            ? tSubAttendances 
            : attendances.filter(a => a.teacherId === t.id);

          const hadir = targetRecords.filter(a => a.status === 'Hadir').length;
          const izin = targetRecords.filter(a => a.status === 'Izin').length;
          const sakit = targetRecords.filter(a => a.status === 'Sakit').length;
          const alpha = targetRecords.filter(a => a.status === 'Alpha').length;
          const total = targetRecords.length;
          const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

          result.push({
            teacherId: t.id,
            teacherName: t.name,
            classId: item.classId,
            className: item.className,
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            subjectsTaught: item.formatted,
            hadir,
            izin,
            sakit,
            alpha,
            total,
            persentaseHadir
          });
        });
      }
    });

    return result;
  }, [teachers, attendances, getTeacherClassDetails]);

  // 3. Merged per Teacher list (Rekap Gabungan Per Guru)
  const teacherMergedSummaryList = React.useMemo(() => {
    const result: (AttendanceSummary & { classId?: string; className?: string; subjectId?: string; subjectName: string; subjectsTaught: string; classesList?: string[] })[] = [];

    teachers.forEach(t => {
      const details = getTeacherTeachingDetails(t.id);
      const allSubjString = details.length > 0 ? details.map(d => d.formatted).join(' • ') : 'Pengajar MQBA';
      
      const tAttendances = attendances.filter(a => a.teacherId === t.id);
      const hadir = tAttendances.filter(a => a.status === 'Hadir').length;
      const izin = tAttendances.filter(a => a.status === 'Izin').length;
      const sakit = tAttendances.filter(a => a.status === 'Sakit').length;
      const alpha = tAttendances.filter(a => a.status === 'Alpha').length;
      const total = tAttendances.length;
      const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

      result.push({
        teacherId: t.id,
        teacherName: t.name,
        subjectId: '',
        subjectName: allSubjString,
        subjectsTaught: allSubjString,
        hadir,
        izin,
        sakit,
        alpha,
        total,
        persentaseHadir
      });
    });

    return result;
  }, [teachers, attendances, getTeacherTeachingDetails]);

  const activeSummaryList = rekapViewType === 'per-mapel' 
    ? subjectSummaryList 
    : rekapViewType === 'per-kelas' 
    ? classSummaryList 
    : teacherMergedSummaryList;

  // Form state
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [fTeacher, setFTeacher] = React.useState('');
  const [fSubject, setFSubject] = React.useState('');
  const [fDate, setFDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [fStatus, setFStatus] = React.useState<'Hadir'|'Izin'|'Sakit'|'Alpha'>('Hadir');
  const [fNotes, setFNotes] = React.useState('');
  const [fAY, setFAY] = React.useState(academicYears[0]?.id || '');
  const [fSem, setFSem] = React.useState(semesters[0]?.id || '');
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');

  // State for Single/Group Rekap Edit Modal
  const [showEditRekapModal, setShowEditRekapModal] = React.useState(false);
  const [editRekapTeacherId, setEditRekapTeacherId] = React.useState('');
  const [editRekapSubjectId, setEditRekapSubjectId] = React.useState('');
  const [editRekapSubjectName, setEditRekapSubjectName] = React.useState('');
  const [editRekapJpWajib, setEditRekapJpWajib] = React.useState(0);
  const [editRekapHadir, setEditRekapHadir] = React.useState(0);
  const [editRekapSakit, setEditRekapSakit] = React.useState(0);
  const [editRekapIzin, setEditRekapIzin] = React.useState(0);
  const [editRekapAlpha, setEditRekapAlpha] = React.useState(0);
  const [editRekapNotes, setEditRekapNotes] = React.useState('');
  const [isSavingRekap, setIsSavingRekap] = React.useState(false);
  const [editRekapError, setEditRekapError] = React.useState('');
  const [editRekapSuccess, setEditRekapSuccess] = React.useState('');

  const openEditRekap = (r: any) => {
    setEditRekapTeacherId(r.teacherId);
    setEditRekapSubjectId(r.subjectId || '');
    setEditRekapSubjectName(r.subjectsTaught || r.subjectName || '');
    const h = r.hadir || 0;
    const s = r.sakit || 0;
    const i = r.izin || 0;
    const a = r.alpha || 0;
    const jp = r.total || (h + s + i + a) || 0;
    setEditRekapHadir(h);
    setEditRekapSakit(s);
    setEditRekapIzin(i);
    setEditRekapAlpha(a);
    setEditRekapJpWajib(jp);
    setEditRekapNotes('');
    setEditRekapError('');
    setEditRekapSuccess('');
    setShowEditRekapModal(true);
  };

  const handleJpWajibChange = (newJp: number) => {
    const jp = Math.max(0, newJp);
    setEditRekapJpWajib(jp);
    const accounted = editRekapHadir + editRekapIzin + editRekapSakit;
    if (jp >= accounted) {
      setEditRekapAlpha(jp - accounted);
    } else {
      setEditRekapAlpha(0);
    }
  };

  const handleHadirChange = (val: number) => {
    const h = Math.max(0, val);
    setEditRekapHadir(h);
    setEditRekapJpWajib(h + editRekapIzin + editRekapSakit + editRekapAlpha);
  };

  const handleIzinChange = (val: number) => {
    const i = Math.max(0, val);
    setEditRekapIzin(i);
    setEditRekapJpWajib(editRekapHadir + i + editRekapSakit + editRekapAlpha);
  };

  const handleSakitChange = (val: number) => {
    const s = Math.max(0, val);
    setEditRekapSakit(s);
    setEditRekapJpWajib(editRekapHadir + editRekapIzin + s + editRekapAlpha);
  };

  const handleAlphaChange = (val: number) => {
    const a = Math.max(0, val);
    setEditRekapAlpha(a);
    setEditRekapJpWajib(editRekapHadir + editRekapIzin + editRekapSakit + a);
  };

  const handleSaveEditRekap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRekap(true);
    setEditRekapError('');
    setEditRekapSuccess('');
    try {
      const mStr = String(filterMonth).padStart(2, '0');
      const yStr = String(filterYear);
      const recordsToCreate: any[] = [];

      const h = Number(editRekapHadir) || 0;
      const i = Number(editRekapIzin) || 0;
      const s = Number(editRekapSakit) || 0;
      const a = Number(editRekapAlpha) || 0;

      let dayCounter = 1;
      const subId = editRekapSubjectId || undefined;

      // Hadir
      for (let idx = 0; idx < h; idx++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          teacherId: editRekapTeacherId,
          subjectId: subId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Hadir',
          notes: editRekapNotes || 'Rekap Kehadiran (Hadir)',
          academicYearId: filterAY,
          semesterId: filterSem
        });
        dayCounter++;
      }
      // Izin
      for (let idx = 0; idx < i; idx++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          teacherId: editRekapTeacherId,
          subjectId: subId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Izin',
          notes: editRekapNotes || 'Rekap Kehadiran (Izin)',
          academicYearId: filterAY,
          semesterId: filterSem
        });
        dayCounter++;
      }
      // Sakit
      for (let idx = 0; idx < s; idx++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          teacherId: editRekapTeacherId,
          subjectId: subId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Sakit',
          notes: editRekapNotes || 'Rekap Kehadiran (Sakit)',
          academicYearId: filterAY,
          semesterId: filterSem
        });
        dayCounter++;
      }
      // Alpha
      for (let idx = 0; idx < a; idx++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          teacherId: editRekapTeacherId,
          subjectId: subId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Alpha',
          notes: editRekapNotes || 'Rekap Kehadiran (Alpha)',
          academicYearId: filterAY,
          semesterId: filterSem
        });
        dayCounter++;
      }

      // First delete existing records for this teacher in this month/period
      const existingToDelete = attendances.filter(rec => {
        if (rec.teacherId !== editRekapTeacherId && (rec as any).teacher_id !== editRekapTeacherId) return false;
        if (editRekapSubjectId && rec.subjectId && rec.subjectId !== editRekapSubjectId) return false;
        const d = new Date(rec.date);
        return d.getFullYear().toString() === yStr && (d.getMonth() + 1).toString() === filterMonth;
      });

      for (const rec of existingToDelete) {
        await api.deleteAttendance(rec.id).catch(() => {});
      }

      // Then create new records
      if (recordsToCreate.length > 0) {
        await api.createAttendanceBulk({ attendances: recordsToCreate, overwriteMonth: false });
      }

      setEditRekapSuccess('Rekap kehadiran berhasil diperbarui.');
      setTimeout(() => {
        setShowEditRekapModal(false);
        loadAttendances();
        loadSummary();
      }, 700);
    } catch (err: any) {
      setEditRekapError(err.message || 'Gagal memperbarui rekap.');
    } finally {
      setIsSavingRekap(false);
    }
  };

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // State for Bulk Monthly Rekap
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [bulkMonth, setBulkMonth] = React.useState(currentMonth);
  const [bulkYear, setBulkYear] = React.useState(currentYear);
  const [bulkAY, setBulkAY] = React.useState(academicYears[0]?.id || '');
  const [bulkSem, setBulkSem] = React.useState(semesters[0]?.id || '');
  const [bulkEffDays, setBulkEffDays] = React.useState(22);
  const [bulkData, setBulkData] = React.useState<Record<string, { hadir: number; izin: number; sakit: number; alpha: number; notes: string }>>({});
  const [isSubmittingBulk, setIsSubmittingBulk] = React.useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = React.useState('');
  const [bulkErrorMsg, setBulkErrorMsg] = React.useState('');

  const openBulkMonthlyModal = () => {
    const initialData: Record<string, { hadir: number; izin: number; sakit: number; alpha: number; notes: string }> = {};
    teachers.forEach(t => {
      const existing = summary.find(s => s.teacherId === t.id);
      initialData[t.id] = {
        hadir: existing ? existing.hadir : bulkEffDays,
        izin: existing ? existing.izin : 0,
        sakit: existing ? existing.sakit : 0,
        alpha: existing ? existing.alpha : 0,
        notes: ''
      };
    });
    setBulkData(initialData);
    setBulkSuccessMsg('');
    setBulkErrorMsg('');
    setShowBulkModal(true);
  };

  const handleSetAllHadir = (days: number) => {
    const updated = { ...bulkData };
    teachers.forEach(t => {
      updated[t.id] = {
        ...(updated[t.id] || { notes: '' }),
        hadir: days,
        izin: 0,
        sakit: 0,
        alpha: 0
      };
    });
    setBulkData(updated);
  };

  const handleBulkChange = (teacherId: string, field: 'hadir'|'izin'|'sakit'|'alpha', val: number) => {
    setBulkData(prev => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' }),
        [field]: Math.max(0, val)
      }
    }));
  };

  const handleSaveBulkMonthly = async () => {
    setIsSubmittingBulk(true);
    setBulkSuccessMsg('');
    setBulkErrorMsg('');
    try {
      const mStr = String(bulkMonth).padStart(2, '0');
      const yStr = String(bulkYear);
      const recordsToCreate: any[] = [];

      teachers.forEach(t => {
        const item = bulkData[t.id] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' };
        const h = Number(item.hadir) || 0;
        const i = Number(item.izin) || 0;
        const s = Number(item.sakit) || 0;
        const a = Number(item.alpha) || 0;

        let dayCounter = 1;
        const tSubjs = getTeacherSubjectObjects(t.id);
        const defaultSubjId = tSubjs.length > 0 ? tSubjs[0].id : undefined;

        // Hadir
        for (let idx = 0; idx < h; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            teacherId: t.id,
            subjectId: defaultSubjId,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Hadir',
            notes: item.notes || 'Rekap Bulanan (Hadir)',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
        // Izin
        for (let idx = 0; idx < i; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            teacherId: t.id,
            subjectId: defaultSubjId,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Izin',
            notes: item.notes || 'Rekap Bulanan (Izin)',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
        // Sakit
        for (let idx = 0; idx < s; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            teacherId: t.id,
            subjectId: defaultSubjId,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Sakit',
            notes: item.notes || 'Rekap Bulanan (Sakit)',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
        // Alpha
        for (let idx = 0; idx < a; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            teacherId: t.id,
            subjectId: defaultSubjId,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Alpha',
            notes: item.notes || 'Rekap Bulanan (Alpha)',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
      });

      if (recordsToCreate.length > 0) {
        await api.createAttendanceBulk({
          attendances: recordsToCreate,
          overwriteMonth: true,
          year: bulkYear,
          month: bulkMonth
        });
      }

      setBulkSuccessMsg(`Berhasil menyimpan rekap absensi bulanan untuk ${teachers.length} guru (${recordsToCreate.length} catatan).`);
      setTimeout(() => {
        setShowBulkModal(false);
        loadAttendances();
        loadSummary();
      }, 1200);
    } catch (err: any) {
      setBulkErrorMsg(err.message || 'Gagal menyimpan rekap bulanan.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const loadAttendances = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAY) params.academicYearId = filterAY;
      if (filterTeacher) params.teacherId = filterTeacher;
      if (rekapMode === 'bulan') { 
        params.year = filterYear; 
        params.month = filterMonth; 
      } else if (rekapMode === 'semester') { 
        params.year = filterYear; 
        if (filterSem) params.semesterId = filterSem;
      } else { 
        params.year = filterYear; 
      }
      const data = await api.getAttendances(params);
      setAttendances(data);
    } catch { setAttendances([]); } finally { setLoading(false); }
  }, [filterTeacher, filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  const loadSummary = React.useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterAY) params.academicYearId = filterAY;
      if (rekapMode === 'bulan') { 
        params.year = filterYear; 
        params.month = filterMonth; 
      } else if (rekapMode === 'semester') {
        params.year = filterYear;
        if (filterSem) params.semesterId = filterSem;
      } else {
        params.year = filterYear;
      }
      const data = await api.getAttendanceSummary(params);
      setSummary(data);
    } catch { setSummary([]); }
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  React.useEffect(() => { loadAttendances(); loadSummary(); }, [loadAttendances, loadSummary]);

  const handleTeacherChange = (tId: string) => {
    setFTeacher(tId);
    const subList = getTeacherSubjectObjects(tId);
    if (subList.length > 0) {
      setFSubject(subList[0].id);
    } else {
      setFSubject('');
    }
  };

  const resetForm = () => {
    setEditId(null); setFTeacher(''); setFSubject(''); setFDate(new Date().toISOString().split('T')[0]);
    setFStatus('Hadir'); setFNotes(''); setFAY(academicYears[0]?.id || '');
    setFSem(semesters[0]?.id || ''); setFormError(''); setFormSuccess('');
  };

  const openEdit = (a: Attendance) => {
    const validTeacherId = (a.teacherId && a.teacherId !== 'pengajar' && teachers.some(t => t.id === a.teacherId))
      ? a.teacherId
      : (teachers.find(t => t.id === (a as any).teacher_id)?.id || 't-12');

    setEditId(a.id);
    setFTeacher(validTeacherId);
    setFSubject(a.subjectId || '');
    setFDate(a.date);
    setFStatus(a.status as any);
    setFNotes(a.notes || '');
    setFAY(a.academicYearId || academicYears[0]?.id || '');
    setFSem(a.semesterId || semesters[0]?.id || '');
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try { await api.deleteAttendance(deleteId); setDeleteId(null); loadAttendances(); loadSummary(); }
    catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth)-1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s=>s.id===filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  const handleExport = () => {
    if (activeTab === 'input') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Nama Guru': teachers.find(t => t.id === a.teacherId)?.name || a.teacherId,
        'Mata Pelajaran': subjects?.find(s => s.id === a.subjectId)?.name || getTeacherSubjects(a.teacherId),
        'Status': a.status,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Guru_${rekapLabel.replace(/ /g, '_')}`);
    } else {
      const exportFileName = `Rekap_Kehadiran_Guru_${rekapViewType === 'per-mapel' ? 'Per_Mapel_' : 'Gabungan_'}${rekapLabel.replace(/ /g, '_')}`;
      exportRekapGuruExcel(activeSummaryList, rekapLabel, exportFileName);
    }
  };

  const handlePrint = () => {
    const title = activeTab === 'input' ? 'Data Absensi Guru' : 'Rekap Absensi Guru';
    const subtitle = `Periode: ${rekapLabel}`;
    if (activeTab === 'input') {
      const headers = ['No', 'Tanggal', 'Nama Guru', 'Mata Pelajaran', 'Status', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1, new Date(a.date).toLocaleDateString('id-ID'), teachers.find(t => t.id === a.teacherId)?.name || a.teacherId, subjects?.find(s => s.id === a.subjectId)?.name || getTeacherSubjects(a.teacherId), a.status, a.notes || '-'
      ]);
      printGenericTable(title, subtitle, headers, dataRows);
    } else {
      printRekapKehadiran(activeSummaryList, academicYears, filterAY, rekapMode === 'bulan' ? MONTHS[parseInt(filterMonth)-1] || '' : rekapLabel, filterYear);
    }
  };

  const handleDownloadPDF = () => {
    if (activeTab === 'input') {
      const title = 'Data Catatan Absensi Guru';
      const subtitle = `Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Nama Guru', 'Mata Pelajaran', 'Status', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1,
        new Date(a.date).toLocaleDateString('id-ID'),
        teachers.find(t => t.id === a.teacherId)?.name || a.teacherId,
        subjects?.find(s => s.id === a.subjectId)?.name || getTeacherSubjects(a.teacherId),
        a.status,
        a.notes || '-'
      ]);
      downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Absensi_Guru_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
    } else {
      downloadRekapKehadiranPdf(activeSummaryList, academicYears, filterAY, rekapMode === 'bulan' ? MONTHS[parseInt(filterMonth)-1] || '' : rekapLabel, filterYear);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fTeacher || !fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    try {
      if (editId) {
        await api.updateAttendance(editId, { teacherId: fTeacher, subjectId: fSubject, status: fStatus, notes: fNotes, date: fDate, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Absensi berhasil diperbarui.');
      } else {
        await api.createAttendance({ teacherId: fTeacher, subjectId: fSubject, status: fStatus, notes: fNotes, date: fDate, academicYearId: fAY, semesterId: fSem });
        setFormSuccess('Absensi baru berhasil dicatat.');
      }
      setTimeout(() => { setShowForm(false); resetForm(); loadAttendances(); loadSummary(); }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan absensi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Guru</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Kelola data & rekapitulasi kehadiran ustadz dan ustazah pengajar MQBA Isy Karima.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openBulkMonthlyModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4"/>
            <span>Input Rekap Bulanan Massal</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4"/>
            <span>Catat Absensi Baru</span>
          </button>
        </div>
      </div>

      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl space-x-1">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'input' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5"/>
            <span>Data Absensi (Input)</span>
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'rekap' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5"/>
            <span>Rekap & Statistik</span>
          </button>
        </div>

        {/* Global Export Bar */}
        <ExportBar
          onExportExcel={handleExport}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onWhatsApp={() => shareToWhatsApp('Rekap Kehadiran Guru', rekapLabel)}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-black text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-600"/>
          <span>Filter Periode & Data Guru</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rentang</label>
            <select value={rekapMode} onChange={e=>setRekapMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="bulan">Per Bulan</option>
              <option value="semester">Per Semester</option>
              <option value="tahun">Per Tahun Ajaran</option>
            </select>
          </div>
          {rekapMode === 'bulan' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bulan</label>
              <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
              </select>
            </div>
          )}
          {rekapMode === 'semester' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semester</label>
              <select value={filterSem} onChange={e=>setFilterSem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun</label>
            <input type="number" value={filterYear} onChange={e=>setFilterYear(e.target.value)} min={2020} max={2035}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun Ajaran</label>
            <select value={filterAY} onChange={e=>setFilterAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Guru</label>
            <select value={filterTeacher} onChange={e=>setFilterTeacher(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Semua Guru</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TAB: INPUT / DATA ABSENSI */}
      {activeTab === 'input' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Daftar Catatan Absensi Harian Guru ({attendances.length} catatan)
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800"/>
              <p className="text-sm font-medium">Belum ada data absensi untuk periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Guru & Mapel Diampu</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {attendances.map(a => {
                    const matchedTeacher = teachers.find(t => t.id === a.teacherId || t.id === (a as any).teacher_id);
                    const teacherName = matchedTeacher?.name || (a.teacherId === 't-12' || a.teacherId === 'pengajar' || !a.teacherId ? 'Ust. Aidil Aqli, S.Ag.' : ((a as any).teacherName || a.recordedBy || 'Ust. Aidil Aqli, S.Ag.'));
                    const teacherSubj = subjects?.find(s => s.id === a.subjectId)?.name || getTeacherSubjects(a.teacherId || 't-12');
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {new Date(a.date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                          <div>
                            <span>{teacherName}</span>
                            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                              <BookOpen className="w-3 h-3" />
                              <span>{teacherSubj}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_COLORS[a.status]}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 italic">{a.notes || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-1.5">
                            <button onClick={() => openEdit(a)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Edit">
                              <Edit className="w-3.5 h-3.5"/>
                            </button>
                            <button onClick={() => setDeleteId(a.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition" title="Hapus">
                              <Trash2 className="w-3.5 h-3.5"/>
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

      {/* TAB: REKAP */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Summary cards */}
          {subjectSummaryList.length > 0 && (() => {
            const totHadir = subjectSummaryList.reduce((s,r)=>s+r.hadir,0);
            const totIzin  = subjectSummaryList.reduce((s,r)=>s+r.izin,0);
            const totSakit = subjectSummaryList.reduce((s,r)=>s+r.sakit,0);
            const totAlpha = subjectSummaryList.reduce((s,r)=>s+r.alpha,0);
            const totAll   = totHadir+totIzin+totSakit+totAlpha;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {label:'Total Hadir',val:totHadir,cls:'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400'},
                  {label:'Izin',val:totIzin,cls:'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'},
                  {label:'Sakit',val:totSakit,cls:'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'},
                  {label:'Alpha',val:totAlpha,cls:'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'},
                ].map(c=>(
                  <div key={c.label} className={`p-4 rounded-2xl border ${c.cls}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                    <p className="text-3xl font-black mt-1">{c.val}</p>
                    <p className="text-[10px] mt-0.5 opacity-60">{totAll>0?Math.round(c.val/totAll*100):0}% dari total</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Per-teacher & Per-Subject table (Dipisah per-mapel satu per satu atau digabung) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Rekap Kehadiran Asatidz & Ustazah
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Periode: {rekapLabel}</span>
                </div>

                {/* View Mode Toggle: Per Mapel & Kelas vs Gabungan Per Guru */}
                <div className="flex p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl space-x-1 border border-slate-300/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setRekapViewType('gabungan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                      rekapViewType === 'gabungan'
                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Gabungan Per-Guru</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapViewType('per-mapel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                      rekapViewType === 'per-mapel'
                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Rincian Per-Mapel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapViewType('per-kelas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                      rekapViewType === 'per-kelas'
                        ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Rincian Per-Kelas</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const target = activeSummaryList.find(r => r.teacherId === filterTeacher) || activeSummaryList[0];
                    if (target) openEditRekap(target);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Buka form edit rekapitulasi kehadiran ustadz"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Rekap Kehadiran</span>
                </button>
                <button
                  onClick={() => {
                    const exportFileName = `Rekap_Kehadiran_Guru_${rekapViewType === 'per-kelas' ? 'Per_Kelas_' : rekapViewType === 'per-mapel' ? 'Per_Mapel_' : 'Gabungan_'}${rekapLabel.replace(/ /g, '_')}`;
                    exportRekapGuruExcel(activeSummaryList, rekapLabel, exportFileName);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    const periodTitle = rekapMode === 'bulan' ? MONTHS[Number(filterMonth) - 1] : rekapLabel;
                    downloadRekapKehadiranPdf(activeSummaryList, academicYears, filterAY, periodTitle, filterYear);
                  }}
                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => {
                    const periodTitle = rekapMode === 'bulan' ? MONTHS[Number(filterMonth) - 1] : rekapLabel;
                    printRekapKehadiran(activeSummaryList, academicYears, filterAY, periodTitle, filterYear);
                  }}
                  className="px-3.5 py-1.5 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </button>
              </div>
            </div>
            {activeSummaryList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Belum ada data kehadiran untuk periode ini.</div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th rowSpan={2} className="px-2.5 py-2.5 text-center border border-[#1e3a5f] w-10">No</th>
                      <th rowSpan={2} className="px-3 py-2.5 border border-[#1e3a5f]">Nama Asatidz / Ustazah</th>
                      <th rowSpan={2} className="px-3 py-2.5 border border-[#1e3a5f] bg-[#0d2847]">
                        {rekapViewType === 'per-kelas' ? 'Kelas & Mata Pelajaran' : 'Mata Pelajaran yang Diampu'}
                      </th>
                      <th colSpan={4} className="px-2 py-1.5 text-center border border-[#1e3a5f] bg-[#0b2545]">Kehadiran</th>
                      <th rowSpan={2} className="px-2.5 py-2.5 text-center border border-[#1e3a5f] w-20 bg-[#0d2847]">Total JP Wajib</th>
                      <th rowSpan={2} className="px-2.5 py-2.5 text-center border border-[#1e3a5f] w-20 bg-[#0b2545]">Total Kehadiran</th>
                      <th rowSpan={2} className="px-2.5 py-2.5 text-center border border-[#1e3a5f] w-16">% Hadir</th>
                      <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24 bg-[#1e1b4b] text-indigo-200 sticky right-0 z-20 shadow-md">Aksi</th>
                    </tr>
                    <tr>
                      <th className="px-2 py-1 text-center border border-[#1e3a5f] w-10 bg-[#16365c]">H</th>
                      <th className="px-2 py-1 text-center border border-[#1e3a5f] w-10 bg-[#16365c]">S</th>
                      <th className="px-2 py-1 text-center border border-[#1e3a5f] w-10 bg-[#16365c]">I</th>
                      <th className="px-2 py-1 text-center border border-[#1e3a5f] w-10 bg-[#16365c]">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {activeSummaryList.map((r, idx) => (
                      <tr key={`${r.teacherId}-${r.classId || ''}-${r.subjectId || idx}`} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-2.5 py-2.5 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{r.teacherName}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                          {rekapViewType === 'per-kelas' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                                <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span>{r.className || 'Kelas'}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-800">
                                <BookOpen className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                <span>{r.subjectName || r.subjectsTaught}</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {(r.subjectsTaught || 'Pengajar MQBA').split(' • ').map((subj, sIdx) => (
                                <span key={sIdx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-200 dark:border-indigo-800">
                                  <BookOpen className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                  <span>{subj}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">{r.hadir}</td>
                        <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{r.sakit}</td>
                        <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">{r.izin}</td>
                        <td className={`px-2 py-2.5 text-center font-mono border-r border-slate-200 dark:border-slate-800 ${r.alpha > 0 ? 'text-rose-600 font-black' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{r.alpha}</td>
                        <td className="px-2.5 py-2.5 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">{r.total}</td>
                        <td className="px-2.5 py-2.5 text-center font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-r border-slate-200 dark:border-slate-800">{r.hadir}</td>
                        <td className="px-2.5 py-2.5 text-center bg-[#0f2942] text-white font-extrabold">{r.persentaseHadir}%</td>
                        <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-white group-hover:bg-indigo-50/80 dark:bg-slate-900 dark:group-hover:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-xs">
                          <button
                            onClick={() => openEditRekap(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                            title="Edit Rekap Kehadiran Guru"
                          >
                            <Edit className="w-3.5 h-3.5"/>
                            <span>Edit</span>
                          </button>
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

      {/* FORM MODAL (CATAT / EDIT ABSENSI HARIAN) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                {editId ? 'Edit Absensi Guru' : 'Catat Absensi Baru (Per-Mapel)'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{formError}</span></div>}
            {formSuccess && <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2"><CheckCircle className="w-4 h-4"/><span>{formSuccess}</span></div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* FIELD GURU */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Guru / Pengajar</label>
                <select
                  required
                  value={fTeacher}
                  onChange={e => handleTeacherChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Pilih guru...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* FIELD MATA PELAJARAN (DIPISAH SATU-SATU) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mata Pelajaran yang Diajar (Dipisah Per-Mapel)</label>
                <select value={fSubject} onChange={e => setFSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">-- Pilih Mapel --</option>
                  {fTeacher && getTeacherSubjectObjects(fTeacher).length > 0 ? (
                    getTeacherSubjectObjects(fTeacher).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  ) : (
                    (subjects || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
                {fTeacher && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] flex items-center space-x-2 mt-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-600 dark:text-slate-300">Mapel Terpilih: </span>
                      <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                        {subjects?.find(s => s.id === fSubject)?.name || getTeacherSubjects(fTeacher)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal</label>
                  <input type="date" required value={fDate} onChange={e=>setFDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                  <select required value={fStatus} onChange={e=>setFStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['Hadir','Izin','Sakit','Alpha'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select required value={fAY} onChange={e=>setFAY(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select required value={fSem} onChange={e=>setFSem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Keterangan (opsional)</label>
                <input type="text" placeholder="Contoh: Mengajar jam ke-1" value={fNotes} onChange={e=>setFNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
                <button type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition cursor-pointer">
                  {editId ? 'Simpan Perubahan' : 'Catat Absensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT REKAP (PER-GURU ATAU PER-MAPEL) */}
      {showEditRekapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-3 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5 text-indigo-600"/>
                  <span>Edit Rekap Kehadiran Guru</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Periode: {rekapLabel}</p>
              </div>
              <button onClick={() => setShowEditRekapModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {editRekapError && <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0"/><span>{editRekapError}</span></div>}
            {editRekapSuccess && <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0"/><span>{editRekapSuccess}</span></div>}

            <form onSubmit={handleSaveEditRekap} className="space-y-3">
              {/* Guru Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Guru / Pengajar</label>
                <select
                  required
                  value={editRekapTeacherId}
                  onChange={e => {
                    const newTId = e.target.value;
                    setEditRekapTeacherId(newTId);
                    const subList = getTeacherSubjectObjects(newTId);
                    if (subList.length > 0) {
                      setEditRekapSubjectId(subList[0].id);
                      setEditRekapSubjectName(subList[0].name);
                    } else {
                      setEditRekapSubjectId('');
                      setEditRekapSubjectName('Pengajar MQBA');
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Mapel Info */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mata Pelajaran yang Diampu</label>
                <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {editRekapSubjectName || getTeacherSubjects(editRekapTeacherId)}
                  </span>
                </div>
              </div>

              {/* Field Input TOTAL JP WAJIB (Bisa Diedit Langsung) */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Total JP Wajib Mengajar (Target Masuk / Jam)</span>
                  </label>
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 px-1.5 py-0.5 rounded-full shadow-2xs">
                    ✏️ Edit Bebas
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={editRekapJpWajib}
                    onChange={e => handleJpWajibChange(Number(e.target.value))}
                    className="w-16 text-center font-mono font-bold text-sm text-indigo-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg py-1 border border-indigo-300 dark:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    <span>Target total jam pelajaran / pertemuan wajib ustadz periode ini.</span>
                  </div>
                </div>
              </div>

              {/* Kehadiran Counts Input Grid */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Realisasi Kehadiran (H, S, I, A)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                    <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 block uppercase">Hadir (H)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editRekapHadir}
                      onChange={e => handleHadirChange(Number(e.target.value))}
                      className="w-full text-center font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 rounded-md py-0.5 border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-1"
                    />
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40 text-center">
                    <span className="text-[9px] font-black text-blue-700 dark:text-blue-300 block uppercase">Izin (I)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editRekapIzin}
                      onChange={e => handleIzinChange(Number(e.target.value))}
                      className="w-full text-center font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 rounded-md py-0.5 border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/40 text-center">
                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 block uppercase">Sakit (S)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editRekapSakit}
                      onChange={e => handleSakitChange(Number(e.target.value))}
                      className="w-full text-center font-mono font-bold text-xs text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 rounded-md py-0.5 border border-amber-200 dark:border-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500 mt-1"
                    />
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40 text-center">
                    <span className="text-[9px] font-black text-rose-700 dark:text-rose-300 block uppercase">Alpha (A)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editRekapAlpha}
                      onChange={e => handleAlphaChange(Number(e.target.value))}
                      className="w-full text-center font-mono font-bold text-xs text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 rounded-md py-0.5 border border-rose-200 dark:border-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-500 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Total & % Hadir Summary Row */}
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Total Hadir & Persentase:</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                  {editRekapHadir} Hadir / {editRekapJpWajib} JP ({editRekapJpWajib > 0 ? Math.round((editRekapHadir / editRekapJpWajib) * 100) : 0}%)
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={editRekapNotes}
                  onChange={e => setEditRekapNotes(e.target.value)}
                  placeholder="Contoh: Rekap kehadiran bulan ini"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditRekapModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold uppercase transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingRekap}
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5"/>
                  <span>{isSavingRekap ? 'Menyimpan...' : 'Simpan Rekap'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <Trash2 className="w-6 h-6"/>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Hapus Catatan Absensi?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini akan menghapus data absensi harian ini dari database secara permanen.</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition">
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BULK MONTHLY REKAP */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600"/>
                  <span>Input Rekap Kehadiran Bulanan Massal Guru</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Isi rekapitulasi frekuensi mengajar & masuk kelas (Hadir, Izin, Sakit, dan Alpha) untuk seluruh pengajar ({teachers.length} orang) secara sekaligus dalam 1 bulan.
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-900/30 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bulan</label>
                <select value={bulkMonth} onChange={e=>setBulkMonth(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun</label>
                <input type="number" value={bulkYear} onChange={e=>setBulkYear(e.target.value)} min={2020} max={2035}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Masuk Kelas / Jam</label>
                <input type="number" value={bulkEffDays} onChange={e=>{
                  const d = Math.max(1, Number(e.target.value)||22);
                  setBulkEffDays(d);
                }} min={1} max={100}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="col-span-2 sm:col-span-1 md:col-span-2">
                <button type="button" onClick={() => handleSetAllHadir(bulkEffDays)}
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4"/>
                  <span>Set Semua {bulkEffDays} Kali Masuk</span>
                </button>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {bulkErrorMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{bulkErrorMsg}</span></div>}
            {bulkSuccessMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center space-x-2"><CheckCircle className="w-4 h-4"/><span>{bulkSuccessMsg}</span></div>}

            {/* Bulk Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">No</th>
                      <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">Nama Pengajar & Mapel</th>
                      <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-indigo-600">Hadir (Masuk)</th>
                      <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-blue-600">Izin</th>
                      <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-amber-600">Sakit</th>
                      <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-rose-600">Alpha</th>
                      <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800">Total Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                    {teachers.map((t, idx) => {
                      const item = bulkData[t.id] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' };
                      const tot = Number(item.hadir) + Number(item.izin) + Number(item.sakit) + Number(item.alpha);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 max-w-[240px]">
                            <div>
                              <span>{t.name}</span>
                              <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                                <BookOpen className="w-3 h-3" />
                                <span>{getTeacherSubjects(t.id)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input type="number" min={0} max={100}
                              value={item.hadir}
                              onChange={e => handleBulkChange(t.id, 'hadir', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center font-mono font-bold text-indigo-600 border border-indigo-200 dark:border-indigo-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input type="number" min={0} max={100}
                              value={item.izin}
                              onChange={e => handleBulkChange(t.id, 'izin', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center font-mono font-bold text-blue-600 border border-blue-200 dark:border-blue-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input type="number" min={0} max={100}
                              value={item.sakit}
                              onChange={e => handleBulkChange(t.id, 'sakit', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center font-mono font-bold text-amber-600 border border-amber-200 dark:border-amber-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"/>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input type="number" min={0} max={100}
                              value={item.alpha}
                              onChange={e => handleBulkChange(t.id, 'alpha', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center font-mono font-bold text-rose-600 border border-rose-200 dark:border-rose-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"/>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                            {tot}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end space-x-3">
              <button type="button" onClick={() => setShowBulkModal(false)}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase transition">
                Batal
              </button>
              <button type="button" onClick={handleSaveBulkMonthly} disabled={isSubmittingBulk}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                <CheckCircle className="w-4 h-4"/>
                <span>{isSubmittingBulk ? 'Menyimpan Rekap...' : 'Simpan Rekap Bulanan Massal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
