import React from 'react';
import { Calendar, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Santri, SchoolClass, AcademicYear, Semester } from '../types';
import { api } from '../api';

interface BulkMonthlySantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  santriList: Santri[];
  onSuccess: () => void;
  defaultClassId?: string;
}

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export default function BulkMonthlySantriModal({
  isOpen,
  onClose,
  classes,
  academicYears,
  semesters,
  santriList,
  onSuccess,
  defaultClassId
}: BulkMonthlySantriModalProps) {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [selectedClass, setSelectedClass] = React.useState(defaultClassId || classes[0]?.id || '');
  const [bulkMonth, setBulkMonth] = React.useState(currentMonth);
  const [bulkYear, setBulkYear] = React.useState(currentYear);
  const [bulkAY, setBulkAY] = React.useState(academicYears[0]?.id || '');
  const [bulkSem, setBulkSem] = React.useState(semesters[0]?.id || '');
  const [bulkEffDays, setBulkEffDays] = React.useState(22);

  const [bulkData, setBulkData] = React.useState<Record<string, { hadir: number; izin: number; sakit: number; alpha: number; notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Update default class if props change
  React.useEffect(() => {
    if (defaultClassId) {
      setSelectedClass(defaultClassId);
    } else if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [defaultClassId, classes]);

  // Santri in selected class
  const classSantris = React.useMemo(() => {
    return santriList.filter(s => s.classId === selectedClass);
  }, [santriList, selectedClass]);

  // Initialize bulkData when class or bulkEffDays changes
  React.useEffect(() => {
    if (isOpen && selectedClass) {
      const initial: Record<string, { hadir: number; izin: number; sakit: number; alpha: number; notes: string }> = {};
      classSantris.forEach(s => {
        initial[s.id] = {
          hadir: bulkEffDays,
          izin: 0,
          sakit: 0,
          alpha: 0,
          notes: ''
        };
      });
      setBulkData(initial);
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, selectedClass, classSantris.length]);

  if (!isOpen) return null;

  const handleSetAllHadir = (days: number) => {
    const updated = { ...bulkData };
    classSantris.forEach(s => {
      updated[s.id] = {
        ...(updated[s.id] || { notes: '' }),
        hadir: days,
        izin: 0,
        sakit: 0,
        alpha: 0
      };
    });
    setBulkData(updated);
  };

  const handleBulkChange = (santriId: string, field: 'hadir'|'izin'|'sakit'|'alpha', val: number) => {
    setBulkData(prev => ({
      ...prev,
      [santriId]: {
        ...(prev[santriId] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' }),
        [field]: Math.max(0, val)
      }
    }));
  };

  const handleSaveBulkMonthly = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!selectedClass) {
      setErrorMsg('Silakan pilih kelas terlebih dahulu.');
      return;
    }
    if (classSantris.length === 0) {
      setErrorMsg('Tidak ada santri di kelas ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const recordsToCreate: any[] = [];
      const mStr = String(bulkMonth).padStart(2, '0');
      const yStr = bulkYear;

      classSantris.forEach(s => {
        const item = bulkData[s.id] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' };
        const h = Number(item.hadir) || 0;
        const i = Number(item.izin) || 0;
        const sk = Number(item.sakit) || 0;
        const a = Number(item.alpha) || 0;

        let dayCounter = 1;

        // Hadir
        for (let idx = 0; idx < h; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            classId: selectedClass,
            santriId: s.id,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Hadir',
            notes: item.notes || 'Rekap Bulanan',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
        // Izin
        for (let idx = 0; idx < i; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            classId: selectedClass,
            santriId: s.id,
            date: `${yStr}-${mStr}-${dayStr}`,
            status: 'Izin',
            notes: item.notes || 'Rekap Bulanan (Izin)',
            academicYearId: bulkAY,
            semesterId: bulkSem
          });
          dayCounter++;
        }
        // Sakit
        for (let idx = 0; idx < sk; idx++) {
          const dayStr = String(dayCounter).padStart(2, '0');
          recordsToCreate.push({
            classId: selectedClass,
            santriId: s.id,
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
            classId: selectedClass,
            santriId: s.id,
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
        await api.createSantriAttendanceBulk({
          attendances: recordsToCreate,
          overwriteMonth: true,
          classId: selectedClass,
          year: bulkYear,
          month: bulkMonth
        });
      }

      const targetClassName = classes.find(c => c.id === selectedClass)?.name || 'Kelas';
      setSuccessMsg(`Berhasil menyimpan rekap absensi bulanan untuk ${classSantris.length} santri ${targetClassName} (${recordsToCreate.length} entri kehadiran).`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan rekap bulanan santri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Input Rekap Absensi Santri Bulanan (Massal)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Isi rekapitulasi kehadiran santri per kelas sekaligus dalam 1 bulan tanpa perlu absen harian satu persatu.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100/50 dark:border-emerald-900/30 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-end">
          <div className="col-span-2 sm:col-span-2 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pilih Kelas</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bulan</label>
            <select value={bulkMonth} onChange={e=>setBulkMonth(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {MONTHS.map((m,i)=><option key={i} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tahun</label>
            <input type="number" value={bulkYear} onChange={e=>setBulkYear(e.target.value)} min={2020} max={2035}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Hari Efektif</label>
            <input type="number" value={bulkEffDays} onChange={e=>{
              const d = Math.max(1, Number(e.target.value)||22);
              setBulkEffDays(d);
            }} min={1} max={31}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <button type="button" onClick={() => handleSetAllHadir(bulkEffDays)}
              className="w-full px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5"/>
              <span>Set Semua {bulkEffDays} Hadir</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{errorMsg}</span></div>}
        {successMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center space-x-2"><CheckCircle className="w-4 h-4"/><span>{successMsg}</span></div>}

        {/* Bulk Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {classSantris.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">Tidak ada santri terdaftar di kelas ini.</div>
          ) : (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">No</th>
                    <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">NIS</th>
                    <th className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">Nama Santri</th>
                    <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-emerald-600">Hadir</th>
                    <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-blue-600">Izin</th>
                    <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-amber-600">Sakit</th>
                    <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800 text-rose-600">Alpha</th>
                    <th className="px-3 py-3 text-center border-b border-slate-100 dark:border-slate-800">Total Hari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                  {classSantris.map((s, idx) => {
                    const item = bulkData[s.id] || { hadir: bulkEffDays, izin: 0, sakit: 0, alpha: 0, notes: '' };
                    const tot = Number(item.hadir) + Number(item.izin) + Number(item.sakit) + Number(item.alpha);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{s.nis || '-'}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                          {s.name}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min={0} max={31}
                            value={item.hadir}
                            onChange={e => handleBulkChange(s.id, 'hadir', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-emerald-600 border border-emerald-200 dark:border-emerald-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"/>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min={0} max={31}
                            value={item.izin}
                            onChange={e => handleBulkChange(s.id, 'izin', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-blue-600 border border-blue-200 dark:border-blue-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min={0} max={31}
                            value={item.sakit}
                            onChange={e => handleBulkChange(s.id, 'sakit', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-amber-600 border border-amber-200 dark:border-amber-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"/>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min={0} max={31}
                            value={item.alpha}
                            onChange={e => handleBulkChange(s.id, 'alpha', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-rose-600 border border-rose-200 dark:border-rose-900 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"/>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                          {tot} Hari
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Target: <strong>{classes.find(c=>c.id===selectedClass)?.name}</strong> — {MONTHS[Number(bulkMonth)-1]} {bulkYear} ({classSantris.length} santri)
          </span>
          <div className="flex space-x-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase transition">
              Batal
            </button>
            <button type="button" onClick={handleSaveBulkMonthly} disabled={isSubmitting || classSantris.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase shadow-md transition flex items-center space-x-2 disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  <span>Menyimpan Rekap...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4"/>
                  <span>Simpan Rekap Bulanan Santri</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
