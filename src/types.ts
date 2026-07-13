export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Guru';
  teacherId?: string;
  teacher?: Teacher;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface Subject {
  id: string;
  name: string;
  category: 'Al-Qur\'an' | 'Diniyah' | 'Bahasa' | 'Umum';
}

export interface SchoolClass {
  id: string;
  name: string;
  level: 'I\'dad' | 'Wustho';
}

export interface AcademicYear {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: 'Ganjil' | 'Genap';
}

export interface TeachingSchedule {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  time: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  class?: SchoolClass;
  teacher?: Teacher;
  subject?: Subject;
  academicYear?: AcademicYear;
  semester?: Semester;
}

// Satu item silabus per pertemuan dalam RPP tahunan
export interface SyllabusItem {
  meetingNo: number;
  semester: 'Ganjil' | 'Genap';
  topic: string;         // Pokok bahasan / materi
  date?: string;         // Tanggal rencana pelaksanaan (opsional)
}

export interface RPP {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;

  // Identitas RPP Tahunan
  kompetensiInti: string;          // Kompetensi Inti / KI
  kompetensiDasar: string;         // Kompetensi Dasar / KD

  // Semester Ganjil
  objectivesGanjil: string;        // Tujuan pembelajaran semester ganjil
  totalMeetingsGanjil: number;     // Jumlah pertemuan semester ganjil
  materialsGanjil: string;         // Ringkasan materi semester ganjil

  // Semester Genap
  objectivesGenap: string;         // Tujuan pembelajaran semester genap
  totalMeetingsGenap: number;      // Jumlah pertemuan semester genap
  materialsGenap: string;          // Ringkasan materi semester genap

  // Komponen umum (berlaku kedua semester)
  method: string;                  // Metode pembelajaran
  media: string;                   // Media & alat pembelajaran
  assessment: string;              // Penilaian / asesmen
  notes: string;                   // Catatan tambahan

  // Silabus rinci (daftar materi per pertemuan)
  syllabusItems: SyllabusItem[];

  attachmentUrl?: string;
  attachmentName?: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
  revisionNotes?: string;
  updatedAt: string;
  createdAt: string;

  // Decorated (dari join)
  class?: SchoolClass;
  subject?: Subject;
  teacher?: Teacher;
  academicYear?: AcademicYear;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  teachers: number;
  subjects: number;
  classes: number;
  schedules: number;
  rpp: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    revision: number;
  };
  activityLogs: ActivityLog[];
}

export interface GuruStats {
  mySchedulesCount: number;
  rpp: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    revision: number;
  };
}
