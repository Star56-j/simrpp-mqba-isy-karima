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
  score: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
    santriAttendances: [],
    waliKelas,
    santri,
    nilai: [],
    activityLogs,
    raporDetails: []
  };
}
