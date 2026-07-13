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
  const user = db.users.find(u => u.id === token);
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
    kompetensiInti, kompetensiDasar,
    objectivesGanjil, totalMeetingsGanjil, materialsGanjil,
    objectivesGenap, totalMeetingsGenap, materialsGenap,
    method, media, assessment, notes,
    syllabusItems,
    attachmentUrl, attachmentName,
    status
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
    kompetensiInti: kompetensiInti || '',
    kompetensiDasar: kompetensiDasar || '',
    objectivesGanjil: objectivesGanjil || '',
    totalMeetingsGanjil: totalMeetingsGanjil || 0,
    materialsGanjil: materialsGanjil || '',
    objectivesGenap: objectivesGenap || '',
    totalMeetingsGenap: totalMeetingsGenap || 0,
    materialsGenap: materialsGenap || '',
    method: method || '',
    media: media || '',
    assessment: assessment || '',
    notes: notes || '',
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
    `Membuat RPP Tahunan (${status || 'Draft'}) untuk ${mapel} - Kelas ${kelas} - TA ${tahun}`);

  res.status(201).json(newRpp);
});

app.put('/api/rpps/:id', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const rpp = db.rpps.find(r => r.id === req.params.id);

  if (!rpp) {
    res.status(404).json({ error: 'RPP tidak ditemukan' });
    return;
  }

  if (user.role === 'Guru' && rpp.teacherId !== user.teacherId) {
    res.status(403).json({ error: 'Anda hanya dapat mengedit RPP milik Anda sendiri' });
    return;
  }

  const {
    kompetensiInti, kompetensiDasar,
    objectivesGanjil, totalMeetingsGanjil, materialsGanjil,
    objectivesGenap, totalMeetingsGenap, materialsGenap,
    method, media, assessment, notes,
    syllabusItems,
    attachmentUrl, attachmentName,
    status
  } = req.body;

  if (kompetensiInti !== undefined) rpp.kompetensiInti = kompetensiInti;
  if (kompetensiDasar !== undefined) rpp.kompetensiDasar = kompetensiDasar;
  if (objectivesGanjil !== undefined) rpp.objectivesGanjil = objectivesGanjil;
  if (totalMeetingsGanjil !== undefined) rpp.totalMeetingsGanjil = totalMeetingsGanjil;
  if (materialsGanjil !== undefined) rpp.materialsGanjil = materialsGanjil;
  if (objectivesGenap !== undefined) rpp.objectivesGenap = objectivesGenap;
  if (totalMeetingsGenap !== undefined) rpp.totalMeetingsGenap = totalMeetingsGenap;
  if (materialsGenap !== undefined) rpp.materialsGenap = materialsGenap;
  if (method !== undefined) rpp.method = method;
  if (media !== undefined) rpp.media = media;
  if (assessment !== undefined) rpp.assessment = assessment;
  if (notes !== undefined) rpp.notes = notes;
  if (syllabusItems !== undefined) rpp.syllabusItems = syllabusItems;
  if (attachmentUrl !== undefined) rpp.attachmentUrl = attachmentUrl;
  if (attachmentName !== undefined) rpp.attachmentName = attachmentName;
  if (status) rpp.status = status;

  rpp.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const mapel = db.subjects.find(s => s.id === rpp.subjectId)?.name || '';
  const kelas = db.classes.find(c => c.id === rpp.classId)?.name || '';

  logActivity(user.id, user.name, user.role, 'Ubah RPP',
    `Memperbarui RPP Tahunan ${mapel} - Kelas ${kelas} (Status: ${rpp.status})`);

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

// GET rekap absensi — summary per guru untuk filter tertentu
app.get('/api/attendances/summary', requireAuth(), (req, res) => {
  const user = (req as any).user as User;
  const db = getDatabase();
  const { month, year, semesterId, academicYearId } = req.query as Record<string, string>;

  let list = db.attendances || [];

  // Guru hanya bisa lihat milik sendiri
  if (user.role === 'Guru') {
    list = list.filter(a => a.teacherId === user.teacherId);
  }

  if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
  if (semesterId)     list = list.filter(a => a.semesterId === semesterId);
  if (year)           list = list.filter(a => a.date.startsWith(year));
  if (month && year)  list = list.filter(a => a.date.startsWith(`${year}-${month.padStart(2,'0')}`));

  // Hitung per guru
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


// 10. Activity Logs API
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
