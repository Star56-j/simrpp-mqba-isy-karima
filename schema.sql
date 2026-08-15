-- Schema dan Seed Data untuk Cloudflare D1 (simrpp_db)
-- Jalankan: npx wrangler d1 execute simrpp_db --remote --file=schema.sql

-- BUAT SEMUA TABEL
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  teacher_id TEXT,
  santri_id TEXT
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  nip TEXT,
  subjects TEXT,
  classes TEXT
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year_id TEXT
);

CREATE TABLE IF NOT EXISTS teaching_schedules (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  semester_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rpps (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  subject_id TEXT,
  class_id TEXT,
  academic_year_id TEXT,
  status TEXT DEFAULT 'Draft',
  profil_pelajar TEXT,
  sarana TEXT,
  capaian_pembelajaran TEXT,
  tujuan_pembelajaran TEXT,
  alur_tp TEXT,
  materi_ganjil TEXT,
  materi_genap TEXT,
  total_meetings_ganjil INTEGER DEFAULT 0,
  total_meetings_genap INTEGER DEFAULT 0,
  pendahuluan TEXT,
  kegiatan_inti TEXT,
  penutup TEXT,
  metode TEXT,
  media TEXT,
  asesmen_diagnostik TEXT,
  asesmen_formatif TEXT,
  asesmen_sumatif TEXT,
  diferensiasi TEXT,
  pengayaan TEXT,
  catatan TEXT,
  syllabus_items TEXT,
  revision_notes TEXT,
  updated_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  date TEXT,
  status TEXT,
  notes TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  recorded_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS santri (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT,
  nis TEXT,
  gender TEXT,
  birth_date TEXT,
  address TEXT,
  wali_name TEXT,
  wali_phone TEXT
);

CREATE TABLE IF NOT EXISTS santri_attendances (
  id TEXT PRIMARY KEY,
  class_id TEXT,
  date TEXT,
  santri_id TEXT,
  status TEXT,
  jumlah_hadir INTEGER DEFAULT 0,
  jumlah_izin INTEGER DEFAULT 0,
  jumlah_sakit INTEGER DEFAULT 0,
  jumlah_alpha INTEGER DEFAULT 0,
  jumlah_total INTEGER DEFAULT 0,
  notes TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  recorded_by TEXT,
  teacher_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS wali_kelas (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  academic_year_id TEXT,
  semester_id TEXT
);

CREATE TABLE IF NOT EXISTS nilai (
  id TEXT PRIMARY KEY,
  santri_id TEXT,
  subject_id TEXT,
  class_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  harian REAL DEFAULT 0,
  bulanan REAL DEFAULT 0,
  uts REAL DEFAULT 0,
  uas REAL DEFAULT 0,
  uas_lisan REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rapor_detail (
  id TEXT PRIMARY KEY,
  santri_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  kepribadian TEXT,
  ketahfizhan TEXT,
  ekstrakurikuler TEXT,
  ketidakhadiran TEXT,
  catatan_wali_kelas TEXT
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT,
  details TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS pengumuman (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT,
  author_name TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluasi_pembelajaran (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  class_id TEXT,
  subject_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  bulan TEXT,
  tahun TEXT,
  capaian_materi TEXT,
  kendala TEXT,
  solusi TEXT,
  rencana_bulan_depan TEXT,
  nilai_rata_santri REAL DEFAULT 0,
  persentase_kehadiran REAL DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  teacher_name TEXT,
  teacher_email TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TEXT,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluasi_wali_kelas (
  id TEXT PRIMARY KEY,
  guru_id TEXT,
  guru_nama TEXT,
  kelas_id TEXT,
  kelas_nama TEXT,
  tipe_periode TEXT DEFAULT 'bulanan',
  bulan TEXT,
  tahun TEXT,
  semester TEXT,
  tahun_ajaran TEXT,
  laporan_kbm TEXT,
  masalah_kelas TEXT,
  perkembangan_santri TEXT,
  rekomendasi_kurikulum TEXT,
  tanggapan_admin TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- ================================================================
-- SEED DATA
-- ================================================================

-- Academic Years
INSERT OR IGNORE INTO academic_years (id, name) VALUES
  ('ay-1', '2026/2027'),
  ('ay-2', '2025/2026');

-- Semesters
INSERT OR IGNORE INTO semesters (id, name, academic_year_id) VALUES
  ('sem-1', 'Ganjil', 'ay-1'),
  ('sem-2', 'Genap', 'ay-1');

-- Classes (7 kelas MQBA)
INSERT OR IGNORE INTO classes (id, name, level) VALUES
  ('cls-1', 'I''dad 1', 'I''dad'),
  ('cls-2', 'I''dad 2', 'I''dad'),
  ('cls-3', 'Wustho 1', 'Wustho'),
  ('cls-4', 'Wustho 2', 'Wustho'),
  ('cls-5', 'Wustho 3', 'Wustho'),
  ('cls-6', 'Wustho 4', 'Wustho'),
  ('cls-7', 'Wustho 5', 'Wustho');

-- Subjects (18 mata pelajaran)
INSERT OR IGNORE INTO subjects (id, name, category) VALUES
  ('sub-1',  'Tahfizh Al-Qur''an', 'Al-Qur''an'),
  ('sub-2',  'Tajwid', 'Al-Qur''an'),
  ('sub-3',  'Tafsir', 'Al-Qur''an'),
  ('sub-4',  'Fiqh', 'Diniyah'),
  ('sub-5',  'Aqidah', 'Diniyah'),
  ('sub-6',  'Hadits', 'Diniyah'),
  ('sub-7',  'Sirah Nabawiyah', 'Diniyah'),
  ('sub-8',  'Akhlak', 'Diniyah'),
  ('sub-9',  'Faraidh', 'Diniyah'),
  ('sub-10', 'Bahasa Arab', 'Bahasa'),
  ('sub-11', 'Nahwu', 'Bahasa'),
  ('sub-12', 'Sharaf', 'Bahasa'),
  ('sub-13', 'Bahasa Inggris', 'Bahasa'),
  ('sub-14', 'Matematika', 'Umum'),
  ('sub-15', 'IPA', 'Umum'),
  ('sub-16', 'IPS', 'Umum'),
  ('sub-17', 'Komputer / TIK', 'Umum'),
  ('sub-18', 'Kaligrafi', 'Al-Qur''an');

-- Teachers (30 guru)
INSERT OR IGNORE INTO teachers (id, name, email) VALUES
  ('teacher-1',  'Ust. Ahmad Fauzi',        'ahmad.fauzi@mqba.sch.id'),
  ('teacher-2',  'Ust. Muhammad Ridwan',     'muhammad.ridwan@mqba.sch.id'),
  ('teacher-3',  'Ust. Abdullah Salam',      'abdullah.salam@mqba.sch.id'),
  ('teacher-4',  'Ust. Hasan Bashri',        'hasan.bashri@mqba.sch.id'),
  ('teacher-5',  'Ust. Ibrahim Al-Fatih',    'ibrahim.alfatih@mqba.sch.id'),
  ('teacher-6',  'Ust. Yusuf Mansur',        'yusuf.mansur@mqba.sch.id'),
  ('teacher-7',  'Ust. Abdurrahman Wahid',   'abdurrahman.wahid@mqba.sch.id'),
  ('teacher-8',  'Ust. Khalid Al-Amin',      'khalid.alamin@mqba.sch.id'),
  ('teacher-9',  'Ust. Omar Faruq',          'omar.faruq@mqba.sch.id'),
  ('teacher-10', 'Ust. Salim Al-Azhari',     'salim.alazhari@mqba.sch.id'),
  ('teacher-11', 'Usth. Fatimah Az-Zahra',   'fatimah.azzahra@mqba.sch.id'),
  ('teacher-12', 'Usth. Aisyah Sidiq',       'aisyah.sidiq@mqba.sch.id'),
  ('teacher-13', 'Usth. Khadijah Al-Kubra',  'khadijah.alkubra@mqba.sch.id'),
  ('teacher-14', 'Usth. Maryam Binti Imran', 'maryam.binti.imran@mqba.sch.id'),
  ('teacher-15', 'Usth. Hafsah Binti Umar',  'hafsah.binti.umar@mqba.sch.id'),
  ('teacher-16', 'Ust. Zubair Al-Awwam',     'zubair.alawwam@mqba.sch.id'),
  ('teacher-17', 'Ust. Thalhah Ubaidillah',  'thalhah.ubaidillah@mqba.sch.id'),
  ('teacher-18', 'Ust. Sa''d Bin Abi Waqas', 'sad.bin.abi.waqas@mqba.sch.id'),
  ('teacher-19', 'Ust. Abu Dzar Al-Ghifari', 'abu.dzar@mqba.sch.id'),
  ('teacher-20', 'Ust. Bilal Al-Habsyi',     'bilal.alhabsyi@mqba.sch.id'),
  ('teacher-21', 'Usth. Sumayya Binti Khabab', 'sumayya.binti.khabab@mqba.sch.id'),
  ('teacher-22', 'Usth. Ramlah Binti Harits', 'ramlah.binti.harits@mqba.sch.id'),
  ('teacher-23', 'Ust. Muadz Bin Jabal',     'muadz.bin.jabal@mqba.sch.id'),
  ('teacher-24', 'Ust. Abdullah Bin Masud',  'abdullah.bin.masud@mqba.sch.id'),
  ('teacher-25', 'Ust. Abu Hurairah',        'abu.hurairah@mqba.sch.id'),
  ('teacher-26', 'Usth. Zainab Binti Jahsy', 'zainab.binti.jahsy@mqba.sch.id'),
  ('teacher-27', 'Usth. Ummu Salamah',       'ummu.salamah@mqba.sch.id'),
  ('teacher-28', 'Ust. Ammar Bin Yasir',     'ammar.bin.yasir@mqba.sch.id'),
  ('teacher-29', 'Ust. Huzaifah Ilyaman',    'huzaifah.ilyaman@mqba.sch.id'),
  ('teacher-30', 'Ust. Jabir Bin Abdillah',  'jabir.bin.abdillah@mqba.sch.id');

-- Users (Admin + Guru)
INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, teacher_id) VALUES
  ('user-admin-1', 'Aqli',       'aidilibnusalam3@gmail.com', '$2b$10$parabek123hashed', 'Admin', NULL),
  ('user-admin-2', 'Admin MQBA', 'admin@mqba.sch.id',         '$2b$10$admin123hashed',   'Admin', NULL);

-- Teaching Schedules (Jadwal KBM Lengkap)
-- SABTU 10:00 - 11:30
INSERT OR IGNORE INTO teaching_schedules (id, day, time, class_id, teacher_id, subject_id, academic_year_id, semester_id) VALUES
  ('sch-1',  'Sabtu', '10:00 - 11:30', 'cls-3', 'teacher-7',  'sub-12', 'ay-1', 'sem-1'),
  ('sch-2',  'Sabtu', '10:00 - 11:30', 'cls-4', 'teacher-17', 'sub-5',  'ay-1', 'sem-1'),
  ('sch-3',  'Sabtu', '10:00 - 11:30', 'cls-5', 'teacher-8',  'sub-15', 'ay-1', 'sem-1'),
  ('sch-4',  'Sabtu', '10:00 - 11:30', 'cls-6', 'teacher-18', 'sub-7',  'ay-1', 'sem-1'),
  ('sch-5',  'Sabtu', '10:00 - 11:30', 'cls-7', 'teacher-23', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-6',  'Sabtu', '10:00 - 11:30', 'cls-1', 'teacher-28', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-7',  'Sabtu', '10:00 - 11:30', 'cls-2', 'teacher-25', 'sub-13', 'ay-1', 'sem-1'),
-- SABTU 12:30 - 13:30
  ('sch-8',  'Sabtu', '12:30 - 13:30', 'cls-3', 'teacher-29', 'sub-16', 'ay-1', 'sem-1'),
  ('sch-9',  'Sabtu', '12:30 - 13:30', 'cls-4', 'teacher-7',  'sub-12', 'ay-1', 'sem-1'),
  ('sch-10', 'Sabtu', '12:30 - 13:30', 'cls-5', 'teacher-23', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-11', 'Sabtu', '12:30 - 13:30', 'cls-6', 'teacher-30', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-12', 'Sabtu', '12:30 - 13:30', 'cls-7', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-13', 'Sabtu', '12:30 - 13:30', 'cls-1', 'teacher-10', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-14', 'Sabtu', '12:30 - 13:30', 'cls-2', 'teacher-3',  'sub-11', 'ay-1', 'sem-1'),
-- SABTU 13:30 - 14:30
  ('sch-15', 'Sabtu', '13:30 - 14:30', 'cls-3', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-16', 'Sabtu', '13:30 - 14:30', 'cls-4', 'teacher-29', 'sub-16', 'ay-1', 'sem-1'),
  ('sch-17', 'Sabtu', '13:30 - 14:30', 'cls-5', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-18', 'Sabtu', '13:30 - 14:30', 'cls-6', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-19', 'Sabtu', '13:30 - 14:30', 'cls-7', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-20', 'Sabtu', '13:30 - 14:30', 'cls-1', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
  ('sch-21', 'Sabtu', '13:30 - 14:30', 'cls-2', 'teacher-9',  'sub-4',  'ay-1', 'sem-1'),
-- AHAD 07:30 - 09:00
  ('sch-22', 'Ahad',  '07:30 - 09:00', 'cls-1', 'teacher-11', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-23', 'Ahad',  '07:30 - 09:00', 'cls-2', 'teacher-12', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-24', 'Ahad',  '07:30 - 09:00', 'cls-3', 'teacher-4',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-25', 'Ahad',  '07:30 - 09:00', 'cls-4', 'teacher-5',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-26', 'Ahad',  '07:30 - 09:00', 'cls-5', 'teacher-6',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-27', 'Ahad',  '07:30 - 09:00', 'cls-6', 'teacher-16', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-28', 'Ahad',  '07:30 - 09:00', 'cls-7', 'teacher-20', 'sub-10', 'ay-1', 'sem-1'),
-- AHAD 09:00 - 10:30
  ('sch-29', 'Ahad',  '09:00 - 10:30', 'cls-1', 'teacher-24', 'sub-6',  'ay-1', 'sem-1'),
  ('sch-30', 'Ahad',  '09:00 - 10:30', 'cls-2', 'teacher-2',  'sub-8',  'ay-1', 'sem-1'),
  ('sch-31', 'Ahad',  '09:00 - 10:30', 'cls-3', 'teacher-1',  'sub-3',  'ay-1', 'sem-1'),
  ('sch-32', 'Ahad',  '09:00 - 10:30', 'cls-4', 'teacher-24', 'sub-6',  'ay-1', 'sem-1'),
  ('sch-33', 'Ahad',  '09:00 - 10:30', 'cls-5', 'teacher-1',  'sub-3',  'ay-1', 'sem-1'),
  ('sch-34', 'Ahad',  '09:00 - 10:30', 'cls-6', 'teacher-2',  'sub-8',  'ay-1', 'sem-1'),
  ('sch-35', 'Ahad',  '09:00 - 10:30', 'cls-7', 'teacher-1',  'sub-3',  'ay-1', 'sem-1'),
-- AHAD 10:30 - 12:00
  ('sch-36', 'Ahad',  '10:30 - 12:00', 'cls-1', 'teacher-13', 'sub-2',  'ay-1', 'sem-1'),
  ('sch-37', 'Ahad',  '10:30 - 12:00', 'cls-2', 'teacher-13', 'sub-2',  'ay-1', 'sem-1'),
  ('sch-38', 'Ahad',  '10:30 - 12:00', 'cls-3', 'teacher-13', 'sub-2',  'ay-1', 'sem-1'),
  ('sch-39', 'Ahad',  '10:30 - 12:00', 'cls-4', 'teacher-13', 'sub-2',  'ay-1', 'sem-1'),
  ('sch-40', 'Ahad',  '10:30 - 12:00', 'cls-5', 'teacher-14', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-41', 'Ahad',  '10:30 - 12:00', 'cls-6', 'teacher-15', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-42', 'Ahad',  '10:30 - 12:00', 'cls-7', 'teacher-26', 'sub-14', 'ay-1', 'sem-1'),
-- SENIN 07:30 - 09:00
  ('sch-43', 'Senin', '07:30 - 09:00', 'cls-1', 'teacher-10', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-44', 'Senin', '07:30 - 09:00', 'cls-2', 'teacher-3',  'sub-11', 'ay-1', 'sem-1'),
  ('sch-45', 'Senin', '07:30 - 09:00', 'cls-3', 'teacher-16', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-46', 'Senin', '07:30 - 09:00', 'cls-4', 'teacher-6',  'sub-11', 'ay-1', 'sem-1'),
  ('sch-47', 'Senin', '07:30 - 09:00', 'cls-5', 'teacher-19', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-48', 'Senin', '07:30 - 09:00', 'cls-6', 'teacher-20', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-49', 'Senin', '07:30 - 09:00', 'cls-7', 'teacher-21', 'sub-11', 'ay-1', 'sem-1'),
-- SENIN 09:00 - 10:30
  ('sch-50', 'Senin', '09:00 - 10:30', 'cls-1', 'teacher-27', 'sub-5',  'ay-1', 'sem-1'),
  ('sch-51', 'Senin', '09:00 - 10:30', 'cls-2', 'teacher-17', 'sub-5',  'ay-1', 'sem-1'),
  ('sch-52', 'Senin', '09:00 - 10:30', 'cls-3', 'teacher-18', 'sub-7',  'ay-1', 'sem-1'),
  ('sch-53', 'Senin', '09:00 - 10:30', 'cls-4', 'teacher-8',  'sub-15', 'ay-1', 'sem-1'),
  ('sch-54', 'Senin', '09:00 - 10:30', 'cls-5', 'teacher-30', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-55', 'Senin', '09:00 - 10:30', 'cls-6', 'teacher-23', 'sub-13', 'ay-1', 'sem-1'),
  ('sch-56', 'Senin', '09:00 - 10:30', 'cls-7', 'teacher-28', 'sub-13', 'ay-1', 'sem-1'),
-- SELASA 07:30 - 09:00
  ('sch-57', 'Selasa','07:30 - 09:00', 'cls-1', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-58', 'Selasa','07:30 - 09:00', 'cls-2', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-59', 'Selasa','07:30 - 09:00', 'cls-3', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-60', 'Selasa','07:30 - 09:00', 'cls-4', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-61', 'Selasa','07:30 - 09:00', 'cls-5', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-62', 'Selasa','07:30 - 09:00', 'cls-6', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
  ('sch-63', 'Selasa','07:30 - 09:00', 'cls-7', 'teacher-22', 'sub-18', 'ay-1', 'sem-1'),
-- SELASA 09:00 - 10:30
  ('sch-64', 'Selasa','09:00 - 10:30', 'cls-1', 'teacher-4',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-65', 'Selasa','09:00 - 10:30', 'cls-2', 'teacher-5',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-66', 'Selasa','09:00 - 10:30', 'cls-3', 'teacher-11', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-67', 'Selasa','09:00 - 10:30', 'cls-4', 'teacher-12', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-68', 'Selasa','09:00 - 10:30', 'cls-5', 'teacher-16', 'sub-10', 'ay-1', 'sem-1'),
  ('sch-69', 'Selasa','09:00 - 10:30', 'cls-6', 'teacher-6',  'sub-10', 'ay-1', 'sem-1'),
  ('sch-70', 'Selasa','09:00 - 10:30', 'cls-7', 'teacher-19', 'sub-10', 'ay-1', 'sem-1'),
-- RABU 07:30 - 09:00
  ('sch-71', 'Rabu',  '07:30 - 09:00', 'cls-1', 'teacher-14', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-72', 'Rabu',  '07:30 - 09:00', 'cls-2', 'teacher-15', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-73', 'Rabu',  '07:30 - 09:00', 'cls-3', 'teacher-26', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-74', 'Rabu',  '07:30 - 09:00', 'cls-4', 'teacher-14', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-75', 'Rabu',  '07:30 - 09:00', 'cls-5', 'teacher-26', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-76', 'Rabu',  '07:30 - 09:00', 'cls-6', 'teacher-14', 'sub-14', 'ay-1', 'sem-1'),
  ('sch-77', 'Rabu',  '07:30 - 09:00', 'cls-7', 'teacher-15', 'sub-14', 'ay-1', 'sem-1'),
-- RABU 09:00 - 10:30
  ('sch-78', 'Rabu',  '09:00 - 10:30', 'cls-1', 'teacher-2',  'sub-8',  'ay-1', 'sem-1'),
  ('sch-79', 'Rabu',  '09:00 - 10:30', 'cls-2', 'teacher-24', 'sub-6',  'ay-1', 'sem-1'),
  ('sch-80', 'Rabu',  '09:00 - 10:30', 'cls-3', 'teacher-17', 'sub-5',  'ay-1', 'sem-1'),
  ('sch-81', 'Rabu',  '09:00 - 10:30', 'cls-4', 'teacher-1',  'sub-3',  'ay-1', 'sem-1'),
  ('sch-82', 'Rabu',  '09:00 - 10:30', 'cls-5', 'teacher-8',  'sub-15', 'ay-1', 'sem-1'),
  ('sch-83', 'Rabu',  '09:00 - 10:30', 'cls-6', 'teacher-7',  'sub-12', 'ay-1', 'sem-1'),
  ('sch-84', 'Rabu',  '09:00 - 10:30', 'cls-7', 'teacher-29', 'sub-16', 'ay-1', 'sem-1'),
-- KAMIS 07:30 - 09:00
  ('sch-85', 'Kamis', '07:30 - 09:00', 'cls-1', 'teacher-3',  'sub-11', 'ay-1', 'sem-1'),
  ('sch-86', 'Kamis', '07:30 - 09:00', 'cls-2', 'teacher-10', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-87', 'Kamis', '07:30 - 09:00', 'cls-3', 'teacher-6',  'sub-11', 'ay-1', 'sem-1'),
  ('sch-88', 'Kamis', '07:30 - 09:00', 'cls-4', 'teacher-16', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-89', 'Kamis', '07:30 - 09:00', 'cls-5', 'teacher-21', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-90', 'Kamis', '07:30 - 09:00', 'cls-6', 'teacher-19', 'sub-11', 'ay-1', 'sem-1'),
  ('sch-91', 'Kamis', '07:30 - 09:00', 'cls-7', 'teacher-20', 'sub-11', 'ay-1', 'sem-1');
