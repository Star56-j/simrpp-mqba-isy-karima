import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Guru' | 'WaliSantri';
  teacherId?: string;
  santriId?: string;
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

  // Format Kurikulum Merdeka
  profilPelajar: string;
  sarana: string;
  capaiPembelajaran: string;
  tujuanPembelajaran: string;
  alurTP: string;
  materiGanjil: string;
  materiGenap: string;
  totalMeetingsGanjil: number;
  totalMeetingsGenap: number;
  pendahuluan: string;
  kegiatanInti: string;
  penutup: string;
  metode: string;
  media: string;
  asesmenDiagnostik: string;
  asesmenFormatif: string;
  asesmenSumatif: string;
  diferensiasi: string;
  pengayaan: string;
  catatan: string;
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
}

export interface Santri {
  id: string;
  nis: string;
  name: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Nilai {
  id: string;
  santriId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  teacherId: string;
  harian: number;    // Nilai Harian
  bulanan: number;   // Nilai Bulanan
  uts: number;       // Ujian Tengah Semester
  uas: number;       // Ujian Akhir Semester (Tulis)
  uasLisan: number;  // Ujian Akhir Semester Lisan
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pengumuman {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
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
  santriAttendances: SantriAttendance[];
  waliKelas: WaliKelas[];
  santri: Santri[];
  nilai: Nilai[];
  activityLogs: ActivityLog[];
  raporDetails: RaporDetail[];
  pengumuman: Pengumuman[];
}

export interface KepribadianItem {
  aspek: string;
  predikat: string;
  deskripsi: string;
}

export interface KetahfizhanItem {
  capaian: string;
  penilaian: string;
}

export interface EkstrakurikulerItem {
  namaKegiatan: string;
  nilai: string;
  keterangan: string;
}

export interface Ketidakhadiran {
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
}

export interface RaporDetail {
  id: string;
  santriId: string;
  academicYearId: string;
  semesterId: string;
  kepribadian: KepribadianItem[];
  ketahfizhan: KetahfizhanItem[];
  ekstrakurikuler: EkstrakurikulerItem[];
  ketidakhadiran: Ketidakhadiran;
  catatanWaliKelas: string;
  keputusanKenaikan: string;
  tanggapanOrangTua?: string;
  createdAt: string;
  updatedAt: string;
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

export const REAL_SANTRI_DATA = [
  // cls-3: Kelas VII Putra (19 santri)
  { name: "Ahmad Ajyad Syamil Sutrisno", classId: "cls-3" },
  { name: "Ahmad Fakhry Athallah", classId: "cls-3" },
  { name: "Athilasyah Rifqi Sulistyo", classId: "cls-3" },
  { name: "Baihaqi Hanif Abrorni", classId: "cls-3" },
  { name: "Fairuz Fahri Firmansyah", classId: "cls-3" },
  { name: "Hasbi Nafsi Jalalullah", classId: "cls-3" },
  { name: "Hisyam Zuhdi", classId: "cls-3" },
  { name: "Israr At Taufik", classId: "cls-3" },
  { name: "Keven Maghribi Darmaresta", classId: "cls-3" },
  { name: "Khoirul Akbar Nur Hidayatulloh", classId: "cls-3" },
  { name: "M Rajendra Ali Mudzakir", classId: "cls-3" },
  { name: "Muhammad Fatih Izzan An-Naqy", classId: "cls-3" },
  { name: "Muhammad Ilyas Anrisyab", classId: "cls-3" },
  { name: "Muhammad Yahya Izzuddin", classId: "cls-3" },
  { name: "Muhammad Yusuf Rifa'i", classId: "cls-3" },
  { name: "Ramdhan Ridhwanullah", classId: "cls-3" },
  { name: "Shofyan Abdillah Achmad", classId: "cls-3" },
  { name: "Tsaabit Qawiyyul Himmah", classId: "cls-3" },
  { name: "Yahya", classId: "cls-3" },

  // cls-4: Kelas VII Putri (11 santri)
  { name: "Abigail Madhalee Ariya Fatihah", classId: "cls-4" },
  { name: "Alya Mukhbita", classId: "cls-4" },
  { name: "Ammara taqiyya khoirunnisa", classId: "cls-4" },
  { name: "Annisauzzahro as-salamah Parapat", classId: "cls-4" },
  { name: "Ayesha khayla Salsabila", classId: "cls-4" },
  { name: "Cataleya Azzahwa Fieary", classId: "cls-4" },
  { name: "Filzah Taqy Hilmiyah Hanief", classId: "cls-4" },
  { name: "Marwa Az Zahira Ibrahim Pribadi", classId: "cls-4" },
  { name: "Maryam Muthiah Tafdlila", classId: "cls-4" },
  { name: "Shabiha Nadira Azzahra", classId: "cls-4" },
  { name: "Syakila Nada Salsabila", classId: "cls-4" },

  // cls-1: I'dad Putra (6 santri)
  { name: "Attahir Zarkasya Ramadhan", classId: "cls-1" },
  { name: "Bintang Bumi Langit Biru", classId: "cls-1" },
  { name: "Handade Yonca Satya Harjuna", classId: "cls-1" },
  { name: "Kenzie Iffat Itoniwa", classId: "cls-1" },
  { name: "Miqdaad Dzakiyy Hasan Faishal", classId: "cls-1" },
  { name: "Sae Sibghotallah", classId: "cls-1" },

  // cls-2: I'dad Putri (3 santri)
  { name: "Imtihan Syarifatul 'Ula", classId: "cls-2" },
  { name: "Iskanda Aulia Neisya", classId: "cls-2" },
  { name: "Naura Auni Qonita", classId: "cls-2" },

  // cls-5: Kelas VIII Putra (12 santri)
  { name: "Adit Wahyu Pratama", classId: "cls-5" },
  { name: "Azka Rasya Darmawan", classId: "cls-5" },
  { name: "Badar Farisul Qital", classId: "cls-5" },
  { name: "Farzan Fiza Ananta", classId: "cls-5" },
  { name: "Hamidurohman Hudzaifi", classId: "cls-5" },
  { name: "Hilmi Dzabihulloh", classId: "cls-5" },
  { name: "Muhammad Faathir Rusyada Azhar", classId: "cls-5" },
  { name: "Nizar Haidar Rahman", classId: "cls-5" },
  { name: "Raushan Akhtar Majid", classId: "cls-5" },
  { name: "Tristan Firafisa Parsa", classId: "cls-5" },
  { name: "Yafiq Alvaro", classId: "cls-5" },
  { name: "Yuwhay Haura Anbiiya", classId: "cls-5" },

  // cls-6: Kelas VIII Putri (7 santri)
  { name: "Raisa Shakila Putri", classId: "cls-6" },
  { name: "Shofiyyah Afnan", classId: "cls-6" },
  { name: "Dzakira Tsania Fahmi", classId: "cls-6" },
  { name: "Rafanda Rayyan Adeeva", classId: "cls-6" },
  { name: "Hafidzah Mumtaazah Ni'matullah", classId: "cls-6" },
  { name: "Hurin Iin Luluil Maknun", classId: "cls-6" },
  { name: "Queena Kayyisa Nararya", classId: "cls-6" },

  // cls-7: Kelas IX Putra (15 santri)
  { name: "Abdurrahman Az Zubair", classId: "cls-7" },
  { name: "Achmad Akmal Alhakim", classId: "cls-7" },
  { name: "Ahza Ibnu Hafiz", classId: "cls-7" },
  { name: "Albanna Sheeva", classId: "cls-7" },
  { name: "Arman Abdurrahman Nasution", classId: "cls-7" },
  { name: "Faiq Kamal Yazid Al-Bara", classId: "cls-7" },
  { name: "Jaisy Aliy Al Khalil", classId: "cls-7" },
  { name: "Mirza Alzam Azhari", classId: "cls-7" },
  { name: "Moh Khalifatullah Rosyad Al Amin", classId: "cls-7" },
  { name: "Muhammad Faruq Baharta", classId: "cls-7" },
  { name: "Muhammad Faqih Multazim", classId: "cls-7" },
  { name: "Muhammad Zidan Dhiyauddin", classId: "cls-7" },
  { name: "Rafasya Muhammad Firdaus An'Naba", classId: "cls-7" },
  { name: "Vajradhatu Keinan Noor", classId: "cls-7" },
  { name: "Ziyad Alhaq", classId: "cls-7" }
];

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
    // Migrate: tambah santriAttendances jika belum ada
    if (!parsed.santriAttendances) {
      parsed.santriAttendances = [];
      saveDatabase(parsed);
    }
    // Migrate: tambah waliKelas jika belum ada
    if (!parsed.waliKelas) {
      parsed.waliKelas = [];
      saveDatabase(parsed);
    }
    // Migrate: tambah santri jika belum ada
    if (!parsed.santri) {
      parsed.santri = [];
      saveDatabase(parsed);
    }
    // Migrate: tambah nilai jika belum ada
    if (!parsed.nilai) {
      parsed.nilai = [];
      saveDatabase(parsed);
    }
    // Migrate: tambah raporDetails jika belum ada
    if (!parsed.raporDetails) {
      parsed.raporDetails = [];
      saveDatabase(parsed);
    }
    // Migrate: tambah pengumuman jika belum ada
    if (!parsed.pengumuman) {
      parsed.pengumuman = [];
      saveDatabase(parsed);
    }
    // Migrate: konversi score tunggal → 4 kategori (harian, bulanan, uts, uas)
    if (parsed.nilai && parsed.nilai.length > 0 && (parsed.nilai[0] as any).score !== undefined) {
      parsed.nilai = parsed.nilai.map((n: any) => ({
        ...n,
        harian: n.score || 0,
        bulanan: n.bulanan || 0,
        uts: n.uts || 0,
        uas: n.uas || 0,
        uasLisan: n.uasLisan || 0,
      }));
      // Remove old score field
      parsed.nilai.forEach((n: any) => { delete n.score; });
      saveDatabase(parsed);
      console.log('Migrated nilai from single score to 4 categories');
    }

    // Migrate: tambah uasLisan ke nilai jika belum ada
    if (parsed.nilai && parsed.nilai.length > 0) {
      let migratedUasLisan = false;
      parsed.nilai.forEach((n: any) => {
        if (n.uasLisan === undefined) {
          n.uasLisan = 0;
          migratedUasLisan = true;
        }
      });
      if (migratedUasLisan) {
        saveDatabase(parsed);
        console.log('Migrated database: added uasLisan to existing grades');
      }
    }

    // Migrate: ganti format penamaan kelas
    if (parsed.classes && parsed.classes.length > 0) {
      const classMap: Record<string, string> = {
        "cls-1": "I'dad Putra",
        "cls-2": "I'dad Putri",
        "cls-3": "Kelas VII Putra",
        "cls-4": "Kelas VII Putri",
        "cls-5": "Kelas VIII Putra",
        "cls-6": "Kelas VIII Putri",
        "cls-7": "Kelas IX Putra"
      };
      let changed = false;
      parsed.classes.forEach(c => {
        if (classMap[c.id] && c.name !== classMap[c.id]) {
          c.name = classMap[c.id];
          changed = true;
        }
      });
      if (changed) {
        saveDatabase(parsed);
        console.log("Migrated class names to new format in database");
      }
    }

    // Migrate: masukkan data santri asli (timpa data demo jika isinya hanya demo / sedikit)
    if (parsed.santri && (parsed.santri.length <= 3 || parsed.santri.some(s => s.name === "Ahmad Abdullah" && s.id === "santri-1"))) {
      const newSantriList = REAL_SANTRI_DATA.map((s, idx) => ({
        id: `santri-${idx + 1}`,
        nis: `2026${String(idx + 1).padStart(3, '0')}`,
        name: s.name,
        classId: s.classId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      parsed.santri = newSantriList;
      saveDatabase(parsed);
      console.log(`Migrated database to use the ${newSantriList.length} real santri list`);
    }

    if (parsed.users && parsed.users.length > 0) {
      const adminUser = parsed.users.find(u => u.id === "user-admin-1" || u.email === "aidilibnusalam3@gmail.com");
      if (adminUser && adminUser.name !== "Aqli") {
        adminUser.name = "Aqli";
        saveDatabase(parsed);
        console.log("Migrated Admin name to Aqli in active database");
      }
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
    "Usth. Ilfah", "Usth. Hasri", "Ust. Latief",
    "Ust. Akmal", "Ust. Rezkidar", "Usth. Lina",
    "Ust. Agib", "Usth. Rahmah", "Ust. Azri"
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
      name: "Aqli",
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
    { id: "cls-1", name: "I'dad Putra", level: "I'dad" },
    { id: "cls-2", name: "I'dad Putri", level: "I'dad" },
    // Wustho
    { id: "cls-3", name: "Kelas VII Putra", level: "Wustho" },
    { id: "cls-4", name: "Kelas VII Putri", level: "Wustho" },
    { id: "cls-5", name: "Kelas VIII Putra", level: "Wustho" },
    { id: "cls-6", name: "Kelas VIII Putri", level: "Wustho" },
    { id: "cls-7", name: "Kelas IX Putra", level: "Wustho" }
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
    // === SABTU ===
    // Waktu: 10.00 - 11.30
    { id: "sch-1", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-1", subjectId: "sub-12", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PA - Khot
    { id: "sch-2", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-2", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Aqidah
    { id: "sch-3", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-3", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PA - Bhs. Inggris
    { id: "sch-4", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-4", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PI - Fiqih
    { id: "sch-5", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-5", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 3 - ABY
    { id: "sch-6", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // PA (Idad) - ABY
    { id: "sch-7", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // PI (Idad) - ABY

    // Waktu: 12.30 - 13.30
    { id: "sch-8", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-30", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PA - Matematika
    { id: "sch-9", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-1", subjectId: "sub-12", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Khot
    { id: "sch-10", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-5", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PA - ABY
    { id: "sch-11", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-31", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - Bhs. Inggris
    { id: "sch-12", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-3", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - Bhs. Inggris
    { id: "sch-13", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - ABY

    // === AHAD ===
    // Waktu: 10.00 - 11.30
    { id: "sch-14", day: "Ahad", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-7", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - Tajwid
    { id: "sch-15", day: "Ahad", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PI - ABY
    { id: "sch-16", day: "Ahad", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-14", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PA - Aqidah
    { id: "sch-17", day: "Ahad", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-15", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PI - Siroh
    { id: "sch-18", day: "Ahad", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-5", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - ABY
    { id: "sch-19", day: "Ahad", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-7", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - Tajwid
    { id: "sch-20", day: "Ahad", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - ABY

    // Waktu: 12.30 - 13.30
    { id: "sch-21", day: "Ahad", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-10", subjectId: "sub-6", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PA - Akhlaq
    { id: "sch-22", day: "Ahad", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PI - Tahsin
    { id: "sch-23", day: "Ahad", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-18", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PA - Siroh
    { id: "sch-24", day: "Ahad", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - Tahsin
    { id: "sch-25", day: "Ahad", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // 3 - Tahsin
    { id: "sch-26", day: "Ahad", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // PA (Idad) - Tahsin
    { id: "sch-27", day: "Ahad", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // PI (Idad) - Tahsin

    // === SENIN ===
    // Waktu: 10.00 - 11.30
    { id: "sch-28", day: "Senin", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-14", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - Aqidah
    { id: "sch-29", day: "Senin", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PI - ABY
    { id: "sch-30", day: "Senin", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-13", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PA - Tahsin
    { id: "sch-31", day: "Senin", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-17", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - Fiqih
    { id: "sch-32", day: "Senin", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - ABY
    { id: "sch-33", day: "Senin", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - ABY

    // Waktu: 12.30 - 13.30
    { id: "sch-34", day: "Senin", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - ABY
    { id: "sch-35", day: "Senin", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Tahsin
    { id: "sch-36", day: "Senin", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PA - Tahsin
    { id: "sch-37", day: "Senin", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - ABY
    { id: "sch-38", day: "Senin", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-16", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" }, // 3 - IPA
    { id: "sch-39", day: "Senin", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - Tahsin
    { id: "sch-40", day: "Senin", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - Tahsin

    // === SELASA ===
    // Waktu: 10.00 - 11.30
    { id: "sch-41", day: "Selasa", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - ABY
    { id: "sch-42", day: "Selasa", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PI - ABY
    { id: "sch-43", day: "Selasa", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-19", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - Matematika
    { id: "sch-44", day: "Selasa", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-5", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - ABY
    { id: "sch-45", day: "Selasa", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - ABY
    { id: "sch-46", day: "Selasa", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - ABY

    // Waktu: 12.30 - 13.30
    { id: "sch-47", day: "Selasa", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-32", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - Tahsin
    { id: "sch-48", day: "Selasa", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-20", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Tajwid
    { id: "sch-49", day: "Selasa", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-16", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PA - IPA
    { id: "sch-50", day: "Selasa", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-9", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PI - IPA
    { id: "sch-51", day: "Selasa", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-10", subjectId: "sub-14", academicYearId: "ay-1", semesterId: "sem-1" }, // 3 - Bhs. Indonesia
    { id: "sch-52", day: "Selasa", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-20", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - Tajwid

    // === RABU ===
    // Waktu: 10.00 - 11.30
    { id: "sch-53", day: "Rabu", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - ABY
    { id: "sch-54", day: "Rabu", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Tahsin
    { id: "sch-55", day: "Rabu", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-5", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },   // 2 PA - ABY
    { id: "sch-56", day: "Rabu", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PI - Tahsin
    { id: "sch-57", day: "Rabu", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - Tahsin
    { id: "sch-58", day: "Rabu", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - ABY
    { id: "sch-59", day: "Rabu", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-11", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - Tahsin

    // Waktu: 12.30 - 13.30
    { id: "sch-60", day: "Rabu", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PA - ABY
    { id: "sch-61", day: "Rabu", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-20", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Tajwid
    { id: "sch-62", day: "Rabu", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-13", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PA - Tahsin
    { id: "sch-63", day: "Rabu", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - ABY
    { id: "sch-64", day: "Rabu", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-18", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" },  // 3 - Siroh
    { id: "sch-65", day: "Rabu", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PA (Idad) - ABY
    { id: "sch-66", day: "Rabu", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-20", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - Tajwid

    // === KAMIS ===
    // Waktu: 10.00 - 11.30
    { id: "sch-67", day: "Kamis", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-32", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PA - Tahsin
    { id: "sch-68", day: "Kamis", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-24", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PI - Matematika
    { id: "sch-69", day: "Kamis", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-25", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PA - Matematika
    { id: "sch-70", day: "Kamis", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-2", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },   // 2 PI - Aqidah
    { id: "sch-71", day: "Kamis", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-27", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" }, // 3 - Matematika
    { id: "sch-72", day: "Kamis", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-32", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // PA (Idad) - Tahsin
    { id: "sch-73", day: "Kamis", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },  // PI (Idad) - ABY

    // Waktu: 12.30 - 13.30
    { id: "sch-74", day: "Kamis", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-32", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" }, // 1 PA - Tahsin
    { id: "sch-75", day: "Kamis", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-29", subjectId: "sub-6", academicYearId: "ay-1", semesterId: "sem-1" },  // 1 PI - Akhlaq
    { id: "sch-76", day: "Kamis", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-28", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },  // 2 PA - Fiqih
    { id: "sch-77", day: "Kamis", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-23", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" }, // 2 PI - ABY
    { id: "sch-78", day: "Kamis", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-4", subjectId: "sub-8", academicYearId: "ay-1", semesterId: "sem-1" }    // 3 - Adab / Tarbiyyah
  ];

  // Seed 2 initial RPP items for immediate demonstration
  const rpps: RPP[] = [
    {
      id: "rpp-demo-1",
      teacherId: "teacher-1",
      subjectId: "sub-1",
      classId: "cls-3",
      academicYearId: "ay-1",
      profilPelajar: "Beriman & Bertakwa kepada Tuhan YME, Mandiri, Bergotong Royong",
      sarana: "Mushaf Al-Qur'an Pojok, Lembar Monitor Hafalan, Papan Tulis, Spidol",
      capaiPembelajaran: "Pada akhir fase ini, peserta didik mampu membaca Al-Qur'an dengan tajwid yang benar, menghafal juz-juz pilihan secara tartil, dan memahami makna kandungan ayat yang dihafal.",
      tujuanPembelajaran: "1. Santri dapat menyetorkan hafalan baru minimal 1 halaman per pertemuan dengan makhraj yang benar.\n2. Santri dapat memuroja'ah hafalan lama dengan lancar dan tanpa kesalahan.\n3. Santri memahami adab berinteraksi dengan Al-Qur'an.",
      alurTP: "Tes Diagnostik Awal → Talaqqi Hafalan Baru → Tikrar Mandiri → Setoran ke Pengajar → Muroja'ah → Evaluasi Akhir Semester",
      materiGanjil: "Hafalan Juz 30 (An-Naba' s.d. Al-Fajr) — muroja'ah harian, tajwid, adab tilawah",
      materiGenap: "Hafalan Juz 29 (Al-Mulk s.d. Al-Mursalat) — muroja'ah gabungan Juz 29-30",
      totalMeetingsGanjil: 18,
      totalMeetingsGenap: 18,
      pendahuluan: "1. Salam dan doa bersama (5 mnt).\n2. Absensi dan cek kondisi santri.\n3. Motivasi adab menghafal Al-Qur'an.\n4. Muroja'ah bersama hafalan pertemuan sebelumnya (10 mnt).",
      kegiatanInti: "1. Pengajar mencontohkan bacaan ayat baru (talaqqi) — 15 mnt.\n2. Santri mengikuti bacaan pengajar 3x berulang.\n3. Santri tikrar mandiri/berpasangan — 30 mnt.\n4. Setoran hafalan individual ke pengajar — 30 mnt.\n5. Koreksi makhraj dan tajwid secara langsung.",
      penutup: "1. Pengajar merangkum pencapaian hari ini.\n2. Santri mencatat target hafalan berikutnya.\n3. Doa penutup majelis — 5 mnt.",
      metode: "Talaqqi, Tikrar (Pengulangan), Sima'i, Setoran Individual",
      media: "Mushaf Al-Qur'an Pojok, Lembar Monitor Hafalan, Papan Tulis",
      asesmenDiagnostik: "Tes kelancaran hafalan awal semester untuk menentukan posisi hafalan tiap santri.",
      asesmenFormatif: "Observasi kelancaran setoran tiap pertemuan; catatan makhraj dan tajwid per santri.",
      asesmenSumatif: "Ujian setoran hafalan di akhir semester disaksikan pengajar dan koordinator halaqah.",
      diferensiasi: "Santri yang belum lancar mendapat sesi muroja'ah tambahan. Santri yang sudah hafal maju ke juz berikutnya.",
      pengayaan: "Santri berprestasi mendapat kesempatan menjadi musami' (penyimak) untuk santri lain.",
      catatan: "Prioritas semester ganjil: kelancaran dan konsistensi. Semester genap: tartil dan penguatan makna.",
      syllabusItems: [
        { meetingNo: 1, semester: 'Ganjil', topic: "Tes Diagnostik Awal & Orientasi Program Halaqah", date: "2026-07-14" },
        { meetingNo: 2, semester: 'Ganjil', topic: "Hafalan An-Naba' (78:1-20) + Pengenalan Tajwid", date: "2026-07-21" },
        { meetingNo: 3, semester: 'Ganjil', topic: "Hafalan An-Naba' (78:21-40) + Muroja'ah", date: "2026-07-28" },
        { meetingNo: 1, semester: 'Genap', topic: "Muroja'ah Juz 30 + Orientasi Juz 29", date: "2027-01-13" },
        { meetingNo: 2, semester: 'Genap', topic: "Hafalan Al-Mulk (67:1-15)", date: "2027-01-20" },
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
      profilPelajar: "Beriman & Bertakwa kepada Tuhan YME, Bernalar Kritis, Mandiri",
      sarana: "Kitab Aqidah (Ushul Tsalatsah), Papan Tulis, Slide Presentasi (opsional)",
      capaiPembelajaran: "Pada akhir fase ini, peserta didik memahami pokok-pokok aqidah Islam (rukun iman dan tauhid) berdasarkan dalil Al-Qur'an dan Sunnah shahih, serta mengimplementasikannya dalam kehidupan.",
      tujuanPembelajaran: "1. Santri mampu menjelaskan 6 rukun iman beserta dalilnya.\n2. Santri memahami tiga landasan utama (Ushul Tsalatsah).\n3. Santri mampu membedakan tauhid rububiyyah, uluhiyyah, dan asma wa sifat.",
      alurTP: "Tes Diagnostik → Pengenalan Aqidah Islam → Rukun Iman → Tauhid → Asmaul Husna → Iman kepada Rasul → Hari Akhir → Qadha-Qadar → Evaluasi Semester",
      materiGanjil: "Rukun Iman (6 Rukun), Iman kepada Allah (Tauhid Rububiyyah & Uluhiyyah), Asmaul Husna 1-40, Iman kepada Malaikat & Kitab",
      materiGenap: "Iman kepada Rasul (sifat wajib/mustahil), Hari Kiamat & tanda-tandanya, Qadha dan Qadar, Aplikasi Aqidah dalam kehidupan",
      totalMeetingsGanjil: 16,
      totalMeetingsGenap: 16,
      pendahuluan: "1. Salam dan doa pembuka — 5 mnt.\n2. Muroja'ah materi minggu lalu (tanya jawab singkat).\n3. Apersepsi: kaitan materi baru dengan kehidupan nyata — 5 mnt.",
      kegiatanInti: "1. Pembacaan teks kitab beserta terjemah harfiah — 15 mnt.\n2. Penjelasan (syarah) oleh pengajar + contoh nyata — 25 mnt.\n3. Diskusi kelompok / tanya jawab santri — 20 mnt.\n4. Santri merangkum poin utama di buku catatan — 10 mnt.",
      penutup: "1. Pengajar merangkum poin-poin utama — 5 mnt.\n2. Penugasan: hafalan dalil atau rangkuman.\n3. Doa penutup majelis.",
      metode: "Ceramah Interaktif, Syarah Kitab, Halaqah Diskusi, Tanya Jawab",
      media: "Kitab Ushul Tsalatsah, Papan Tulis, Kartu Dalil (opsional)",
      asesmenDiagnostik: "Pertanyaan lisan di awal semester: apa yang santri ketahui tentang aqidah Islam.",
      asesmenFormatif: "Keaktifan tanya jawab, kelancaran hafalan dalil, kualitas rangkuman catatan tiap pertemuan.",
      asesmenSumatif: "Ujian lisan dan tertulis di akhir semester: menjelaskan rukun iman + menyebutkan dalil.",
      diferensiasi: "Santri yang kesulitan mendapat kartu dalil bergambar. Santri maju mendapat soal analisis kasus.",
      pengayaan: "Santri berprestasi mengkaji kitab Qawa'id Al-Arba' sebagai tambahan.",
      catatan: "Hindari pembahasan khilafiyah yang tidak produktif. Fokus pada aqidah ahlus sunnah wal jama'ah.",
      syllabusItems: [
        { meetingNo: 1, semester: 'Ganjil', topic: "Pengantar Aqidah Islam & Ushul Tsalatsah", date: "2026-07-14" },
        { meetingNo: 2, semester: 'Ganjil', topic: "Rukun Iman: Pengertian & Dalil Global", date: "2026-07-21" },
        { meetingNo: 3, semester: 'Ganjil', topic: "Iman kepada Allah: Tauhid Rububiyyah", date: "2026-07-28" },
        { meetingNo: 1, semester: 'Genap', topic: "Iman kepada Rasul: Sifat Wajib & Mustahil", date: "2027-01-13" },
        { meetingNo: 2, semester: 'Genap', topic: "Iman kepada Hari Kiamat", date: "2027-01-20" },
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
      userName: "Aqli",
      userRole: "Admin",
      action: "System Seed",
      details: "Sistem berhasil diinisialisasi dan data master berhasil di-seed.",
      timestamp: new Date().toISOString()
    }
  ];

  const waliKelas: WaliKelas[] = [];
  const santri: Santri[] = REAL_SANTRI_DATA.map((s, idx) => ({
    id: `santri-${idx + 1}`,
    nis: `2026${String(idx + 1).padStart(3, '0')}`,
    name: s.name,
    classId: s.classId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

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
    santriAttendances: [],
    waliKelas,
    santri,
    nilai: [],
    activityLogs,
    raporDetails: [],
    pengumuman: []
  };
}
