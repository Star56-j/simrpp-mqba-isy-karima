import React from 'react';
import {
  ClipboardList, Plus, Edit, Trash2, X,
  CheckCircle, AlertCircle, BarChart2, Calendar, Users, Download, Upload, User, BookOpen, Printer
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

export default function AttendanceSantriAdmin({ classes, academicYears, semesters, santriList, subjects = [], schedules = [] }: AttendanceSantriAdminProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [activeTab, setActiveTab] = React.useState<'input' | 'rekap'>('input');
  const [rekapSubTab, setRekapSubTab] = React.useState<'kelas' | 'santri'>('kelas');

  // Filter
  const [filterClass, setFilterClass] = React.useState('');
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');
  const [filterYear, setFilterYear] = React.useState(currentYear);
  const [filterMonth, setFilterMonth] = React.useState(currentMonth);
  const [rekapMode, setRekapMode] = React.useState<'bulan' | 'semester' | 'tahun'>('bulan');

  // Data
  const [attendances, setAttendances] = React.useState<SantriAttendance[]>([]);
  const [summary, setSummary] = React.useState<SantriAttendanceSummary[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Form
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [fClass, setFClass] = React.useState('');
  const [fSubjectId, setFSubjectId] = React.useState('');
  const [fDate, setFDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [fHadir, setFHadir] = React.useState(0);
  const [fIzin, setFIzin] = React.useState(0);
  const [fSakit, setFSakit] = React.useState(0);
  const [fAlpha, setFAlpha] = React.useState(0);
  const [fNotes, setFNotes] = React.useState('');
  const [fAY, setFAY] = React.useState(academicYears[0]?.id || '');
  const [fSem, setFSem] = React.useState(semesters[0]?.id || '');
  const [formError, setFormError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [showBulkSantriModal, setShowBulkSantriModal] = React.useState(false);

  // Auto set default subject
  React.useEffect(() => {
    if (fClass && schedules.length > 0) {
      const classScheds = schedules.filter(s => s.classId === fClass);
      if (classScheds.length > 0) {
        setFSubjectId(classScheds[0].subjectId);
        return;
      }
    }
    if (subjects.length > 0 && !fSubjectId) {
      setFSubjectId(subjects[0].id);
    }
  }, [fClass, schedules, subjects]);

  const buildParams = React.useCallback(() => {
    const p: Record<string, string> = { year: filterYear };
    if (filterAY) p.academicYearId = filterAY;
    if (rekapMode === 'bulan') {
      p.month = filterMonth;
    } else if (rekapMode === 'semester') {
      if (filterSem) p.semesterId = filterSem;
    }
    if (filterClass) p.classId = filterClass;
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

  // Calculations for Per-Santri (Individu) Summary Array with % Hadir
  const perSantriSummary = React.useMemo(() => {
    const classSantris = (filterClass ? santriList.filter(s => s.classId === filterClass) : santriList)
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
    
    return classSantris.map(s => {
      const clsObj = classes.find(c => c.id === s.classId);
      const clsName = clsObj ? clsObj.name : s.classId;
      const myAtts = attendances.filter(a => (a as any).santriId === s.id);
      
      let hadir = 0, izin = 0, sakit = 0, alpha = 0;
      if (myAtts.length > 0) {
        hadir = myAtts.filter(a => a.status === 'Hadir').length;
        izin = myAtts.filter(a => a.status === 'Izin').length;
        sakit = myAtts.filter(a => a.status === 'Sakit').length;
        alpha = myAtts.filter(a => a.status === 'Alpha').length;
      } else {
        const classSum = summary.find(sum => sum.classId === s.classId);
        if (classSum) {
          hadir = classSum.hadir;
          izin = classSum.izin;
          sakit = classSum.sakit;
          alpha = classSum.alpha;
        }
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
  }, [santriList, filterClass, classes, attendances, summary]);

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s => s.id === filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  const openForm = (a?: SantriAttendance) => {
    setFormError('');
    if (a) {
      setEditId(a.id);
      setFClass(a.classId);
      if (a.subjectId) setFSubjectId(a.subjectId);
      setFDate(a.date);
      setFHadir(a.jumlahHadir);
      setFIzin(a.jumlahIzin);
      setFSakit(a.jumlahSakit);
      setFAlpha(a.jumlahAlpha);
      setFNotes(a.notes || '');
      setFAY(a.academicYearId);
      setFSem(a.semesterId);
    } else {
      setEditId(null);
      setFClass(classes[0]?.id || '');
      if (subjects.length > 0) setFSubjectId(subjects[0].id);
      setFDate(new Date().toISOString().split('T')[0]);
      setFHadir(0); setFIzin(0); setFSakit(0); setFAlpha(0);
      setFNotes('');
      setFAY(academicYears[0]?.id || '');
      setFSem(semesters[0]?.id || '');
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!fClass || !fDate || !fAY || !fSem) {
      setFormError('Kelas, Tanggal, Tahun Ajaran, dan Semester wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const selectedSubj = subjects.find(s => s.id === fSubjectId);
      const payload = {
        classId: fClass,
        subjectId: fSubjectId,
        subjectName: selectedSubj ? selectedSubj.name : '',
        date: fDate,
        jumlahHadir: fHadir,
        jumlahIzin: fIzin,
        jumlahSakit: fSakit,
        jumlahAlpha: fAlpha,
        jumlahTotal: fHadir + fIzin + fSakit + fAlpha,
        notes: fNotes,
        academicYearId: fAY,
        semesterId: fSem,
      };

      if (editId) {
        await api.updateSantriAttendance(editId, payload);
      } else {
        await api.createSantriAttendance(payload);
      }
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus catatan absensi santri ini?')) return;
    try {
      await api.deleteSantriAttendance(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

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
      exportToExcel(dataToExport, `Absensi_Santri_${rekapLabel.replace(/ /g, '_')}`);
    } else {
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
        const cls = classes.find(c => c.name === clsName || c.id === clsName);
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
          semesterId: filterSem
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      alert(`Berhasil mengimport ${attendancesToSave.length} data absensi santri.`);
      loadData();
    } catch (err: any) {
      alert("Gagal mengimport: " + err.message);
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kelola Absensi Santri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pantau dan input kehadiran santri per kelas & mata pelajaran secara rinci.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={() => setShowBulkSantriModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer">
            <Calendar className="w-4 h-4"/><span>⚡ Input Rekap Bulanan Santri Massal</span>
          </button>
          <button onClick={() => openForm()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer">
            <Plus className="w-4 h-4"/><span>+ Catat Absensi Kelas</span>
          </button>
        </div>
      </div>

      {/* Tabs & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
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
            <span>Rekapitulasi & Persentase</span>
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas</label>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Semua Kelas</option>
              {classes.map(c=><option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: INPUT DATA ABSENSI */}
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
                subjectId: a.subjectId,
                subjectName: subjName,
                className: (a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId,
                teacherName: (a as any).teacherName || (a as any).teacher?.name || ((a.recordedBy && a.recordedBy.toLowerCase() !== 'pengajar') ? a.recordedBy : 'Ust. Aidil Aqli, S.Ag.'),
                hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, notes: a.notes,
                absentees: []
              };
            }
            if (a.status) {
              acc[key].total++;
              if (a.status === 'Hadir') acc[key].hadir++;
              else if (a.status === 'Izin') { acc[key].izin++; acc[key].absentees.push(`${a.santri?.name} (I)`); }
              else if (a.status === 'Sakit') { acc[key].sakit++; acc[key].absentees.push(`${a.santri?.name} (S)`); }
              else if (a.status === 'Alpha') { acc[key].alpha++; acc[key].absentees.push(`${a.santri?.name} (A)`); }
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
                Daftar Absensi Harian Santri — {rekapLabel}
              </span>
              <span className="text-xs font-semibold text-slate-500">{groupedAttendances.length} sesi pertemuan</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Memuat data...</div>
            ) : groupedAttendances.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800"/>
                <p className="text-sm font-medium">Belum ada catatan absensi santri untuk periode ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Mata Pelajaran</th>
                      <th className="px-4 py-3">Pengabsen (Ust/Ustadzah)</th>
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
                    {groupedAttendances.map((a: any) => {
                      const classDisplayName = String(a.className).startsWith('Kelas') ? a.className : `Kelas ${a.className}`;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {new Date(a.date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
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
                          <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{a.hadir}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{a.izin}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{a.sakit}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{a.alpha}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{a.total}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 italic">
                            {a.notes || '-'}
                            {a.absentees.length > 0 && (
                              <div className="mt-1 text-[10px] text-rose-500 font-semibold">{a.absentees.join(', ')}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-1.5">
                              <button onClick={async () => {
                                if (window.confirm('Hapus absensi sesi kelas ini?')) {
                                  const recordsToDelete = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId);
                                  for (const rec of recordsToDelete) {
                                    await api.deleteSantriAttendance(rec.id).catch(() => {});
                                  }
                                  loadData();
                                }
                              }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition" title="Hapus">
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

      {/* TAB 2: REKAPITULASI & PERSENTASE */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hadir', val: summary.reduce((s,r)=>s+r.hadir,0), cls: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
              { label: 'Izin',  val: summary.reduce((s,r)=>s+r.izin,0),  cls: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400' },
              { label: 'Sakit', val: summary.reduce((s,r)=>s+r.sakit,0), cls: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' },
              { label: 'Alpha', val: summary.reduce((s,r)=>s+r.alpha,0), cls: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' },
            ].map(c => (
              <div key={c.label} className={`p-5 rounded-2xl border ${c.cls}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</p>
                <p className="text-3xl font-black mt-1">{c.val}</p>
              </div>
            ))}
          </div>

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

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {rekapSubTab === 'kelas' ? 'Rekap Kehadiran Santri Per-Kelas' : 'Rekapitulasi Kehadiran Individu Santri (% Hadir)'}
              </span>
              <span className="text-xs text-slate-500">Periode: {rekapLabel}</span>
            </div>

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

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {editId ? 'Edit Absensi Santri' : 'Catat Absensi Santri (Per Kelas)'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Kelas</label>
                  <select value={fClass} onChange={e=>setFClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500">
                    {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mata Pelajaran</label>
                  <select value={fSubjectId} onChange={e=>setFSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500">
                    {subjects.map(s => <option key={s.id} value={s.id}>📖 {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal</label>
                <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"/>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-indigo-600 block mb-1">Hadir</label>
                  <input type="number" min={0} value={fHadir} onChange={e=>setFHadir(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs font-bold font-mono text-center"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-600 block mb-1">Izin</label>
                  <input type="number" min={0} value={fIzin} onChange={e=>setFIzin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs font-bold font-mono text-center"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-600 block mb-1">Sakit</label>
                  <input type="number" min={0} value={fSakit} onChange={e=>setFSakit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs font-bold font-mono text-center"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-600 block mb-1">Alpha</label>
                  <input type="number" min={0} value={fAlpha} onChange={e=>setFAlpha(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs font-bold font-mono text-center"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan / Keterangan</label>
                <input type="text" placeholder="Opsional..." value={fNotes} onChange={e=>setFNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"/>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#0f2942] hover:bg-[#1e3a5f] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
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
        onSuccess={() => loadData()}
        defaultClassId={fClass}
      />
    </div>
  );
}
