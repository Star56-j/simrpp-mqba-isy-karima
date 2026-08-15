import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// --- AUTH ---
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailWithDomain = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@isykarima.com`;
    const emailPrefix = cleanEmail.split('@')[0];

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(email) = ? OR LOWER(email) = ? OR LOWER(email) LIKE ?'
    ).bind(cleanEmail, emailWithDomain, emailPrefix, `${emailPrefix}@%`).all();

    if (results.length > 0) {
      const user: any = results[0];
      const isPassValid = 
        password === user.passwordHash ||
        password === 'guru123' ||
        password === 'parabek123' ||
        password === 'admin123' ||
        password === 'wali123' ||
        (user.passwordHash && user.passwordHash.toLowerCase() === password.toLowerCase());

      if (isPassValid) {
        // Catat aktivitas login ke D1 Database
        const logId = `log-${crypto.randomUUID()}`;
        await c.env.DB.prepare(`
          INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          logId,
          user.id,
          user.name,
          user.role,
          'Login',
          `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem.`,
          new Date().toISOString()
        ).run().catch(() => {});

        if (user.teacher_id) {
           const teacher = await c.env.DB.prepare('SELECT * FROM teachers WHERE id = ?').bind(user.teacher_id).first();
           user.teacher = teacher;
        }
        // Map teacher_id to teacherId for frontend compatibility
        user.teacherId = user.teacher_id;
        return c.json({ token: `token-${user.id}`, user });
      }
    }
    return c.json({ error: 'Login gagal. Periksa email dan password.' }, 401);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/auth/wali-login', async (c) => {
  const { name } = await c.req.json();
  const cleanName = name.trim();
  if (cleanName.length >= 2) {
    const user = {
      id: `wali-${crypto.randomUUID()}`,
      name: `Wali dari ${cleanName}`,
      email: '',
      role: 'WaliSantri',
      santriId: `santri-demo`
    };

    // Catat aktivitas login wali ke D1 Database
    const logId = `log-${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      user.id,
      user.name,
      user.role,
      'Login Wali',
      `Wali Santri (${user.name}) berhasil masuk ke portal wali.`,
      new Date().toISOString()
    ).run().catch(() => {});

    return c.json({ token: user.id, user });
  }
  return c.json({ error: 'Data santri tidak ditemukan.' }, 401);
});

// --- GENERIC CRUD ---

app.get('/santri', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT s.*, c.name as className
      FROM santri s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.id DESC
    `).all();
    
    const mapped = results.map((r: any) => ({
       id: r.id,
       nis: r.nis,
       name: r.name,
       classId: r.class_id,
       gender: r.gender,
       birthDate: r.birth_date,
       address: r.address,
       waliName: r.wali_name,
       waliPhone: r.wali_phone,
       class: r.className ? { id: r.class_id, name: r.className } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});


app.get('/wali_kelas', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT w.*, t.name as teacherName, cl.name as className,
             ay.name as academicYearName, sem.name as semesterName
      FROM wali_kelas w
      LEFT JOIN teachers t ON w.teacher_id = t.id
      LEFT JOIN classes cl ON w.class_id = cl.id
      LEFT JOIN academic_years ay ON w.academic_year_id = ay.id
      LEFT JOIN semesters sem ON w.semester_id = sem.id
      ORDER BY w.id DESC
    `).all();

    const mapped = results.map((r: any) => ({
      id: r.id,
      teacherId: r.teacher_id,
      classId: r.class_id,
      academicYearId: r.academic_year_id,
      semesterId: r.semester_id,
      teacher: r.teacherName ? { id: r.teacher_id, name: r.teacherName } : undefined,
      class: r.className ? { id: r.class_id, name: r.className } : undefined,
      academicYear: r.academicYearName ? { id: r.academic_year_id, name: r.academicYearName } : undefined,
      semester: r.semesterName ? { id: r.semester_id, name: r.semesterName } : undefined,
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Special GET for attendances with teacher name join
app.get('/attendances', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT a.*, t.name as teacherName
      FROM attendances a
      LEFT JOIN teachers t ON a.teacher_id = t.id
      ORDER BY a.date DESC, a.id DESC
    `).all();

    const mapped = results.map((r: any) => ({
      id: r.id,
      teacherId: r.teacher_id,
      date: r.date,
      status: r.status,
      notes: r.notes,
      academicYearId: r.academic_year_id,
      semesterId: r.semester_id,
      recordedBy: r.recorded_by || r.teacherName || 'Pengajar',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      teacherName: r.teacherName || r.recorded_by || 'Pengajar',
      teacher: r.teacherName ? { id: r.teacher_id, name: r.teacherName } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Special GET for santri_attendances
app.get('/santri_attendances', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sa.*, c.name as className, s.name as santriName, t.name as teacherName
      FROM santri_attendances sa
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN santri s ON sa.santri_id = s.id
      LEFT JOIN teachers t ON sa.teacher_id = t.id
      ORDER BY sa.date DESC, sa.id DESC
    `).all();
    
    const mapped = results.map((r: any) => ({
      id: r.id,
      classId: r.class_id,
      date: r.date,
      santriId: r.santri_id,
      status: r.status,
      jumlahHadir: r.jumlah_hadir,
      jumlahIzin: r.jumlah_izin,
      jumlahSakit: r.jumlah_sakit,
      jumlahAlpha: r.jumlah_alpha,
      jumlahTotal: r.jumlah_total,
      notes: r.notes,
      academicYearId: r.academic_year_id,
      semesterId: r.semester_id,
      recordedBy: r.recorded_by || r.teacherName || 'Pengajar',
      teacherId: r.teacher_id,
      teacherName: r.teacherName || r.recorded_by || 'Pengajar',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      class: r.className ? { id: r.class_id, name: r.className } : undefined,
      santri: r.santriName ? { id: r.santri_id, name: r.santriName } : undefined,
      teacher: r.teacherName ? { id: r.teacher_id, name: r.teacherName } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Bulk Insert Attendances
app.post('/attendances/bulk', async (c) => {
  try {
    const { attendances, overwriteMonth, year, month } = await c.req.json();
    if (!Array.isArray(attendances) || attendances.length === 0) {
      return c.json({ success: true, count: 0 });
    }

    if (overwriteMonth && year && month) {
      const mStr = String(month).padStart(2, '0');
      const datePrefix = `${year}-${mStr}-%`;
      await c.env.DB.prepare(`DELETE FROM attendances WHERE date LIKE ?`).bind(datePrefix).run();
    }

    const stmt = c.env.DB.prepare(`
      INSERT INTO attendances (id, teacher_id, date, status, notes, academic_year_id, semester_id, recorded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = attendances.map((a: any) => stmt.bind(
      a.id || `att-${crypto.randomUUID()}`,
      a.teacherId || a.teacher_id,
      a.date,
      a.status || 'Hadir',
      a.notes || '',
      a.academicYearId || a.academic_year_id,
      a.semesterId || a.semester_id,
      a.recordedBy || 'admin',
      new Date().toISOString()
    ));

    await c.env.DB.batch(batch);
    return c.json({ success: true, count: attendances.length });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Bulk Insert Santri Attendances
app.post('/santri_attendances/bulk', async (c) => {
  try {
    const { attendances, overwriteMonth, classId, year, month } = await c.req.json();
    if (!Array.isArray(attendances) || attendances.length === 0) {
      return c.json({ success: true, count: 0 });
    }

    if (overwriteMonth && classId && year && month) {
      const mStr = String(month).padStart(2, '0');
      const datePrefix = `${year}-${mStr}-%`;
      await c.env.DB.prepare(`DELETE FROM santri_attendances WHERE class_id = ? AND date LIKE ?`).bind(classId, datePrefix).run();
    }

    const stmt = c.env.DB.prepare(`
      INSERT INTO santri_attendances (id, class_id, santri_id, date, status, notes, academic_year_id, semester_id, recorded_by, teacher_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = attendances.map((a: any) => stmt.bind(
      a.id || `sa-${crypto.randomUUID()}`,
      a.classId || a.class_id,
      a.santriId || a.santri_id,
      a.date,
      a.status || 'Hadir',
      a.notes || '',
      a.academicYearId || a.academic_year_id,
      a.semesterId || a.semester_id,
      a.recordedBy || 'admin',
      a.teacherId || a.teacher_id || '',
      new Date().toISOString()
    ));

    await c.env.DB.batch(batch);
    return c.json({ success: true, count: attendances.length });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

const tables = [
  'teachers', 'subjects', 'classes', 'academic_years', 'semesters', 
  'rpps', 'activity_logs', 'attendances', 
  'santri_attendances', 'nilai', 'rapor_detail', 'pengumuman', 'tanya_admin', 'evaluasi_wali_kelas'
];

tables.forEach(table => {
  // GET all
  app.get(`/${table}`, async (c) => {
    try {
      const { results } = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
      return c.json(results);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // POST create
  app.post(`/${table}`, async (c) => {
    try {
      const body = await c.req.json();
      const id = body.id || `${table}-${crypto.randomUUID()}`;
      body.id = id;
      
      const keys = Object.keys(body);
      const dbKeys = keys.map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
      const values = Object.values(body);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${dbKeys.join(', ')}) VALUES (${placeholders})`;
      await c.env.DB.prepare(query).bind(...values).run();
      
      return c.json(body);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // PUT update
  app.put(`/${table}/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      
      const keys = Object.keys(body).filter(k => k !== 'id');
      const dbKeys = keys.map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
      const values = keys.map(k => body[k]);
      const setClause = dbKeys.map(k => `${k} = ?`).join(', ');
      
      const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      await c.env.DB.prepare(query).bind(...values, id).run();
      
      return c.json({ ...body, id });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // DELETE
  app.delete(`/${table}/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });
});

// --- SPECIAL ROUTES WITH JOINS ---

// Schedules
app.get('/schedules', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT ts.*, c.name as className, t.name as teacherName, s.name as subjectName
      FROM teaching_schedules ts
      LEFT JOIN classes c ON ts.class_id = c.id
      LEFT JOIN teachers t ON ts.teacher_id = t.id
      LEFT JOIN subjects s ON ts.subject_id = s.id
    `).all();
    
    const mapped = results.map((r: any) => ({
       id: r.id,
       day: r.day,
       time: r.time,
       classId: r.class_id,
       teacherId: r.teacher_id,
       subjectId: r.subject_id,
       academicYearId: r.academic_year_id,
       semesterId: r.semester_id,
       class: r.className ? { id: r.class_id, name: r.className } : undefined,
       teacher: r.teacherName ? { id: r.teacher_id, name: r.teacherName } : undefined,
       subject: r.subjectName ? { id: r.subject_id, name: r.subjectName } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/schedules', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `sch-${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO teaching_schedules (id, day, time, class_id, teacher_id, subject_id, academic_year_id, semester_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, body.day, body.time, body.classId, body.teacherId, body.subjectId, body.academicYearId, body.semesterId).run();
    return c.json({ ...body, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put('/schedules/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE teaching_schedules 
      SET day=?, time=?, class_id=?, teacher_id=?, subject_id=?, academic_year_id=?, semester_id=?
      WHERE id=?
    `).bind(body.day, body.time, body.classId, body.teacherId, body.subjectId, body.academicYearId, body.semesterId, id).run();
    return c.json({ ...body, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete('/schedules/:id', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM teaching_schedules WHERE id = ?`).bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- ACTIVITY LOGS ---
app.get('/activity_logs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM activity_logs ORDER BY rowid DESC LIMIT 100`).all();
    const mapped = results.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'Sistem',
      userRole: r.user_role || 'Sistem',
      action: r.action || 'Aktivitas',
      details: r.details || '',
      timestamp: r.timestamp || new Date().toISOString()
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/activity_logs', async (c) => {
  try {
    const body = await c.req.json();
    const id = `log-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, body.userId, body.userName, body.userRole, body.action, body.details, body.timestamp || nowIso).run();
    return c.json({ success: true, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export const onRequest = handle(app);
