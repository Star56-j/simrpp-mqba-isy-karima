import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  getDatabase,
  saveDatabase,
  logActivity,
  hashPassword,
  User,
  Teacher,
  Subject,
  SchoolClass,
  AcademicYear,
  Semester,
  TeachingSchedule,
  RPP,
  Attendance,
  SantriAttendance,
  WaliKelas,
  Santri,
  Nilai,
  ActivityLog
} from './src/server/db.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Setup limits for file upload support (Base64)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Create public upload directory
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Authentication Middleware
function getAuthUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const db = getDatabase();
  // Find user by their id encoded in mock token
  let user = db.users.find(u => u.id === token);
  
  if (!user && token.startsWith('wali-')) {
    const santriId = token.replace('wali-', '');
    const santri = db.santri.find(s => s.id === santriId);
    if (santri) {
      user = {
        id: token,
        name: `Wali dari ${santri.name}`,
        email: '',
        role: 'WaliSantri',
        santriId: santri.id
      };
    }
  }

  return user || null;
}

function requireAuth(role?: 'Admin' | 'Guru') {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sesi kedaluwarsa atau Anda tidak terautentikasi' });
      return;
    }
    if (role && user.role !== role) {
      res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin untuk halaman ini.' });
      return;
    }
    (req as any).user = user;
    next();
  };
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Auth API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email dan password harus diisi' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Email atau password salah' });
    return;
  }

  // Set response data
  const teacher = user.teacherId ? db.teachers.find(t => t.id === user.teacherId) : null;
  
  logActivity(user.id, user.name, user.role, 'Login', 'Berhasil melakukan login ke sistem.');

  res.json({
    token: user.id, // Simplistic mock token
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId,
      teacher: teacher
    }
  });
});

app.post('/api/auth/wali-login', (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Nama santri wajib diisi' });
    return;
  }
  const db = getDatabase();
  // case-insensitive search
  const santri = db.santri.find(s => s.name.toLowerCase() === name.toLowerCase());

  if (!santri) {
    res.status(404).json({ error: 'Data santri dengan nama tersebut tidak ditemukan' });
    return;
  }

  // Set mock user for wali santri
  const user: User = {
    id: `wali-${santri.id}`,
    name: `Wali dari ${santri.name}`,
    email: '',
    role: 'WaliSantri',
    santriId: santri.id
  };

  logActivity(user.id, user.name, user.role, 'Login', `Berhasil melakukan login sebagai Wali Santri (Anak: ${santri.name}).`);

  res.json({
    token: user.id, // Simplistic mock token
    user: user
  });
});

app.post('/api/auth/profile/update', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { name, email } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Nama dan email harus diisi' });
    return;
  }

  const db = getDatabase();
  // Check email conflict
  const conflict = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
  if (conflict) {
    res.status(400).json({ error: 'Email sudah terdaftar oleh pengguna lain' });
    return;
  }

  const dbUser = db.users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.name = name;
    dbUser.email = email;
    
    // Sync teacher profile name and email if linked
    if (dbUser.teacherId) {
      const teacher = db.teachers.find(t => t.id === dbUser.teacherId);
      if (teacher) {
        teacher.name = name;
        teacher.email = email;
      }
    }

    saveDatabase(db);
    logActivity(user.id, name, user.role, 'Update Profil', `Memperbarui nama dan email.`);
    res.json({ message: 'Profil berhasil diperbarui', user: dbUser });
  } else {
    res.status(404).json({ error: 'User tidak ditemukan' });
  }
});

app.post('/api/auth/change-password', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Password saat ini dan password baru harus diisi' });
    return;
  }

  const db = getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);

  if (!dbUser || dbUser.passwordHash !== hashPassword(currentPassword)) {
    res.status(400).json({ error: 'Password saat ini salah' });
    return;
  }

  dbUser.passwordHash = hashPassword(newPassword);
  saveDatabase(db);

  logActivity(user.id, user.name, user.role, 'Ubah Password', 'Berhasil mengubah password akun.');
  res.json({ message: 'Password berhasil diperbarui' });
});


// 2. Dashboard Stats API
app.get('/api/dashboard/stats', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();

  const totalTeachers = db.teachers.length;
  const totalSubjects = db.subjects.length;
  const totalClasses = db.classes.length;
  const totalSchedules = db.teachingSchedules.length;

  if (user.role === 'Admin') {
    const totalRPP = db.rpps.length;
    const rppDraft = db.rpps.filter(r => r.status === 'Draft').length;
    const rppPending = db.rpps.filter(r => r.status === 'Menunggu Persetujuan').length;
    const rppApproved = db.rpps.filter(r => r.status === 'Disetujui').length;
    const rppRevision = db.rpps.filter(r => r.status === 'Revisi').length;

    res.json({
      teachers: totalTeachers,
      subjects: totalSubjects,
      classes: totalClasses,
      schedules: totalSchedules,
      rpp: {
        total: totalRPP,
        draft: rppDraft,
        pending: rppPending,
        approved: rppApproved,
        revision: rppRevision
      },
      activityLogs: db.activityLogs.slice(0, 10)
    });
  } else {
    // For Guru
    const teacherId = user.teacherId;
    const teacherSchedules = db.teachingSchedules.filter(s => s.teacherId === teacherId).length;
    
    const myRPPs = db.rpps.filter(r => r.teacherId === teacherId);
    const totalRPP = myRPPs.length;
    const rppDraft = myRPPs.filter(r => r.status === 'Draft').length;
    const rppPending = myRPPs.filter(r => r.status === 'Menunggu Persetujuan').length;
    const rppApproved = myRPPs.filter(r => r.status === 'Disetujui').length;
    const rppRevision = myRPPs.filter(r => r.status === 'Revisi').length;

    res.json({
      mySchedulesCount: teacherSchedules,
      rpp: {
        total: totalRPP,
        draft: rppDraft,
        pending: rppPending,
        approved: rppApproved,
        revision: rppRevision
      }
    });
  }
});


// 3. Master Data: Teachers
app.get('/api/teachers', requireAuth(), (req, res) => {
  res.json(getDatabase().teachers);
});

app.post('/api/teachers', requireAuth('Admin'), (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Nama dan email guru harus diisi' });
    return;
  }

  const db = getDatabase();
  // Check if email already exists
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase()) || db.teachers.some(t => t.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'Email sudah terdaftar' });
    return;
  }

  const teacherId = `teacher-${Date.now()}`;
  const newTeacher: Teacher = { id: teacherId, name, email };
  db.teachers.push(newTeacher);

  // Auto-create User account for the teacher
  const newUserId = `user-guru-${teacherId}`;
  const pass = password || "guru123";
  db.users.push({
    id: newUserId,
    name,
    email,
    passwordHash: hashPassword(pass),
    role: "Guru",
    teacherId
  });

  saveDatabase(db);
  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Tambah Guru', `Menambahkan guru baru: ${name} (${email})`);

  res.status(201).json(newTeacher);
});

app.put('/api/teachers/:id', requireAuth('Admin'), (req, res) => {
  const { name, email, password } = req.body;
  const db = getDatabase();
  const teacher = db.teachers.find(t => t.id === req.params.id);

  if (!teacher) {
    res.status(404).json({ error: 'Guru tidak ditemukan' });
    return;
  }

  // Check email conflict
  if (email && email.toLowerCase() !== teacher.email.toLowerCase()) {
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.teacherId !== teacher.id)) {
      res.status(400).json({ error: 'Email sudah terdaftar oleh pengguna lain' });
      return;
    }
    teacher.email = email;
  }

  if (name) teacher.name = name;

  // Sync user account
  const user = db.users.find(u => u.teacherId === teacher.id);
  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.passwordHash = hashPassword(password);
  }

  saveDatabase(db);
  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Ubah Guru', `Mengubah informasi guru: ${teacher.name}`);
  res.json(teacher);
});

app.delete('/api/teachers/:id', requireAuth('Admin'), (req, res) => {
  const db = getDatabase();
  const teacherIdx = db.teachers.findIndex(t => t.id === req.params.id);

  if (teacherIdx === -1) {
    res.status(404).json({ error: 'Guru tidak ditemukan' });
    return;
  }

  const teacher = db.teachers[teacherIdx];

  // Check references: can't delete if referenced in schedules or RPP
  if (db.teachingSchedules.some(s => s.teacherId === teacher.id)) {
    res.status(400).json({ error: 'Guru ini tidak bisa dihapus karena terikat dengan Jadwal KBM' });
    return;
  }

  db.teachers.splice(teacherIdx, 1);
  
  // Remove linked user
  const userIdx = db.users.findIndex(u => u.teacherId === req.params.id);
  if (userIdx !== -1) {
    db.users.splice(userIdx, 1);
  }

  saveDatabase(db);
  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Hapus Guru', `Menghapus guru: ${teacher.name}`);
  res.json({ message: 'Guru berhasil dihapus' });
});


// 4. Master Data: Subjects
app.get('/api/subjects', requireAuth(), (req, res) => {
  res.json(getDatabase().subjects);
});

app.post('/api/subjects', requireAuth('Admin'), (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    res.status(400).json({ error: 'Nama dan kategori mata pelajaran harus diisi' });
    return;
  }

  const db = getDatabase();
  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    name,
    category
  };
  db.subjects.push(newSubject);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Tambah Mapel', `Menambahkan mata pelajaran: ${name} [${category}]`);
  res.status(201).json(newSubject);
});

app.put('/api/subjects/:id', requireAuth('Admin'), (req, res) => {
  const { name, category } = req.body;
  const db = getDatabase();
  const subject = db.subjects.find(s => s.id === req.params.id);

  if (!subject) {
    res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
    return;
  }

  if (name) subject.name = name;
  if (category) subject.category = category;

  saveDatabase(db);
  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Ubah Mapel', `Mengubah mata pelajaran: ${subject.name}`);
  res.json(subject);
});

app.delete('/api/subjects/:id', requireAuth('Admin'), (req, res) => {
  const db = getDatabase();
  const subjectIdx = db.subjects.findIndex(s => s.id === req.params.id);

  if (subjectIdx === -1) {
    res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
    return;
  }

  const subject = db.subjects[subjectIdx];

  if (db.teachingSchedules.some(s => s.subjectId === subject.id)) {
    res.status(400).json({ error: 'Mata pelajaran ini tidak bisa dihapus karena terikat dengan Jadwal KBM' });
    return;
  }

  db.subjects.splice(subjectIdx, 1);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Hapus Mapel', `Menghapus mata pelajaran: ${subject.name}`);
  res.json({ message: 'Mata pelajaran berhasil dihapus' });
});


// 5. Master Data: Classes
app.get('/api/classes', requireAuth(), (req, res) => {
  res.json(getDatabase().classes);
});

app.post('/api/classes', requireAuth('Admin'), (req, res) => {
  const { name, level } = req.body;
  if (!name || !level) {
    res.status(400).json({ error: 'Nama dan jenjang kelas harus diisi' });
    return;
  }

  const db = getDatabase();
  const newClass: SchoolClass = {
    id: `cls-${Date.now()}`,
    name,
    level
  };
  db.classes.push(newClass);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Tambah Kelas', `Menambahkan kelas baru: ${name} (${level})`);
  res.status(201).json(newClass);
});

app.put('/api/classes/:id', requireAuth('Admin'), (req, res) => {
  const { name, level } = req.body;
  const db = getDatabase();
  const schoolClass = db.classes.find(c => c.id === req.params.id);

  if (!schoolClass) {
    res.status(404).json({ error: 'Kelas tidak ditemukan' });
    return;
  }

  if (name) schoolClass.name = name;
  if (level) schoolClass.level = level;

  saveDatabase(db);
  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Ubah Kelas', `Mengubah informasi kelas: ${schoolClass.name}`);
  res.json(schoolClass);
});

app.delete('/api/classes/:id', requireAuth('Admin'), (req, res) => {
  const db = getDatabase();
  const classIdx = db.classes.findIndex(c => c.id === req.params.id);

  if (classIdx === -1) {
    res.status(404).json({ error: 'Kelas tidak ditemukan' });
    return;
  }

  const schoolClass = db.classes[classIdx];

  if (db.teachingSchedules.some(s => s.classId === schoolClass.id)) {
    res.status(400).json({ error: 'Kelas ini tidak bisa dihapus karena terikat dengan Jadwal KBM' });
    return;
  }

  db.classes.splice(classIdx, 1);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Hapus Kelas', `Menghapus kelas: ${schoolClass.name}`);
  res.json({ message: 'Kelas berhasil dihapus' });
});


// 6. Master Data: Academic Years & Semesters
app.get('/api/academic-years', requireAuth(), (req, res) => {
  res.json(getDatabase().academicYears);
});

app.post('/api/academic-years', requireAuth('Admin'), (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Tahun ajaran harus diisi' });
    return;
  }

  const db = getDatabase();
  const newAy: AcademicYear = {
    id: `ay-${Date.now()}`,
    name
  };
  db.academicYears.push(newAy);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Tambah Tahun Ajaran', `Menambahkan tahun ajaran baru: ${name}`);
  res.status(201).json(newAy);
});

app.put('/api/academic-years/:id', requireAuth('Admin'), (req, res) => {
  const { name } = req.body;
  const db = getDatabase();
  const ay = db.academicYears.find(y => y.id === req.params.id);

  if (!ay) {
    res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });
    return;
  }

  if (name) ay.name = name;
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Ubah Tahun Ajaran', `Mengubah tahun ajaran: ${ay.name}`);
  res.json(ay);
});

app.delete('/api/academic-years/:id', requireAuth('Admin'), (req, res) => {
  const db = getDatabase();
  const ayIdx = db.academicYears.findIndex(y => y.id === req.params.id);

  if (ayIdx === -1) {
    res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });
    return;
  }

  const ay = db.academicYears[ayIdx];

  if (db.teachingSchedules.some(s => s.academicYearId === ay.id)) {
    res.status(400).json({ error: 'Tahun ajaran ini tidak bisa dihapus karena terikat dengan Jadwal KBM' });
    return;
  }

  db.academicYears.splice(ayIdx, 1);
  saveDatabase(db);

  logActivity((req as any).user.id, (req as any).user.name, 'Admin', 'Hapus Tahun Ajaran', `Menghapus tahun ajaran: ${ay.name}`);
  res.json({ message: 'Tahun ajaran berhasil dihapus' });
});

app.get('/api/semesters', requireAuth(), (req, res) => {
  res.json(getDatabase().semesters);
});


// 7. Teaching Schedules (Jadwal KBM)
app.get('/api/schedules', requireAuth(), (req, res) => {
  const db = getDatabase();
  // Decorate with name models
  const decorated = db.teachingSchedules.map(sch => {
    const cls = db.classes.find(c => c.id === sch.classId);
    const tch = db.teachers.find(t => t.id === sch.teacherId);
    const sub = db.subjects.find(s => s.id === sch.subjectId);
    const ay = db.academicYears.find(y => y.id === sch.academicYearId);
    const sem = db.semesters.find(s => s.id === sch.semesterId);

    return {
      ...sch,
      class: cls,
      teacher: tch,
      subject: sub,
      academicYear: ay,
      semester: sem
    };
  });
  res.json(decorated);
});

app.post('/api/schedules', requireAuth('Admin'), (req, res) => {
  const { day, time, classId, teacherId, subjectId, academicYearId, semesterId } = req.body;
  if (!day || !time || !classId || !teacherId || !subjectId || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'Semua kolom jadwal KBM harus diisi' });
    return;
  }

  const db = getDatabase();
  const newSch: TeachingSchedule = {
    id: `sch-${Date.now()}`,
    day,
    time,
    classId,
    teacherId,
    subjectId,
    academicYearId,
    semesterId
  };
  db.teachingSchedules.push(newSch);
  saveDatabase(db);

  const teacher = db.teachers.find(t => t.id === teacherId);
  const subject = db.subjects.find(s => s.id === subjectId);
  const classItem = db.classes.find(c => c.id === classId);

  logActivity(
    (req as any).user.id,
    (req as any).user.name,
    'Admin',
    'Tambah Jadwal KBM',
    `Menambahkan jadwal baru: ${teacher?.name || ''} mengajar ${subject?.name || ''} di Kelas ${classItem?.name || ''} (${day}, ${time})`
  );

  res.status(201).json(newSch);
});

app.put('/api/schedules/:id', requireAuth('Admin'), (req, res) => {
  const { day, time, classId, teacherId, subjectId, academicYearId, semesterId } = req.body;
  const db = getDatabase();
  const sch = db.teachingSchedules.find(s => s.id === req.params.id);

  if (!sch) {
    res.status(404).json({ error: 'Jadwal KBM tidak ditemukan' });
    return;
  }

  if (day) sch.day = day;
  if (time) sch.time = time;
  if (classId) sch.classId = classId;
  if (teacherId) sch.teacherId = teacherId;
  if (subjectId) sch.subjectId = subjectId;
  if (academicYearId) sch.academicYearId = academicYearId;
  if (semesterId) sch.semesterId = semesterId;

  saveDatabase(db);

  const teacher = db.teachers.find(t => t.id === sch.teacherId);
  const subject = db.subjects.find(s => s.id === sch.subjectId);
  const classItem = db.classes.find(c => c.id === sch.classId);

  logActivity(
    (req as any).user.id,
    (req as any).user.name,
    'Admin',
    'Ubah Jadwal KBM',
    `Mengubah jadwal KBM: ${teacher?.name || ''} - ${subject?.name || ''} di Kelas ${classItem?.name || ''}`
  );

  res.json(sch);
});

app.delete('/api/schedules/:id', requireAuth('Admin'), (req, res) => {
  const db = getDatabase();
  const schIdx = db.teachingSchedules.findIndex(s => s.id === req.params.id);

  if (schIdx === -1) {
    res.status(404).json({ error: 'Jadwal KBM tidak ditemukan' });
    return;
  }

  const sch = db.teachingSchedules[schIdx];
  
  // Verify if there are associated RPP reports before deletion
  if (db.rpps.some(r => r.scheduleId === sch.id)) {
    res.status(400).json({ error: 'Jadwal ini tidak bisa dihapus karena sudah ada laporan RPP yang dibuat pengajar' });
    return;
  }

  db.teachingSchedules.splice(schIdx, 1);
  saveDatabase(db);

  logActivity(
    (req as any).user.id,
    (req as any).user.name,
    'Admin',
    'Hapus Jadwal KBM',
    `Menghapus Jadwal KBM ID: ${sch.id}`
  );

  res.json({ message: 'Jadwal KBM berhasil dihapus' });
});

// Copy Semester teaching schedules logic
app.post('/api/schedules/copy-semester', requireAuth('Admin'), (req, res) => {
  const { fromAcademicYearId, fromSemesterId, toAcademicYearId, toSemesterId } = req.body;
  
  if (!fromAcademicYearId || !fromSemesterId || !toAcademicYearId || !toSemesterId) {
    res.status(400).json({ error: 'Semua field sumber dan tujuan harus ditentukan' });
    return;
  }

  if (fromAcademicYearId === toAcademicYearId && fromSemesterId === toSemesterId) {
    res.status(400).json({ error: 'Semester sumber dan tujuan tidak boleh sama' });
    return;
  }

  const db = getDatabase();
  const sourceSchedules = db.teachingSchedules.filter(
    s => s.academicYearId === fromAcademicYearId && s.semesterId === fromSemesterId
  );

  if (sourceSchedules.length === 0) {
    res.status(400).json({ error: 'Tidak ditemukan jadwal KBM pada semester sumber untuk disalin' });
    return;
  }

  // Clear existing schedules in destination first?
  // User can either append or replace. We will append safely, ensuring no identical duplicates exist, or just append new copies.
  const newSchedules: TeachingSchedule[] = sourceSchedules.map((s, index) => ({
    id: `sch-${Date.now()}-${index}`,
    day: s.day,
    time: s.time,
    classId: s.classId,
    teacherId: s.teacherId,
    subjectId: s.subjectId,
    academicYearId: toAcademicYearId,
    semesterId: toSemesterId
  }));

  db.teachingSchedules.push(...newSchedules);
  saveDatabase(db);

  const fromAy = db.academicYears.find(y => y.id === fromAcademicYearId)?.name || '';
  const fromSem = db.semesters.find(s => s.id === fromSemesterId)?.name || '';
  const toAy = db.academicYears.find(y => y.id === toAcademicYearId)?.name || '';
  const toSem = db.semesters.find(s => s.id === toSemesterId)?.name || '';

  logActivity(
    (req as any).user.id,
    (req as any).user.name,
    'Admin',
    'Salin Jadwal Semester',
    `Berhasil menyalin ${sourceSchedules.length} jadwal dari semester (${fromAy} - ${fromSem}) ke (${toAy} - ${toSem}).`
  );

  res.json({ message: `Berhasil menyalin ${sourceSchedules.length} jadwal KBM`, count: sourceSchedules.length });
});


// 8. RPP API
app.get('/api/rpps', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();

  let filteredRpps = db.rpps;

  // Guru hanya bisa melihat RPP miliknya sendiri
  if (user.role === 'Guru') {
    filteredRpps = db.rpps.filter(r => r.teacherId === user.teacherId);
  }

  // Decorate dengan data relasi
  const decorated = filteredRpps.map(r => {
    const cls = db.classes.find(c => c.id === r.classId);
    const sub = db.subjects.find(s => s.id === r.subjectId);
    const tch = db.teachers.find(t => t.id === r.teacherId);
    const ay = db.academicYears.find(y => y.id === r.academicYearId);
    return { ...r, class: cls, subject: sub, teacher: tch, academicYear: ay };
  });

  decorated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(decorated);
});

app.post('/api/rpps', requireAuth('Guru'), (req, res) => {
  const user = (req as any).user as User;
  const {
    subjectId, classId, academicYearId,
    profilPelajar, sarana,
    capaiPembelajaran, tujuanPembelajaran, alurTP,
    materiGanjil, materiGenap, totalMeetingsGanjil, totalMeetingsGenap,
    pendahuluan, kegiatanInti, penutup, metode, media,
    asesmenDiagnostik, asesmenFormatif, asesmenSumatif,
    diferensiasi, pengayaan, catatan,
    syllabusItems, attachmentUrl, attachmentName, status
  } = req.body;

  if (!subjectId || !classId || !academicYearId) {
    res.status(400).json({ error: 'Mata pelajaran, kelas, dan tahun ajaran harus diisi' });
    return;
  }

  const db = getDatabase();

  // Cek duplikat: 1 RPP per mapel+kelas+tahun ajaran per guru
  const duplicate = db.rpps.find(r =>
    r.teacherId === user.teacherId &&
    r.subjectId === subjectId &&
    r.classId === classId &&
    r.academicYearId === academicYearId
  );
  if (duplicate) {
    res.status(400).json({ error: 'RPP untuk mata pelajaran, kelas, dan tahun ajaran ini sudah ada. Silakan edit RPP yang ada.' });
    return;
  }

  const newRpp: RPP = {
    id: `rpp-${Date.now()}`,
    teacherId: user.teacherId!,
    subjectId, classId, academicYearId,
    profilPelajar: profilPelajar || '',
    sarana: sarana || '',
    capaiPembelajaran: capaiPembelajaran || '',
    tujuanPembelajaran: tujuanPembelajaran || '',
    alurTP: alurTP || '',
    materiGanjil: materiGanjil || '',
    materiGenap: materiGenap || '',
    totalMeetingsGanjil: totalMeetingsGanjil || 0,
    totalMeetingsGenap: totalMeetingsGenap || 0,
    pendahuluan: pendahuluan || '',
    kegiatanInti: kegiatanInti || '',
    penutup: penutup || '',
    metode: metode || '',
    media: media || '',
    asesmenDiagnostik: asesmenDiagnostik || '',
    asesmenFormatif: asesmenFormatif || '',
    asesmenSumatif: asesmenSumatif || '',
    diferensiasi: diferensiasi || '',
    pengayaan: pengayaan || '',
    catatan: catatan || '',
    syllabusItems: syllabusItems || [],
    attachmentUrl: attachmentUrl || '',
    attachmentName: attachmentName || '',
    status: status || 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.rpps.push(newRpp);
  saveDatabase(db);

  const mapel = db.subjects.find(s => s.id === subjectId)?.name || '';
  const kelas = db.classes.find(c => c.id === classId)?.name || '';
  const tahun = db.academicYears.find(y => y.id === academicYearId)?.name || '';

  logActivity(user.id, user.name, 'Guru', 'Buat RPP',
    `Membuat RPP Kurikulum Merdeka (${status || 'Draft'}) untuk ${mapel} - Kelas ${kelas} - TA ${tahun}`);

  res.status(201).json(newRpp);
});

app.put('/api/rpps/:id', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const rpp = db.rpps.find(r => r.id === req.params.id);

  if (!rpp) { res.status(404).json({ error: 'RPP tidak ditemukan' }); return; }
  if (user.role === 'Guru' && rpp.teacherId !== user.teacherId) {
    res.status(403).json({ error: 'Anda hanya dapat mengedit RPP milik Anda sendiri' }); return;
  }

  const fields = [
    'profilPelajar','sarana','capaiPembelajaran','tujuanPembelajaran','alurTP',
    'materiGanjil','materiGenap','totalMeetingsGanjil','totalMeetingsGenap',
    'pendahuluan','kegiatanInti','penutup','metode','media',
    'asesmenDiagnostik','asesmenFormatif','asesmenSumatif',
    'diferensiasi','pengayaan','catatan',
    'syllabusItems','attachmentUrl','attachmentName','status'
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) (rpp as any)[f] = req.body[f];
  }

  rpp.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const mapel = db.subjects.find(s => s.id === rpp.subjectId)?.name || '';
  const kelas = db.classes.find(c => c.id === rpp.classId)?.name || '';
  logActivity(user.id, user.name, user.role, 'Ubah RPP',
    `Memperbarui RPP ${mapel} - Kelas ${kelas} (Status: ${rpp.status})`);

  res.json(rpp);
});

// Admin Review Workflow
app.post('/api/rpps/:id/review', requireAuth('Admin'), (req, res) => {
  const user = (req as any).user as User;
  const { status, revisionNotes } = req.body;

  if (!status || !['Disetujui', 'Revisi'].includes(status)) {
    res.status(400).json({ error: 'Status review harus ditentukan (Disetujui atau Revisi)' });
    return;
  }

  const db = getDatabase();
  const rpp = db.rpps.find(r => r.id === req.params.id);

  if (!rpp) {
    res.status(404).json({ error: 'RPP tidak ditemukan' });
    return;
  }

  rpp.status = status;
  rpp.revisionNotes = status === 'Revisi' ? (revisionNotes || 'Harap lakukan perbaikan sesuai catatan kurikulum.') : '';
  rpp.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const teacherName = db.teachers.find(t => t.id === rpp.teacherId)?.name || '';
  const mapel = db.subjects.find(s => s.id === rpp.subjectId)?.name || '';

  logActivity(user.id, user.name, 'Admin', 'Review RPP',
    `Review RPP Tahunan ${teacherName} (${mapel}): ${status}. Catatan: ${rpp.revisionNotes}`);

  res.json(rpp);
});

app.delete('/api/rpps/:id', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const rppIdx = db.rpps.findIndex(r => r.id === req.params.id);

  if (rppIdx === -1) {
    res.status(404).json({ error: 'RPP tidak ditemukan' });
    return;
  }

  const rpp = db.rpps[rppIdx];

  if (user.role === 'Guru') {
    if (rpp.teacherId !== user.teacherId) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    if (rpp.status !== 'Draft') {
      res.status(400).json({ error: 'Anda hanya dapat menghapus RPP dengan status Draft' });
      return;
    }
  }

  db.rpps.splice(rppIdx, 1);
  saveDatabase(db);

  const mapel = db.subjects.find(s => s.id === rpp.subjectId)?.name || '';
  const kelas = db.classes.find(c => c.id === rpp.classId)?.name || '';

  logActivity(user.id, user.name, user.role, 'Hapus RPP',
    `Menghapus RPP Tahunan: ${mapel} - Kelas ${kelas}`);

  res.json({ message: 'RPP berhasil dihapus' });
});


// 9. Attendance API
// GET semua absensi (Admin: semua, Guru: milik sendiri)
app.get('/api/attendances', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const { month, year, semesterId, academicYearId, teacherId } = req.query as Record<string, string>;

  let list = db.attendances || [];

  if (user.role === 'Guru') {
    list = list.filter(a => a.teacherId === user.teacherId);
  } else if (teacherId) {
    list = list.filter(a => a.teacherId === teacherId);
  }

  if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(a => a.semesterId === semesterId);
  if (year)           list = list.filter(a => a.date.startsWith(year));
  if (month && year)  list = list.filter(a => a.date.startsWith(`${year}-${month.padStart(2,'0')}`));

  // Decorate
  const decorated = list.map(a => ({
    ...a,
    teacher: db.teachers.find(t => t.id === a.teacherId),
    academicYear: db.academicYears.find(y => y.id === a.academicYearId),
    semester: db.semesters.find(s => s.id === a.semesterId),
  }));

  decorated.sort((a, b) => b.date.localeCompare(a.date));
  res.json(decorated);
});

// POST guru mengisi absensi diri sendiri
app.post('/api/attendances/self', requireAuth('Guru'), (req, res) => {
  const guru = (req as any).user as User;
  if (!guru.teacherId) {
    res.status(400).json({ error: 'Akun guru tidak terhubung ke data pengajar' });
    return;
  }

  const { date, status, notes, academicYearId, semesterId } = req.body;

  if (!date || !status || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'date, status, academicYearId, dan semesterId wajib diisi' });
    return;
  }

  const validStatus = ['Hadir', 'Izin', 'Sakit'];
  if (!validStatus.includes(status)) {
    res.status(400).json({ error: 'Guru hanya dapat mengisi status Hadir, Izin, atau Sakit' });
    return;
  }

  const db = getDatabase();
  if (!db.attendances) db.attendances = [];

  // Cek duplikat — 1 absensi per hari
  const dup = db.attendances.find(a => a.teacherId === guru.teacherId && a.date === date);
  if (dup) {
    res.status(400).json({ error: 'Absensi untuk tanggal ini sudah diisi. Hubungi Admin untuk mengubahnya.' });
    return;
  }

  const teacher = db.teachers.find(t => t.id === guru.teacherId);

  const newAtt: Attendance = {
    id: `att-${Date.now()}`,
    teacherId: guru.teacherId,
    date, status, notes: notes || '',
    academicYearId, semesterId,
    recordedBy: guru.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.attendances.push(newAtt);
  saveDatabase(db);
  logActivity(guru.id, guru.name, 'Guru', 'Isi Absensi Mandiri',
    `${teacher?.name} mengisi absensi tanggal ${date}: ${status}`);
  res.status(201).json(newAtt);
});

// POST buat catatan absensi (Admin only)
app.post('/api/attendances', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const { teacherId, date, status, notes, academicYearId, semesterId } = req.body;

  if (!teacherId || !date || !status || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'teacherId, date, status, academicYearId, dan semesterId wajib diisi' });
    return;
  }

  const validStatus = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
  if (!validStatus.includes(status)) {
    res.status(400).json({ error: 'Status tidak valid' });
    return;
  }

  const db = getDatabase();
  if (!db.attendances) db.attendances = [];

  // Cek duplikat: 1 catatan per guru per tanggal
  const dup = db.attendances.find(a => a.teacherId === teacherId && a.date === date);
  if (dup) {
    res.status(400).json({ error: 'Absensi untuk guru ini pada tanggal tersebut sudah ada. Gunakan edit untuk mengubah.' });
    return;
  }

  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) { res.status(404).json({ error: 'Guru tidak ditemukan' }); return; }

  const newAtt: Attendance = {
    id: `att-${Date.now()}`,
    teacherId, date, status, notes: notes || '',
    academicYearId, semesterId,
    recordedBy: admin.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.attendances.push(newAtt);
  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Catat Absensi',
    `Mencatat absensi ${teacher.name} pada ${date}: ${status}`);
  res.status(201).json(newAtt);
});

// GET rekap absensi — summary per guru untuk filter tertentu
// PENTING: route ini harus di atas /:id agar tidak ditangkap sebagai parameter
app.get('/api/attendances/summary', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const { month, year, semesterId, academicYearId } = req.query as Record<string, string>;

  let list = db.attendances || [];

  if (user.role === 'Guru') {
    list = list.filter(a => a.teacherId === user.teacherId);
  }

  if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(a => a.semesterId === semesterId);
  if (year)           list = list.filter(a => a.date.startsWith(year));
  if (month && year)  list = list.filter(a => a.date.startsWith(`${year}-${month.padStart(2,'0')}`));

  const map = new Map<string, { hadir:number; izin:number; sakit:number; alpha:number }>();
  for (const a of list) {
    if (!map.has(a.teacherId)) map.set(a.teacherId, { hadir:0, izin:0, sakit:0, alpha:0 });
    const s = map.get(a.teacherId)!;
    if (a.status === 'Hadir') s.hadir++;
    else if (a.status === 'Izin') s.izin++;
    else if (a.status === 'Sakit') s.sakit++;
    else if (a.status === 'Alpha') s.alpha++;
  }

  const summary = Array.from(map.entries()).map(([tid, counts]) => {
    const teacher = db.teachers.find(t => t.id === tid);
    const total = counts.hadir + counts.izin + counts.sakit + counts.alpha;
    return {
      teacherId: tid,
      teacherName: teacher?.name || tid,
      ...counts,
      total,
      persentaseHadir: total > 0 ? Math.round((counts.hadir / total) * 100) : 0,
    };
  });

  summary.sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  res.json(summary);
});

// PUT update absensi (Admin only)
app.put('/api/attendances/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.attendances) db.attendances = [];

  const att = db.attendances.find(a => a.id === req.params.id);
  if (!att) { res.status(404).json({ error: 'Data absensi tidak ditemukan' }); return; }

  const { status, notes, date, academicYearId, semesterId } = req.body;
  const validStatus = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
  if (status && !validStatus.includes(status)) {
    res.status(400).json({ error: 'Status tidak valid' }); return;
  }

  if (status) att.status = status;
  if (notes !== undefined) att.notes = notes;
  if (date) att.date = date;
  if (academicYearId) att.academicYearId = academicYearId;
  if (semesterId) att.semesterId = semesterId;
  att.updatedAt = new Date().toISOString();

  saveDatabase(db);
  const teacher = db.teachers.find(t => t.id === att.teacherId);
  logActivity(admin.id, admin.name, 'Admin', 'Ubah Absensi',
    `Mengubah absensi ${teacher?.name} pada ${att.date}: ${att.status}`);
  res.json(att);
});

// DELETE absensi (Admin only)
app.delete('/api/attendances/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.attendances) db.attendances = [];

  const idx = db.attendances.findIndex(a => a.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Data absensi tidak ditemukan' }); return; }

  const att = db.attendances[idx];
  db.attendances.splice(idx, 1);
  saveDatabase(db);

  const teacher = db.teachers.find(t => t.id === att.teacherId);
  logActivity(admin.id, admin.name, 'Admin', 'Hapus Absensi',
    `Menghapus absensi ${teacher?.name} pada ${att.date}`);
  res.json({ message: 'Absensi berhasil dihapus' });
});



// 10. Santri Attendance API
// GET semua absensi santri (Admin: semua, Guru: kelas yang diajar)
app.get('/api/santri-attendances', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const { month, year, semesterId, academicYearId, classId } = req.query as Record<string, string>;

  if (!db.santriAttendances) db.santriAttendances = [];
  let list = db.santriAttendances;

  // Guru hanya bisa lihat kelas yang diajarnya
  if (user.role === 'Guru') {
    const guruClassIds = new Set(
      db.teachingSchedules
        .filter(s => s.teacherId === user.teacherId)
        .map(s => s.classId)
    );
    list = list.filter(a => guruClassIds.has(a.classId));
  } else if (classId) {
    list = list.filter(a => a.classId === classId);
  }

  if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(a => a.semesterId === semesterId);
  if (year)           list = list.filter(a => a.date.startsWith(year));
  if (month && year)  list = list.filter(a => a.date.startsWith(`${year}-${month.padStart(2,'0')}`));

  const decorated = list.map(a => ({
    ...a,
    class: db.classes.find(c => c.id === a.classId),
    academicYear: db.academicYears.find(y => y.id === a.academicYearId),
    semester: db.semesters.find(s => s.id === a.semesterId),
  }));

  decorated.sort((a, b) => b.date.localeCompare(a.date));
  res.json(decorated);
});

// GET rekap absensi santri — summary per kelas
app.get('/api/santri-attendances/summary', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const { month, year, semesterId, academicYearId } = req.query as Record<string, string>;

  if (!db.santriAttendances) db.santriAttendances = [];
  let list = db.santriAttendances;

  if (user.role === 'Guru') {
    const guruClassIds = new Set(
      db.teachingSchedules
        .filter(s => s.teacherId === user.teacherId)
        .map(s => s.classId)
    );
    list = list.filter(a => guruClassIds.has(a.classId));
  }

  if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(a => a.semesterId === semesterId);
  if (year)           list = list.filter(a => a.date.startsWith(year));
  if (month && year)  list = list.filter(a => a.date.startsWith(`${year}-${month.padStart(2,'0')}`));

  const map = new Map<string, { hadir: number; izin: number; sakit: number; alpha: number }>();
  for (const a of list) {
    if (!map.has(a.classId)) map.set(a.classId, { hadir: 0, izin: 0, sakit: 0, alpha: 0 });
    const s = map.get(a.classId)!;
    s.hadir  += a.jumlahHadir;
    s.izin   += a.jumlahIzin;
    s.sakit  += a.jumlahSakit;
    s.alpha  += a.jumlahAlpha;
  }

  const summary = Array.from(map.entries()).map(([cid, counts]) => {
    const cls = db.classes.find(c => c.id === cid);
    const total = counts.hadir + counts.izin + counts.sakit + counts.alpha;
    return {
      classId: cid,
      className: cls?.name || cid,
      ...counts,
      total,
      rataHadir: total > 0 ? Math.round((counts.hadir / total) * 100) : 0,
    };
  });

  summary.sort((a, b) => a.className.localeCompare(b.className));
  res.json(summary);
});

// POST guru mencatat absensi santri kelas yang diajar
app.post('/api/santri-attendances/guru', requireAuth('Guru'), (req, res) => {
  const guru = (req as any).user as User;
  if (!guru.teacherId) {
    res.status(400).json({ error: 'Akun guru tidak terhubung ke data pengajar' });
    return;
  }

  const { classId, date, jumlahHadir, jumlahIzin, jumlahSakit, jumlahAlpha, jumlahTotal, notes, academicYearId, semesterId } = req.body;

  if (!classId || !date || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'classId, date, academicYearId, dan semesterId wajib diisi' });
    return;
  }

  const db = getDatabase();
  if (!db.santriAttendances) db.santriAttendances = [];

  // Pastikan guru mengajar di kelas tersebut
  const guruClassIds = new Set(
    db.teachingSchedules.filter(s => s.teacherId === guru.teacherId).map(s => s.classId)
  );
  if (!guruClassIds.has(classId)) {
    res.status(403).json({ error: 'Anda tidak mengajar di kelas ini' });
    return;
  }

  // Cek duplikat: 1 absensi per kelas per tanggal
  const dup = db.santriAttendances.find(a => a.classId === classId && a.date === date);
  if (dup) {
    res.status(400).json({ error: 'Absensi santri untuk kelas ini pada tanggal tersebut sudah ada.' });
    return;
  }

  const cls = db.classes.find(c => c.id === classId);
  const newAtt: SantriAttendance = {
    id: `satt-${Date.now()}`,
    classId, date,
    jumlahHadir: jumlahHadir || 0,
    jumlahIzin: jumlahIzin || 0,
    jumlahSakit: jumlahSakit || 0,
    jumlahAlpha: jumlahAlpha || 0,
    jumlahTotal: jumlahTotal || 0,
    notes: notes || '',
    academicYearId, semesterId,
    recordedBy: guru.id,
    teacherId: guru.teacherId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.santriAttendances.push(newAtt);
  saveDatabase(db);
  logActivity(guru.id, guru.name, 'Guru', 'Catat Absensi Santri',
    `${guru.name} mencatat absensi santri Kelas ${cls?.name} pada ${date}`);
  res.status(201).json(newAtt);
});

// POST Admin mencatat absensi santri
app.post('/api/santri-attendances', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const { classId, date, jumlahHadir, jumlahIzin, jumlahSakit, jumlahAlpha, jumlahTotal, notes, academicYearId, semesterId } = req.body;

  if (!classId || !date || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'classId, date, academicYearId, dan semesterId wajib diisi' });
    return;
  }

  const db = getDatabase();
  if (!db.santriAttendances) db.santriAttendances = [];

  const cls = db.classes.find(c => c.id === classId);
  if (!cls) { res.status(404).json({ error: 'Kelas tidak ditemukan' }); return; }

  // Cek duplikat: 1 absensi per kelas per tanggal
  const dup = db.santriAttendances.find(a => a.classId === classId && a.date === date);
  if (dup) {
    res.status(400).json({ error: 'Absensi santri untuk kelas ini pada tanggal tersebut sudah ada. Gunakan edit untuk mengubah.' });
    return;
  }

  const newAtt: SantriAttendance = {
    id: `satt-${Date.now()}`,
    classId, date,
    jumlahHadir: jumlahHadir || 0,
    jumlahIzin: jumlahIzin || 0,
    jumlahSakit: jumlahSakit || 0,
    jumlahAlpha: jumlahAlpha || 0,
    jumlahTotal: jumlahTotal || 0,
    notes: notes || '',
    academicYearId, semesterId,
    recordedBy: admin.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.santriAttendances.push(newAtt);
  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Catat Absensi Santri',
    `Mencatat absensi santri Kelas ${cls.name} pada ${date}`);
  res.status(201).json(newAtt);
});

// PUT update absensi santri (Admin only)
app.put('/api/santri-attendances/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.santriAttendances) db.santriAttendances = [];

  const att = db.santriAttendances.find(a => a.id === req.params.id);
  if (!att) { res.status(404).json({ error: 'Data absensi santri tidak ditemukan' }); return; }

  const { jumlahHadir, jumlahIzin, jumlahSakit, jumlahAlpha, jumlahTotal, notes, date, academicYearId, semesterId } = req.body;

  if (jumlahHadir !== undefined) att.jumlahHadir = jumlahHadir;
  if (jumlahIzin !== undefined)  att.jumlahIzin = jumlahIzin;
  if (jumlahSakit !== undefined) att.jumlahSakit = jumlahSakit;
  if (jumlahAlpha !== undefined) att.jumlahAlpha = jumlahAlpha;
  if (jumlahTotal !== undefined) att.jumlahTotal = jumlahTotal;
  if (notes !== undefined)       att.notes = notes;
  if (date)                      att.date = date;
  if (academicYearId)            att.academicYearId = academicYearId;
  if (semesterId)                att.semesterId = semesterId;
  att.updatedAt = new Date().toISOString();

  saveDatabase(db);
  const cls = db.classes.find(c => c.id === att.classId);
  logActivity(admin.id, admin.name, 'Admin', 'Edit Absensi Santri',
    `Mengubah absensi santri Kelas ${cls?.name} pada ${att.date}`);
  res.json(att);
});

// DELETE absensi santri (Admin only)
app.delete('/api/santri-attendances/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.santriAttendances) db.santriAttendances = [];

  const idx = db.santriAttendances.findIndex(a => a.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Data absensi santri tidak ditemukan' }); return; }

  const att = db.santriAttendances[idx];
  db.santriAttendances.splice(idx, 1);
  saveDatabase(db);

  const cls = db.classes.find(c => c.id === att.classId);
  logActivity(admin.id, admin.name, 'Admin', 'Hapus Absensi Santri',
    `Menghapus absensi santri Kelas ${cls?.name} pada ${att.date}`);
  res.json({ message: 'Absensi santri berhasil dihapus' });
});


// 12. Wali Kelas API
// GET — daftar wali kelas (semua user dapat akses, filter by teacherId dll)
app.get('/api/wali-kelas', requireAuth(), (req, res) => {
  const db = getDatabase();
  if (!db.waliKelas) db.waliKelas = [];
  const { teacherId, classId, academicYearId, semesterId } = req.query as Record<string, string>;

  let list = db.waliKelas;
  if (teacherId)      list = list.filter(w => w.teacherId === teacherId);
  if (classId)        list = list.filter(w => w.classId === classId);
  if (academicYearId) list = list.filter(w => w.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(w => w.semesterId === semesterId);

  const decorated = list.map(w => ({
    ...w,
    class: db.classes.find(c => c.id === w.classId),
    teacher: db.teachers.find(t => t.id === w.teacherId),
    academicYear: db.academicYears.find(y => y.id === w.academicYearId),
    semester: db.semesters.find(s => s.id === w.semesterId),
  }));

  res.json(decorated);
});

// POST — Admin menunjuk wali kelas
app.post('/api/wali-kelas', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const { classId, teacherId, academicYearId, semesterId } = req.body;

  if (!classId || !teacherId || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'classId, teacherId, academicYearId, dan semesterId wajib diisi' });
    return;
  }

  const db = getDatabase();
  if (!db.waliKelas) db.waliKelas = [];

  // Cek duplikat: 1 kelas hanya boleh 1 wali kelas per TA+Semester
  const dup = db.waliKelas.find(w => w.classId === classId && w.academicYearId === academicYearId && w.semesterId === semesterId);
  if (dup) {
    res.status(400).json({ error: 'Kelas ini sudah memiliki wali kelas pada periode tersebut. Hapus dulu sebelum menunjuk yang baru.' });
    return;
  }

  const cls = db.classes.find(c => c.id === classId);
  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!cls || !teacher) {
    res.status(404).json({ error: 'Kelas atau guru tidak ditemukan' });
    return;
  }

  const newWali: WaliKelas = {
    id: `wali-${Date.now()}`,
    classId, teacherId, academicYearId, semesterId,
    assignedBy: admin.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.waliKelas.push(newWali);
  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Tunjuk Wali Kelas',
    `Menunjuk ${teacher.name} sebagai wali kelas ${cls.name}`);
  res.status(201).json(newWali);
});

// PUT — Admin mengubah wali kelas (ganti guru/kelas)
app.put('/api/wali-kelas/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.waliKelas) db.waliKelas = [];

  const wali = db.waliKelas.find(w => w.id === req.params.id);
  if (!wali) { res.status(404).json({ error: 'Data wali kelas tidak ditemukan' }); return; }

  const { teacherId, academicYearId, semesterId } = req.body;

  // Cek duplikat (kecuali data ini sendiri)
  const targetClassId = wali.classId;
  const targetAY = academicYearId || wali.academicYearId;
  const targetSem = semesterId || wali.semesterId;
  const dup = db.waliKelas.find(w => w.id !== wali.id && w.classId === targetClassId && w.academicYearId === targetAY && w.semesterId === targetSem);
  if (dup) {
    res.status(400).json({ error: 'Kelas ini sudah memiliki wali kelas lain pada periode tersebut.' });
    return;
  }

  if (teacherId)      wali.teacherId = teacherId;
  if (academicYearId) wali.academicYearId = academicYearId;
  if (semesterId)     wali.semesterId = semesterId;
  wali.updatedAt = new Date().toISOString();

  saveDatabase(db);
  const cls = db.classes.find(c => c.id === wali.classId);
  const teacher = db.teachers.find(t => t.id === wali.teacherId);
  logActivity(admin.id, admin.name, 'Admin', 'Ubah Wali Kelas',
    `Mengubah wali kelas ${cls?.name} menjadi ${teacher?.name}`);
  res.json(wali);
});

// DELETE — Admin menghapus penugasan wali kelas
app.delete('/api/wali-kelas/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.waliKelas) db.waliKelas = [];

  const idx = db.waliKelas.findIndex(w => w.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Data wali kelas tidak ditemukan' }); return; }

  const wali = db.waliKelas[idx];
  db.waliKelas.splice(idx, 1);
  saveDatabase(db);

  const cls = db.classes.find(c => c.id === wali.classId);
  const teacher = db.teachers.find(t => t.id === wali.teacherId);
  logActivity(admin.id, admin.name, 'Admin', 'Hapus Wali Kelas',
    `Menghapus penugasan wali kelas ${cls?.name} (${teacher?.name})`);
  res.json({ message: 'Penugasan wali kelas berhasil dihapus' });
});


// 13. Santri API
app.get('/api/santri', requireAuth(), (req, res) => {
  const db = getDatabase();
  const { classId } = req.query as Record<string, string>;
  let list = db.santri || [];
  if (classId) list = list.filter(s => s.classId === classId);
  
  // Decorate with class
  const decorated = list.map(s => ({
    ...s,
    class: db.classes.find(c => c.id === s.classId)
  }));
  res.json(decorated);
});

app.post('/api/santri', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const { nis, name, classId } = req.body;

  if (!nis || !name || !classId) {
    res.status(400).json({ error: 'NIS, Nama, dan Kelas wajib diisi' });
    return;
  }

  const db = getDatabase();
  if (!db.santri) db.santri = [];

  if (db.santri.find(s => s.nis === nis)) {
    res.status(400).json({ error: 'NIS sudah terdaftar' });
    return;
  }

  const cls = db.classes.find(c => c.id === classId);
  if (!cls) {
    res.status(404).json({ error: 'Kelas tidak ditemukan' });
    return;
  }

  const newSantri: Santri = {
    id: `santri-${Date.now()}`,
    nis, name, classId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.santri.push(newSantri);
  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Tambah Santri', `Menambahkan santri baru: ${name} (NIS: ${nis}) di Kelas ${cls.name}`);
  res.status(201).json(newSantri);
});

app.put('/api/santri/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.santri) db.santri = [];

  const santri = db.santri.find(s => s.id === req.params.id);
  if (!santri) { res.status(404).json({ error: 'Santri tidak ditemukan' }); return; }

  const { nis, name, classId } = req.body;
  if (nis && nis !== santri.nis && db.santri.find(s => s.id !== santri.id && s.nis === nis)) {
    res.status(400).json({ error: 'NIS sudah terdaftar untuk santri lain' });
    return;
  }

  if (nis) santri.nis = nis;
  if (name) santri.name = name;
  if (classId) santri.classId = classId;
  santri.updatedAt = new Date().toISOString();

  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Edit Santri', `Mengubah data santri: ${santri.name} (NIS: ${santri.nis})`);
  res.json(santri);
});

app.delete('/api/santri/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.santri) db.santri = [];

  const idx = db.santri.findIndex(s => s.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Santri tidak ditemukan' }); return; }

  const santri = db.santri[idx];
  db.santri.splice(idx, 1);
  // Optional: delete related nilai? (keep it simple for now, or just let them be orphaned, or delete them)
  if (db.nilai) {
    db.nilai = db.nilai.filter(n => n.santriId !== santri.id);
  }

  saveDatabase(db);
  logActivity(admin.id, admin.name, 'Admin', 'Hapus Santri', `Menghapus santri: ${santri.name} (NIS: ${santri.nis})`);
  res.json({ message: 'Santri berhasil dihapus' });
});


// 14. Nilai API
app.get('/api/nilai', requireAuth(), (req, res) => {
  const db = getDatabase();
  const { santriId, classId, subjectId, academicYearId, semesterId, teacherId } = req.query as Record<string, string>;
  let list = db.nilai || [];

  if (santriId) list = list.filter(n => n.santriId === santriId);
  if (subjectId) list = list.filter(n => n.subjectId === subjectId);
  if (academicYearId) list = list.filter(n => n.academicYearId === academicYearId);
  if (semesterId) list = list.filter(n => n.semesterId === semesterId);
  if (teacherId) list = list.filter(n => n.teacherId === teacherId);

  // Filter by classId via santri's class
  if (classId) {
    const santriIdsInClass = (db.santri || []).filter(s => s.classId === classId).map(s => s.id);
    list = list.filter(n => santriIdsInClass.includes(n.santriId));
  }

  const decorated = list.map(n => ({
    ...n,
    santri: db.santri.find(s => s.id === n.santriId),
    subject: db.subjects.find(sub => sub.id === n.subjectId),
    academicYear: db.academicYears.find(ay => ay.id === n.academicYearId),
    semester: db.semesters.find(sem => sem.id === n.semesterId),
    teacher: db.teachers.find(t => t.id === n.teacherId)
  }));
  res.json(decorated);
});

app.post('/api/nilai', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { santriId, subjectId, academicYearId, semesterId, score, notes } = req.body;

  if (!santriId || !subjectId || !academicYearId || !semesterId || score === undefined) {
    res.status(400).json({ error: 'Data nilai tidak lengkap' });
    return;
  }

  const db = getDatabase();
  if (!db.nilai) db.nilai = [];

  const santri = db.santri.find(s => s.id === santriId);
  const subject = db.subjects.find(s => s.id === subjectId);
  if (!santri || !subject) {
    res.status(404).json({ error: 'Santri atau Mata Pelajaran tidak ditemukan' });
    return;
  }

  // Check if nilai already exists for this santri, subject, AY, semester
  let nilai = db.nilai.find(n => n.santriId === santriId && n.subjectId === subjectId && n.academicYearId === academicYearId && n.semesterId === semesterId);

  if (nilai) {
    // Update
    nilai.score = Number(score);
    nilai.notes = notes || '';
    nilai.teacherId = user.teacherId || user.id;
    nilai.updatedAt = new Date().toISOString();
    logActivity(user.id, user.name, user.role, 'Update Nilai', `Mengubah nilai ${subject.name} untuk ${santri.name}`);
  } else {
    // Create
    nilai = {
      id: `nilai-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      santriId, subjectId, academicYearId, semesterId,
      teacherId: user.teacherId || user.id,
      score: Number(score),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.nilai.push(nilai);
    logActivity(user.id, user.name, user.role, 'Input Nilai', `Menginput nilai ${subject.name} untuk ${santri.name}`);
  }

  saveDatabase(db);
  res.status(201).json(nilai);
});

app.put('/api/nilai/:id', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  if (!db.nilai) db.nilai = [];

  const nilai = db.nilai.find(n => n.id === req.params.id);
  if (!nilai) { res.status(404).json({ error: 'Nilai tidak ditemukan' }); return; }

  const { score, notes } = req.body;
  if (score !== undefined) nilai.score = Number(score);
  if (notes !== undefined) nilai.notes = notes;
  nilai.teacherId = user.teacherId || user.id; // Mark last editor
  nilai.updatedAt = new Date().toISOString();

  saveDatabase(db);
  
  const santri = db.santri.find(s => s.id === nilai.santriId);
  const subject = db.subjects.find(s => s.id === nilai.subjectId);
  logActivity(user.id, user.name, user.role, 'Edit Nilai', `Mengubah nilai ${subject?.name} untuk ${santri?.name}`);
  
  res.json(nilai);
});

app.delete('/api/nilai/:id', requireAuth('Admin'), (req, res) => {
  const admin = (req as any).user as User;
  const db = getDatabase();
  if (!db.nilai) db.nilai = [];

  const idx = db.nilai.findIndex(n => n.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: 'Nilai tidak ditemukan' }); return; }

  const nilai = db.nilai[idx];
  db.nilai.splice(idx, 1);
  saveDatabase(db);

  const santri = db.santri.find(s => s.id === nilai.santriId);
  const subject = db.subjects.find(s => s.id === nilai.subjectId);
  logActivity(admin.id, admin.name, 'Admin', 'Hapus Nilai', `Menghapus nilai ${subject?.name} untuk ${santri?.name}`);
  
  res.json({ message: 'Nilai berhasil dihapus' });
});

// 15. RaporDetail API
app.get('/api/rapor-detail', requireAuth(), (req, res) => {
  const db = getDatabase();
  const { santriId, academicYearId, semesterId } = req.query as Record<string, string>;
  let list = db.raporDetails || [];

  if (santriId) list = list.filter(r => r.santriId === santriId);
  if (academicYearId) list = list.filter(r => r.academicYearId === academicYearId);
  if (semesterId) list = list.filter(r => r.semesterId === semesterId);

  res.json(list);
});

app.post('/api/rapor-detail', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { santriId, academicYearId, semesterId, kepribadian, ketahfizhan, ekstrakurikuler, ketidakhadiran, catatanWaliKelas, keputusanKenaikan, tanggapanOrangTua } = req.body;

  if (!santriId || !academicYearId || !semesterId) {
    res.status(400).json({ error: 'Data santri, tahun ajaran, dan semester wajib diisi' });
    return;
  }

  const db = getDatabase();
  if (!db.raporDetails) db.raporDetails = [];

  const existing = db.raporDetails.find(r => r.santriId === santriId && r.academicYearId === academicYearId && r.semesterId === semesterId);
  if (existing) {
    res.status(400).json({ error: 'Detail Rapor untuk santri pada periode ini sudah ada. Gunakan metode PUT untuk mengupdate.' });
    return;
  }

  const santri = db.santri.find(s => s.id === santriId);

  const newRapor: RaporDetail = {
    id: `rapor-${Date.now()}`,
    santriId,
    academicYearId,
    semesterId,
    kepribadian: kepribadian || [],
    ketahfizhan: ketahfizhan || [],
    ekstrakurikuler: ekstrakurikuler || [],
    ketidakhadiran: ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 },
    catatanWaliKelas: catatanWaliKelas || '',
    keputusanKenaikan: keputusanKenaikan || '',
    tanggapanOrangTua: tanggapanOrangTua || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.raporDetails.push(newRapor);
  saveDatabase(db);
  
  logActivity(user.id, user.name, user.role, 'Isi Detail Rapor', `Menginput detail rapor untuk ${santri?.name || santriId}`);
  res.status(201).json(newRapor);
});

app.put('/api/rapor-detail/:id', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  if (!db.raporDetails) db.raporDetails = [];

  const rapor = db.raporDetails.find(r => r.id === req.params.id);
  if (!rapor) {
    res.status(404).json({ error: 'Detail Rapor tidak ditemukan' });
    return;
  }

  const { kepribadian, ketahfizhan, ekstrakurikuler, ketidakhadiran, catatanWaliKelas, keputusanKenaikan, tanggapanOrangTua } = req.body;

  if (kepribadian) rapor.kepribadian = kepribadian;
  if (ketahfizhan) rapor.ketahfizhan = ketahfizhan;
  if (ekstrakurikuler) rapor.ekstrakurikuler = ekstrakurikuler;
  if (ketidakhadiran) rapor.ketidakhadiran = ketidakhadiran;
  if (catatanWaliKelas !== undefined) rapor.catatanWaliKelas = catatanWaliKelas;
  if (keputusanKenaikan !== undefined) rapor.keputusanKenaikan = keputusanKenaikan;
  if (tanggapanOrangTua !== undefined) rapor.tanggapanOrangTua = tanggapanOrangTua;
  
  rapor.updatedAt = new Date().toISOString();

  saveDatabase(db);
  
  const santri = db.santri.find(s => s.id === rapor.santriId);
  logActivity(user.id, user.name, user.role, 'Update Detail Rapor', `Mengubah detail rapor untuk ${santri?.name || rapor.santriId}`);
  
  res.json(rapor);
});

// BULK API FOR IMPORT EXCEL
app.post('/api/santri-attendance/bulk', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { attendances } = req.body;
  if (!Array.isArray(attendances)) {
    res.status(400).json({ error: 'Format data salah, harus berupa array' });
    return;
  }
  const db = getDatabase();
  let count = 0;
  for (const item of attendances) {
    const { santriId, classId, date, status, notes } = item;
    if (!santriId || !classId || !date) continue;
    const existing = db.santriAttendances.find(a => a.santriId === santriId && a.date === date);
    if (existing) {
      existing.status = status;
      existing.notes = notes || '';
      existing.updatedAt = new Date().toISOString();
      existing.teacherId = user.teacherId || user.id;
    } else {
      db.santriAttendances.push({
        id: `att-santri-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        santriId, classId, date,
        status: status || 'Hadir',
        notes: notes || '',
        teacherId: user.teacherId || user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    count++;
  }
  saveDatabase(db);
  logActivity(user.id, user.name, user.role, 'Bulk Import Absensi', `Mengimport ${count} data absensi santri via Excel`);
  res.status(201).json({ message: `Berhasil mengimport ${count} data` });
});

app.post('/api/nilai/bulk', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { nilaiList } = req.body;
  if (!Array.isArray(nilaiList)) {
    res.status(400).json({ error: 'Format data salah, harus berupa array' });
    return;
  }
  const db = getDatabase();
  let count = 0;
  for (const item of nilaiList) {
    const { santriId, subjectId, academicYearId, semesterId, score, notes } = item;
    if (!santriId || !subjectId || !academicYearId || !semesterId) continue;
    const existing = db.nilai.find(n => n.santriId === santriId && n.subjectId === subjectId && n.academicYearId === academicYearId && n.semesterId === semesterId);
    if (existing) {
      existing.score = Number(score);
      existing.notes = notes || '';
      existing.updatedAt = new Date().toISOString();
      existing.teacherId = user.teacherId || user.id;
    } else {
      db.nilai.push({
        id: `nilai-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        santriId, subjectId, academicYearId, semesterId,
        teacherId: user.teacherId || user.id,
        score: Number(score),
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    count++;
  }
  saveDatabase(db);
  logActivity(user.id, user.name, user.role, 'Bulk Import Nilai', `Mengimport ${count} data nilai via Excel`);
  res.status(201).json({ message: `Berhasil mengimport ${count} data` });
});

app.post('/api/rpp/bulk', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { rppList } = req.body;
  if (!Array.isArray(rppList)) {
    res.status(400).json({ error: 'Format data salah, harus berupa array' });
    return;
  }
  const db = getDatabase();
  let count = 0;
  for (const rpp of rppList) {
    if (!rpp.classId || !rpp.subjectId || !rpp.academicYearId) continue;
    db.rpps.push({
      ...rpp,
      id: `rpp-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      teacherId: user.teacherId || user.id,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    count++;
  }
  saveDatabase(db);
  logActivity(user.id, user.name, user.role, 'Bulk Import RPP', `Mengimport ${count} dokumen RPP via Excel`);
  res.status(201).json({ message: `Berhasil mengimport ${count} RPP` });
});

app.post('/api/rapor-detail/bulk', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const { raporList } = req.body;
  if (!Array.isArray(raporList)) {
    res.status(400).json({ error: 'Format data salah, harus berupa array' });
    return;
  }
  const db = getDatabase();
  let count = 0;
  for (const rapor of raporList) {
    if (!rapor.santriId || !rapor.academicYearId || !rapor.semesterId) continue;
    const existing = db.raporDetails.find(r => r.santriId === rapor.santriId && r.academicYearId === rapor.academicYearId && r.semesterId === rapor.semesterId);
    if (existing) {
      existing.kepribadian = rapor.kepribadian || existing.kepribadian;
      existing.ketahfizhan = rapor.ketahfizhan || existing.ketahfizhan;
      existing.ekstrakurikuler = rapor.ekstrakurikuler || existing.ekstrakurikuler;
      existing.ketidakhadiran = rapor.ketidakhadiran || existing.ketidakhadiran;
      existing.catatanWaliKelas = rapor.catatanWaliKelas || existing.catatanWaliKelas;
      existing.keputusanKenaikan = rapor.keputusanKenaikan || existing.keputusanKenaikan;
      existing.updatedAt = new Date().toISOString();
    } else {
      db.raporDetails.push({
        ...rapor,
        id: `rapor-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    count++;
  }
  saveDatabase(db);
  logActivity(user.id, user.name, user.role, 'Bulk Import Detail Rapor', `Mengimport ${count} data detail rapor via Excel`);
  res.status(201).json({ message: `Berhasil mengimport ${count} data rapor` });
});

// 11. Activity Logs API
app.get('/api/activity-logs', requireAuth('Admin'), (req, res) => {
  res.json(getDatabase().activityLogs);
});


// 10. File upload via base64 JSON payload
app.post('/api/upload', requireAuth(), (req, res) => {
  const { fileName, fileType, fileData } = req.body;
  
  if (!fileName || !fileData) {
    res.status(400).json({ error: 'Nama berkas dan konten data tidak boleh kosong' });
    return;
  }

  try {
    // Strip header if exists (e.g., "data:application/pdf;base64,")
    const base64Content = fileData.split(';base64,').pop();
    const buffer = Buffer.from(base64Content, 'base64');
    
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${baseName}_${Date.now()}${extension}`;
    
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFileName}`;
    res.json({
      url: relativeUrl,
      name: fileName
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Gagal mengunggah lampiran: ' + error.message });
  }
});


// ============================================================================
// FRONTEND INTEGRATION & MIDDLEWARE
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Setup Vite as a dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of pre-built React asset files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback single-page-application route
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMRPP MQBA Isy Karima server is running on http://localhost:${PORT}`);
  });
}

startServer();
