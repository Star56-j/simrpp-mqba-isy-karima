import React from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash, 
  X, 
  AlertCircle,
  CheckCircle,
  Copy,
  Printer,
  FileSpreadsheet,
  Search,
  ChevronDown,
  Filter
} from 'lucide-react';
import { TeachingSchedule, Teacher, Subject, SchoolClass, AcademicYear, Semester } from '../types';
import { api } from '../api';

interface MasterSchedulesProps {
  schedules: TeachingSchedule[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  onRefresh: () => void;
}

export default function MasterSchedules({
  schedules,
  teachers,
  subjects,
  classes,
  academicYears,
  semesters,
  onRefresh
}: MasterSchedulesProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterDay, setFilterDay] = React.useState<string>('Semua');
  const [filterClass, setFilterClass] = React.useState<string>('Semua');
  const [filterTeacher, setFilterTeacher] = React.useState<string>('Semua');

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = React.useState(false);
  const [selectedSchedule, setSelectedSchedule] = React.useState<TeachingSchedule | null>(null);

  // Schedule Form
  const [day, setDay] = React.useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad'>('Senin');
  const [time, setTime] = React.useState('');
  const [classId, setClassId] = React.useState('');
  const [teacherId, setTeacherId] = React.useState('');
  const [subjectId, setSubjectId] = React.useState('');
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [semesterId, setSemesterId] = React.useState('');

  // Copy Semester Form
  const [fromAy, setFromAy] = React.useState('');
  const [fromSem, setFromSem] = React.useState('');
  const [toAy, setToAy] = React.useState('');
  const [toSem, setToSem] = React.useState('');

  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Set default form values
  React.useEffect(() => {
    if (classes.length > 0) setClassId(classes[0].id);
    if (teachers.length > 0) setTeacherId(teachers[0].id);
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    if (academicYears.length > 0) {
      setAcademicYearId(academicYears[0].id);
      setFromAy(academicYears[0].id);
      setToAy(academicYears[0].id);
    }
    if (semesters.length > 0) {
      setSemesterId(semesters[0].id);
      setFromSem(semesters[0].id);
      setToSem(semesters[0].id);
    }
  }, [classes, teachers, subjects, academicYears, semesters]);

  const daysList: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad')[] = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'
  ];

  // Filtering Logic
  const filteredSchedules = schedules.filter(sch => {
    const teacherName = sch.teacher?.name || '';
    const subjectName = sch.subject?.name || '';
    const className = sch.class?.name || '';
    const matchesSearch = 
      teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDay = filterDay === 'Semua' || sch.day === filterDay;
    const matchesClass = filterClass === 'Semua' || sch.classId === filterClass;
    const matchesTeacher = filterTeacher === 'Semua' || sch.teacherId === filterTeacher;

    return matchesSearch && matchesDay && matchesClass && matchesTeacher;
  });

  // Export Excel Function (CSV stream)
  const exportToExcel = () => {
    const headers = ['No', 'Hari', 'Jam KBM', 'Kelas', 'Guru Pengajar', 'Mata Pelajaran', 'Tahun Ajaran', 'Semester'];
    const rows = filteredSchedules.map((sch, idx) => [
      idx + 1,
      sch.day,
      sch.time,
      `Kelas ${sch.class?.name || ''}`,
      sch.teacher?.name || '',
      sch.subject?.name || '',
      sch.academicYear?.name || '',
      sch.semester?.name || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jadwal_KBM_MQBA_Isy_Karima_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF / Print Function
  const handlePrint = () => {
    const printContent = document.getElementById('printable-schedule-area');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const style = `
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
        h1 { text-align: center; color: #065f46; font-size: 20px; margin-bottom: 2px; text-transform: uppercase; }
        p { text-align: center; font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
        th { background-color: #065f46; color: white; text-transform: uppercase; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .text-center { text-align: center; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Jadwal KBM MQBA Isy Karima</title>
            ${style}
          </head>
          <body>
            <h1>SIMRPP MQBA Isy Karima</h1>
            <p>Sistem Informasi Rencana Pelaksanaan Pembelajaran - Dokumen Resmi Jadwal Kegiatan Belajar Mengajar (KBM)</p>
            <table>
              <thead>
                <tr>
                  <th class="text-center" style="width: 40px">No</th>
                  <th style="width: 100px">Hari</th>
                  <th style="width: 120px">Jam KBM</th>
                  <th style="width: 100px">Kelas</th>
                  <th>Guru Pengajar</th>
                  <th>Mata Pelajaran</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSchedules.map((sch, idx) => `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><strong>${sch.day}</strong></td>
                    <td>${sch.time}</td>
                    <td>Kelas ${sch.class?.name || ''}</td>
                    <td>${sch.teacher?.name || ''}</td>
                    <td>${sch.subject?.name || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 40px; text-align: right; font-size: 10px; color: #64748b;">
              Dicetak pada: ${new Date().toLocaleString('id-ID')}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openAddModal = () => {
    setSelectedSchedule(null);
    setDay('Senin');
    setTime('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (sch: TeachingSchedule) => {
    setSelectedSchedule(sch);
    setDay(sch.day);
    setTime(sch.time);
    setClassId(sch.classId);
    setTeacherId(sch.teacherId);
    setSubjectId(sch.subjectId);
    setAcademicYearId(sch.academicYearId);
    setSemesterId(sch.semesterId);
    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!time || !classId || !teacherId || !subjectId || !academicYearId || !semesterId) {
      setErrorMessage('Semua kolom jadwal KBM harus dilengkapi.');
      return;
    }

    try {
      const payload = { day, time, classId, teacherId, subjectId, academicYearId, semesterId };
      if (selectedSchedule) {
        await api.updateSchedule(selectedSchedule.id, payload);
        setSuccessMessage('Jadwal KBM berhasil diperbarui.');
      } else {
        await api.createSchedule(payload);
        setSuccessMessage('Jadwal KBM baru berhasil ditambahkan.');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kegagalan memproses jadwal.');
    }
  };

  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fromAy || !fromSem || !toAy || !toSem) {
      setErrorMessage('Semua field salin harus ditentukan.');
      return;
    }

    try {
      const res = await api.copySemester({
        fromAcademicYearId: fromAy,
        fromSemesterId: fromSem,
        toAcademicYearId: toAy,
        toSemesterId: toSem
      });
      setSuccessMessage(`Berhasil menyalin ${res.count} jadwal KBM.`);
      setTimeout(() => {
        setIsCopyModalOpen(false);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyalin jadwal semester.');
    }
  };

  const handleDelete = async (sch: TeachingSchedule) => {
    if (window.confirm(`Hapus Jadwal KBM ini?\nPengajar: ${sch.teacher?.name}\nMapel: ${sch.subject?.name}`)) {
      try {
        await api.deleteSchedule(sch.id);
        alert('Jadwal KBM berhasil dihapus.');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Jadwal tidak dapat dihapus karena sudah ada data RPP milik guru.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Jadwal Kegiatan Belajar Mengajar (KBM)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Atur dan sinkronisasikan jadwal penugasan harian guru-guru pengajar Markaz MQBA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-emerald-700/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 font-bold text-xs uppercase tracking-wider transition"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Semester</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan guru, kelas, atau mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Day Filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Hari</span>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Semua">Semua</option>
                {daysList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Kelas</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Semua">Semua</option>
                {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
              </select>
            </div>

            {/* Teacher Filter */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Guru</span>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer max-w-[150px]"
              >
                <option value="Semua">Semua</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Ditemukan <strong>{filteredSchedules.length}</strong> jadwal mengajar.
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider transition"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider transition"
              title="Print PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Matrix Area */}
      <div id="printable-schedule-area" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4 w-28">Hari</th>
                <th className="p-4 w-36">Jam KBM</th>
                <th className="p-4 w-28">Kelas</th>
                <th className="p-4">Guru Pengajar</th>
                <th className="p-4">Mata Pelajaran</th>
                <th className="p-4 w-28 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((sch, index) => (
                  <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300">
                        {sch.day}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {sch.time}
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Kelas {sch.class?.name}
                    </td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      {sch.teacher?.name}
                    </td>
                    <td className="p-4 text-emerald-800 dark:text-emerald-400 font-bold">
                      {sch.subject?.name}
                    </td>
                    <td className="p-4 text-center no-print">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(sch)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sch)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada jadwal mengajar yang ditemukan dengan filter aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {selectedSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal KBM'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-emerald-700/85 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hari Mengajar</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {daysList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jam Belajar (KBM)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 07:30 - 09:00"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Guru Pengajar</label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Pilih guru...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Mata Pelajaran</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Pilih mapel...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>[{s.category}] {s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Kelas</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Pilih kelas...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name} ({c.level})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tahun Ajaran</label>
                  <select
                    required
                    value={academicYearId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Semester</label>
                  <select
                    required
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {selectedSchedule ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Semester Bulk Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Copy className="w-5 h-5 text-emerald-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Salin Seluruh Jadwal Semester
                </h3>
              </div>
              <button onClick={() => setIsCopyModalOpen(false)} className="p-1 rounded-lg hover:bg-emerald-700/85 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCopySubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-800 text-xs leading-relaxed">
                Fitur ini menduplikasi seluruh penugasan Jadwal KBM dari Semester Sumber ke Semester Tujuan secara otomatis. Membantu meringankan penyiapan kalender akademik baru.
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Source Semester */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/20">
                <h4 className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest leading-none">Semester Sumber (Asal)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Tahun Ajaran</span>
                    <select
                      value={fromAy}
                      onChange={(e) => setFromAy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Semester</span>
                    <select
                      value={fromSem}
                      onChange={(e) => setFromSem(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Destination Semester */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-emerald-50/10 dark:bg-emerald-950/10">
                <h4 className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest leading-none">Semester Tujuan (Salin Ke)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Tahun Ajaran</span>
                    <select
                      value={toAy}
                      onChange={(e) => setToAy(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Semester</span>
                    <select
                      value={toSem}
                      onChange={(e) => setToSem(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Proses Salin Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
