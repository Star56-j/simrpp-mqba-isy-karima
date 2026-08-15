import React from 'react';
import { 
  FileSpreadsheet, FileText, CheckCircle, Search, Edit, Save, BookOpen, AlertCircle, Download, Upload, X, Printer, Volume2
} from 'lucide-react';
import { Santri, Nilai, SchoolClass, AcademicYear, Semester, Subject, WaliKelas, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printGenericTable } from '../utils/printUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';
import RaporModal from './RaporModal';

import { computeRaporScore } from '../utils/nilaiWeights';

// Helper: hitung Nilai Akhir Rapor berdasarkan bobot resmi
function nilaiAvg(n: Nilai): number {
  return computeRaporScore(n).nilaiAkhirTulis;
}

interface NilaiSantriProps {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  subjects: Subject[];
  schedules: TeachingSchedule[];
  waliKelasList: WaliKelas[];
  currentUser: any;
  onRefresh: () => void;
}

export default function NilaiSantri({ 
  classes, academicYears, semesters, subjects, schedules, waliKelasList, currentUser, onRefresh 
}: NilaiSantriProps) {
  const [santriList, setSantriList] = React.useState<Santri[]>([]);
  const [nilaiList, setNilaiList] = React.useState<Nilai[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [filterAY, setFilterAY] = React.useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = React.useState(semesters[0]?.id || '');
  const [filterClass, setFilterClass] = React.useState('');
  const [filterSubject, setFilterSubject] = React.useState('');

  // Mode: 'input' (Nilai Tulis), 'lisan' (Ujian Lisan Terpisah), atau 'rapor' (Rekap Rapor)
  const [mode, setMode] = React.useState<'input' | 'lisan' | 'rapor'>('input');

  // Input state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editHarian, setEditHarian] = React.useState('');
  const [editBulanan, setEditBulanan] = React.useState('');
  const [editUts, setEditUts] = React.useState('');
  const [editUas, setEditUas] = React.useState('');
  const [editUasLisan, setEditUasLisan] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');

  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });

  // Rapor modal state
  const [raporModalSantri, setRaporModalSantri] = React.useState<Santri | null>(null);

  // Filter schedules yang diajar oleh guru saat ini
  const teacherIds = [currentUser.teacherId, currentUser.id, (currentUser as any).teacher_id].filter(Boolean);
  const mySchedules = currentUser.role === 'Admin' ? schedules : schedules.filter(s => teacherIds.includes(s.teacherId));
  const myClassIds = Array.from(new Set(mySchedules.map(s => s.classId)));
  const mySubjectIds = Array.from(new Set(mySchedules.map(s => s.subjectId)));
  
  // Classes where current teacher is Wali Kelas
  const myWaliClasses = waliKelasList.filter(w => teacherIds.includes(w.teacherId) && w.academicYearId === filterAY && w.semesterId === filterSem).map(w => w.classId);
  
  const isWaliKelas = currentUser.role === 'Admin' || myWaliClasses.length > 0;
  
  // Available classes for dropdown
  const availableClasses = classes;

  React.useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.find(c => c.id === filterClass)) {
      setFilterClass(availableClasses[0].id);
    }
  }, [availableClasses, filterClass, mode]);

  const loadData = React.useCallback(async () => {
    if (!filterClass || !filterAY || !filterSem) return;
    setLoading(true);
    try {
      const [sData, nData] = await Promise.all([
        api.getSantri(filterClass),
        api.getNilai({ classId: filterClass, academicYearId: filterAY, semesterId: filterSem })
      ]);
      setSantriList(sData);
      setNilaiList(nData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterAY, filterSem]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const startEdit = (sId: string, n?: Nilai) => {
    setEditingId(sId);
    setEditHarian(n ? n.harian.toString() : '');
    setEditBulanan(n ? n.bulanan.toString() : '');
    setEditUts(n ? n.uts.toString() : '');
    setEditUas(n ? n.uas.toString() : '');
    setEditUasLisan(n && n.uasLisan ? n.uasLisan.toString() : '');
    setEditNotes(n ? n.notes : '');
    setMsg({ type: '', text: '' });
  };

  const handleSave = async (santriId: string) => {
    if (!filterSubject) {
      setMsg({ type: 'error', text: 'Pilih mata pelajaran terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const existingN = nilaiList.find(x => x.santriId === santriId && x.subjectId === filterSubject);
      const payload = {
        santriId,
        subjectId: filterSubject,
        academicYearId: filterAY,
        semesterId: filterSem,
        harian: Number(editHarian) || (existingN ? existingN.harian : 0),
        bulanan: Number(editBulanan) || (existingN ? existingN.bulanan : 0),
        uts: Number(editUts) || (existingN ? existingN.uts : 0),
        uas: Number(editUas) || (existingN ? existingN.uas : 0),
        uasLisan: Number(editUasLisan) || (existingN ? existingN.uasLisan || 0 : 0),
        notes: editNotes,
        teacherId: currentUser.teacherId || currentUser.id
      };
      
      if (existingN) {
        await api.updateNilai(existingN.id, payload);
      } else {
        await api.createNilai(payload);
      }
      setMsg({ type: 'success', text: 'Nilai berhasil disimpan.' });
      setEditingId(null);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const availableSubjects = (currentUser.role === 'Admin' || myWaliClasses.includes(filterClass)) 
    ? subjects 
    : (mySubjectIds.length > 0 
        ? subjects.filter(s => mySubjectIds.includes(s.id)) 
        : subjects);

  React.useEffect(() => {
    if ((mode === 'input' || mode === 'lisan') && availableSubjects.length > 0 && !availableSubjects.find(s => s.id === filterSubject)) {
      setFilterSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, filterSubject, mode]);

  const handleExport = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';
    
    if (mode === 'input' || mode === 'lisan') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const exportData = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
        if (mode === 'lisan') {
          return {
            'No': idx + 1,
            'NIS': santri.nis,
            'Nama Santri': santri.name,
            'UAS Lisan': n?.uasLisan || 0,
            'Catatan': n?.notes || '-'
          };
        }
        return {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
          'Harian': n?.harian || 0,
          'Bulanan': n?.bulanan || 0,
          'UTS (Mid)': n?.uts || 0,
          'UAS Tulis': n?.uas || 0,
          'Nilai Akhir Rapor': n ? nilaiAvg(n) : 0,
          'Catatan': n?.notes || '-'
        };
      });
      exportToExcel(exportData, `Nilai_${mode === 'lisan' ? 'Lisan_' : ''}${subj}_${cls}_TA${ay}_${sem}`);
    } else {
      const exportData = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id);
        const row: any = {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
        };
        let total = 0;
        subjects.forEach(sub => {
          const n = santriNilai.find(x => x.subjectId === sub.id);
          const score = n ? nilaiAvg(n) : 0;
          row[sub.name] = score;
          total += score;
        });
        row['Rata-rata'] = subjects.length > 0 ? (total / subjects.length).toFixed(1) : 0;
        return row;
      });
      exportToExcel(exportData, `Rekap_Rapor_${cls}_TA${ay}_${sem}`);
    }
  };

  const handlePrint = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';
    
    if (mode === 'input' || mode === 'lisan') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const columns = mode === 'lisan'
        ? ['No', 'NIS', 'Nama Santri', 'UAS Lisan', 'Catatan']
        : ['No', 'NIS', 'Nama Santri', 'Harian', 'Bulanan', 'UTS (Mid)', 'UAS Tulis', 'Nilai Akhir', 'Catatan'];
      const data = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
        if (mode === 'lisan') {
          return [idx + 1, santri.nis, santri.name, n?.uasLisan || '-', n?.notes || '-'];
        }
        return [idx + 1, santri.nis, santri.name, n?.harian || '-', n?.bulanan || '-', n?.uts || '-', n?.uas || '-', n ? nilaiAvg(n) : '-', n?.notes || '-'];
      });
      printGenericTable(`Daftar Nilai ${mode === 'lisan' ? 'Ujian Lisan' : 'Tulis'} - ${subj}`, `Kelas: ${cls} | TA: ${ay} | Semester: ${sem}`, columns, data);
    } else {
      const columns = ['No', 'NIS', 'Nama Santri', ...subjects.map(s => s.name), 'Nilai Akhir'];
      const data = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id);
        let total = 0;
        const scores = subjects.map(sub => {
          const n = santriNilai.find(x => x.subjectId === sub.id);
          const score = n ? nilaiAvg(n) : 0;
          total += score;
          return score > 0 ? score : '-';
        });
        const finalAvg = subjects.length > 0 ? (total / subjects.length).toFixed(1) : '-';
        return [idx + 1, santri.nis, santri.name, ...scores, finalAvg];
      });
      printGenericTable(`Rekap Rapor Kelas ${cls}`, `TA: ${ay} | Semester: ${sem}`, columns, data);
    }
  };

  const handleWhatsApp = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';
    const subj = subjects.find(s => s.id === filterSubject)?.name || '';

    let text = `*REKAP NILAI ${mode === 'lisan' ? 'UJIAN LISAN' : 'TULIS'} MQBA ISY KARIMA*\n`;
    text += `Mata Pelajaran: ${subj}\nKelas: ${cls}\nTA: ${ay} | ${sem}\n\n`;

    santriList.forEach((santri, idx) => {
      const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
      if (mode === 'lisan') {
        text += `${idx + 1}. ${santri.name}: Lisan = ${n?.uasLisan || '-'}\n`;
      } else {
        text += `${idx + 1}. ${santri.name}: Harian=${n?.harian||0}, Bulanan=${n?.bulanan||0}, UTS=${n?.uts||0}, UAS=${n?.uas||0} -> Nilai Akhir=${n ? nilaiAvg(n) : '-'}\n`;
      }
    });

    shareToWhatsApp(text);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !filterSubject) return;
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) return;

      let count = 0;
      for (const row of parsed) {
        const nis = row['NIS'] || row['nis'];
        const santri = santriList.find(s => s.nis === String(nis));
        if (santri) {
          const existingN = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
          const payload = {
            santriId: santri.id,
            subjectId: filterSubject,
            academicYearId: filterAY,
            semesterId: filterSem,
            harian: Number(row['Harian'] || row['harian']) || 0,
            bulanan: Number(row['Bulanan'] || row['bulanan']) || 0,
            uts: Number(row['UTS'] || row['uts'] || row['UTS (Mid)']) || 0,
            uas: Number(row['UAS Tulis'] || row['uas'] || row['UAS']) || 0,
            uasLisan: Number(row['UAS Lisan'] || row['lisan']) || 0,
            notes: row['Catatan'] || row['catatan'] || '',
            teacherId: currentUser.teacherId || currentUser.id
          };
          if (existingN) {
            await api.updateNilai(existingN.id, payload);
          } else {
            await api.createNilai(payload);
          }
          count++;
        }
      }
      setMsg({ type: 'success', text: `Berhasil mengimpor ${count} data nilai.` });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mengimpor file.' });
    }
  };

  const scoreColor = (v: number) => {
    if (v === 0) return 'text-slate-300';
    if (v < 60) return 'text-rose-500';
    if (v < 75) return 'text-amber-500';
    return 'text-teal-600 dark:text-teal-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nilai & Rapor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Input nilai ujian tulis, ujian lisan terpisah, dan kelola rekap rapor santri.</p>
        </div>
        
        {/* Toggle Mode & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setMode('input')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${mode === 'input' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Edit className="w-3.5 h-3.5" /><span>Input Nilai Tulis</span>
            </button>
            <button onClick={() => setMode('lisan')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${mode === 'lisan' ? 'bg-white dark:bg-slate-700 text-fuchsia-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Volume2 className="w-3.5 h-3.5" /><span>Ujian Lisan (Terpisah)</span>
            </button>
            {isWaliKelas && (
              <button onClick={() => setMode('rapor')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${mode === 'rapor' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <BookOpen className="w-3.5 h-3.5" /><span>Rekap Rapor</span>
              </button>
            )}
          </div>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 cursor-pointer">
            <Upload className="w-4 h-4" /><span>{mode === 'rapor' ? 'Import Rapor' : 'Import Nilai'}</span>
          </button>
        </div>
      </div>

      <ExportBar 
        onExportExcel={handleExport}
        onPrint={handlePrint}
        onWhatsApp={handleWhatsApp}
        itemName={mode === 'rapor' ? 'Data Rapor' : mode === 'lisan' ? 'Nilai Lisan' : 'Nilai Tulis'}
      />

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            {availableClasses.length === 0 && <option value="" disabled>-- Tidak ada kelas --</option>}
          </select>
        </div>
        {(mode === 'input' || mode === 'lisan') && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {availableSubjects.length === 0 && <option value="" disabled>-- Tidak ada mapel --</option>}
            </select>
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Legend & Info Banner */}
      {mode === 'input' && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /><span>Harian</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span>Bulanan</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /><span>UTS (Mid)</span></span>
            <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>UAS Tulis (60%)</span></span>
          </div>
          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-extrabold normal-case bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            📌 Rumus Rapor: 30% Akhlaq + 10% Absensi + 10% Mid/Harian + 60% UAS Tulis
          </div>
        </div>
      )}

      {mode === 'lisan' && (
        <div className="bg-fuchsia-50 dark:bg-fuchsia-950/30 border border-fuchsia-200 dark:border-fuchsia-900/40 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-xl text-fuchsia-700 dark:text-fuchsia-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-fuchsia-900 dark:text-fuchsia-200 uppercase tracking-wider">Penilaian Ujian Lisan Terpisah</h4>
              <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300 mt-0.5">Form ini khusus untuk mata pelajaran yang memiliki skema Ujian Lisan (Misal: Al-Qur'an, Bahasa Arab, Hadits, Tahfizh). Nilai lisan ini tidak mempengaruhi nilai ujian tulis.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : santriList.length === 0 ? (
          <div className="p-16 text-center text-slate-400">Belum ada santri di kelas ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              {mode === 'input' && (
                <>
                  <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th colSpan={3} className="px-4 py-2 text-center bg-slate-200/50 dark:bg-slate-800/80 border-r border-slate-300 dark:border-slate-700">
                        Identitas Santri
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-r border-teal-200 dark:border-teal-800/60">
                        1️⃣ Ujian Proses (10%)
                      </th>
                      <th colSpan={1} className="px-3 py-2 text-center bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-r border-rose-200 dark:border-rose-800/60">
                        2️⃣ Ujian Semester (60%)
                      </th>
                      <th colSpan={1} className="px-3 py-2 text-center bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-r border-indigo-300 dark:border-indigo-700 font-black">
                        Nilai Akhir Rapor
                      </th>
                      <th colSpan={2} className="px-3 py-2 text-center bg-slate-200/50 dark:bg-slate-800/80">
                        Lainnya
                      </th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900/80">
                      <th className="px-4 py-2.5 w-12">No</th>
                      <th className="px-4 py-2.5 w-24">NIS</th>
                      <th className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">Nama Santri</th>
                      <th className="px-3 py-2.5 text-center w-20">Harian</th>
                      <th className="px-3 py-2.5 text-center w-20">Bulanan</th>
                      <th className="px-3 py-2.5 text-center w-20 border-r border-slate-200 dark:border-slate-700">UTS (Mid)</th>
                      <th className="px-3 py-2.5 text-center w-24 border-r border-slate-200 dark:border-slate-700">UAS Tulis</th>
                      <th className="px-3 py-2.5 text-center w-28 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-r border-indigo-200 dark:border-indigo-800 font-black">
                        Nilai Akhir
                      </th>
                      <th className="px-3 py-2.5">Catatan</th>
                      <th className="px-3 py-2.5 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {santriList.map((santri, idx) => {
                      const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
                      const isEditing = editingId === santri.id;
                      const avg = n ? nilaiAvg(n) : 0;
                      
                      return (
                        <tr key={santri.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs">{santri.nis}</td>
                          <td className="px-4 py-3 font-bold border-r border-slate-200 dark:border-slate-800">{santri.name}</td>
                          
                          {/* Harian */}
                          <td className="px-3 py-3 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editHarian} onChange={e => setEditHarian(e.target.value)}
                                placeholder="0" className="w-14 px-1.5 py-1 text-center border border-indigo-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            ) : (
                              <span className={`font-bold text-xs ${n ? scoreColor(n.harian) : 'text-slate-300'}`}>
                                {n && n.harian > 0 ? n.harian : '-'}
                              </span>
                            )}
                          </td>
                          {/* Bulanan */}
                          <td className="px-3 py-3 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editBulanan} onChange={e => setEditBulanan(e.target.value)}
                                placeholder="0" className="w-14 px-1.5 py-1 text-center border border-amber-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            ) : (
                              <span className={`font-bold text-xs ${n ? scoreColor(n.bulanan) : 'text-slate-300'}`}>
                                {n && n.bulanan > 0 ? n.bulanan : '-'}
                              </span>
                            )}
                          </td>
                          {/* UTS */}
                          <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUts} onChange={e => setEditUts(e.target.value)}
                                placeholder="0" className="w-14 px-1.5 py-1 text-center border border-teal-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            ) : (
                              <span className={`font-bold text-xs ${n ? scoreColor(n.uts) : 'text-slate-300'}`}>
                                {n && n.uts > 0 ? n.uts : '-'}
                              </span>
                            )}
                          </td>
                          {/* UAS Tulis */}
                          <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUas} onChange={e => setEditUas(e.target.value)}
                                placeholder="0" className="w-14 px-1.5 py-1 text-center border border-rose-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-rose-500" />
                            ) : (
                              <span className={`font-bold text-xs ${n ? scoreColor(n.uas) : 'text-slate-300'}`}>
                                {n && n.uas > 0 ? n.uas : '-'}
                              </span>
                            )}
                          </td>
                          {/* Nilai Akhir Rapor */}
                          <td className="px-3 py-3 text-center bg-indigo-50/60 dark:bg-indigo-950/30 border-r border-indigo-200 dark:border-indigo-800">
                            {!isEditing && n ? (
                              <span className={`font-black text-sm ${scoreColor(avg)}`}>{avg > 0 ? avg : '-'}</span>
                            ) : isEditing ? (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold italic">Auto</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          {/* Catatan */}
                          <td className="px-3 py-3">
                            {isEditing ? (
                              <input type="text" placeholder="Catatan (opsional)" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                className="w-full px-2 py-1 border border-indigo-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            ) : (
                              <span className="text-slate-500 text-xs">{n?.notes || '-'}</span>
                            )}
                          </td>
                          {/* Aksi */}
                          <td className="px-3 py-3 text-center">
                            {isEditing ? (
                              <div className="flex space-x-1 justify-center">
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded cursor-pointer" disabled={saving}><X className="w-3.5 h-3.5"/></button>
                                <button onClick={() => handleSave(santri.id)} className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer" disabled={saving}><Save className="w-3.5 h-3.5"/></button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(santri.id, n)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                                {n ? 'Edit' : 'Input'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {mode === 'lisan' && (
                <>
                  <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-fuchsia-100/80 dark:bg-fuchsia-950/60 text-fuchsia-900 dark:text-fuchsia-200 border-b border-fuchsia-200 dark:border-fuchsia-800">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3 w-24">NIS</th>
                      <th className="px-4 py-3">Nama Santri</th>
                      <th className="px-4 py-3 text-center w-48 font-black">Nilai Ujian Lisan (0 - 100)</th>
                      <th className="px-4 py-3">Catatan / Evaluasi Lisan</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fuchsia-50 dark:divide-slate-800">
                    {santriList.map((santri, idx) => {
                      const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
                      const isEditing = editingId === santri.id;

                      return (
                        <tr key={santri.id} className="hover:bg-fuchsia-50/40 dark:hover:bg-fuchsia-950/20 transition-colors">
                          <td className="px-4 py-3 text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs">{santri.nis}</td>
                          <td className="px-4 py-3 font-bold">{santri.name}</td>
                          <td className="px-4 py-3 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUasLisan} onChange={e => setEditUasLisan(e.target.value)}
                                placeholder="0 - 100" className="w-24 px-2 py-1 text-center font-extrabold text-sm border-2 border-fuchsia-400 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                            ) : (
                              <span className={`font-black text-sm px-3 py-1 rounded-full ${n && n.uasLisan && n.uasLisan > 0 ? 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-300 border border-fuchsia-300' : 'text-slate-300'}`}>
                                {n && n.uasLisan && n.uasLisan > 0 ? `${n.uasLisan} / 100` : '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input type="text" placeholder="Catatan lisan (misal: Kelancaran tajwid memuaskan)" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                className="w-full px-3 py-1 border border-fuchsia-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                            ) : (
                              <span className="text-slate-500 text-xs">{n?.notes || '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isEditing ? (
                              <div className="flex space-x-1 justify-center">
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer" disabled={saving}><X className="w-4 h-4"/></button>
                                <button onClick={() => handleSave(santri.id)} className="p-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-bold shadow-xs cursor-pointer" disabled={saving}><Save className="w-4 h-4"/></button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(santri.id, n)} className="px-3.5 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/60 dark:text-fuchsia-300 rounded-xl text-xs font-extrabold border border-fuchsia-200 transition cursor-pointer">
                                {n && n.uasLisan ? 'Edit Lisan' : 'Input Lisan'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {mode === 'rapor' && (
                <>
                  <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 w-12">No</th>
                      <th className="px-4 py-3 w-24">NIS</th>
                      <th className="px-4 py-3">Nama Santri</th>
                      <th className="px-4 py-3 text-center text-indigo-700 dark:text-indigo-300 font-black">Nilai Akhir Rapor</th>
                      <th className="px-4 py-3 text-center w-64">Aksi Rapor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {santriList.map((santri, idx) => {
                      const santriNilai = nilaiList.filter(x => x.santriId === santri.id);
                      let totalScore = 0;
                      let subjectCount = 0;

                      subjects.forEach(sub => {
                        const n = santriNilai.find(x => x.subjectId === sub.id);
                        if (n) {
                          const avg = nilaiAvg(n);
                          if (avg > 0) {
                            totalScore += avg;
                            subjectCount++;
                          }
                        }
                      });

                      const finalRaporAvg = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;

                      return (
                        <tr key={santri.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs">{santri.nis}</td>
                          <td className="px-4 py-3 font-bold">{santri.name}</td>
                          <td className="px-4 py-3 text-center font-black text-indigo-700 dark:text-indigo-300 text-sm">
                            {finalRaporAvg > 0 ? (
                              <span className={`px-2.5 py-1 rounded-full ${scoreColor(finalRaporAvg)}`}>
                                {finalRaporAvg}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setRaporModalSantri(santri)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-300 rounded-xl text-xs font-extrabold border border-teal-200 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Cetak Rapor Santri</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Rapor Modal */}
      {raporModalSantri && (
        <RaporModal
          santri={raporModalSantri}
          academicYear={academicYears.find(y => y.id === filterAY)}
          semester={semesters.find(s => s.id === filterSem)}
          schoolClass={classes.find(c => c.id === filterClass)}
          subjects={subjects}
          nilaiList={nilaiList.filter(n => n.santriId === raporModalSantri.id)}
          waliKelasName={currentUser.name}
          onClose={() => setRaporModalSantri(null)}
        />
      )}
    </div>
  );
}
