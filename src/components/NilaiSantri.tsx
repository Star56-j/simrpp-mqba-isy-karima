import React from 'react';
import { 
  FileSpreadsheet, FileText, CheckCircle, Search, Edit, Save, BookOpen, AlertCircle, Download, Upload, X
} from 'lucide-react';
import { Santri, Nilai, SchoolClass, AcademicYear, Semester, Subject, WaliKelas, TeachingSchedule } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printRapor } from '../utils/printRapor';
import RaporModal from './RaporModal';
import { Printer } from 'lucide-react';

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

  // Mode: 'input' (Guru) atau 'rapor' (Wali Kelas)
  const [mode, setMode] = React.useState<'input' | 'rapor'>('input');

  // Input state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editScore, setEditScore] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');

  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });

  // Rapor modal state
  const [raporModalSantri, setRaporModalSantri] = React.useState<Santri | null>(null);

  // Filter schedules that the current teacher teaches
  const mySchedules = currentUser.role === 'Admin' ? schedules : schedules.filter(s => s.teacherId === currentUser.teacherId);
  // Get unique classes and subjects the teacher teaches
  const myClassIds = Array.from(new Set(mySchedules.map(s => s.classId)));
  const mySubjectIds = Array.from(new Set(mySchedules.map(s => s.subjectId)));
  
  // Classes where current teacher is Wali Kelas
  const myWaliClasses = waliKelasList.filter(w => w.teacherId === currentUser.teacherId && w.academicYearId === filterAY && w.semesterId === filterSem).map(w => w.classId);
  
  const isWaliKelas = currentUser.role === 'Admin' || myWaliClasses.length > 0;
  
  // Available classes for dropdown
  const availableClasses = mode === 'input' 
    ? (currentUser.role === 'Admin' ? classes : classes.filter(c => myClassIds.includes(c.id)))
    : (currentUser.role === 'Admin' ? classes : classes.filter(c => myWaliClasses.includes(c.id)));

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
    setEditScore(n ? n.score.toString() : '');
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
      await api.createNilai({
        santriId,
        subjectId: filterSubject,
        academicYearId: filterAY,
        semesterId: filterSem,
        score: Number(editScore) || 0,
        notes: editNotes,
        teacherId: currentUser.teacherId || currentUser.id
      });
      setMsg({ type: 'success', text: 'Nilai berhasil disimpan.' });
      setEditingId(null);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  };

  const availableSubjects = currentUser.role === 'Admin' 
    ? subjects 
    : subjects.filter(s => mySchedules.some(sch => sch.classId === filterClass && sch.subjectId === s.id));

  React.useEffect(() => {
    if (mode === 'input' && availableSubjects.length > 0 && !availableSubjects.find(s => s.id === filterSubject)) {
      setFilterSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, filterSubject, mode]);

  const handleExport = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';
    
    if (mode === 'input') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const exportData = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
        return {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
          'Nilai': n ? n.score : '-',
          'Catatan': n ? n.notes : '-'
        };
      });
      exportToExcel(exportData, `Nilai_${subj}_${cls}_TA${ay}_${sem}`);
    } else {
      const exportData = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id);
        const avg = santriNilai.length > 0 
          ? Math.round(santriNilai.reduce((a, b) => a + b.score, 0) / santriNilai.length) 
          : 0;
        return {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
          'Rata-rata Nilai': santriNilai.length > 0 ? avg : 'Belum ada nilai'
        };
      });
      exportToExcel(exportData, `Rapor_${cls}_TA${ay}_${sem}`);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await parseExcelFile<any>(file);
      if (data.length === 0) throw new Error("File Excel kosong.");
      
      setSaving(true);
      if (mode === 'input') {
        const nilaiListToSave = data.map(row => {
          const santri = santriList.find(s => s.nis === String(row['NIS']));
          if (!santri) return null;
          return {
            santriId: santri.id,
            subjectId: filterSubject,
            academicYearId: filterAY,
            semesterId: filterSem,
            score: Number(row['Nilai'] || 0),
            notes: row['Catatan'] || ''
          };
        }).filter(Boolean);
        
        await api.createNilaiBulk({ nilaiList: nilaiListToSave });
        setMsg({ type: 'success', text: `Berhasil mengimport ${nilaiListToSave.length} data nilai.` });
      } else {
        const raporListToSave = data.map(row => {
          const santri = santriList.find(s => s.nis === String(row['NIS']));
          if (!santri) return null;
          return {
            santriId: santri.id,
            academicYearId: filterAY,
            semesterId: filterSem,
            catatanWaliKelas: row['Catatan Wali Kelas'] || '',
            keputusanKenaikan: row['Keputusan'] || ''
          };
        }).filter(Boolean);
        
        await api.createRaporDetailBulk({ raporList: raporListToSave });
        setMsg({ type: 'success', text: `Berhasil mengimport ${raporListToSave.length} data rapor.` });
      }
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mengimport file Excel.' });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nilai & Rapor</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Input nilai mata pelajaran dan lihat rapor santri.</p>
        </div>
        
        {/* Toggle Mode & Export */}
        <div className="flex items-center gap-2">
          {isWaliKelas && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setMode('input')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${mode === 'input' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Edit className="w-3.5 h-3.5" /><span>Input Nilai</span>
              </button>
              <button onClick={() => setMode('rapor')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${mode === 'rapor' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <BookOpen className="w-3.5 h-3.5" /><span>Rekap Rapor</span>
              </button>
            </div>
          )}
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
            <Upload className="w-4 h-4" /><span>{mode === 'input' ? 'Import Nilai' : 'Import Rapor'}</span>
          </button>
          <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
            <Download className="w-4 h-4" /><span>Export Excel</span>
          </button>
        </div>
      </div>

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
        {mode === 'input' && (
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
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{msg.text}</span>
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
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                <tr>
                  <th className="px-4 py-3 w-16">No</th>
                  <th className="px-4 py-3 w-32">NIS</th>
                  <th className="px-4 py-3">Nama Santri</th>
                  {mode === 'input' ? (
                    <>
                      <th className="px-4 py-3 text-center w-24">Nilai</th>
                      <th className="px-4 py-3">Catatan / Deskripsi</th>
                      <th className="px-4 py-3 text-center w-24">Aksi</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-center">Rata-rata Nilai</th>
                      <th className="px-4 py-3 text-center w-64">Aksi Rapor</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {santriList.map((santri, idx) => {
                  if (mode === 'input') {
                    const n = nilaiList.find(x => x.santriId === santri.id && x.subjectId === filterSubject);
                    const isEditing = editingId === santri.id;
                    
                    return (
                      <tr key={santri.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs">{santri.nis}</td>
                        <td className="px-4 py-3 font-bold">{santri.name}</td>
                        
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input type="number" min="0" max="100" value={editScore} onChange={e => setEditScore(e.target.value)}
                              className="w-16 px-2 py-1 text-center border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <span className={`font-bold ${n ? (n.score < 75 ? 'text-rose-500' : 'text-teal-600') : 'text-slate-300'}`}>
                              {n ? n.score : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="text" placeholder="Catatan (opsional)" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <span className="text-slate-500 text-xs">{n?.notes || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex space-x-1 justify-center">
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded" disabled={saving}><X className="w-3.5 h-3.5"/></button>
                              <button onClick={() => handleSave(santri.id)} className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded" disabled={saving}><Save className="w-3.5 h-3.5"/></button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(santri.id, n)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {n ? 'Edit' : 'Input'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // RAPOR MODE (Wali Kelas / Admin)
                    const santriNilai = nilaiList.filter(x => x.santriId === santri.id);
                    const avg = santriNilai.length > 0 
                      ? Math.round(santriNilai.reduce((a, b) => a + b.score, 0) / santriNilai.length) 
                      : 0;

                    return (
                      <tr key={santri.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs">{santri.nis}</td>
                        <td className="px-4 py-3 font-bold">{santri.name}</td>
                        <td className="px-4 py-3 text-center">
                          {santriNilai.length > 0 ? (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-black">
                              {avg}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ada nilai</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setRaporModalSantri(santri)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center">
                              <Edit className="w-3.5 h-3.5 mr-1"/> Isi Detail
                            </button>
                            <button onClick={async () => {
                              try {
                                const details = await api.getRaporDetail({ santriId: santri.id, academicYearId: filterAY, semesterId: filterSem });
                                const raporDetail = details.length > 0 ? details[0] : null;
                                const waliName = waliKelasList.find(w => w.classId === filterClass && w.academicYearId === filterAY && w.semesterId === filterSem)?.teacher?.name || currentUser.name || "Wali Kelas";
                                printRapor(
                                  santri,
                                  classes.find(c => c.id === filterClass)!,
                                  academicYears.find(a => a.id === filterAY)!,
                                  semesters.find(s => s.id === filterSem)!,
                                  nilaiList,
                                  subjects,
                                  raporDetail,
                                  waliName
                                );
                              } catch (err) {
                                alert("Gagal memuat detail rapor. Silakan coba lagi.");
                              }
                            }} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-semibold flex items-center">
                              <Printer className="w-3.5 h-3.5 mr-1"/> Cetak
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {raporModalSantri && (
        <RaporModal
          santri={raporModalSantri}
          academicYearId={filterAY}
          semesterId={filterSem}
          onClose={() => setRaporModalSantri(null)}
          onSave={() => {
            setRaporModalSantri(null);
            alert("Data rapor berhasil disimpan.");
          }}
        />
      )}
    </div>
  );
}
