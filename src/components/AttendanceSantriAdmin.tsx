import React from 'react';
import {
  ClipboardList, Plus, Edit, Trash2, X,
  CheckCircle, AlertCircle, BarChart2, Calendar, Users, Download, Upload
} from 'lucide-react';
import { Santri, SantriAttendance, SantriAttendanceSummary, SchoolClass, AcademicYear, Semester } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printGenericTable } from '../utils/printUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';
import BulkMonthlySantriModal from './BulkMonthlySantriModal';

interface AttendanceSantriAdminProps {
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  santriList: Santri[];
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export default function AttendanceSantriAdmin({ classes, academicYears, semesters, santriList }: AttendanceSantriAdminProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [activeTab, setActiveTab] = React.useState<'input' | 'rekap'>('input');

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
  const [fDate, setFDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [fHadir, setFHadir] = React.useState(0);
  const [fIzin, setFIzin] = React.useState(0);
  const [fSakit, setFSakit] = React.useState(0);
  const [fAlpha, setFAlpha] = React.useState(0);
  const [fNotes, setFNotes] = React.useState('');
  const [fAY, setFAY] = React.useState(academicYears[0]?.id || '');
  const [fSem, setFSem] = React.useState(semesters[0]?.id || '');
  const [formError, setFormError] = React.useState('');
  const [formSuccess, setFormSuccess] = React.useState('');
  const [santriStatuses, setSantriStatuses] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  // Delete
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showBulkSantriModal, setShowBulkSantriModal] = React.useState(false);

  // Initialize santri statuses when class changes
  React.useEffect(() => {
    if (fClass) {
      const initial: Record<string, string> = {};
      santriList.filter(s => s.classId === fClass).forEach(s => {
        initial[s.id] = 'Hadir';
      });
      setSantriStatuses(initial);
    }
  }, [fClass, santriList]);

  const loadAttendances = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem };
      if (filterClass) params.classId = filterClass;
      if (rekapMode === 'bulan') { params.year = filterYear; params.month = filterMonth; }
      else { params.year = filterYear; }
      const data = await api.getSantriAttendances(params);
      setAttendances(data);
    } catch { setAttendances([]); } finally { setLoading(false); }
  }, [filterClass, filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  const loadSummary = React.useCallback(async () => {
    try {
      const params: Record<string, string> = { academicYearId: filterAY, semesterId: filterSem };
      if (rekapMode === 'bulan') { params.year = filterYear; params.month = filterMonth; }
      else { params.year = filterYear; }
      const data = await api.getSantriAttendanceSummary(params);
      setSummary(data);
    } catch { setSummary([]); }
  }, [filterAY, filterSem, filterYear, filterMonth, rekapMode]);

  React.useEffect(() => { loadAttendances(); loadSummary(); }, [loadAttendances, loadSummary]);

  const handleExport = () => {
    const ayName = academicYears.find(a => a.id === filterAY)?.name || '';
    const semName = semesters.find(s => s.id === filterSem)?.name || '';
    
    if (activeTab === 'input') {
      const dataToExport = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': new Date(a.date).toLocaleDateString('id-ID'),
        'Kelas': classes.find(c => c.id === a.classId)?.name || a.classId,
        'Hadir': a.jumlahHadir,
        'Izin': a.jumlahIzin,
        'Sakit': a.jumlahSakit,
        'Alpha': a.jumlahAlpha,
        'Total': a.jumlahTotal,
        'Keterangan': a.notes || '-'
      }));
      exportToExcel(dataToExport, `Absensi_Santri_${ayName}_${semName}`);
    } else {
      const dataToExport = summary.map((s, idx) => ({
        'No': idx + 1,
        'Kelas': classes.find(c => c.id === s.classId)?.name || s.classId,
        'Total Pertemuan': s.total,
        'Rata-rata Hadir': Math.round(s.hadir / (s.total || 1)),
        'Rata-rata Izin': Math.round(s.izin / (s.total || 1)),
        'Rata-rata Sakit': Math.round(s.sakit / (s.total || 1)),
        'Rata-rata Alpha': Math.round(s.alpha / (s.total || 1))
      }));
      exportToExcel(dataToExport, `Rekap_Absensi_Santri_${ayName}_${semName}`);
    }
  };

  const handlePrint = () => {
    const title = activeTab === 'input' ? 'Data Absensi Santri' : 'Rekap Absensi Santri';
    const subtitle = `Periode: ${rekapLabel}`;
    if (activeTab === 'input') {
      const headers = ['No', 'Tanggal', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total', 'Keterangan'];
      const dataRows = attendances.map((a, idx) => [
        idx + 1, new Date(a.date).toLocaleDateString('id-ID'), classes.find(c => c.id === a.classId)?.name || a.classId, a.jumlahHadir, a.jumlahIzin, a.jumlahSakit, a.jumlahAlpha, a.jumlahTotal, a.notes || '-'
      ]);
      printGenericTable(title, subtitle, headers, dataRows);
    } else {
      const headers = ['No', 'Kelas', 'Total Pertemuan', 'Rata-rata Hadir', 'Rata-rata Izin', 'Rata-rata Sakit', 'Rata-rata Alpha'];
      const dataRows = summary.map((s, idx) => [
        idx + 1, classes.find(c => c.id === s.classId)?.name || s.classId, s.total, Math.round(s.hadir / (s.total || 1)), Math.round(s.izin / (s.total || 1)), Math.round(s.sakit / (s.total || 1)), Math.round(s.alpha / (s.total || 1))
      ]);
      printGenericTable(title, subtitle, headers, dataRows);
    }
  };

  const handleWhatsApp = () => {
    const title = activeTab === 'input' ? 'Data Absensi Santri' : 'Rekap Absensi Santri';
    const subtitle = `Periode: ${rekapLabel}`;
    let text = `*${subtitle}*\n\n`;
    
    if (activeTab === 'input') {
      text += attendances.slice(0, 50).map(a => `- ${new Date(a.date).toLocaleDateString('id-ID')} | Kelas ${classes.find(c => c.id === a.classId)?.name || a.classId} | H:${a.jumlahHadir} I:${a.jumlahIzin} S:${a.jumlahSakit} A:${a.jumlahAlpha}`).join('\n');
      if (attendances.length > 50) text += `\n...dan ${attendances.length - 50} data lainnya.`;
    } else {
      text += summary.map(s => `- Kelas ${classes.find(c => c.id === s.classId)?.name || s.classId}: Hadir rata-rata ${Math.round(s.hadir / (s.total || 1))}`).join('\n');
    }
    shareToWhatsApp(title, text);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile<any>(file);
      if (data.length === 0) throw new Error("File kosong");
      const attendancesToSave = data.map(row => {
        const clsName = String(row['Kelas']).replace('Kelas ', '');
        const cls = classes.find(c => c.name === clsName || c.id === clsName);
        if (!cls) return null;
        return {
          santriId: 'import', // we only have class level for this UI actually wait
          classId: cls.id,
          date: row['Tanggal'] || new Date().toISOString().split('T')[0],
          status: 'Hadir',
          jumlahHadir: Number(row['Hadir'] || 0),
          jumlahIzin: Number(row['Izin'] || 0),
          jumlahSakit: Number(row['Sakit'] || 0),
          jumlahAlpha: Number(row['Alpha'] || 0),
          jumlahTotal: Number(row['Total'] || 0),
          notes: row['Keterangan'] || ''
        };
      }).filter(Boolean);
      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      alert(`Berhasil mengimport data absensi`);
      loadAttendances(); loadSummary();
    } catch (err: any) {
      alert("Gagal mengimport: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setEditId(null); setFClass(''); setFDate(new Date().toISOString().split('T')[0]);
    setFHadir(0); setFIzin(0); setFSakit(0); setFAlpha(0); setFNotes('');
    setFAY(academicYears[0]?.id || ''); setFSem(semesters[0]?.id || '');
    setFormError(''); setFormSuccess('');
  };

  const openEdit = (a: SantriAttendance) => {
    setEditId(a.id); setFClass(a.classId); setFDate(a.date);
    setFHadir(a.jumlahHadir); setFIzin(a.jumlahIzin); setFSakit(a.jumlahSakit); setFAlpha(a.jumlahAlpha);
    setFNotes(a.notes); setFAY(a.academicYearId); setFSem(a.semesterId);
    setFormError(''); setFormSuccess(''); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fClass || !fDate || !fAY || !fSem) { setFormError('Semua field wajib diisi.'); return; }
    
    const classSantris = santriList.filter(s => s.classId === fClass);
    if (classSantris.length === 0) { setFormError('Tidak ada santri di kelas ini.'); return; }
    
    setSubmitting(true);
    try {
      if (editId) {
        setFormError('Edit riwayat absensi santri format lama tidak didukung. Silakan hapus & input baru.');
        setSubmitting(false);
        return;
      }

      const attendancesToSave = classSantris.map(santri => ({
        classId: fClass,
        date: fDate,
        santriId: santri.id,
        status: santriStatuses[santri.id] || 'Hadir',
        jumlahHadir: 0, jumlahIzin: 0, jumlahSakit: 0, jumlahAlpha: 0, jumlahTotal: 1,
        notes: fNotes,
        academicYearId: fAY,
        semesterId: fSem
      }));

      await api.createSantriAttendanceBulk({ attendances: attendancesToSave });
      setFormSuccess('Absensi santri berhasil dicatat.');
      
      setTimeout(() => { setShowForm(false); resetForm(); loadAttendances(); loadSummary(); }, 900);
    } catch (err: any) { 
      setFormError(err.message || 'Gagal menyimpan.'); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try { await api.deleteSantriAttendance(deleteId); setDeleteId(null); loadAttendances(); loadSummary(); }
    catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  const rekapLabel = rekapMode === 'bulan'
    ? `${MONTHS[parseInt(filterMonth)-1]} ${filterYear}`
    : rekapMode === 'semester'
    ? `Semester ${semesters.find(s=>s.id===filterSem)?.name || ''} ${filterYear}`
    : `Tahun ${filterYear}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Absensi Santri</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Catat dan pantau kehadiran santri per kelas MQBA Isy Karima.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition">
            <Plus className="w-4 h-4"/><span>Catat Harian</span>
          </button>
          <button onClick={() => setShowBulkSantriModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition">
            <Calendar className="w-4 h-4"/><span>⚡ Input Rekap Bulanan Santri Massal</span>
          </button>
        </div>
      </div>

      {/* Toggle View & Export */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setActiveTab('input')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${activeTab === 'input' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Edit className="w-3.5 h-3.5" /><span>Data Harian</span>
          </button>
          <button onClick={() => setActiveTab('rekap')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${activeTab === 'rekap' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <BarChart2 className="w-3.5 h-3.5" /><span>Rekapitulasi</span>
          </button>
        </div>
        
        {activeTab === 'input' && (
          <div className="flex items-center space-x-2">
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
              <Upload className="w-4 h-4" /><span>Import</span>
            </button>
          </div>
        )}
      </div>

      <ExportBar 
        onExportExcel={handleExport}
        onPrint={handlePrint}
        onWhatsApp={handleWhatsApp}
        itemName={activeTab === 'input' ? 'Data Absensi Santri' : 'Rekap Absensi Santri'}
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e=>setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {academicYears.map(y=><option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e=>setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1 min-w-[100px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rentang</label>
          <select value={rekapMode} onChange={e=>setRekapMode(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="bulan">Per Bulan</option>
            <option value="semester">Per Semester</option>
            <option value="tahun">Per Tahun</option>
          </select>
        </div>
        {rekapMode === 'bulan' && (
          <div className="space-y-1 min-w-[130px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan</label>
            <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1 min-w-[80px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun</label>
          <input type="number" value={filterYear} onChange={e=>setFilterYear(e.target.value)} min={2020} max={2035}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        {activeTab === 'input' && (
          <div className="space-y-1 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Kelas</label>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Semua Kelas</option>
              {classes.map(c=><option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* TAB: DATA ABSENSI */}
      {activeTab === 'input' && (() => {
        // Group by date and class
        const groupedAttendances = Object.values(
          attendances.reduce((acc, a) => {
            const key = `${a.date}-${a.classId}`;
            if (!acc[key]) {
              acc[key] = {
                id: key,
                date: a.date,
                classId: a.classId,
                className: (a as any).class?.name || classes.find(c => c.id === a.classId)?.name || a.classId,
                teacherName: (a as any).teacher?.name || a.recordedBy || 'Pengajar',
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
              // Legacy format support
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
              Daftar Absensi Santri — {rekapLabel}
            </span>
            <span className="text-xs text-slate-400">{groupedAttendances.length} sesi pertemuan</span>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : groupedAttendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200 dark:text-slate-800"/>
              <p className="text-sm font-medium">Belum ada data absensi santri untuk periode ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kelas</th>
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
                      <td className="px-4 py-3 font-semibold text-xs text-indigo-700 dark:text-indigo-300">
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
                        <div className="flex justify-center space-x-1.5">
                          <button onClick={() => alert('Edit massal dinonaktifkan sementara. Silakan hapus & buat ulang.')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition disabled:opacity-50" title="Edit">
                            <Edit className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={async () => {
                            if (window.confirm('Hapus seluruh absensi kelas ini pada tanggal tersebut?')) {
                              setLoading(true);
                              const recordsToDelete = attendances.filter(rec => rec.date === a.date && rec.classId === a.classId);
                              try {
                                for (const rec of recordsToDelete) await api.deleteSantriAttendance(rec.id);
                                loadAttendances(); loadSummary();
                              } catch(e){ alert('Gagal menghapus'); } finally { setLoading(false); }
                            }
                          }}
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
        );
      })()}

      {/* TAB: REKAP */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {summary.length > 0 && (() => {
            const totHadir = summary.reduce((s,r)=>s+r.hadir,0);
            const totIzin  = summary.reduce((s,r)=>s+r.izin,0);
            const totSakit = summary.reduce((s,r)=>s+r.sakit,0);
            const totAlpha = summary.reduce((s,r)=>s+r.alpha,0);
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

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Rekap Per Kelas — {rekapLabel}
              </span>
            </div>
            {summary.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">Belum ada data untuk periode ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3 text-center">Hadir</th>
                      <th className="px-4 py-3 text-center">Izin</th>
                      <th className="px-4 py-3 text-center">Sakit</th>
                      <th className="px-4 py-3 text-center">Alpha</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                    {summary.map(r => (
                      <tr key={r.classId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">Kelas {r.className}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{r.hadir}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">{r.izin}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">{r.sakit}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{r.alpha}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">{r.total}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{width:`${r.rataHadir}%`}}/>
                            </div>
                            <span className={`text-xs font-extrabold ${r.rataHadir>=80?'text-indigo-600':r.rataHadir>=60?'text-amber-600':'text-rose-600'}`}>
                              {r.rataHadir}%
                            </span>
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

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                {editId ? 'Edit Absensi Santri' : 'Catat Absensi Santri Baru'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{formError}</span></div>}
            {formSuccess && <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs flex items-center space-x-2"><CheckCircle className="w-4 h-4"/><span>{formSuccess}</span></div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas</label>
                <select required value={fClass} onChange={e=>setFClass(e.target.value)} disabled={!!editId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 dark:disabled:bg-slate-800">
                  <option value="" disabled>Pilih kelas...</option>
                  {classes.map(c=><option key={c.id} value={c.id}>Kelas {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tanggal</label>
                  <input type="date" required value={fDate} onChange={e=>setFDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>
              
              {/* Daftar Santri */}
              <div className="space-y-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Daftar Santri Kelas {classes.find(c => c.id === fClass)?.name}</label>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-bold">Total: {santriList.filter(s => s.classId === fClass).length} Santri</span>
                </div>
                
                {!fClass ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500">Pilih kelas terlebih dahulu.</p>
                  </div>
                ) : santriList.filter(s => s.classId === fClass).length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500">Tidak ada santri di kelas ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider">No</th>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider">Nama Santri</th>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider text-center">Hadir</th>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider text-center">Izin</th>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider text-center">Sakit</th>
                          <th className="px-3 py-2 font-bold uppercase tracking-wider text-center">Alpha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {santriList.filter(s => s.classId === fClass).map((santri, idx) => (
                          <tr key={santri.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{santri.name}</td>
                            {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(status => (
                              <td key={status} className="px-3 py-2 text-center">
                                <input 
                                  type="radio" 
                                  name={`status-${santri.id}`}
                                  checked={santriStatuses[santri.id] === status || (!santriStatuses[santri.id] && status === 'Hadir')}
                                  onChange={() => setSantriStatuses(p => ({...p, [santri.id]: status}))}
                                  className={`w-4 h-4 cursor-pointer ${
                                    status === 'Hadir' ? 'accent-indigo-600' :
                                    status === 'Izin' ? 'accent-blue-500' :
                                    status === 'Sakit' ? 'accent-amber-500' : 'accent-rose-500'
                                  }`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                <input type="text" placeholder="Contoh: Libur pesantren, acara khusus..." value={fNotes} onChange={e=>setFNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase">Batal</button>
                <button type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition">
                  {editId ? 'Simpan Perubahan' : 'Catat Absensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Hapus data absensi santri ini?</h3>
            <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase">Batal</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-sm transition flex items-center space-x-1.5 disabled:opacity-60">
                <Trash2 className="w-3.5 h-3.5"/><span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
              </button>
            </div>
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
        onSuccess={() => { loadAttendances(); loadSummary(); }}
        defaultClassId={filterClass || classes[0]?.id}
      />
    </div>
  );
}
