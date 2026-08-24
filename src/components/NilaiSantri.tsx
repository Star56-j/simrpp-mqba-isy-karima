import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileSpreadsheet, FileText, CheckCircle, Search, Edit, Save, BookOpen, AlertCircle, 
  Download, Upload, X, Volume2, UserCheck, Layers, Sparkles, Check, RefreshCw,
  Trash2, RotateCcw
} from 'lucide-react';
import { Santri, Nilai, SchoolClass, AcademicYear, Semester, Subject, WaliKelas, TeachingSchedule, AkhlaqSantri } from '../types';
import { api } from '../api';
import { exportToExcel } from '../utils/exportExcel';
import { parseExcelFile } from '../utils/importExcel';
import { printGenericTable } from '../utils/printUtils';
import { downloadNilaiSantriPdf } from '../utils/pdfDownloader';
import { shareToWhatsApp } from '../utils/whatsappUtils';
import ExportBar from './ExportBar';
import RaporModal from './RaporModal';
import { computeRaporScore } from '../utils/nilaiWeights';

const parseScore = (val: string): number => {
  if (val === undefined || val === null || val.trim() === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
};

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

type ViewMode = 'per_mapel' | 'per_santri' | 'bulk_mapel' | 'lisan' | 'akhlaq' | 'rapor';
type ExamCategory = 'all' | 'harian' | 'bulanan' | 'uts' | 'uas' | 'uasLisan';

export default function NilaiSantri({ 
  classes, academicYears, semesters, subjects, schedules, waliKelasList, currentUser, onRefresh 
}: NilaiSantriProps) {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [akhlaqList, setAkhlaqList] = useState<AkhlaqSantri[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAY, setFilterAY] = useState(academicYears[0]?.id || '');
  const [filterSem, setFilterSem] = useState(semesters[0]?.id || '');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSantriId, setFilterSantriId] = useState('');
  
  // View & Category modes
  const [viewMode, setViewMode] = useState<ViewMode>('per_mapel');
  const [examCategory, setExamCategory] = useState<ExamCategory>('all');

  // Single edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHarian, setEditHarian] = useState('');
  const [editBulanan, setEditBulanan] = useState('');
  const [editUts, setEditUts] = useState('');
  const [editUas, setEditUas] = useState('');
  const [editUasLisan, setEditUasLisan] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Bulk edit state: santriId -> { harian, bulanan, uts, uas, uasLisan, notes }
  const [bulkMapelData, setBulkMapelData] = useState<Record<string, { harian: string; bulanan: string; uts: string; uas: string; uasLisan: string; notes: string }>>({});
  
  // Per Santri edit state: subjectId -> { harian, bulanan, uts, uas, uasLisan, notes }
  const [perSantriData, setPerSantriData] = useState<Record<string, { harian: string; bulanan: string; uts: string; uas: string; uasLisan: string; notes: string }>>({});

  // Akhlaq Keseharian state: santriId -> { score, adab, ibadah, kebersihan, notes }
  const [bulkAkhlaqData, setBulkAkhlaqData] = useState<Record<string, { score: string; adab: string; ibadah: string; kebersihan: string; notes: string }>>({});

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Rapor modal & ref state
  const [raporModalSantri, setRaporModalSantri] = useState<Santri | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedules filter
  // Schedules filter
  const teacherIds = [currentUser.teacherId, currentUser.id, (currentUser as any).teacher_id, (currentUser.teacher && currentUser.teacher.id)].filter(Boolean);
  const mySchedules = currentUser.role === 'Admin' ? schedules : schedules.filter(s => teacherIds.includes(s.teacherId) || teacherIds.includes((s as any).teacher_id));
  const mySubjectIds = Array.from(new Set(mySchedules.map(s => s.subjectId || (s as any).subject_id)));
  
  // All wali kelas records for this teacher
  const myAllWaliClassIds = waliKelasList
    .filter(w => teacherIds.includes(w.teacherId) || teacherIds.includes((w as any).teacher_id))
    .map(w => w.classId || (w as any).class_id);
    
  const myWaliClasses = waliKelasList
    .filter(w => (teacherIds.includes(w.teacherId) || teacherIds.includes((w as any).teacher_id)) && (w.academicYearId === filterAY || (w as any).academic_year_id === filterAY))
    .map(w => w.classId || (w as any).class_id);

  const isWaliRole = currentUser.role === 'WaliKelas';
  const isWaliKelas = currentUser.role === 'Admin' || isWaliRole || myAllWaliClassIds.length > 0;

  // If user is WaliKelas role, restrict availableClasses to ONLY their assigned class(es)
  const availableClasses = (currentUser.role === 'WaliKelas' && myAllWaliClassIds.length > 0)
    ? classes.filter(c => myAllWaliClassIds.includes(c.id))
    : classes;

  // Wali Kelas can input ALL subjects for their handled class
  const isHandlingThisClass = myAllWaliClassIds.includes(filterClass) || myWaliClasses.includes(filterClass);
  const availableSubjects = (currentUser.role === 'Admin' || isWaliRole || isHandlingThisClass) 
    ? subjects 
    : (mySubjectIds.length > 0 
        ? subjects.filter(s => mySubjectIds.includes(s.id)) 
        : subjects);

  const getSantriAkhlaqScore = useCallback((sId: string): number => {
    const a = akhlaqList.find(x => x.santriId === sId || (x as any).santri_id === sId);
    return a && typeof a.nilaiAkhlaq === 'number' ? a.nilaiAkhlaq : 90;
  }, [akhlaqList]);

  const nilaiAvg = useCallback((n: Nilai, sId?: string): number => {
    const santriId = sId || n.santriId || (n as any).santri_id || '';
    const akhlaqVal = santriId ? getSantriAkhlaqScore(santriId) : 90;
    return computeRaporScore(n, akhlaqVal).nilaiAkhirTulis;
  }, [getSantriAkhlaqScore]);

  useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.find(c => c.id === filterClass)) {
      setFilterClass(availableClasses[0].id);
    }
  }, [availableClasses, filterClass]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.find(s => s.id === filterSubject)) {
      setFilterSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, filterSubject]);

  const loadData = useCallback(async () => {
    if (!filterClass || !filterAY || !filterSem) return;
    setLoading(true);
    try {
      const [sData, nData, aData] = await Promise.all([
        api.getSantri(filterClass),
        api.getNilai({ classId: filterClass, academicYearId: filterAY, semesterId: filterSem }),
        api.getAkhlaqSantri({ classId: filterClass, academicYearId: filterAY, semesterId: filterSem })
      ]);
      setSantriList(sData);
      setNilaiList(nData);
      setAkhlaqList(aData);

      if (sData.length > 0 && !sData.find(s => s.id === filterSantriId)) {
        setFilterSantriId(sData[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat nilai:', err);
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterAY, filterSem, filterSantriId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync bulk & per santri data when list changes
  useEffect(() => {
    if (santriList.length > 0 && filterSubject) {
      const initialBulk: Record<string, any> = {};
      santriList.forEach(s => {
        const n = nilaiList.find(x => (x.santriId === s.id || (x as any).santri_id === s.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
        initialBulk[s.id] = {
          harian: n && typeof n.harian === 'number' ? String(n.harian) : '',
          bulanan: n && typeof n.bulanan === 'number' ? String(n.bulanan) : '',
          uts: n && typeof n.uts === 'number' ? String(n.uts) : '',
          uas: n && typeof n.uas === 'number' ? String(n.uas) : '',
          uasLisan: n && typeof n.uasLisan === 'number' ? String(n.uasLisan) : '',
          notes: n?.notes || ''
        };
      });
      setBulkMapelData(initialBulk);
    }
  }, [santriList, nilaiList, filterSubject]);

  // Sync Akhlaq state
  useEffect(() => {
    if (santriList.length > 0) {
      const initialAkhlaq: Record<string, any> = {};
      santriList.forEach(s => {
        const a = akhlaqList.find(x => x.santriId === s.id || (x as any).santri_id === s.id);
        initialAkhlaq[s.id] = {
          score: a && typeof a.nilaiAkhlaq === 'number' ? String(a.nilaiAkhlaq) : '90',
          adab: a && typeof a.adabKesopanan === 'number' ? String(a.adabKesopanan) : (a ? String(a.nilaiAkhlaq) : '90'),
          ibadah: a && typeof a.kedisiplinanIbadah === 'number' ? String(a.kedisiplinanIbadah) : (a ? String(a.nilaiAkhlaq) : '90'),
          kebersihan: a && typeof a.kebersihanKerapian === 'number' ? String(a.kebersihanKerapian) : (a ? String(a.nilaiAkhlaq) : '90'),
          notes: a?.catatan || ''
        };
      });
      setBulkAkhlaqData(initialAkhlaq);
    }
  }, [santriList, akhlaqList]);

  useEffect(() => {
    if (filterSantriId && subjects.length > 0) {
      const initialSantriData: Record<string, any> = {};
      subjects.forEach(sub => {
        const n = nilaiList.find(x => (x.santriId === filterSantriId || (x as any).santri_id === filterSantriId) && (x.subjectId === sub.id || (x as any).subject_id === sub.id));
        initialSantriData[sub.id] = {
          harian: n && typeof n.harian === 'number' ? String(n.harian) : '',
          bulanan: n && typeof n.bulanan === 'number' ? String(n.bulanan) : '',
          uts: n && typeof n.uts === 'number' ? String(n.uts) : '',
          uas: n && typeof n.uas === 'number' ? String(n.uas) : '',
          uasLisan: n && typeof n.uasLisan === 'number' ? String(n.uasLisan) : '',
          notes: n?.notes || ''
        };
      });
      setPerSantriData(initialSantriData);
    }
  }, [filterSantriId, nilaiList, subjects]);

  const startEdit = (sId: string, n?: Nilai) => {
    setEditingId(sId);
    setEditHarian(n && typeof n.harian === 'number' ? n.harian.toString() : '0');
    setEditBulanan(n && typeof n.bulanan === 'number' ? n.bulanan.toString() : '0');
    setEditUts(n && typeof n.uts === 'number' ? n.uts.toString() : '0');
    setEditUas(n && typeof n.uas === 'number' ? n.uas.toString() : '0');
    setEditUasLisan(n && typeof n.uasLisan === 'number' ? n.uasLisan.toString() : '0');
    setEditNotes(n ? n.notes : '');
    setMsg({ type: '', text: '' });
  };

  const handleSaveSingle = async (santriId: string) => {
    if (!filterSubject) {
      setMsg({ type: 'error', text: 'Pilih mata pelajaran terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const existingN = nilaiList.find(x => (x.santriId === santriId || (x as any).santri_id === santriId) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
      const payload = {
        santriId,
        santri_id: santriId,
        subjectId: filterSubject,
        subject_id: filterSubject,
        classId: filterClass,
        class_id: filterClass,
        academicYearId: filterAY,
        academic_year_id: filterAY,
        semesterId: filterSem,
        semester_id: filterSem,
        harian: parseScore(editHarian),
        bulanan: parseScore(editBulanan),
        uts: parseScore(editUts),
        uas: parseScore(editUas),
        uasLisan: parseScore(editUasLisan),
        uas_lisan: parseScore(editUasLisan),
        notes: editNotes,
        teacherId: currentUser.teacherId || currentUser.id,
        teacher_id: currentUser.teacherId || currentUser.id
      };
      
      if (existingN) {
        await api.updateNilai(existingN.id, payload);
      } else {
        await api.createNilai(payload);
      }
      setMsg({ type: 'success', text: 'Nilai berhasil disimpan!' });
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNilai = async (santriId: string, subjectId: string) => {
    const existingN = nilaiList.find(x => (x.santriId === santriId || (x as any).santri_id === santriId) && (x.subjectId === subjectId || (x as any).subject_id === subjectId));
    if (!existingN) {
      setEditingId(null);
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus data nilai santri ini?')) {
      setSaving(true);
      try {
        await api.deleteNilai(existingN.id);
        setMsg({ type: 'success', text: 'Data nilai berhasil dihapus!' });
        setEditingId(null);
        await loadData();
      } catch (err: any) {
        setMsg({ type: 'error', text: err.message || 'Gagal menghapus data nilai.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveBulkMapel = async () => {
    if (!filterSubject) {
      setMsg({ type: 'error', text: 'Pilih mata pelajaran terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      let savedCount = 0;
      for (const santri of santriList) {
        const item = bulkMapelData[santri.id];
        if (!item) continue;
        const existingN = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
        const payload = {
          santriId: santri.id,
          santri_id: santri.id,
          subjectId: filterSubject,
          subject_id: filterSubject,
          classId: filterClass,
          class_id: filterClass,
          academicYearId: filterAY,
          academic_year_id: filterAY,
          semesterId: filterSem,
          semester_id: filterSem,
          harian: parseScore(item.harian),
          bulanan: parseScore(item.bulanan),
          uts: parseScore(item.uts),
          uas: parseScore(item.uas),
          uasLisan: parseScore(item.uasLisan),
          uas_lisan: parseScore(item.uasLisan),
          notes: item.notes || '',
          teacherId: currentUser.teacherId || currentUser.id,
          teacher_id: currentUser.teacherId || currentUser.id
        };

        if (existingN) {
          await api.updateNilai(existingN.id, payload);
        } else {
          await api.createNilai(payload);
        }
        savedCount++;
      }
      setMsg({ type: 'success', text: `Berhasil menyimpan nilai ${savedCount} santri sekaligus!` });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai massal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePerSantri = async () => {
    if (!filterSantriId) {
      setMsg({ type: 'error', text: 'Pilih santri terlebih dahulu.' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      let savedCount = 0;
      for (const sub of subjects) {
        const item = perSantriData[sub.id];
        if (!item) continue;
        const existingN = nilaiList.find(x => (x.santriId === filterSantriId || (x as any).santri_id === filterSantriId) && (x.subjectId === sub.id || (x as any).subject_id === sub.id));
        const payload = {
          santriId: filterSantriId,
          santri_id: filterSantriId,
          subjectId: sub.id,
          subject_id: sub.id,
          classId: filterClass,
          class_id: filterClass,
          academicYearId: filterAY,
          academic_year_id: filterAY,
          semesterId: filterSem,
          semester_id: filterSem,
          harian: parseScore(item.harian),
          bulanan: parseScore(item.bulanan),
          uts: parseScore(item.uts),
          uas: parseScore(item.uas),
          uasLisan: parseScore(item.uasLisan),
          uas_lisan: parseScore(item.uasLisan),
          notes: item.notes || '',
          teacherId: currentUser.teacherId || currentUser.id,
          teacher_id: currentUser.teacherId || currentUser.id
        };

        if (existingN) {
          await api.updateNilai(existingN.id, payload);
        } else {
          await api.createNilai(payload);
        }
        savedCount++;
      }
      setMsg({ type: 'success', text: `Berhasil menyimpan nilai seluruh mata pelajaran untuk santri pilihan!` });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai santri.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingleAkhlaq = async (santriId: string) => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const item = bulkAkhlaqData[santriId] || { score: '90', adab: '90', ibadah: '90', kebersihan: '90', notes: '' };
      const score = parseScore(item.score || '90');
      const adab = parseScore(item.adab || String(score));
      const ibadah = parseScore(item.ibadah || String(score));
      const kebersihan = parseScore(item.kebersihan || String(score));
      const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';

      await api.saveAkhlaqSantri({
        santriId,
        classId: filterClass,
        academicYearId: filterAY,
        semesterId: filterSem,
        nilaiAkhlaq: score,
        predikat: pred,
        adabKesopanan: adab,
        kedisiplinanIbadah: ibadah,
        kebersihanKerapian: kebersihan,
        catatan: item.notes || '',
        recordedBy: currentUser.name || 'Wali Kelas'
      });

      setMsg({ type: 'success', text: 'Nilai Akhlaq Santri berhasil disimpan!' });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai akhlaq.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBulkAkhlaq = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const items = santriList.map(s => {
        const item = bulkAkhlaqData[s.id] || { score: '90', adab: '90', ibadah: '90', kebersihan: '90', notes: '' };
        const score = parseScore(item.score || '90');
        const adab = parseScore(item.adab || String(score));
        const ibadah = parseScore(item.ibadah || String(score));
        const kebersihan = parseScore(item.kebersihan || String(score));
        const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
        return {
          santriId: s.id,
          classId: filterClass,
          academicYearId: filterAY,
          semesterId: filterSem,
          nilaiAkhlaq: score,
          predikat: pred,
          adabKesopanan: adab,
          kedisiplinanIbadah: ibadah,
          kebersihanKerapian: kebersihan,
          catatan: item.notes || '',
          recordedBy: currentUser.name || 'Wali Kelas'
        };
      });

      await api.saveAkhlaqSantriBulk({ items });
      setMsg({ type: 'success', text: `Berhasil menyimpan nilai akhlaq keseharian ${items.length} santri kelas ini!` });
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai akhlaq massal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';
    
    if (viewMode === 'akhlaq') {
      const exportData = santriList.map((santri, idx) => {
        const a = akhlaqList.find(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        const score = a && typeof a.nilaiAkhlaq === 'number' ? a.nilaiAkhlaq : 90;
        return {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
          'Nilai Akhlaq Keseharian (20%)': score,
          'Predikat': score >= 90 ? 'A (Sangat Baik)' : score >= 80 ? 'B (Baik)' : score >= 70 ? 'C (Cukup)' : 'D (Perlu Bimbingan)',
          'Adab & Kesopanan': a?.adabKesopanan ?? score,
          'Kedisiplinan & Ibadah': a?.kedisiplinanIbadah ?? score,
          'Kerapian & Kebersihan': a?.kebersihanKerapian ?? score,
          'Catatan Karakter': a?.catatan || '-'
        };
      });
      exportToExcel(exportData, `Nilai_Akhlaq_Keseharian_${cls}_TA${ay}_${sem}`);
      return;
    }

    if (viewMode === 'per_mapel' || viewMode === 'bulk_mapel' || viewMode === 'lisan') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const exportData = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
        if (viewMode === 'lisan') {
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
          'UAS Lisan': n?.uasLisan || 0,
          'Nilai Akhir Rapor': n ? nilaiAvg(n, santri.id) : 0,
          'Catatan': n?.notes || '-'
        };
      });
      exportToExcel(exportData, `Nilai_${subj}_${cls}_TA${ay}_${sem}`);
    } else {
      const exportData = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        const row: any = {
          'No': idx + 1,
          'NIS': santri.nis,
          'Nama Santri': santri.name,
        };
        let total = 0;
        subjects.forEach(sub => {
          const n = santriNilai.find(x => x.subjectId === sub.id || (x as any).subject_id === sub.id);
          const score = n ? nilaiAvg(n, santri.id) : 0;
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
    
    if (viewMode === 'akhlaq') {
      const columns = ['No', 'NIS', 'Nama Santri', 'Nilai Akhlaq (20%)', 'Predikat', 'Adab', 'Ibadah', 'Kebersihan', 'Catatan Karakter'];
      const data = santriList.map((santri, idx) => {
        const a = akhlaqList.find(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        const score = a && typeof a.nilaiAkhlaq === 'number' ? a.nilaiAkhlaq : 90;
        const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
        return [
          idx + 1,
          santri.nis,
          santri.name,
          score,
          pred,
          a?.adabKesopanan ?? score,
          a?.kedisiplinanIbadah ?? score,
          a?.kebersihanKerapian ?? score,
          a?.catatan || '-'
        ];
      });
      printGenericTable(`Nilai Akhlaq Keseharian Santri (Bobot 20%)`, `Kelas: ${cls} | TA: ${ay} | Semester: ${sem}`, columns, data);
      return;
    }

    if (viewMode === 'per_mapel' || viewMode === 'bulk_mapel' || viewMode === 'lisan') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const columns = ['No', 'NIS', 'Nama Santri', 'Harian', 'Bulanan', 'UTS (Mid)', 'UAS Tulis', 'UAS Lisan', 'Nilai Akhir', 'Catatan'];
      const data = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
        return [idx + 1, santri.nis, santri.name, n?.harian || '-', n?.bulanan || '-', n?.uts || '-', n?.uas || '-', n?.uasLisan || '-', n ? nilaiAvg(n, santri.id) : '-', n?.notes || '-'];
      });
      printGenericTable(`Daftar Nilai - ${subj}`, `Kelas: ${cls} | TA: ${ay} | Semester: ${sem}`, columns, data);
    } else {
      const columns = ['No', 'NIS', 'Nama Santri', ...subjects.map(s => s.name), 'Nilai Akhir'];
      const data = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        let total = 0;
        const scores = subjects.map(sub => {
          const n = santriNilai.find(x => x.subjectId === sub.id || (x as any).subject_id === sub.id);
          const score = n ? nilaiAvg(n, santri.id) : 0;
          total += score;
          return score > 0 ? score : '-';
        });
        const finalAvg = subjects.length > 0 ? (total / subjects.length).toFixed(1) : '-';
        return [idx + 1, santri.nis, santri.name, ...scores, finalAvg];
      });
      printGenericTable(`Rekap Rapor Kelas ${cls}`, `TA: ${ay} | Semester: ${sem}`, columns, data);
    }
  };

  const handleDownloadPDF = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';

    if (viewMode === 'akhlaq') {
      const columns = ['No', 'NIS', 'Nama Santri', 'Nilai Akhlaq (20%)', 'Predikat', 'Adab', 'Ibadah', 'Kebersihan', 'Catatan Karakter'];
      const data = santriList.map((santri, idx) => {
        const a = akhlaqList.find(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        const score = a && typeof a.nilaiAkhlaq === 'number' ? a.nilaiAkhlaq : 90;
        const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
        return [
          idx + 1,
          santri.nis,
          santri.name,
          score,
          pred,
          a?.adabKesopanan ?? score,
          a?.kedisiplinanIbadah ?? score,
          a?.kebersihanKerapian ?? score,
          a?.catatan || '-'
        ];
      });
      downloadNilaiSantriPdf(`Nilai Akhlaq Keseharian Santri`, `Kelas: ${cls} | TA: ${ay} | Semester: ${sem}`, columns, data, `Nilai_Akhlaq_${cls.replace(/\s+/g, '_')}.pdf`);
      return;
    }

    if (viewMode === 'per_mapel' || viewMode === 'bulk_mapel' || viewMode === 'lisan') {
      const subj = subjects.find(s => s.id === filterSubject)?.name || '';
      const columns = ['No', 'NIS', 'Nama Santri', 'Harian', 'Bulanan', 'UTS (Mid)', 'UAS Tulis', 'UAS Lisan', 'Nilai Akhir', 'Catatan'];
      const data = santriList.map((santri, idx) => {
        const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
        return [idx + 1, santri.nis, santri.name, n?.harian || '-', n?.bulanan || '-', n?.uts || '-', n?.uas || '-', n?.uasLisan || '-', n ? nilaiAvg(n, santri.id) : '-', n?.notes || '-'];
      });
      downloadNilaiSantriPdf(`Daftar Nilai - ${subj}`, `Kelas: ${cls} | TA: ${ay} | Semester: ${sem}`, columns, data, `Daftar_Nilai_${subj.replace(/\s+/g, '_')}_Kelas_${cls}.pdf`);
    } else {
      const columns = ['No', 'NIS', 'Nama Santri', ...subjects.map(s => s.name), 'Nilai Akhir'];
      const data = santriList.map((santri, idx) => {
        const santriNilai = nilaiList.filter(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        let total = 0;
        const scores = subjects.map(sub => {
          const n = santriNilai.find(x => x.subjectId === sub.id || (x as any).subject_id === sub.id);
          const score = n ? nilaiAvg(n, santri.id) : 0;
          total += score;
          return score > 0 ? score : '-';
        });
        const finalAvg = subjects.length > 0 ? (total / subjects.length).toFixed(1) : '-';
        return [idx + 1, santri.nis, santri.name, ...scores, finalAvg];
      });
      downloadNilaiSantriPdf(`Rekap Rapor Kelas ${cls}`, `TA: ${ay} | Semester: ${sem}`, columns, data, `Rekap_Rapor_Kelas_${cls}.pdf`);
    }
  };

  const handleWhatsApp = () => {
    const ay = academicYears.find(y => y.id === filterAY)?.name || '';
    const sem = semesters.find(s => s.id === filterSem)?.name || '';
    const cls = classes.find(c => c.id === filterClass)?.name || '';

    if (viewMode === 'akhlaq') {
      let text = `*REKAP NILAI AKHLAQ KESEHARIAN SANTRI*\n`;
      text += `Kelas: ${cls}\nTA: ${ay} | ${sem}\n\n`;
      santriList.forEach((santri, idx) => {
        const a = akhlaqList.find(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
        const score = a && typeof a.nilaiAkhlaq === 'number' ? a.nilaiAkhlaq : 90;
        const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
        text += `${idx + 1}. ${santri.name}: Nilai Akhlaq=${score} (${pred})\n`;
      });
      shareToWhatsApp(`Rekap Nilai Akhlaq ${cls}`, text);
      return;
    }

    const subj = subjects.find(s => s.id === filterSubject)?.name || '';
    let text = `*REKAP NILAI MQBA ISY KARIMA*\n`;
    text += `Mata Pelajaran: ${subj}\nKelas: ${cls}\nTA: ${ay} | ${sem}\n\n`;

    santriList.forEach((santri, idx) => {
      const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
      text += `${idx + 1}. ${santri.name}: Harian=${n?.harian||0}, Bulanan=${n?.bulanan||0}, UTS=${n?.uts||0}, UAS Tulis=${n?.uas||0}, UAS Lisan=${n?.uasLisan||0} -> Nilai Akhir=${n ? nilaiAvg(n, santri.id) : '-'}\n`;
    });

    shareToWhatsApp(`Rekap Nilai ${subj}`, text);
  };

  const scoreColor = (v: number) => {
    if (v === 0) return 'text-slate-300 dark:text-slate-600';
    if (v < 60) return 'text-rose-600 font-bold';
    if (v < 75) return 'text-amber-600 font-bold';
    return 'text-emerald-600 dark:text-emerald-400 font-extrabold';
  };

  const activeSantriObj = santriList.find(s => s.id === filterSantriId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Pengelolaan Nilai & Rapor Santri</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Input, edit, dan kelola nilai santri secara fleksibel: Per Mata Pelajaran, Per Santri, atau Sekaligus (Massal).
          </p>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex-wrap gap-1 border border-slate-200 dark:border-slate-700 shadow-xs">
          <button 
            onClick={() => setViewMode('per_mapel')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'per_mapel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <BookOpen className="w-4 h-4" /><span>1. Per Mapel</span>
          </button>
          
          <button 
            onClick={() => setViewMode('per_santri')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'per_santri' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <UserCheck className="w-4 h-4" /><span>2. Per Santri</span>
          </button>

          <button 
            onClick={() => setViewMode('bulk_mapel')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'bulk_mapel' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Layers className="w-4 h-4" /><span>3. Edit Massal</span>
          </button>

          <button 
            onClick={() => setViewMode('lisan')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'lisan' ? 'bg-fuchsia-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Volume2 className="w-4 h-4" /><span>4. Ujian Lisan</span>
          </button>

          <button 
            onClick={() => setViewMode('akhlaq')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'akhlaq' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Sparkles className="w-4 h-4" /><span>5. Akhlaq Keseharian (20%)</span>
          </button>

          {isWaliKelas && (
            <button 
              onClick={() => setViewMode('rapor')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${viewMode === 'rapor' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <FileText className="w-4 h-4" /><span>6. Rekap Rapor</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Bar (Export & Refresh) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ExportBar 
          onExportExcel={handleExport}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onWhatsApp={handleWhatsApp}
          itemName={viewMode === 'rapor' ? 'Data Rapor' : viewMode === 'lisan' ? 'Nilai Lisan' : viewMode === 'akhlaq' ? 'Nilai Akhlaq Santri' : 'Nilai Santri'}
        />

        <div className="flex items-center space-x-2">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={() => {}} className="hidden" />
          <button 
            onClick={loadData} 
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Ajaran</label>
          <select value={filterAY} onChange={e => setFilterAY(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {academicYears.map(y => <option key={y.id} value={y.id}>TA {y.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</label>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Filter Subject / Santri depending on Mode */}
        {viewMode === 'per_santri' ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Pilih Santri (Per Anak)</label>
            <select value={filterSantriId} onChange={e => setFilterSantriId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {santriList.map(s => <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>)}
              {santriList.length === 0 && <option value="" disabled>-- Belum ada santri --</option>}
            </select>
          </div>
        ) : (viewMode === 'per_mapel' || viewMode === 'bulk_mapel' || viewMode === 'lisan') ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {availableSubjects.length === 0 && <option value="" disabled>-- Tidak ada mapel --</option>}
            </select>
          </div>
        ) : null}
      </div>

      {/* Category Sub-Tabs for Filtering Exam Types */}
      {(viewMode === 'per_mapel' || viewMode === 'bulk_mapel') && (
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'all', label: 'Semua Nilai Ujian' },
            { id: 'harian', label: '1. Nilai Harian' },
            { id: 'bulanan', label: '2. Nilai Bulanan' },
            { id: 'uts', label: '3. UTS (Mid)' },
            { id: 'uas', label: '4. UAS Tulis' },
            { id: 'uasLisan', label: '5. UAS Lisan' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setExamCategory(cat.id as ExamCategory)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                examCategory === cat.id 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-sm font-semibold shadow-xs ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Banner Rumus Rapor & Action Buttons */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] uppercase font-black">Info Bobot Rapor</span>
          <span>Rumus (Total 100%): 20% Akhlaq Keseharian + 10% Kehadiran + 10% Mid/Harian + 60% UAS Tulis</span>
        </div>
        {viewMode === 'akhlaq' && (
          <button 
            onClick={handleSaveBulkAkhlaq} 
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Memproses...' : 'Simpan Seluruh Nilai Akhlaq Kelas Ini'}</span>
          </button>
        )}
        {viewMode === 'bulk_mapel' && (
          <button 
            onClick={handleSaveBulkMapel} 
            disabled={saving}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Memproses...' : 'Simpan Semua Nilai Kelas Ini'}</span>
          </button>
        )}
        {viewMode === 'per_santri' && (
          <button 
            onClick={handleSavePerSantri} 
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Memproses...' : 'Simpan Seluruh Mapel Santri Ini'}</span>
          </button>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm font-semibold">Memuat data nilai...</div>
        ) : santriList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">Belum ada data santri di kelas ini.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* MODE 1: PER MAPEL (INPUT / EDIT INDIVIDUAL) */}
            {viewMode === 'per_mapel' && (
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-24">NIS</th>
                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Nama Santri</th>
                    
                    {(examCategory === 'all' || examCategory === 'harian') && <th className="px-3 py-3 text-center w-24">Harian</th>}
                    {(examCategory === 'all' || examCategory === 'bulanan') && <th className="px-3 py-3 text-center w-24">Bulanan</th>}
                    {(examCategory === 'all' || examCategory === 'uts') && <th className="px-3 py-3 text-center w-24">UTS (Mid)</th>}
                    {(examCategory === 'all' || examCategory === 'uas') && <th className="px-3 py-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">UAS Tulis</th>}
                    {(examCategory === 'all' || examCategory === 'uasLisan') && <th className="px-3 py-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">UAS Lisan</th>}
                    
                    <th className="px-3 py-3 text-center w-28 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-r border-indigo-200 dark:border-indigo-800 font-black">
                      Nilai Akhir
                    </th>
                    <th className="px-3 py-3">Catatan</th>
                    <th className="px-3 py-3 text-center w-28">Aksi Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {santriList.map((santri, idx) => {
                    const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
                    const isEditing = editingId === santri.id;
                    const avg = n ? nilaiAvg(n) : 0;
                    
                    return (
                      <tr key={santri.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 text-slate-400 text-center font-mono">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{santri.nis}</td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                          {santri.name}
                        </td>
                        
                        {/* Harian */}
                        {(examCategory === 'all' || examCategory === 'harian') && (
                          <td className="px-3 py-3.5 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editHarian} onChange={e => setEditHarian(e.target.value)}
                                placeholder="0" className="w-16 px-2 py-1 text-center font-bold border-2 border-indigo-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            ) : (
                              <span className={scoreColor(n?.harian)}>{n && typeof n.harian === 'number' ? n.harian : '-'}</span>
                            )}
                          </td>
                        )}

                        {/* Bulanan */}
                        {(examCategory === 'all' || examCategory === 'bulanan') && (
                          <td className="px-3 py-3.5 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editBulanan} onChange={e => setEditBulanan(e.target.value)}
                                placeholder="0" className="w-16 px-2 py-1 text-center font-bold border-2 border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            ) : (
                              <span className={scoreColor(n?.bulanan)}>{n && typeof n.bulanan === 'number' ? n.bulanan : '-'}</span>
                            )}
                          </td>
                        )}

                        {/* UTS */}
                        {(examCategory === 'all' || examCategory === 'uts') && (
                          <td className="px-3 py-3.5 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUts} onChange={e => setEditUts(e.target.value)}
                                placeholder="0" className="w-16 px-2 py-1 text-center font-bold border-2 border-teal-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            ) : (
                              <span className={scoreColor(n?.uts)}>{n && typeof n.uts === 'number' ? n.uts : '-'}</span>
                            )}
                          </td>
                        )}

                        {/* UAS Tulis */}
                        {(examCategory === 'all' || examCategory === 'uas') && (
                          <td className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUas} onChange={e => setEditUas(e.target.value)}
                                placeholder="0" className="w-16 px-2 py-1 text-center font-bold border-2 border-rose-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500" />
                            ) : (
                              <span className={scoreColor(n?.uas)}>{n && typeof n.uas === 'number' ? n.uas : '-'}</span>
                            )}
                          </td>
                        )}

                        {/* UAS Lisan */}
                        {(examCategory === 'all' || examCategory === 'uasLisan') && (
                          <td className="px-3 py-3.5 text-center border-r border-slate-200 dark:border-slate-800">
                            {isEditing ? (
                              <input type="number" min="0" max="100" value={editUasLisan} onChange={e => setEditUasLisan(e.target.value)}
                                placeholder="0" className="w-16 px-2 py-1 text-center font-bold border-2 border-fuchsia-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                            ) : (
                              <span className={scoreColor(n?.uasLisan)}>{n && typeof n.uasLisan === 'number' ? n.uasLisan : '-'}</span>
                            )}
                          </td>
                        )}

                        {/* Nilai Akhir Rapor */}
                        <td className="px-3 py-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950/30 border-r border-indigo-200 dark:border-indigo-800">
                          {avg > 0 ? (
                            <span className="font-black text-sm text-indigo-700 dark:text-indigo-300">{avg}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Catatan */}
                        <td className="px-3 py-3.5">
                          {isEditing ? (
                            <input type="text" placeholder="Catatan guru..." value={editNotes} onChange={e => setEditNotes(e.target.value)}
                              className="w-full px-2.5 py-1 border border-indigo-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          ) : (
                            <span className="text-slate-500 text-xs">{n?.notes || '-'}</span>
                          )}
                        </td>

                        {/* Aksi Edit & Hapus */}
                        <td className="px-3 py-3.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center space-x-1 justify-center">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditHarian('0'); setEditBulanan('0'); setEditUts('0'); setEditUas('0'); setEditUasLisan('0');
                                }}
                                title="Reset Nilai ke 0"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg cursor-pointer transition"
                                disabled={saving}
                              >
                                <RotateCcw className="w-4 h-4"/>
                              </button>
                              <button type="button" onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer" disabled={saving}><X className="w-4 h-4"/></button>
                              <button type="button" onClick={() => handleSaveSingle(santri.id)} className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer font-bold shadow-xs" disabled={saving}><Save className="w-4 h-4"/></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button type="button" onClick={() => startEdit(santri.id, n)} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700">
                                <Edit className="w-3.5 h-3.5" />
                                <span>{n ? 'Edit' : 'Input'}</span>
                              </button>
                              {n && (
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteNilai(santri.id, filterSubject)}
                                  title="Hapus Data Nilai Santri Ini"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                                  disabled={saving}
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* MODE 2: PER SANTRI (INPUT / EDIT SELURUH MAPEL UNTUK 1 SANTRI) */}
            {viewMode === 'per_santri' && activeSantriObj && (
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-600" />
                      <span>{activeSantriObj.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">NIS: {activeSantriObj.nis} | Mengisi seluruh nilai mata pelajaran untuk santri ini.</p>
                  </div>
                  <button 
                    onClick={handleSavePerSantri} 
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Memproses...' : 'Simpan Seluruh Mapel Santri Ini'}</span>
                  </button>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3">Mata Pelajaran</th>
                      <th className="px-3 py-3 text-center w-24">Harian</th>
                      <th className="px-3 py-3 text-center w-24">Bulanan</th>
                      <th className="px-3 py-3 text-center w-24">UTS (Mid)</th>
                      <th className="px-3 py-3 text-center w-24">UAS Tulis</th>
                      <th className="px-3 py-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">UAS Lisan</th>
                      <th className="px-3 py-3">Catatan Per Mapel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjects.map((sub, idx) => {
                      const item = perSantriData[sub.id] || { harian: '', bulanan: '', uts: '', uas: '', uasLisan: '', notes: '' };

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-center font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">{sub.name}</td>

                          <td className="px-3 py-3 text-center">
                            <input type="number" min="0" max="100" value={item.harian} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, harian: e.target.value } });
                            }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-indigo-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" />
                          </td>

                          <td className="px-3 py-3 text-center">
                            <input type="number" min="0" max="100" value={item.bulanan} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, bulanan: e.target.value } });
                            }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-amber-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-amber-500" />
                          </td>

                          <td className="px-3 py-3 text-center">
                            <input type="number" min="0" max="100" value={item.uts} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, uts: e.target.value } });
                            }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-teal-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-teal-500" />
                          </td>

                          <td className="px-3 py-3 text-center">
                            <input type="number" min="0" max="100" value={item.uas} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, uas: e.target.value } });
                            }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-rose-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-rose-500" />
                          </td>

                          <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-700">
                            <input type="number" min="0" max="100" value={item.uasLisan} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, uasLisan: e.target.value } });
                            }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-fuchsia-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-fuchsia-500" />
                          </td>

                          <td className="px-3 py-3">
                            <input type="text" value={item.notes} onChange={e => {
                              setPerSantriData({ ...perSantriData, [sub.id]: { ...item, notes: e.target.value } });
                            }} placeholder="Catatan..." className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODE 3: EDIT MASSAL (BULK GRID FOR SELECTED SUBJECT) */}
            {viewMode === 'bulk_mapel' && (
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-900/60">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-24">NIS</th>
                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Nama Santri</th>
                    <th className="px-3 py-3 text-center w-24">Harian</th>
                    <th className="px-3 py-3 text-center w-24">Bulanan</th>
                    <th className="px-3 py-3 text-center w-24">UTS (Mid)</th>
                    <th className="px-3 py-3 text-center w-24">UAS Tulis</th>
                    <th className="px-3 py-3 text-center w-24 border-r border-slate-200 dark:border-slate-700">UAS Lisan</th>
                    <th className="px-3 py-3">Catatan Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {santriList.map((santri, idx) => {
                    const item = bulkMapelData[santri.id] || { harian: '', bulanan: '', uts: '', uas: '', uasLisan: '', notes: '' };

                    return (
                      <tr key={santri.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-center font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{santri.nis}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                          {santri.name}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <input type="number" min="0" max="100" value={item.harian} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, harian: e.target.value } });
                          }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <input type="number" min="0" max="100" value={item.bulanan} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, bulanan: e.target.value } });
                          }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500" />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <input type="number" min="0" max="100" value={item.uts} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, uts: e.target.value } });
                          }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-teal-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500" />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <input type="number" min="0" max="100" value={item.uas} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, uas: e.target.value } });
                          }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-rose-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500" />
                        </td>

                        <td className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-700">
                          <input type="number" min="0" max="100" value={item.uasLisan} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, uasLisan: e.target.value } });
                          }} placeholder="0" className="w-16 px-2 py-1 text-center font-bold border border-fuchsia-200 rounded-lg text-xs focus:ring-2 focus:ring-fuchsia-500" />
                        </td>

                        <td className="px-3 py-3">
                          <input type="text" value={item.notes} onChange={e => {
                            setBulkMapelData({ ...bulkMapelData, [santri.id]: { ...item, notes: e.target.value } });
                          }} placeholder="Catatan..." className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* MODE 4: UJIAN LISAN */}
            {viewMode === 'lisan' && (
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-fuchsia-100/80 dark:bg-fuchsia-950/60 text-fuchsia-900 dark:text-fuchsia-200 border-b border-fuchsia-200 dark:border-fuchsia-800">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-24">NIS</th>
                    <th className="px-4 py-3">Nama Santri</th>
                    <th className="px-4 py-3 text-center w-48 font-black">Nilai Ujian Lisan (0 - 100)</th>
                    <th className="px-4 py-3">Catatan / Evaluasi Lisan</th>
                    <th className="px-4 py-3 text-center w-28">Aksi Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fuchsia-50 dark:divide-slate-800">
                  {santriList.map((santri, idx) => {
                    const n = nilaiList.find(x => (x.santriId === santri.id || (x as any).santri_id === santri.id) && (x.subjectId === filterSubject || (x as any).subject_id === filterSubject));
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
                            <span className={`font-black text-sm px-3 py-1 rounded-full ${n && typeof n.uasLisan === 'number' ? 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/60 dark:text-fuchsia-300 border border-fuchsia-300' : 'text-slate-300'}`}>
                              {n && typeof n.uasLisan === 'number' ? `${n.uasLisan} / 100` : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="text" placeholder="Catatan lisan (misal: Tajwid sangat baik)" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                              className="w-full px-3 py-1 border border-fuchsia-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                          ) : (
                            <span className="text-slate-500 text-xs">{n?.notes || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center space-x-1 justify-center">
                              <button type="button" onClick={() => setEditUasLisan('0')} title="Reset Nilai Lisan ke 0" className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg cursor-pointer"><RotateCcw className="w-4 h-4"/></button>
                              <button type="button" onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer" disabled={saving}><X className="w-4 h-4"/></button>
                              <button type="button" onClick={() => handleSaveSingle(santri.id)} className="p-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-bold shadow-xs cursor-pointer" disabled={saving}><Save className="w-4 h-4"/></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button type="button" onClick={() => startEdit(santri.id, n)} className="px-3.5 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/60 dark:text-fuchsia-300 rounded-xl text-xs font-extrabold border border-fuchsia-200 transition cursor-pointer">
                                {n && typeof n.uasLisan === 'number' ? 'Edit Lisan' : 'Input Lisan'}
                              </button>
                              {n && (
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteNilai(santri.id, filterSubject)}
                                  title="Hapus Nilai Lisan Santri Ini"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                                  disabled={saving}
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* MODE 5: AKHLAQ KESEHARIAN SANTRI (BOBOT 20% RAPOR) */}
            {viewMode === 'akhlaq' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        Penilaian Akhlaq Keseharian Santri (Bukan Pelajaran)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Nilai ini dinilai berdasarkan adab santri, kedisiplinan shalat/ibadah, dan ketertiban harian di ma'had. Nilai ini menyumbang <strong>20% bobot langsung</strong> pada Nilai Akhir Rapor santri (Total 100%).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveBulkAkhlaq}
                    disabled={saving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 self-start md:self-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai Akhlaq'}</span>
                  </button>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3 w-24">NIS</th>
                      <th className="px-4 py-3 border-r border-emerald-200 dark:border-emerald-800">Nama Santri</th>
                      <th className="px-3 py-3 text-center w-32 bg-emerald-200/60 dark:bg-emerald-900/60 font-black text-emerald-900 dark:text-emerald-100 border-r border-emerald-300 dark:border-emerald-700">
                        Nilai Akhlaq (20%)
                      </th>
                      <th className="px-3 py-3 text-center w-24">Predikat</th>
                      <th className="px-3 py-3 text-center w-24">Adab & Kesopanan</th>
                      <th className="px-3 py-3 text-center w-24">Kedisiplinan & Ibadah</th>
                      <th className="px-3 py-3 text-center w-24 border-r border-emerald-200 dark:border-emerald-800">Kebersihan & Kerapian</th>
                      <th className="px-3 py-3">Catatan Perkembangan Karakter</th>
                      <th className="px-3 py-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 dark:divide-slate-800">
                    {santriList.map((santri, idx) => {
                      const item = bulkAkhlaqData[santri.id] || { score: '90', adab: '90', ibadah: '90', kebersihan: '90', notes: '' };
                      const numScore = parseScore(item.score || '90');
                      const pred = numScore >= 90 ? 'A' : numScore >= 80 ? 'B' : numScore >= 70 ? 'C' : 'D';
                      const predBadge = numScore >= 90 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : numScore >= 80 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : numScore >= 70 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : 'bg-rose-100 text-rose-800 border-rose-300';

                      return (
                        <tr key={santri.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-center font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{santri.nis}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100 border-r border-emerald-100 dark:border-slate-800">
                            {santri.name}
                          </td>

                          {/* Nilai Akhlaq Terpadu */}
                          <td className="px-3 py-3 text-center bg-emerald-50/60 dark:bg-emerald-950/40 border-r border-emerald-200 dark:border-emerald-800">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.score}
                              onChange={e => {
                                const val = e.target.value;
                                setBulkAkhlaqData(prev => ({
                                  ...prev,
                                  [santri.id]: {
                                    ...item,
                                    score: val,
                                    adab: item.adab === item.score ? val : item.adab,
                                    ibadah: item.ibadah === item.score ? val : item.ibadah,
                                    kebersihan: item.kebersihan === item.score ? val : item.kebersihan,
                                  }
                                }));
                              }}
                              placeholder="90"
                              className="w-20 px-2 py-1.5 text-center font-black text-sm border-2 border-emerald-400 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                            />
                          </td>

                          {/* Predikat */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${predBadge}`}>
                              {pred}
                            </span>
                          </td>

                          {/* Adab & Kesopanan */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.adab}
                              onChange={e => setBulkAkhlaqData(prev => ({ ...prev, [santri.id]: { ...item, adab: e.target.value } }))}
                              placeholder="90"
                              className="w-16 px-2 py-1 text-center font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Kedisiplinan & Ibadah */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.ibadah}
                              onChange={e => setBulkAkhlaqData(prev => ({ ...prev, [santri.id]: { ...item, ibadah: e.target.value } }))}
                              placeholder="90"
                              className="w-16 px-2 py-1 text-center font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Kebersihan & Kerapian */}
                          <td className="px-3 py-3 text-center border-r border-emerald-100 dark:border-slate-800">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.kebersihan}
                              onChange={e => setBulkAkhlaqData(prev => ({ ...prev, [santri.id]: { ...item, kebersihan: e.target.value } }))}
                              placeholder="90"
                              className="w-16 px-2 py-1 text-center font-bold border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Catatan */}
                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={item.notes}
                              onChange={e => setBulkAkhlaqData(prev => ({ ...prev, [santri.id]: { ...item, notes: e.target.value } }))}
                              placeholder="Catatan sikap / ketertiban santri..."
                              className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Aksi Simpan Baris */}
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleAkhlaq(santri.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center justify-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODE 6: REKAP RAPOR */}
            {viewMode === 'rapor' && (
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 w-12">No</th>
                    <th className="px-4 py-3 w-24">NIS</th>
                    <th className="px-4 py-3">Nama Santri</th>
                    <th className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-300 font-bold">Akhlaq (20%)</th>
                    <th className="px-4 py-3 text-center text-indigo-700 dark:text-indigo-300 font-black">Nilai Akhir Rapor</th>
                    <th className="px-4 py-3 text-center w-64">Aksi Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {santriList.map((santri, idx) => {
                    const santriNilai = nilaiList.filter(x => x.santriId === santri.id || (x as any).santri_id === santri.id);
                    const santriAkhlaq = getSantriAkhlaqScore(santri.id);
                    let totalScore = 0;
                    let subjectCount = 0;

                    subjects.forEach(sub => {
                      const n = santriNilai.find(x => x.subjectId === sub.id || (x as any).subject_id === sub.id);
                      if (n) {
                        const avg = nilaiAvg(n, santri.id);
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
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                            {santriAkhlaq}
                          </span>
                        </td>
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
              </table>
            )}
          </div>
        )}
      </div>

      {/* Rapor Modal */}
      {raporModalSantri && (
        <RaporModal
          santri={raporModalSantri}
          academicYearId={filterAY}
          semesterId={filterSem}
          onClose={() => setRaporModalSantri(null)}
          onSave={() => setRaporModalSantri(null)}
        />
      )}
    </div>
  );
}

