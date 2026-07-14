import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Guru';
  teacherId?: string;
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
}

export interface SyllabusItem {
  meetingNo: number;
  semester: 'Ganjil' | 'Genap';
  topic: string;
  date?: string;
}

export interface RPP {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  academicYearId: string;

  kompetensiInti: string;
  kompetensiDasar: string;

  objectivesGanjil: string;
  totalMeetingsGanjil: number;
  materialsGanjil: string;

  objectivesGenap: string;
  totalMeetingsGenap: number;
  materialsGenap: string;

  method: string;
  media: string;
  assessment: string;
  notes: string;

  syllabusItems: SyllabusItem[];

  attachmentUrl?: string;
  attachmentName?: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
  revisionNotes?: string;
  updatedAt: string;
  createdAt: string;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface Attendance {
  id: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
  academicYearId: string;
  semesterId: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
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

export interface DatabaseSchema {
  users: User[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  teachingSchedules: TeachingSchedule[];
  rpps: RPP[];
  attendances: Attendance[];
  activityLogs: ActivityLog[];
}

// Gunakan DATA_PATH dari environment variable (Railway persistent volume)
// atau fallback ke folder data/ lokal
const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

// Ensure database directory exists
function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function getDatabase(): DatabaseSchema {
  ensureDbDir();
  if (!fs.existsSync(DB_PATH)) {
    const db = seedDatabase();
    saveDatabase(db);
    return db;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data) as DatabaseSchema;
    // If users array is empty, the database was never seeded properly — seed now
    if (!parsed.users || parsed.users.length === 0) {
      console.log("Database exists but has no users, seeding...");
      const db = seedDatabase();
      saveDatabase(db);
      return db;
    }
    // Migrate: tambah attendances jika belum ada
    if (!parsed.attendances) {
      parsed.attendances = [];
      saveDatabase(parsed);
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, reseeding...", error);
    const db = seedDatabase();
    saveDatabase(db);
    return db;
  }
}

export function saveDatabase(db: DatabaseSchema) {
  ensureDbDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function logActivity(userId: string, userName: string, userRole: string, action: string, details: string) {
  const db = getDatabase();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName,
    userRole,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.activityLogs.unshift(newLog); // Put latest logs at the top
  // Limit to last 500 logs to prevent file bloat
  if (db.activityLogs.length > 500) {
    db.activityLogs = db.activityLogs.slice(0, 500);
  }
  saveDatabase(db);
}

function seedDatabase(): DatabaseSchema {
  console.log("Seeding fresh database...");
  
  // Teachers list
  const teacherNames = [
    "Ust. Abdul Malik", "Ust. Umar", "Ust. Zulfikar", "Ust. Karim", "Ust. Fredy",
    "Ust. Abdullah", "Ust. Yunan", "Usth. Anim", "Usth. Azizah", "Ust. Aidil",
    "Usth. Saiba Musyaiya", "Ust. Arya", "Ust. Kholif", "Ust. Faqih", "Usth. Nurika",
    "Ust. Hafizh", "Ust. Farhan", "Ust. Tubagus", "Usth. Bela", "Usth. Dila",
    "Usth. Ramiza", "Ust. Musthofa", "Usth. Ilfah", "Usth. Hasri", "Ust. Latief",
    "Ust. Zain", "Ust. Akmal", "Ust. Rezkidori", "Usth. Lina"
  ];

  const teachers: Teacher[] = teacherNames.map((name, index) => {
    // Generate clean slug email
    const slug = name.toLowerCase()
      .replace(/ust\.\s*/g, '')
      .replace(/usth\.\s*/g, '')
      .replace(/[^a-z]/g, '');
    return {
      id: `teacher-${index + 1}`,
      name,
      email: `${slug}@mqba.sch.id`
    };
  });

  // Create Users (Default credentials)
  const users: User[] = [
    // Seeder Admin
    {
      id: "user-admin-1",
      name: "Aidil Ibnu Salam",
      email: "aidilibnusalam3@gmail.com",
      passwordHash: hashPassword("parabek123"),
      role: "Admin"
    }
  ];

  // Seed standard guru password "guru123"
  const defaultGuruPasswordHash = hashPassword("guru123");

  teachers.forEach((t) => {
    users.push({
      id: `user-guru-${t.id}`,
      name: t.name,
      email: t.email,
      passwordHash: defaultGuruPasswordHash,
      role: "Guru",
      teacherId: t.id
    });
  });

  // Subjects (Mata Pelajaran)
  const subjects: Subject[] = [
    // Al-Qur'an
    { id: "sub-1", name: "Halaqah Qur'an", category: "Al-Qur'an" },
    { id: "sub-2", name: "Tahsin", category: "Al-Qur'an" },
    { id: "sub-3", name: "Tajwid", category: "Al-Qur'an" },
    { id: "sub-4", name: "Muroja'ah Hafalan", category: "Al-Qur'an" },
    // Diniyah
    { id: "sub-5", name: "Aqidah", category: "Diniyah" },
    { id: "sub-6", name: "Akhlaq", category: "Diniyah" },
    { id: "sub-7", name: "Fiqih", category: "Diniyah" },
    { id: "sub-8", name: "Adab wa Tarbiyah", category: "Diniyah" },
    { id: "sub-9", name: "Sirah", category: "Diniyah" },
    { id: "sub-10", name: "Manhaji", category: "Diniyah" },
    { id: "sub-11", name: "Jazary", category: "Diniyah" },
    { id: "sub-12", name: "Khot", category: "Diniyah" },
    // Bahasa
    { id: "sub-13", name: "Arabiyah Baina Yadaik (ABY)", category: "Bahasa" },
    { id: "sub-14", name: "Bahasa Indonesia", category: "Bahasa" },
    { id: "sub-15", name: "Bahasa Inggris", category: "Bahasa" },
    // Umum
    { id: "sub-16", name: "Matematika", category: "Umum" },
    { id: "sub-17", name: "IPA", category: "Umum" },
    { id: "sub-18", name: "Olahraga", category: "Umum" },
    { id: "sub-19", name: "Tai Chi", category: "Umum" }
  ];

  // Classes (Kelas)
  const classes: SchoolClass[] = [
    // I'dad
    { id: "cls-1", name: "PA", level: "I'dad" },
    { id: "cls-2", name: "PI", level: "I'dad" },
    // Wustho
    { id: "cls-3", name: "1 PA", level: "Wustho" },
    { id: "cls-4", name: "1 PI", level: "Wustho" },
    { id: "cls-5", name: "2 PA", level: "Wustho" },
    { id: "cls-6", name: "2 PI", level: "Wustho" },
    { id: "cls-7", name: "3", level: "Wustho" }
  ];

  // Academic Years
  const academicYears: AcademicYear[] = [
    { id: "ay-1", name: "2026 / 2027" }
  ];

  // Semesters
  const semesters: Semester[] = [
    { id: "sem-1", name: "Ganjil" },
    { id: "sem-2", name: "Genap" }
  ];

  // Teaching Schedules (Jadwal KBM)
  // Let's seed schedules for the first few teachers to allow immediate testing!
  const teachingSchedules: TeachingSchedule[] = [
    {
      id: "sch-1",
      day: "Senin",
      time: "07:30 - 09:00",
      classId: "cls-3", // 1 PA
      teacherId: "teacher-1", // Ust. Abdul Malik
      subjectId: "sub-1", // Halaqah Qur'an
      academicYearId: "ay-1",
      semesterId: "sem-1"
    },
    {
      id: "sch-2",
      day: "Senin",
      time: "09:30 - 11:00",
      classId: "cls-3", // 1 PA
      teacherId: "teacher-1", // Ust. Abdul Malik
      subjectId: "sub-2", // Tahsin
      academicYearId: "ay-1",
      semesterId: "sem-1"
    },
    {
      id: "sch-3",
      day: "Selasa",
      time: "08:00 - 09:30",
      classId: "cls-5", // 2 PA
      teacherId: "teacher-2", // Ust. Umar
      subjectId: "sub-5", // Aqidah
      academicYearId: "ay-1",
      semesterId: "sem-1"
    },
    {
      id: "sch-4",
      day: "Rabu",
      time: "10:00 - 11:30",
      classId: "cls-1", // PA
      teacherId: "teacher-3", // Ust. Zulfikar
      subjectId: "sub-13", // ABY
      academicYearId: "ay-1",
      semesterId: "sem-1"
    },
    {
      id: "sch-5",
      day: "Kamis",
      time: "07:30 - 09:00",
      classId: "cls-4", // 1 PI
      teacherId: "teacher-8", // Usth. Anim
      subjectId: "sub-7", // Fiqih
      academicYearId: "ay-1",
      semesterId: "sem-1"
    }
  ];

  // Seed 2 initial RPP items for immediate demonstration
  const rpps: RPP[] = [
    {
      id: "rpp-demo-1",
      teacherId: "teacher-1",
      subjectId: "sub-1",
      classId: "cls-3",
      academicYearId: "ay-1",
      kompetensiInti: "Menguasai bacaan Al-Qur'an dengan tajwid yang benar dan mampu menghafal juz-juz pilihan secara tartil.",
      kompetensiDasar: "Membaca dan menghafal Surat-surat dalam Al-Qur'an dengan makhraj dan tajwid yang tepat sesuai kaidah ilmu tajwid.",
      objectivesGanjil: "Santri mampu menyetorkan hafalan Juz 30 (Juz 'Amma) secara lancar dengan makhraj dan tajwid yang benar.",
      totalMeetingsGanjil: 18,
      materialsGanjil: "Hafalan Juz 30: An-Naba' s.d. Al-Fajr, Muroja'ah harian, Evaluasi Tajwid",
      objectivesGenap: "Santri mampu menyetorkan hafalan Juz 29 (Al-Mulk s.d. Al-Mursalat) secara lancar.",
      totalMeetingsGenap: 18,
      materialsGenap: "Hafalan Juz 29: Al-Mulk s.d. Al-Mursalat, Muroja'ah gabungan Juz 29-30",
      method: "Talaqqi, Tikrar (Pengulangan Mandiri), Sima'i (Menyimak), Setoran Individual",
      media: "Mushaf Al-Qur'an Pojok, Lembar Monitor Hafalan Santri, Papan Tulis",
      assessment: "Setoran kelancaran hafalan, ketepatan makharijul huruf, sifatul huruf, dan tajwid.",
      notes: "Santri yang belum lancar Juz 30 didahulukan muroja'ah sebelum menambah hafalan baru.",
      syllabusItems: [
        { meetingNo: 1, semester: 'Ganjil', topic: "Orientasi & Tes Awal Hafalan Juz 30", date: "2026-07-14" },
        { meetingNo: 2, semester: 'Ganjil', topic: "Hafalan An-Naba' (78:1-20)", date: "2026-07-21" },
        { meetingNo: 3, semester: 'Ganjil', topic: "Hafalan An-Naba' (78:21-40) + Muroja'ah", date: "2026-07-28" },
        { meetingNo: 4, semester: 'Ganjil', topic: "Hafalan An-Nazi'at (79:1-46)", date: "2026-08-04" },
        { meetingNo: 5, semester: 'Ganjil', topic: "'Abasa & At-Takwir", date: "2026-08-11" },
        { meetingNo: 6, semester: 'Ganjil', topic: "Al-Infitar, Al-Mutaffifin", date: "2026-08-18" },
        { meetingNo: 1, semester: 'Genap', topic: "Muroja'ah Juz 30 + Orientasi Juz 29", date: "2027-01-13" },
        { meetingNo: 2, semester: 'Genap', topic: "Hafalan Al-Mulk (67:1-30)", date: "2027-01-20" },
        { meetingNo: 3, semester: 'Genap', topic: "Hafalan Al-Qalam (68:1-52)", date: "2027-01-27" },
      ],
      status: "Disetujui",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "rpp-demo-2",
      teacherId: "teacher-2",
      subjectId: "sub-5",
      classId: "cls-5",
      academicYearId: "ay-1",
      kompetensiInti: "Memahami, menghayati, dan mengamalkan ajaran Islam berdasarkan dalil-dalil Qur'an dan Sunnah yang shahih.",
      kompetensiDasar: "Menjelaskan rukun iman, asmaul husna, serta akidah ahlus sunnah wal jama'ah secara sistematis.",
      objectivesGanjil: "Santri memahami dan mampu menjelaskan 6 rukun iman beserta dalil-dalilnya dari Al-Qur'an dan Hadits shahih.",
      totalMeetingsGanjil: 16,
      materialsGanjil: "Rukun Iman (6 Rukun), Iman kepada Allah & Asmaul Husna, Iman kepada Malaikat, Iman kepada Kitab-kitab",
      objectivesGenap: "Santri memahami Iman kepada Rasul, Hari Kiamat, dan Qadha-Qadar serta implementasinya dalam kehidupan.",
      totalMeetingsGenap: 16,
      materialsGenap: "Iman kepada Rasul, Hari Akhir (tanda-tanda kiamat, surga-neraka), Qadha dan Qadar",
      method: "Ceramah Interaktif, Halaqah Diskusi, Tanya Jawab, Pembacaan Kitab",
      media: "Kitab Aqidah (Ushul Tsalatsah), Slide Presentasi, Papan Tulis, Video Edukasi",
      assessment: "Kuis lisan, keaktifan diskusi, hafalan dalil-dalil aqidah, tugas rangkuman tertulis.",
      notes: "Tekankan aqidah ahlus sunnah wal jama'ah, hindari pembahasan khilafiyah yang tidak produktif.",
      syllabusItems: [
        { meetingNo: 1, semester: 'Ganjil', topic: "Pengantar Aqidah Islam & Urgensinya", date: "2026-07-14" },
        { meetingNo: 2, semester: 'Ganjil', topic: "Rukun Iman: Pengertian & Dalil Global", date: "2026-07-21" },
        { meetingNo: 3, semester: 'Ganjil', topic: "Iman kepada Allah: Tauhid Rububiyyah", date: "2026-07-28" },
        { meetingNo: 4, semester: 'Ganjil', topic: "Iman kepada Allah: Tauhid Uluhiyyah", date: "2026-08-04" },
        { meetingNo: 5, semester: 'Ganjil', topic: "Asmaul Husna (1-20)", date: "2026-08-11" },
        { meetingNo: 6, semester: 'Ganjil', topic: "Asmaul Husna (21-40) + Kuis", date: "2026-08-18" },
        { meetingNo: 1, semester: 'Genap', topic: "Iman kepada Rasul: Sifat Wajib & Mustahil", date: "2027-01-13" },
        { meetingNo: 2, semester: 'Genap', topic: "Iman kepada Hari Kiamat", date: "2027-01-20" },
        { meetingNo: 3, semester: 'Genap', topic: "Qadha dan Qadar", date: "2027-01-27" },
      ],
      status: "Menunggu Persetujuan",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Logs
  const activityLogs: ActivityLog[] = [
    {
      id: "log-seed-1",
      userId: "user-admin-1",
      userName: "Aidil Ibnu Salam",
      userRole: "Admin",
      action: "System Seed",
      details: "Sistem berhasil diinisialisasi dan data master berhasil di-seed.",
      timestamp: new Date().toISOString()
    }
  ];

  return {
    users,
    teachers,
    subjects,
    classes,
    academicYears,
    semesters,
    teachingSchedules,
    rpps,
    attendances: [],
    activityLogs
  };
}
