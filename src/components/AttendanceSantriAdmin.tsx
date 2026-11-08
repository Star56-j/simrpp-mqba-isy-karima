import React from 'react';
import {
  ClipboardList, Plus, Edit, Trash2, X,
  CheckCircle, AlertCircle, BarChart2, Calendar, Users, Download, Upload, User, BookOpen, Printer,
  Search, RefreshCw, Save
} from 'lucide-react';
import { Santri, SantriAttendance, SantriAttendanceSummary, SchoolClass, AcademicYear, Semester, Subject, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel, exportRekapSantriExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printGenericTable } from '../utils/printUtils';
import { printRekapKehadiranSantri } from '../utils/printRekapKehadiran';
import { downloadRekapSantriPdf } from '../utils/pdfDownloader';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';
import BulkMonthlySantriModal from './BulkMonthlySantriModal';

interface AttendanceSantriAdminProps {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  santriList: Santri[];
  subjects?: Subject[];
  schedules?: TeachingSchedule[];
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

interface SessionModalState {
  isOpen: boolean;
  isEdit: boolean;
  date: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  academicYearId: string;
  semesterId: string;
  notes: string;
  statuses: Record<string, string>;
  originalDate?: string;
  originalClassId?: string;
  originalSubjectId?: string;
}

export default function AttendanceSantriAdmin({
  classes,
  academicYears,
  semesters,
  santriList,
  subjects = [],
  schedules = []
}: AttendanceSantriAdminProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = React.useState<'input' | 'rekap'>('rekap');
  const [rekapSubTab, setRekapSubTab] = React.useState<'santri' | 'kelas'>('santri');

  // Filter
  const [filterClass, setFilterClass] = React.useState('');
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');
  const [filterYear, setFilterYear] = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode, setRekapMode] = React.useState<'bulan' | 'semester' | 'tahun'>('bulan');
  const [searchSantri, setSearchSantri] = React.useState('');

  // Data
  const [attendances, setAttendances] = React.useState<SantriAttendance[]>([]);
  const [summary, setSummary] = React.useState<SantriAttendanceSummary[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Bulk Monthly Modal
  const [showBulkSantriModal, setShowBulkSantriModal] = React.useState(false);

  // Feedback Toast
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Session Modal (Add or Edit full session per class)
  const [sessionModal, setSessionModal] = React.useState<SessionModalState>({
    isOpen: false,
    isEdit: false,
    date: todayStr,
    classId: classes[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    subjectName: subjects[0]?.name || '',
    academicYearId: academicYears[0]?.id || '',
    semesterId: semesters[0]?.id || '',
    notes: '',
    statuses: {}
  });
  const [modalSubmitting, setModalSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState('');

  // Single Santri Edit Modal (from Rekap Table)
  const [santriModalOpen, setSantriModalOpen] = React.useState(false);
  const [santriToEdit, setSantriToEdit] = React.useState<any | null>(null);
  const [editHadir, setEditHadir] = React.useState(0);
  const [editIzin, setEditIzin] = React.useState(0);
  const [editSakit, setEditSakit] = React.useState(0);
  const [editAlpha, setEditAlpha] = React.useState(0);
  const [editSantriNotes, setEditSantriNotes] = React.useState('');
  const [santriSubmitting, setSantriSubmitting] = React.useState(false);
  const [santriModalError, setSantriModalError] = React.useState('');

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = {};
    if (filterAY) p.academicYearId = filterAY;
    if (filterClass) p.classId = filterClass;

    if (rekapMode === 'bulan') {
      p.year = filterYear;
      p.month = filterMonth;
    } else if (rekapMode === 'semester') {
      if (filterSem) p.semesterId = filterSem;
    } else if (rekapMode === 'tahun') {
      p.year = filterYear;
    }
    return p;
  }, [filterAY, filterSem, filterYear, filterMonth, filterClass, rekapMode]);

  const loadData = React.useCallback(() => {
    setLoading(true);
    const params = buildParams();
    Promise.all([
      api.getSantriAttendances(params),
      api.getSantriAttendanceSummary(params),
    ]).then(([attList, sumList]) => {
      setAttendances(attList);
      setSummary(sumList);
    }).catch(() => {
      setAttendances([]);
      setSummary([]);
    }).finally(() => setLoading(false));
  }, [buildParams]);

  React.useEffect(() => { loadData(); }, [loadData]);

  // Calculations for Per-Santri (Individu) Summary Array with % Hadir & % Absen
  const perSantriSummary = React.useMemo(() => {
    const targetSantris = (filterClass ? santriList.filter(s => s.classId === filterClass) : santriList)
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));

    return targetSantris.map(s => {
      const clsObj = classes.find(c => c.id === s.classId);
      const clsName = clsObj ? clsObj.name : s.classId;
      const myAtts = attendances.filter(a => (a as any).santriId === s.id);

      let hadir = 0, izin = 0, sakit = 0, alpha = 0;
      if (myAtts.length > 0) {
        hadir = myAtts.filter(a => a.status === 'Hadir').length;
        izin = myAtts.filter(a => a.status === 'Izin').length;
        sakit = myAtts.filter(a => a.status === 'Sakit').length;
        alpha = myAtts.filter(a => a.status === 'Alpha').length;
      }

      const total = hadir + izin + sakit + alpha;
      const totalTidakHadir = izin + sakit + alpha;
      const persentaseHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;
      const persentaseAbsen = total > 0 ? Math.round((totalTidakHadir / total) * 100) : 0;

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
        totalTidakHadir,
        persentaseHadir,
        persentaseAbsen
      };
    });
  }, [santriList, filterClass, classes, attendances]);

  // Filtered santri by search query
  const displayedSantriSummary = React.useMemo(() => {
    if (!searchSantri.trim()) return perSantriSummary;
    const q = searchSantri.toLowerCase();
    return perSantriSummary.filter(s =>
      s.santriName.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  }, [perSantriSummary, searchSantri]);

  const rekapLabel = rekapMode === 'bulan'
    ? `Bulan ${MONTHS[parseInt(filterMonth) - 1] || filterMonth} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s => s.id === filterSem)?.name || 'Ganjil'} TA ${academicYears.find(a => a.id === filterAY)?.name || ''}`
    : `Tahun ${filterYear}`;

  // ==========================================
  // HANDLERS FOR SESSION EDIT / CREATE
  // ==========================================
  const openCreateSession = () => {
    const defaultCId = filterClass || classes[0]?.id || '';
    const classSantris = santriList.filter(s => s.classId === defaultCId);
    const initialStatuses: Record<string, string> = {};
    classSantris.forEach(s => { initialStatuses[s.id] = 'Hadir'; });

    const scheds = schedules.filter(s => s.classId === defaultCId);
    const defaultSubjId = scheds[0]?.subjectId || subjects[0]?.id || '';
    const subjName = subjects.find(s => s.id === defaultSubjId)?.name || '';

    setModalError('');
    setSessionModal({
      isOpen: true,
      isEdit: false,
      date: todayStr,
      classId: defaultCId,
      subjectId: defaultSubjId,
      subjectName: subjName,
      academicYearId: filterAY || academicYears[0]?.id || '',
      semesterId: filterSem || semesters[0]?.id || '',
      notes: '',
      statuses: initialStatuses
    });
  };

  const openEditSession = (sessionRow: any) => {
    setModalError('');
    const targetClassId = sessionRow.classId;
    const targetDate = sessionRow.date;
    const targetSubjId = sessionRow.subjectId || '';

    // Find all attendance records matching this date, class, and subject
    const matchingRecords = attendances.filter(rec =>
      rec.date === targetDate &&
      rec.classId === targetClassId &&
      (rec.subjectId === targetSubjId || !rec.subjectId || !targetSubjId)
    );

    const classSantris = santriList.filter(s => s.classId === targetClassId);
    const statuses: Record<string, string> = {};
    classSantris.forEach(s => {
      const found = matchingRecords.find(r => (r as any).santriId === s.id);
      statuses[s.id] = found?.status || 'Hadir';
    });

    setSessionModal({
      isOpen: true,
      isEdit: true,
      date: targetDate,
      classId: targetClassId,
      subjectId: targetSubjId,
      subjectName: sessionRow.subjectName || subjects.find(s => s.id === targetSubjId)?.name || '',
      academicYearId: sessionRow.academicYearId || filterAY || academicYears[0]?.id || '',
      semesterId: sessionRow.semesterId || filterSem || semesters[0]?.id || '',
      notes: sessionRow.notes || '',
      statuses,
      originalDate: targetDate,
      originalClassId: targetClassId,
      originalSubjectId: targetSubjId
    });
  };

  const handleSessionClassChange = (newClassId: string) => {
    const classSantris = santriList.filter(s => s.classId === newClassId);
    const newStatuses: Record<string, string> = {};
    classSantris.forEach(s => {
      newStatuses[s.id] = sessionModal.statuses[s.id] || 'Hadir';
    });

    const scheds = schedules.filter(s => s.classId === newClassId);
    const matchSubj = scheds[0]?.subjectId || sessionModal.subjectId || subjects[0]?.id || '';
    const subjName = subjects.find(s => s.id === matchSubj)?.name || '';

    setSessionModal(prev => ({
      ...prev,
      classId: newClassId,
      subjectId: matchSubj,
      subjectName: subjName,
      statuses: newStatuses
    }));
  };

  const handleSetAllSessionStatus = (status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha') => {
    const classSantris = santriList.filter(s => s.classId === sessionModal.classId);
    const updated = { ...sessionModal.statuses };
    classSantris.forEach(s => { updated[s.id] = status; });
    setSessionModal(prev => ({ ...prev, statuses: updated }));
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!sessionModal.classId || !sessionModal.date) {
      setModalError('Kelas dan Tanggal wajib diisi.');
      return;
    }

    const classSantris = santriList.filter(s => s.classId === sessionModal.classId);
    if (classSantris.length === 0) {
      setModalError('Tidak ada santri di kelas yang dipilih.');
      return;
    }

    setModalSubmitting(true);
    try {
      const activeUser = api.getCurrentUser();
      const adminName = activeUser?.name || 'Admin Akademik MQBA';

      // 1. If edit, delete previous session records
      if (sessionModal.isEdit && sessionModal.originalDate && sessionModal.originalClassId) {
        const toDelete = attendances.filter(rec =>
          rec.date === sessionModal.originalDate &&
          rec.classId === sessionModal.originalClassId &&
          (rec.subjectId === sessionModal.originalSubjectId || !rec.subjectId || !sessionModal.originalSubjectId)
        );
        for (const rec of toDelete) {
          await api.deleteSantriAttendance(rec.id).catch(() => {});
        }
      }

      // 2. Insert updated / new per-santri attendance entries
      const recordsToSave = classSantris.map(s => ({
        id: `sa-${crypto.randomUUID()}`,
        classId: sessionModal.classId,
        subjectId: sessionModal.subjectId,
        subjectName: sessionModal.subjectName || subjects.find(sub => sub.id === sessionModal.subjectId)?.name || 'Mapel Umum',
        santriId: s.id,
        date: sessionModal.date,
        status: sessionModal.statuses[s.id] || 'Hadir',
        notes: sessionModal.notes || '',
        academicYearId: sessionModal.academicYearId || filterAY,
        semesterId: sessionModal.semesterId || filterSem,
        recordedBy: adminName
      }));

      await api.createSantriAttendanceBulk({ attendances: recordsToSave });

      setSessionModal(prev => ({ ...prev, isOpen: false }));
      showToast('success', `Berhasil ${sessionModal.isEdit ? 'memperbarui' : 'menyimpan'} absensi ${recordsToSave.length} santri tanggal ${sessionModal.date}.`);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan absensi.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // ==========================================
  // HANDLERS FOR SINGLE SANTRI EDIT (REKAP)
  // ==========================================
  const openEditSantri = (santriSummaryItem: any) => {
    setSantriToEdit(santriSummaryItem);
    setEditHadir(santriSummaryItem.hadir || 0);
    setEditIzin(santriSummaryItem.izin || 0);
    setEditSakit(santriSummaryItem.sakit || 0);
    setEditAlpha(santriSummaryItem.alpha || 0);
    setEditSantriNotes('');
    setSantriModalError('');
    setSantriModalOpen(true);
  };

  const handleSaveSantriRekap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriToEdit) return;
    setSantriModalError('');
    setSantriSubmitting(true);

    try {
      const activeUser = api.getCurrentUser();
      const adminName = activeUser?.name || 'Admin Akademik MQBA';
      const santriId = santriToEdit.santriId;
      const classId = santriToEdit.classId;

      // 1. Delete existing records for this santri in this scope
      const existingForSantri = attendances.filter(a => (a as any).santriId === santriId);
      for (const rec of existingForSantri) {
        await api.deleteSantriAttendance(rec.id).catch(() => {});
      }

      // 2. Generate new records to match exact Hadir, Izin, Sakit, Alpha counts
      const recordsToCreate: any[] = [];
      const mStr = String(filterMonth).padStart(2, '0');
      const yStr = filterYear;
      let dayCounter = 1;

      // Hadir
      for (let i = 0; i < editHadir; i++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          id: `sa-${crypto.randomUUID()}`,
          classId: classId,
          santriId: santriId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Hadir',
          notes: editSantriNotes || 'Rekap Kehadiran Santri',
          academicYearId: filterAY,
          semesterId: filterSem,
          recordedBy: adminName
        });
        dayCounter++;
      }
      // Izin
      for (let i = 0; i < editIzin; i++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          id: `sa-${crypto.randomUUID()}`,
          classId: classId,
          santriId: santriId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Izin',
          notes: editSantriNotes || 'Rekap Izin Santri',
          academicYearId: filterAY,
          semesterId: filterSem,
          recordedBy: adminName
        });
        dayCounter++;
      }
      // Sakit
      for (let i = 0; i < editSakit; i++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          id: `sa-${crypto.randomUUID()}`,
          classId: classId,
          santriId: santriId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Sakit',
          notes: editSantriNotes || 'Rekap Sakit Santri',
          academicYearId: filterAY,
          semesterId: filterSem,
          recordedBy: adminName
        });
        dayCounter++;
      }
      // Alpha
      for (let i = 0; i < editAlpha; i++) {
        const dayStr = String(dayCounter).padStart(2, '0');
        recordsToCreate.push({
          id: `sa-${crypto.randomUUID()}`,
          classId: classId,
          santriId: santriId,
          date: `${yStr}-${mStr}-${dayStr}`,
          status: 'Alpha',
          notes: editSantriNotes || 'Rekap Alpha Santri',
          academicYearId: filterAY,
          semesterId: filterSem,
          recordedBy: adminName
        });
        dayCounter++;
      }

      if (recordsToCreate.length > 0) {
        await api.createSantriAttendanceBulk({ attendances: recordsToCreate });
      }

      setSantriModalOpen(false);
      showToast('success', `Berhasil memperbarui absensi untuk santri ${santriToEdit.santriName} (${recordsToCreate.length} entri kehadiran).`);
      loadData();
    } catch (err: any) {
      setSantriModalError(err.message || 'Gagal menyimpan rekap santri.');
    } finally {
      setSantriSubmitting(false);
    }
  };

  // ==========================================
  // EXPORT & PRINT
  // ==========================================
  const handleExport = () => {
    if (activeTab === 'input') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Kelas': classes.find(c => c.id === a.classId)?.name || a.classId,
        'Mata Pelajaran': a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        'Pengabsen': (a as any).teacherName || a.recordedBy || 'Pengajar',
        'Hadir': a.jumlahHadir,
        'Izin': a.jumlahIzin,
        'Sakit': a.jumlahSakit,
        'Alpha': a.jumlahAlpha,
        'Total': a.jumlahTotal,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Santri_${rekapLabel.replace(/\s+/g, '_')}`);
    } else {
      if (rekapSubTab === 'santri') {
        exportRekapSantriExcel(perSantriSummary, rekapLabel, `Rekap_Kehadiran_Santri_Individu_${rekapLabel.replace(/\s+/g, '_')}`);
      } else {
        const enrichedClassSummary = summary.map(s => {
          const tot = s.hadir + s.sakit + s.izin + s.alpha;
          const pctHadir = s.rataHadir !== undefined ? s.rataHadir : (tot > 0 ? Math.round((s.hadir / tot) * 100) : 0);
          const pctAbsen = tot > 0 ? Math.round(((s.sakit + s.izin + s.alpha) / tot) * 100) : 0;
          return {
            ...s,
            santriName: `Kelas ${classes.find(c => c.id === s.classId)?.name || s.classId}`,
            nis: `Per Kelas`,
            persentaseHadir: pctHadir,
            persentaseAbsen: pctAbsen
          };
        });
        exportRekapSantriExcel(enrichedClassSummary, rekapLabel, `Rekap_Kehadiran_Santri_Kelas_${rekapLabel.replace(/\s+/g, '_')}`);
      }
    }
  };

  const handlePrint = () => {
    if (activeTab === 'input') {
      const title = 'Data Catatan Absensi Harian Santri';
      const subtitle = `Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Kelas', 'Mata Pelajaran', 'Pengabsen', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1,
        new Date(a.date).toLocaleDateString('id-ID'),
        classes.find(c => c.id === a.classId)?.name || a.classId,
        a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        (a as any).teacherName || a.recordedBy || 'Pengajar',
        a.jumlahHadir, a.jumlahIzin, a.jumlahSakit, a.jumlahAlpha, a.jumlahTotal, a.notes || '-'
      ]);
      printGenericTable(title, subtitle, headers, dataRows);
    } else {
      if (rekapSubTab === 'santri') {
        printRekapKehadiranSantri(perSantriSummary, academicYears, filterAY, `Santri (Individu) - ${rekapLabel}`);
      } else {
        const enrichedClassSummary = summary.map(s => {
          const tot = s.hadir + s.sakit + s.izin + s.alpha;
          const pctHadir = s.rataHadir !== undefined ? s.rataHadir : (tot > 0 ? Math.round((s.hadir / tot) * 100) : 0);
          const pctAbsen = tot > 0 ? Math.round(((s.sakit + s.izin + s.alpha) / tot) * 100) : 0;
          return {
            ...s,
            santriName: `Kelas ${classes.find(c => c.id === s.classId)?.name || s.classId}`,
            nis: `Per Kelas`,
            persentaseHadir: pctHadir,
            persentaseAbsen: pctAbsen
          };
        });
        printRekapKehadiranSantri(enrichedClassSummary, academicYears, filterAY, `Per Kelas - ${rekapLabel}`);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (activeTab === 'input') {
      const title = 'Data Catatan Absensi Harian Santri';
      const subtitle = `Periode: ${rekapLabel}`;
      const headers = ['No', 'Tanggal', 'Kelas', 'Mata Pelajaran', 'Pengabsen', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1,
        new Date(a.date).toLocaleDateString('id-ID'),
        classes.find(c => c.id === a.classId)?.name || a.classId,
        a.subjectName || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum',
        (a as any).teacherName || a.recordedBy || 'Pengajar',
        a.jumlahHadir, a.jumlahIzin, a.jumlahSakit, a.jumlahAlpha, a.jumlahTotal, a.notes || '-'
      ]);
      downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Absensi_Harian_Santri_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
    } else {
      if (rekapSubTab === 'santri') {
        const title = `Rekap Kehadiran Santri Individu - ${rekapLabel}`;
        const subtitle = `Tahun Pelajaran: ${academicYears.find(a => a.id === filterAY)?.name || '-'}`;
        const headers = ['No', 'Nama Santri', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Hari', '% Hadir', '% Absen'];
        const dataRows = perSantriSummary.map((s, idx) => [
          idx + 1,
          s.santriName,
          classes.find(c => c.id === s.classId)?.name || s.classId,
          s.hadir,
          s.izin,
          s.sakit,
          s.alpha,
          s.total,
          `${s.persentaseHadir}%`,
          `${s.persentaseAbsen}%`
        ]);
        downloadRekapSantriPdf(title, subtitle, headers, dataRows, `Rekap_Absensi_Santri_Individu_${rekapLabel.replace(/\s+/g, '_')}.pdf`);
      } else {
        const title = `Rekap Kehadiran Santri Per Kelas - ${rekapLabel}`;
        const subtitle = `Tahun Pelajaran: ${academicYears.find(a => a.id === filterAY)?.name || '-'}`;
        const headers = ['No', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Hari', '% Hadir', '% Absen'];
        const dataRows = summary.map((s, idx) => {
          const tot = s.hadir + s.sakit + s.izin + s.alpha;
          const pctHadir = s.rataHadir !== undefined ? s.rataHadir : (tot > 0 ? Math.round((s.hadir / tot) * 100) : 0);
          const pctAbsen = tot > 0 ? Math.round(((s.sakit + s.izin + s.alpha) / tot) * 100) : 0;
          return [
            idx + 1,
            classes.find(c => c.id === s.classId)?.name || s.classId,
            s.hadir,
            s.izin,
            s.sakit,
            s.alpha,
            tot,
            `${pctHadir}%`,
            `${pctAbsen}%`
          ];
        });
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
      setLoading(true);
      const attendancesToSave = data.map(row => {
        const clsName = String(row['Kelas']).replace('Kelas ', '');
        const cls = classes.find(c => c.name === clsName || c.id === clsName);
        if (!cls) return null;
        return {
          id: `sa-${crypto.randomUUID()}`,
          classId: cls.id,
          date: row['Tanggal'] || new Date().toISOString().split('T')[0],
          jumlahHadir: Number(row['Hadir'] || 0),
          jumlahIzin: Number(row['Izin'] || 0),
          jumlahSakit: Number(row['Sakit'] || 0),
          jumlahAlpha: Number(row['Alpha'] || 0),
          jumlahTotal: Number(row['Total'] || 0),
          notes: row['Keterangan'] || '',
          academicYearId: filterAY,
          semesterId: filterSem
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      showToast('success', `Berhasil mengimport ${attendancesToSave.length} data absensi santri.`);
      loadData();
    } catch (err: any) {
      showToast('error', "Gagal mengimport: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition shadow-md border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Kelola Absensi Santri</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
              Admin Portal
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pantau, input, dan edit absensi santri per kelas, per bulan, maupun per semester secara rinci.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button
            onClick={() => setShowBulkSantriModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer"
          >
            <Calendar className="w-4 h-4"/><span>⚡ Input Rekap Bulanan Santri</span>
          </button>
          <button
            onClick={openCreateSession}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4"/><span>+ Catat Absensi Kelas</span>
          </button>
        </div>
      </div>

      {/* Segmented Mode Switcher: Per Bulan vs Per Semester */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-2">Mode Rekapan:</span>
          <button
            onClick={() => setRekapMode('bulan')}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition cursor-pointer flex items-center space-x-1.5 ${
              rekapMode === 'bulan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 Rekapan Per Bulan</span>
          </button>
          <button
            onClick={() => setRekapMode('semester')}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition cursor-pointer flex items-center space-x-1.5 ${
              rekapMode === 'semester'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🎓 Rekapan Per Semester</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          Periode Aktif: <span className="text-indigo-600 dark:text-indigo-400 font-black">{rekapLabel}</span>
        </div>
      </div>

      {/* Tabs & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl space-x-1">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'rekap' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5"/>
            <span>Rekapitulasi & Persentase Kehadiran</span>
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'input' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5"/>
            <span>Riwayat Sesi Absensi (Edit/Hapus)</span>
          </button>
        </div>

        <ExportBar
          onExportExcel={handleExport}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onWhatsApp={() => shareToWhatsApp('Rekap Absensi Santri', rekapLabel)}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {rekapMode === 'bulan' ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Bulan</label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={String(i + 1)}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun Kalender</label>
                <input
                  type="number"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  min={2020}
                  max={2035}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Semester</label>
              <select
                value={filterSem}
                onChange={e => setFilterSem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    Semester {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun Ajaran</label>
            <select
              value={filterAY}
              onChange={e => setFilterAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>
                  TA {y.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Kelas</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => loadData()}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: REKAPITULASI & PERSENTASE                         */}
      {/* ======================================================== */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hadir', val: summary.reduce((s, r) => s + r.hadir, 0), cls: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
              { label: 'Total Izin', val: summary.reduce((s, r) => s + r.izin, 0), cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
              { label: 'Total Sakit', val: summary.reduce((s, r) => s + r.sakit, 0), cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
              { label: 'Total Alpha', val: summary.reduce((s, r) => s + r.alpha, 0), cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
            ].map(c => (
              <div key={c.label} className={`p-4 rounded-2xl border ${c.cls} shadow-2xs`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                <p className="text-2xl font-black mt-1 font-mono">{c.val}</p>
              </div>
            ))}
          </div>

          {/* Sub-Tab Selection: Per-Santri vs Per-Kelas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRekapSubTab('santri')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
                  rekapSubTab === 'santri' ? 'bg-[#0f2942] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5"/>
                <span>👦 Rekapitulasi Per-Santri (Individu)</span>
              </button>
              <button
                onClick={() => setRekapSubTab('kelas')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 ${
                  rekapSubTab === 'kelas' ? 'bg-[#0f2942] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>🏢 Rekapitulasi Per-Kelas</span>
              </button>
            </div>

            {/* Quick search santri */}
            {rekapSubTab === 'santri' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama santri / NIS..."
                  value={searchSantri}
                  onChange={e => setSearchSantri(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {rekapSubTab === 'santri'
                  ? `Rekap Absensi Santri — ${rekapLabel}`
                  : `Rekap Kehadiran Santri Per-Kelas — ${rekapLabel}`}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {rekapSubTab === 'santri' ? `${displayedSantriSummary.length} santri terdaftar` : `${summary.length} kelas`}
              </span>
            </div>

            {/* TABEL REKAP INDIVIDU SANTRI */}
            {rekapSubTab === 'santri' && (
              displayedSantriSummary.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700"/>
                  <p className="text-sm font-bold">Tidak ada data santri ditemukan.</p>
                  <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter kelas atau kata kunci pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-10">No</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f]">Nama Santri</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f] bg-[#0d2847]">NIS / Kelas</th>
                        <th colSpan={4} className="px-3 py-1.5 text-center border border-[#1e3a5f] bg-[#0b2545]">Jumlah Kehadiran</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24 bg-[#0d2847]">Total Sesi</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24">% Hadir</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24 bg-[#7f1d1d] text-white">% Absen</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24">Aksi</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]" title="Hadir">Hadir</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]" title="Izin">Izin</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]" title="Sakit">Sakit</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]" title="Alpha">Alfa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {displayedSantriSummary.map((s, idx) => (
                        <tr key={s.santriId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                {s.santriName.charAt(0)}
                              </span>
                              <span>{s.santriName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-xs font-mono font-bold">NIS: {s.nis}</span>
                              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{s.className}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                            {s.hadir}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                            {s.izin}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800">
                            {s.sakit}
                          </td>
                          <td className={`px-3 py-3 text-center font-mono border-r border-slate-200 dark:border-slate-800 ${
                            s.alpha > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'font-bold text-slate-700 dark:text-slate-300'
                          }`}>
                            {s.alpha}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                            {s.total}
                          </td>
                          <td className="px-3 py-3 text-center bg-[#0f2942] text-white font-extrabold border-r border-slate-200 dark:border-slate-800">
                            <span className="font-mono">{s.persentaseHadir}%</span>
                          </td>
                          <td className="px-3 py-3 text-center font-extrabold border-r border-slate-200 dark:border-slate-800">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                              s.persentaseAbsen > 15
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : s.persentaseAbsen > 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {s.persentaseAbsen}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => openEditSantri(s)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 text-xs font-bold transition cursor-pointer shadow-2xs"
                              title="Edit Absensi Santri Ini"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TABEL REKAP KELAS */}
            {rekapSubTab === 'kelas' && (
              summary.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">Belum ada data absensi untuk periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f2942] text-white text-[11px] font-black uppercase tracking-wider">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-10">No</th>
                        <th rowSpan={2} className="px-4 py-2.5 border border-[#1e3a5f]">Nama Kelas</th>
                        <th colSpan={4} className="px-3 py-1.5 text-center border border-[#1e3a5f] bg-[#0b2545]">Kehadiran Santri</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-28 bg-[#0d2847]">Total Hari Sesi</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24">% Hadir</th>
                        <th rowSpan={2} className="px-3 py-2.5 text-center border border-[#1e3a5f] w-24 bg-[#7f1d1d] text-white">% Absen</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">H</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">I</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">S</th>
                        <th className="px-3 py-1 text-center border border-[#1e3a5f] w-12 bg-[#16365c]">A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {summary.map((r, idx) => {
                        const tot = r.hadir + r.sakit + r.izin + r.alpha;
                        const pctHadir = r.rataHadir !== undefined ? r.rataHadir : (tot > 0 ? Math.round((r.hadir / tot) * 100) : 0);
                        const pctAbsen = tot > 0 ? Math.round(((r.sakit + r.izin + r.alpha) / tot) * 100) : 0;
                        return (
                          <tr key={r.classId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                            <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">Kelas {r.className}</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">{r.hadir}</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">{r.izin}</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800">{r.sakit}</td>
                            <td className={`px-3 py-3 text-center font-mono border-r border-slate-200 dark:border-slate-800 ${r.alpha > 0 ? 'text-rose-600 font-black' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{r.alpha}</td>
                            <td className="px-3 py-3 text-center font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">{r.total}</td>
                            <td className="px-3 py-3 text-center bg-[#0f2942] text-white font-extrabold border-r border-slate-200 dark:border-slate-800">
                              <span className="font-mono">{pctHadir}%</span>
                            </td>
                            <td className="px-3 py-3 text-center font-extrabold">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                pctAbsen > 15 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                              }`}>
                                {pctAbsen}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RIWAYAT SESI ABSENSI (INPUT / EDIT / DELETE)      */}
      {/* ======================================================== */}
      {activeTab === 'input' && (() => {
        const groupedAttendances = Object.values(
          attendances.reduce((acc, a) => {
            const subjName = a.subjectName || (a as any).subject?.name || subjects.find(s => s.id === a.subjectId)?.name || 'Mapel Umum';
            const key = `${a.date}-${a.classId}-${a.subjectId || 'gen'}`;
            if (!acc[key]) {
              acc[key] = {
                id: key,
                date: a.date,
                classId: a.classId,
                subjectId: a.subjectId || '',
                subjectName: subjName,
                academicYearId: a.academicYearId,
                semesterId: a.semesterId,
                className: (a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId,
                teacherName: (a as any).teacherName || (a as any).teacher?.name || ((a.recordedBy && a.recordedBy.toLowerCase() !== 'pengajar') ? a.recordedBy : 'Admin Akademik'),
                hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, notes: a.notes,
                absentees: []
              };
            }
            if (a.status) {
              acc[key].total++;
              if (a.status === 'Hadir') acc[key].hadir++;
              else if (a.status === 'Izin') { acc[key].izin++; acc[key].absentees.push(`${a.santri?.name || 'Santri'} (I)`); }
              else if (a.status === 'Sakit') { acc[key].sakit++; acc[key].absentees.push(`${a.santri?.name || 'Santri'} (S)`); }
              else if (a.status === 'Alpha') { acc[key].alpha++; acc[key].absentees.push(`${a.santri?.name || 'Santri'} (A)`); }
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Sesi Pertemuan Absensi Santri — {rekapLabel}
              </span>
              <span className="text-xs font-semibold text-slate-500">{groupedAttendances.length} sesi pertemuan</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Memuat data absensi...</div>
            ) : groupedAttendances.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800"/>
                <p className="text-sm font-bold">Belum ada catatan absensi santri untuk periode ini.</p>
                <button
                  onClick={openCreateSession}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + Catat Absensi Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Mata Pelajaran</th>
                      <th className="px-4 py-3">Pengabsen</th>
                      <th className="px-4 py-3 text-center">Hadir</th>
                      <th className="px-4 py-3 text-center">Izin</th>
                      <th className="px-4 py-3 text-center">Sakit</th>
                      <th className="px-4 py-3 text-center">Alpha</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3">Keterangan / Tidak Hadir</th>
                      <th className="px-4 py-3 text-center">Aksi (Edit / Hapus)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {groupedAttendances.map((a: any) => {
                      const classDisplayName = String(a.className).startsWith('Kelas') ? a.className : `Kelas ${a.className}`;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
                            {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                            {classDisplayName}
                          </td>
                          <td className="px-4 py-3 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{a.subjectName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-xs text-slate-700 dark:text-slate-300">
                            {a.teacherName || 'Pengajar'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{a.hadir}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{a.izin}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{a.sakit}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{a.alpha}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{a.total}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs">
                            {a.notes && <div>{a.notes}</div>}
                            {a.absentees.length > 0 && (
                              <div className="text-[10px] text-rose-500 font-semibold">{a.absentees.join(', ')}</div>
                            )}
                            {!a.notes && a.absentees.length === 0 && '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => openEditSession(a)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 transition cursor-pointer"
                                title="Edit Absensi Sesi Ini"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Hapus sesi absensi ${classDisplayName} tanggal ${a.date} (${a.subjectName})?`)) {
                                    setLoading(true);
                                    const recordsToDelete = attendances.filter(rec =>
                                      rec.date === a.date &&
                                      rec.classId === a.classId &&
                                      (rec.subjectId === a.subjectId || !rec.subjectId || !a.subjectId)
                                    );
                                    try {
                                      for (const rec of recordsToDelete) {
                                        await api.deleteSantriAttendance(rec.id);
                                      }
                                      showToast('success', `Sesi absensi tanggal ${a.date} berhasil dihapus.`);
                                      loadData();
                                    } catch (err: any) {
                                      showToast('error', err.message || 'Gagal menghapus');
                                      setLoading(false);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                                title="Hapus Sesi Ini"
                              >
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
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT / CATAT SESI KELAS (CHECKLIST PER SANTRI)  */}
      {/* ======================================================== */}
      {sessionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {sessionModal.isEdit ? 'Edit Absensi Sesi Kelas' : 'Catat Absensi Sesi Kelas'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tentukan kehadiran masing-masing santri (Hadir, Izin, Sakit, atau Alpha).
                </p>
              </div>
              <button
                onClick={() => setSessionModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="flex flex-col flex-1 overflow-hidden space-y-4 pt-3">
              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {modalError}
                </div>
              )}

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Kelas</label>
                  <select
                    value={sessionModal.classId}
                    onChange={e => handleSessionClassChange(e.target.value)}
                    disabled={sessionModal.isEdit}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mata Pelajaran</label>
                  <select
                    value={sessionModal.subjectId}
                    onChange={e => {
                      const sId = e.target.value;
                      const sName = subjects.find(s => s.id === sId)?.name || '';
                      setSessionModal(prev => ({ ...prev, subjectId: sId, subjectName: sName }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        📖 {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Pertemuan</label>
                  <input
                    type="date"
                    value={sessionModal.date}
                    onChange={e => setSessionModal(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Fast Status Bar */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Set Cepat Semua Santri:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetAllSessionStatus('Hadir')}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-black rounded-lg transition"
                  >
                    Semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllSessionStatus('Izin')}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-black rounded-lg transition"
                  >
                    Semua Izin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllSessionStatus('Sakit')}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-black rounded-lg transition"
                  >
                    Semua Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllSessionStatus('Alpha')}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-black rounded-lg transition"
                  >
                    Semua Alpha
                  </button>
                </div>
              </div>

              {/* List of Santri in the Class */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/30">
                {santriList.filter(s => s.classId === sessionModal.classId).map((santri, idx) => {
                  const currentSt = sessionModal.statuses[santri.id] || 'Hadir';
                  return (
                    <div
                      key={santri.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-500">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{santri.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">NIS: {santri.nis || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map(st => {
                          const isActive = currentSt === st;
                          let activeCls = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300';
                          if (isActive) {
                            if (st === 'Hadir') activeCls = 'bg-emerald-600 text-white font-black shadow-xs';
                            else if (st === 'Izin') activeCls = 'bg-blue-600 text-white font-black shadow-xs';
                            else if (st === 'Sakit') activeCls = 'bg-amber-600 text-white font-black shadow-xs';
                            else if (st === 'Alpha') activeCls = 'bg-rose-600 text-white font-black shadow-xs';
                          }

                          return (
                            <button
                              type="button"
                              key={st}
                              onClick={() => {
                                setSessionModal(prev => ({
                                  ...prev,
                                  statuses: { ...prev.statuses, [santri.id]: st }
                                }));
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeCls}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Pertemuan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Bab 4 Tajwid, Ulangan Harian, dsb."
                  value={sessionModal.notes}
                  onChange={e => setSessionModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSessionModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5"/>
                  <span>{modalSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT ABSENSI PER-SANTRI (DARI TAB REKAPITULASI) */}
      {/* ======================================================== */}
      {santriModalOpen && santriToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-indigo-600" />
                  <span>Edit Absensi Santri</span>
                </h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {santriToEdit.santriName} <span className="text-slate-400 font-normal">({santriToEdit.nis}) — {santriToEdit.className}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Periode: <span className="font-bold">{rekapLabel}</span>
                </p>
              </div>
              <button
                onClick={() => setSantriModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveSantriRekap} className="space-y-4">
              {santriModalError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {santriModalError}
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesuaikan langsung jumlah hari hadir, izin, sakit, dan alpha untuk santri ini pada periode terpilih:
              </p>

              {/* Input Angka Kehadiran */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 block mb-1 uppercase tracking-wider">Hadir</label>
                  <input
                    type="number"
                    min={0}
                    value={editHadir}
                    onChange={e => setEditHadir(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-200 bg-white dark:bg-slate-900 text-sm font-mono font-black text-center"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-center">
                  <label className="text-[10px] font-black text-blue-700 dark:text-blue-400 block mb-1 uppercase tracking-wider">Izin</label>
                  <input
                    type="number"
                    min={0}
                    value={editIzin}
                    onChange={e => setEditIzin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 rounded-lg border border-blue-200 bg-white dark:bg-slate-900 text-sm font-mono font-black text-center"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-center">
                  <label className="text-[10px] font-black text-amber-700 dark:text-amber-400 block mb-1 uppercase tracking-wider">Sakit</label>
                  <input
                    type="number"
                    min={0}
                    value={editSakit}
                    onChange={e => setEditSakit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-200 bg-white dark:bg-slate-900 text-sm font-mono font-black text-center"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-center">
                  <label className="text-[10px] font-black text-rose-700 dark:text-rose-400 block mb-1 uppercase tracking-wider">Alpha</label>
                  <input
                    type="number"
                    min={0}
                    value={editAlpha}
                    onChange={e => setEditAlpha(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-200 bg-white dark:bg-slate-900 text-sm font-mono font-black text-center"
                  />
                </div>
              </div>

              {/* Calculated Summary */}
              {(() => {
                const total = editHadir + editIzin + editSakit + editAlpha;
                const pctHadir = total > 0 ? Math.round((editHadir / total) * 100) : 0;
                const pctAbsen = total > 0 ? Math.round(((editIzin + editSakit + editAlpha) / total) * 100) : 0;

                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-bold">Total Hari:</span>{' '}
                      <span className="font-mono font-black text-slate-900 dark:text-white">{total}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">% Hadir:</span>{' '}
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{pctHadir}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">% Absen:</span>{' '}
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400">{pctAbsen}%</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Keterangan / Alasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Penyesuaian izin surat dokter, dll."
                  value={editSantriNotes}
                  onChange={e => setEditSantriNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSantriModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={santriSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{santriSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK MONTHLY SANTRI MODAL */}
      <BulkMonthlySantriModal
        isOpen={showBulkSantriModal}
        onClose={() => setShowBulkSantriModal(false)}
        classes={classes}
        academicYears={academicYears}
        semesters={semesters}
        santriList={santriList}
        onSuccess={() => {
          showToast('success', 'Rekap bulanan santri berhasil disimpan.');
          loadData();
        }}
        defaultClassId={filterClass || classes[0]?.id}
      />
    </div>
  );
}
