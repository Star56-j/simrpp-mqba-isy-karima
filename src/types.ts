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

  // === FORMAT KURIKULUM MERDEKA ===

  // A. Informasi Umum
  profilPelajar: string;        // Dimensi Profil Pelajar yang relevan
  sarana: string;               // Sarana & prasarana

  // B. Capaian & Tujuan
  capaiPembelajaran: string;    // Capaian Pembelajaran (CP) — per fase
  tujuanPembelajaran: string;   // Tujuan Pembelajaran (TP) per tahun
  alurTP: string;               // Alur Tujuan Pembelajaran (ATP)

  // C. Materi per Semester
  materiGanjil: string;         // Pokok materi semester ganjil
  materiGenap: string;          // Pokok materi semester genap
  totalMeetingsGanjil: number;
  totalMeetingsGenap: number;

  // D. Pembelajaran
  pendahuluan: string;          // Kegiatan pembuka (apersepsi, motivasi)
  kegiatanInti: string;         // Kegiatan inti (eksplorasi, kolaborasi, refleksi)
  penutup: string;              // Kegiatan penutup & refleksi
  metode: string;               // Metode / model pembelajaran
  media: string;                // Media & alat

  // E. Asesmen
  asesmenDiagnostik: string;    // Asesmen awal / diagnostik
  asesmenFormatif: string;      // Asesmen formatif (proses)
  asesmenSumatif: string;       // Asesmen sumatif (akhir)

  // F. Diferensiasi & Pengayaan
  diferensiasi: string;         // Pembelajaran berdiferensiasi
  pengayaan: string;            // Pengayaan & remedial

  // G. Catatan
  catatan: string;

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

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface Attendance {
  id: string;
  teacherId: string;
  date: string;           // ISO date string YYYY-MM-DD
  status: AttendanceStatus;
  notes: string;
  academicYearId: string;
  semesterId: string;
  recordedBy: string;     // userId admin yang mencatat
  createdAt: string;
  updatedAt: string;
  // Decorated
  teacher?: Teacher;
  academicYear?: AcademicYear;
  semester?: Semester;
}

export interface AttendanceSummary {
  teacherId: string;
  teacherName: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
  persentaseHadir: number;
}

export interface SantriAttendance {
  id: string;
  classId: string;
  date: string;
  jumlahHadir: number;
  jumlahIzin: number;
  jumlahSakit: number;
  jumlahAlpha: number;
  jumlahTotal: number;
  notes: string;
  academicYearId: string;
  semesterId: string;
  recordedBy: string;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
  // Decorated
  class?: SchoolClass;
  academicYear?: AcademicYear;
  semester?: Semester;
}

export interface SantriAttendanceSummary {
  classId: string;
  className: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
  rataHadir: number;
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

export interface WaliKelas {
  id: string;
  classId: string;
  teacherId: string;
  academicYearId: string;
  semesterId: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
  // Decorated
  class?: SchoolClass;
  teacher?: Teacher;
  academicYear?: AcademicYear;
  semester?: Semester;
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
