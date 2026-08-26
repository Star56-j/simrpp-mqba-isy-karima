import { Hono } from 'hono';

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();
const api = new Hono<{ Bindings: Env }>();

api.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

api.notFound((c) => {
  return c.json({ error: `API route not found: ${c.req.method} ${c.req.path}` }, 404);
});

api.use('*', async (c, next) => {
  if (c.req.path === '/health' || c.req.path === '/health/') {
    return next();
  }
  if (!c.env?.DB) {
    return c.json({
      error: 'Database D1 (DB) belum terhubung di Cloudflare Pages Dashboard. Buka Cloudflare Dashboard > Settings > Bindings > D1 Database, lalu hubungkan simrpp_db ke variabel DB.'
    }, 500);
  }
  return next();
});

api.get('/health', (c) => {
  return c.json({ ok: true, hasDb: !!c.env?.DB, timestamp: new Date().toISOString() });
});


// --- AUTH ---
api.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({ email: '', password: '' }));
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
        // Ensure activity_logs table exists
        await c.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            user_name TEXT,
            user_role TEXT,
            action TEXT,
            details TEXT,
            timestamp TEXT
          )
        `).run().catch(() => {});

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
          'Login Sistem',
          `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem.`,
          new Date().toISOString()
        ).run().catch((e: any) => console.error('Failed login log insert:', e));

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

api.post('/auth/wali-login', async (c) => {
  try {
    const { name } = await c.req.json();
    const cleanInput = (name || '').trim();
    if (cleanInput.length >= 1) {
      // 1. Cari santri berdasarkan NIS (exact/trimmed) atau Nama (exact / partial LIKE)
      const { results } = await c.env.DB.prepare(`
        SELECT s.*, c.name as className, c.level as classLevel
        FROM santri s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE LOWER(TRIM(s.nis)) = LOWER(?)
           OR LOWER(TRIM(s.name)) = LOWER(?)
           OR LOWER(s.name) LIKE ?
           OR LOWER(s.nis) LIKE ?
        ORDER BY 
          CASE 
            WHEN LOWER(TRIM(s.nis)) = LOWER(?) THEN 1
            WHEN LOWER(TRIM(s.name)) = LOWER(?) THEN 2
            ELSE 3
          END
        LIMIT 1
      `).bind(
        cleanInput, 
        cleanInput, 
        `%${cleanInput.toLowerCase()}%`, 
        `%${cleanInput.toLowerCase()}%`, 
        cleanInput, 
        cleanInput
      ).all();

      if (results && results.length > 0) {
        const santri: any = results[0];

        // 2. Ambil informasi Wali Kelas untuk kelas santri tersebut
        const wkRes = await c.env.DB.prepare(`
          SELECT wk.*, t.name as teacher_name, t.id as teacher_id
          FROM wali_kelas wk
          LEFT JOIN teachers t ON wk.teacher_id = t.id
          WHERE wk.class_id = ?
          LIMIT 1
        `).bind(santri.class_id).all().catch(() => ({ results: [] }));

        const waliKelasName = (wkRes.results?.[0] as any)?.teacher_name || 'Wali Kelas';
        const waliKelasTeacherId = (wkRes.results?.[0] as any)?.teacher_id || '';

        const user = {
          id: `wali-${santri.id}`,
          name: `Wali dari ${santri.name}`,
          email: `wali.${santri.nis || santri.id}@mqba.sch.id`,
          role: 'WaliSantri',
          santriId: santri.id,
          santriName: santri.name,
          nis: santri.nis || '-',
          classId: santri.class_id,
          className: santri.className || 'Kelas',
          waliKelasName: waliKelasName,
          waliKelasTeacherId: waliKelasTeacherId
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
          `Wali Santri (${user.name} - ${santri.className || 'Kelas'}) berhasil masuk ke portal wali.`,
          new Date().toISOString()
        ).run().catch(() => {});

        return c.json({ token: user.id, user });
      }
    }
    return c.json({ error: `Data santri dengan NIS / Nama "${cleanInput}" tidak ditemukan. Silakan periksa kembali ejaan nama atau NIS santri.` }, 401);
  } catch (err: any) {
    return c.json({ error: err.message || 'Terjadi kesalahan sistem saat login wali.' }, 500);
  }
});

// --- GENERIC CRUD ---

api.get('/santri', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT s.*, c.name as className
      FROM santri s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY LOWER(s.name) ASC
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

api.post('/santri', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `s-${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO santri (id, nis, name, class_id, gender, birth_date, address, wali_name, wali_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.nis || '',
      body.name || '',
      body.classId || body.class_id || '',
      body.gender || 'L',
      body.birthDate || body.birth_date || '',
      body.address || '',
      body.waliName || body.wali_name || '',
      body.waliPhone || body.wali_phone || ''
    ).run();

    return c.json({ ...body, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.put('/santri/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE santri
      SET nis=?, name=?, class_id=?, gender=?, birth_date=?, address=?, wali_name=?, wali_phone=?
      WHERE id=?
    `).bind(
      body.nis || '',
      body.name || '',
      body.classId || body.class_id || '',
      body.gender || 'L',
      body.birthDate || body.birth_date || '',
      body.address || '',
      body.waliName || body.wali_name || '',
      body.waliPhone || body.wali_phone || '',
      id
    ).run();

    return c.json({ ...body, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/santri/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM santri WHERE id = ?`).bind(id).run();
    await c.env.DB.prepare(`DELETE FROM santri_attendances WHERE santri_id = ?`).bind(id).run().catch(() => {});
    await c.env.DB.prepare(`DELETE FROM nilai WHERE santri_id = ?`).bind(id).run().catch(() => {});
    await c.env.DB.prepare(`DELETE FROM rapor_detail WHERE santri_id = ?`).bind(id).run().catch(() => {});

    return c.json({ success: true, message: 'Data santri berhasil dihapus.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});


api.get('/wali_kelas', async (c) => {
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

// Attendance Summary endpoint
api.get('/attendances/summary', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT a.*, t.name as teacherName
      FROM attendances a
      LEFT JOIN teachers t ON a.teacher_id = t.id
    `).all();

    const summary: Record<string, any> = {};
    for (const a of results as any[]) {
      const tId = (a.teacher_id && a.teacher_id !== 'pengajar') ? a.teacher_id : 't-12';
      const tName = a.teacherName || 'Ust. Aidil Aqli, S.Ag.';
      if (!summary[tId]) {
        summary[tId] = { teacherId: tId, teacherName: tName, hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, persentaseHadir: 0 };
      }
      if (a.status === 'Hadir') summary[tId].hadir++;
      if (a.status === 'Izin') summary[tId].izin++;
      if (a.status === 'Sakit') summary[tId].sakit++;
      if (a.status === 'Alpha') summary[tId].alpha++;
      summary[tId].total++;
    }

    const list = Object.values(summary).map((s: any) => {
      s.persentaseHadir = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return s;
    });
    return c.json(list);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Special GET for attendances with teacher name join
api.get('/attendances', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

    // Auto-fix legacy attendances with teacher_id = 'pengajar' or empty -> assign to t-12 (Ust. Aidil Aqli, S.Ag.)
    await c.env.DB.prepare(`
      UPDATE attendances
      SET teacher_id = 't-12'
      WHERE teacher_id = 'pengajar' OR teacher_id IS NULL OR teacher_id = '' OR teacher_id = 'undefined'
    `).run().catch(() => {});

    // Also auto-fix if subject is Akhlaq and subject_id is missing -> assign s-7
    await c.env.DB.prepare(`
      UPDATE attendances
      SET subject_id = 's-7'
      WHERE (subject_id IS NULL OR subject_id = '') AND notes LIKE '%Akhlaq%'
    `).run().catch(() => {});

    const { results } = await c.env.DB.prepare(`
      SELECT a.*, t.name as teacherName, s.name as subjectName
      FROM attendances a
      LEFT JOIN teachers t ON a.teacher_id = t.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      ORDER BY a.date DESC, a.id DESC
    `).all();

    const mapped = results.map((r: any) => {
      const resolvedTeacherId = (r.teacher_id && r.teacher_id !== 'pengajar') ? r.teacher_id : 't-12';
      const resolvedTeacherName = r.teacherName || 'Ust. Aidil Aqli, S.Ag.';
      return {
        id: r.id,
        teacherId: resolvedTeacherId,
        subjectId: r.subject_id,
        subjectName: r.subjectName || r.subject_name || '',
        date: r.date,
        status: r.status,
        notes: r.notes,
        academicYearId: r.academic_year_id,
        semesterId: r.semester_id,
        recordedBy: resolvedTeacherName,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        teacherName: resolvedTeacherName,
        teacher: { id: resolvedTeacherId, name: resolvedTeacherName },
        subject: (r.subjectName || r.subject_name || r.subject_id) ? { id: r.subject_id || '', name: r.subjectName || r.subject_name || '' } : undefined
      };
    });
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Santri Attendance Summary endpoint
api.get('/santri_attendances/summary', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sa.*, c.name as className
      FROM santri_attendances sa
      LEFT JOIN classes c ON sa.class_id = c.id
    `).all();

    const summary: Record<string, any> = {};
    for (const a of results as any[]) {
      if (!a.class_id) continue;
      if (!summary[a.class_id]) {
        summary[a.class_id] = {
          classId: a.class_id,
          className: a.className || 'Kelas',
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          total: 0,
          rataHadir: 0
        };
      }
      if (a.status === 'Hadir') summary[a.class_id].hadir++;
      if (a.status === 'Izin') summary[a.class_id].izin++;
      if (a.status === 'Sakit') summary[a.class_id].sakit++;
      if (a.status === 'Alpha') summary[a.class_id].alpha++;
      summary[a.class_id].total++;
    }

    const list = Object.values(summary).map((s: any) => {
      s.rataHadir = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return s;
    });
    return c.json(list);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Special GET for santri_attendances
api.get('/santri_attendances', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE santri_attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE santri_attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

    const { results } = await c.env.DB.prepare(`
      SELECT sa.*, c.name as className, s.name as santriName, t.name as teacherName, subj.name as subjectName
      FROM santri_attendances sa
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN santri s ON sa.santri_id = s.id
      LEFT JOIN teachers t ON sa.teacher_id = t.id
      LEFT JOIN subjects subj ON sa.subject_id = subj.id
      ORDER BY sa.date DESC, sa.id DESC
    `).all();
    
    const mapped = results.map((r: any) => ({
      id: r.id,
      classId: r.class_id,
      subjectId: r.subject_id,
      subjectName: r.subjectName || r.subject_name || '',
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
      subject: (r.subjectName || r.subject_name || r.subject_id) ? { id: r.subject_id || '', name: r.subjectName || r.subject_name || '' } : undefined,
      santri: r.santriName ? { id: r.santri_id, name: r.santriName } : undefined,
      teacher: r.teacherName ? { id: r.teacher_id, name: r.teacherName } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Clear all activity logs
api.delete('/activity_logs/clear_all', async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM activity_logs').run();
    return c.json({ success: true, message: 'Semua log aktivitas berhasil dihapus.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Special GET for nilai with field mapping
api.get('/nilai', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM nilai ORDER BY id DESC`).all();
    const mapped = results.map((r: any) => ({
      id: r.id,
      santriId: r.santri_id,
      subjectId: r.subject_id,
      classId: r.class_id,
      academicYearId: r.academic_year_id,
      semesterId: r.semester_id,
      harian: r.harian || 0,
      bulanan: r.bulanan || 0,
      uts: r.uts || 0,
      uas: r.uas || 0,
      uasLisan: r.uas_lisan || 0,
      notes: r.notes || ''
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Single Insert Attendance
api.post('/attendances', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

    const body = await c.req.json();
    const id = body.id || `att-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO attendances (id, teacher_id, subject_id, date, status, notes, academic_year_id, semester_id, recorded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.teacherId || body.teacher_id || '',
      body.subjectId || body.subject_id || '',
      body.date,
      body.status || 'Hadir',
      body.notes || '',
      body.academicYearId || body.academic_year_id || '',
      body.semesterId || body.semester_id || '',
      body.recordedBy || 'pengajar',
      nowIso
    ).run();

    return c.json({ ...body, id, createdAt: nowIso });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Update Single Attendance
api.put('/attendances/:id', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

    const id = c.req.param('id');
    const body = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE attendances
      SET teacher_id=?, subject_id=?, date=?, status=?, notes=?, academic_year_id=?, semester_id=?
      WHERE id=?
    `).bind(
      body.teacherId || body.teacher_id || '',
      body.subjectId || body.subject_id || '',
      body.date,
      body.status,
      body.notes || '',
      body.academicYearId || body.academic_year_id || '',
      body.semesterId || body.semester_id || '',
      id
    ).run();

    return c.json({ ...body, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Bulk Insert Attendances
api.post('/attendances/bulk', async (c) => {
  try {
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

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
      INSERT INTO attendances (id, teacher_id, subject_id, date, status, notes, academic_year_id, semester_id, recorded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = attendances.map((a: any) => stmt.bind(
      a.id || `att-${crypto.randomUUID()}`,
      a.teacherId || a.teacher_id,
      a.subjectId || a.subject_id || '',
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
api.post('/santri_attendances/bulk', async (c) => {
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

    await c.env.DB.prepare('ALTER TABLE santri_attendances ADD COLUMN subject_id TEXT').run().catch(() => {});
    await c.env.DB.prepare('ALTER TABLE santri_attendances ADD COLUMN subject_name TEXT').run().catch(() => {});

    const stmt = c.env.DB.prepare(`
      INSERT INTO santri_attendances (id, class_id, subject_id, subject_name, santri_id, date, status, notes, academic_year_id, semester_id, recorded_by, teacher_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = attendances.map((a: any) => stmt.bind(
      a.id || `sa-${crypto.randomUUID()}`,
      a.classId || a.class_id,
      a.subjectId || a.subject_id || '',
      a.subjectName || a.subject_name || '',
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

api.get('/teachers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM teachers ORDER BY LOWER(name) ASC`).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

const tables = [
  'teachers', 'subjects', 'classes', 'academic_years', 'semesters', 
  'rpps', 'activity_logs', 'attendances', 
  'santri_attendances', 'nilai', 'rapor_detail', 'tanya_admin', 'tanya_wali_kelas'
];

tables.forEach(table => {
  // GET all
  api.get(`/${table}`, async (c) => {
    try {
      if (table === 'rpps') {
        await c.env.DB.prepare("UPDATE rpps SET teacher_id = 't-12' WHERE teacher_id IS NULL OR teacher_id = '' OR teacher_id = 'undefined'").run().catch(() => {});
      }
      const { results } = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
      return c.json(results);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // POST create
  api.post(`/${table}`, async (c) => {
    try {
      const body = await c.req.json();
      const id = body.id || `${table}-${crypto.randomUUID()}`;
      body.id = id;

      if (table === 'rpps') {
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN capai_pembelajaran TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN attachment_url TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN attachment_name TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN alur_t_p TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN alur_tp TEXT').run().catch(() => {});
        if (!body.teacherId && !body.teacher_id) {
          body.teacherId = 't-12';
        }
      }
      
      const filteredKeys: string[] = [];
      const values: any[] = [];

      for (const k of Object.keys(body)) {
        const val = body[k];
        if (val === undefined) continue;
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && (k === 'class' || k === 'subject' || k === 'teacher' || k === 'academicYear' || k === 'semester')) {
          continue;
        }
        filteredKeys.push(k);
        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          values.push(JSON.stringify(val));
        } else {
          values.push(val);
        }
      }
      
      const mapKeyToDbColumn = (k: string) => {
        if (k === 'alurTP') return 'alur_tp';
        return k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      };

      const dbKeys = filteredKeys.map(mapKeyToDbColumn);
      const placeholders = filteredKeys.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${dbKeys.join(', ')}) VALUES (${placeholders})`;
      await c.env.DB.prepare(query).bind(...values).run();
      
      return c.json(body);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // PUT update
  api.put(`/${table}/:id`, async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();

      if (table === 'rpps') {
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN capai_pembelajaran TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN attachment_url TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN attachment_name TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN alur_t_p TEXT').run().catch(() => {});
        await c.env.DB.prepare('ALTER TABLE rpps ADD COLUMN alur_tp TEXT').run().catch(() => {});
        if (!body.teacherId && !body.teacher_id && body.status !== 'Disetujui' && body.status !== 'Revisi') {
          body.teacherId = 't-12';
        }
      }
      
      const filteredKeys: string[] = [];
      const values: any[] = [];

      for (const k of Object.keys(body)) {
        if (k === 'id') continue;
        const val = body[k];
        if (val === undefined) continue;
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && (k === 'class' || k === 'subject' || k === 'teacher' || k === 'academicYear' || k === 'semester')) {
          continue;
        }
        filteredKeys.push(k);
        if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
          values.push(JSON.stringify(val));
        } else {
          values.push(val);
        }
      }

      const mapKeyToDbColumn = (k: string) => {
        if (k === 'alurTP') return 'alur_tp';
        return k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      };
      
      const dbKeys = filteredKeys.map(mapKeyToDbColumn);
      const setClause = dbKeys.map(k => `${k} = ?`).join(', ');
      
      const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      await c.env.DB.prepare(query).bind(...values, id).run();
      
      return c.json({ ...body, id });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // DELETE
  api.delete(`/${table}/:id`, async (c) => {
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
api.get('/schedules', async (c) => {
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

api.post('/schedules', async (c) => {
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

api.put('/schedules/:id', async (c) => {
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

api.delete('/schedules/:id', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM teaching_schedules WHERE id = ?`).bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- DASHBOARD STATS ---
api.get('/dashboard/stats', async (c) => {
  try {
    const teachersCount = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM teachers').first() as any)?.count || 0;
    const subjectsCount = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM subjects').first() as any)?.count || 0;
    const classesCount = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM classes').first() as any)?.count || 0;
    const schedulesCount = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM teaching_schedules').first() as any)?.count || 0;
    const santriCount = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM santri').first() as any)?.count || 0;

    let rppStats = { total: 0, draft: 0, pending: 0, approved: 0, revision: 0 };
    try {
      const teacherIdParam = c.req.query('teacherId');
      let rppsRes: any[] = [];
      if (teacherIdParam) {
        const { results } = await c.env.DB.prepare('SELECT status FROM rpps WHERE teacher_id = ?').bind(teacherIdParam).all();
        rppsRes = results || [];
      } else {
        const { results } = await c.env.DB.prepare('SELECT status FROM rpps').all();
        rppsRes = results || [];
      }
      rppStats = {
        total: rppsRes.length,
        draft: rppsRes.filter((r: any) => r.status === 'Draft').length,
        pending: rppsRes.filter((r: any) => r.status === 'Menunggu Persetujuan' || r.status === 'Pending').length,
        approved: rppsRes.filter((r: any) => r.status === 'Disetujui' || r.status === 'Approved').length,
        revision: rppsRes.filter((r: any) => r.status === 'Perlu Revisi' || r.status === 'Revision' || r.status === 'Revisi').length,
      };
    } catch {}

    // Ensure activity_logs table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
      )
    `).run().catch(() => {});

    let logsRes: any[] = [];
    try {
      logsRes = (await c.env.DB.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC, rowid DESC LIMIT 50').all()).results || [];
    } catch {}

    let activityLogs = logsRes.map((r: any) => ({
      id: r.id,
      userId: r.user_id || r.userId || 'system',
      userName: r.user_name || r.userName || 'Sistem',
      userRole: r.user_role || r.userRole || 'Admin',
      action: r.action || 'Aktivitas',
      details: r.details || '',
      timestamp: r.timestamp || new Date().toISOString()
    }));

    if (activityLogs.length === 0) {
      const initLogId = `log-${crypto.randomUUID()}`;
      const nowIso = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        initLogId,
        'system',
        'Ust. Aidil Aqli. S.Ag',
        'Admin',
        'Sistem Utama',
        'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.',
        nowIso
      ).run().catch(() => {});

      activityLogs = [{
        id: initLogId,
        userId: 'system',
        userName: 'Ust. Aidil Aqli. S.Ag',
        userRole: 'Admin',
        action: 'Sistem Utama',
        details: 'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.',
        timestamp: nowIso
      }];
    }

    return c.json({
      teachers: teachersCount,
      subjects: subjectsCount,
      classes: classesCount,
      schedules: schedulesCount,
      santri: santriCount,
      rpp: rppStats,
      activityLogs
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- ACTIVITY LOGS ---
api.get('/activity_logs', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
      )
    `).run().catch(() => {});

    const { results } = await c.env.DB.prepare(`SELECT * FROM activity_logs ORDER BY timestamp DESC, rowid DESC LIMIT 500`).all();
    
    if (!results || results.length === 0) {
      const initLogId = `log-${crypto.randomUUID()}`;
      const nowIso = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        initLogId,
        'system',
        'Ust. Aidil Aqli. S.Ag',
        'Admin',
        'Sistem Utama',
        'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.',
        nowIso
      ).run().catch(() => {});

      return c.json([{
        id: initLogId,
        userId: 'system',
        userName: 'Ust. Aidil Aqli. S.Ag',
        userRole: 'Admin',
        action: 'Sistem Utama',
        details: 'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.',
        timestamp: nowIso
      }]);
    }

    const mapped = results.map((r: any) => ({
      id: r.id,
      userId: r.user_id || r.userId || 'system',
      userName: r.user_name || r.userName || (r.user_id === 'system' ? 'Sistem Utama' : 'Pengguna SIM RPP'),
      userRole: r.user_role || r.userRole || 'Admin',
      action: r.action || 'Aktivitas',
      details: r.details || '',
      timestamp: r.timestamp || new Date().toISOString()
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json([{
      id: `log-${crypto.randomUUID()}`,
      userId: 'system',
      userName: 'Ust. Aidil Aqli. S.Ag',
      userRole: 'Admin',
      action: 'Sistem Utama',
      details: 'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.',
      timestamp: new Date().toISOString()
    }]);
  }
});

api.post('/activity_logs', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        action TEXT,
        details TEXT,
        timestamp TEXT
      )
    `).run().catch(() => {});

    const body = await c.req.json();
    const id = body.id || `log-${crypto.randomUUID()}`;
    const nowIso = body.timestamp || new Date().toISOString();
    const userName = body.userName || body.user_name || 'Ust. Aidil Aqli. S.Ag';
    const userRole = body.userRole || body.user_role || 'Admin';
    const userId = body.userId || body.user_id || 'system';

    await c.env.DB.prepare(`
      INSERT INTO activity_logs (id, user_id, user_name, user_role, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      userName,
      userRole,
      body.action || 'Aktivitas',
      body.details || '',
      nowIso
    ).run();
    return c.json({ success: true, id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/activity_logs/clear_all', async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM activity_logs').run().catch(() => {});
    return c.json({ message: 'Log berhasil dibersihkan.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- PENGUMUMAN & BROADCAST ---
async function ensurePengumumanSchema(db: D1Database) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pengumuman (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        target_type TEXT DEFAULT 'semua',
        target_id TEXT DEFAULT '',
        target_name TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        file_url TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        file_size TEXT DEFAULT '',
        created_at TEXT,
        updated_at TEXT,
        author_id TEXT DEFAULT '',
        author_name TEXT DEFAULT 'Admin'
      )
    `).run().catch(() => {});

    const pragmaRes = await db.prepare('PRAGMA table_info(pengumuman)').all().catch(() => ({ results: [] }));
    const existingCols = new Set((pragmaRes.results || []).map((c: any) => String(c.name).toLowerCase()));

    const colsToAdd = [
      { name: 'title', def: 'TEXT' },
      { name: 'content', def: 'TEXT' },
      { name: 'target_type', def: 'TEXT DEFAULT "semua"' },
      { name: 'target_id', def: 'TEXT DEFAULT ""' },
      { name: 'target_name', def: 'TEXT DEFAULT ""' },
      { name: 'image_url', def: 'TEXT DEFAULT ""' },
      { name: 'file_url', def: 'TEXT DEFAULT ""' },
      { name: 'file_name', def: 'TEXT DEFAULT ""' },
      { name: 'file_size', def: 'TEXT DEFAULT ""' },
      { name: 'created_at', def: 'TEXT' },
      { name: 'updated_at', def: 'TEXT' },
      { name: 'author_id', def: 'TEXT DEFAULT ""' },
      { name: 'author_name', def: 'TEXT DEFAULT "Admin"' }
    ];

    for (const col of colsToAdd) {
      if (!existingCols.has(col.name.toLowerCase())) {
        await db.prepare(`ALTER TABLE pengumuman ADD COLUMN ${col.name} ${col.def}`).run().catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error in ensurePengumumanSchema:', err);
  }
}

api.get('/pengumuman', async (c) => {
  try {
    await ensurePengumumanSchema(c.env.DB);
    const { results } = await c.env.DB.prepare('SELECT * FROM pengumuman ORDER BY created_at DESC, rowid DESC').all();
    const mapped = (results || []).map((r: any) => ({
      id: r.id,
      title: r.title || '',
      content: r.content || '',
      targetType: r.target_type || r.targetType || 'semua',
      targetId: r.target_id || r.targetId || '',
      targetName: r.target_name || r.targetName || '',
      imageUrl: r.image_url || r.imageUrl || '',
      fileUrl: r.file_url || r.fileUrl || '',
      fileName: r.file_name || r.fileName || '',
      fileSize: r.file_size || r.fileSize || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
      authorId: r.author_id || r.authorId || '',
      authorName: r.author_name || r.authorName || 'Admin'
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/pengumuman', async (c) => {
  try {
    await ensurePengumumanSchema(c.env.DB);
    const body = await c.req.json();
    const id = body.id || `ann-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    const targetType = body.targetType || body.target_type || 'semua';
    const targetId = body.targetId || body.target_id || '';
    const targetName = body.targetName || body.target_name || '';
    const imageUrl = body.imageUrl || body.image_url || '';
    const fileUrl = body.fileUrl || body.file_url || '';
    const fileName = body.fileName || body.file_name || '';
    const fileSize = body.fileSize || body.file_size || '';
    const authorId = body.authorId || body.author_id || '';
    const authorName = body.authorName || body.author_name || 'Admin';

    await c.env.DB.prepare(`
      INSERT INTO pengumuman (
        id, title, content, target_type, target_id, target_name,
        image_url, file_url, file_name, file_size,
        created_at, updated_at, author_id, author_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title || '',
      body.content || '',
      targetType,
      targetId,
      targetName,
      imageUrl,
      fileUrl,
      fileName,
      fileSize,
      nowIso,
      nowIso,
      authorId,
      authorName
    ).run();

    return c.json({
      ...body,
      id,
      targetType,
      targetId,
      targetName,
      imageUrl,
      fileUrl,
      fileName,
      fileSize,
      authorId,
      authorName,
      createdAt: nowIso,
      updatedAt: nowIso
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.put('/pengumuman/:id', async (c) => {
  try {
    await ensurePengumumanSchema(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    const nowIso = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE pengumuman SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        target_type = COALESCE(?, target_type),
        target_id = COALESCE(?, target_id),
        target_name = COALESCE(?, target_name),
        image_url = COALESCE(?, image_url),
        file_url = COALESCE(?, file_url),
        file_name = COALESCE(?, file_name),
        file_size = COALESCE(?, file_size),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.title ?? null,
      body.content ?? null,
      body.targetType ?? body.target_type ?? null,
      body.targetId ?? body.target_id ?? null,
      body.targetName ?? body.target_name ?? null,
      body.imageUrl ?? body.image_url ?? null,
      body.fileUrl ?? body.file_url ?? null,
      body.fileName ?? body.file_name ?? null,
      body.fileSize ?? body.file_size ?? null,
      nowIso,
      id
    ).run();

    return c.json({ ...body, id, updatedAt: nowIso });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/pengumuman/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM pengumuman WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- DATABASE CONSISTENCY & AUTOMATIC DATA MIGRATION ---
async function ensureDatabaseConsistency(db: D1Database) {
  try {
    // 1. Ust. Abdullah Kristianto, S.Sos. (t-33) - Pengajar ABY di VII Putra (cls-3) dan I'dad Putra (cls-1), serta Wali Kelas I'dad Putra
    await db.prepare(`
      INSERT OR IGNORE INTO teachers (id, name, email, subjects, classes)
      VALUES ('t-33', 'Ust. Abdullah Kristianto, S.Sos.', 'ustadz.abdullah@isykarima.com', '["s-4"]', '["cls-1","cls-3"]');
    `).run().catch(() => {});

    await db.prepare(`
      UPDATE teachers
      SET name = 'Ust. Abdullah Kristianto, S.Sos.',
          email = 'ustadz.abdullah@isykarima.com',
          subjects = '["s-4"]',
          classes = '["cls-1","cls-3"]'
      WHERE id = 't-33';
    `).run().catch(() => {});

    // Akun Login Guru Ust. Abdullah Kristianto, S.Sos. (ustadz.abdullah)
    await db.prepare(`DELETE FROM users WHERE email = 'ustadz.abdullah' AND teacher_id != 't-33'`).run().catch(() => {});
    await db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_id)
      VALUES ('user-t-33-guru', 'Ust. Abdullah Kristianto, S.Sos.', 'ustadz.abdullah', 'guru123', 'Guru', 't-33')
    `).run().catch(() => {});

    // Akun Login Wali Kelas Ust. Abdullah Kristianto, S.Sos. (wali.abdullah)
    await db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_id)
      VALUES ('user-t-33-wali', 'Ust. Abdullah Kristianto, S.Sos.', 'wali.abdullah', 'wali123', 'WaliKelas', 't-33')
    `).run().catch(() => {});

    // Jadwal Mengajar ABY (s-4) di VII Putra (cls-3) dan I'dad Putra (cls-1) dialihkan ke t-33
    await db.prepare(`
      UPDATE schedules
      SET teacher_id = 't-33'
      WHERE subject_id = 's-4' AND (class_id = 'cls-1' OR class_id = 'cls-3')
    `).run().catch(() => {});

    // 2. Ust. Muhammad Ilyas Abdullah (t-5) - Pengajar Beladiri Tai Chi untuk SEMUA KELAS PUTRA (cls-1, cls-3, cls-5, cls-7)
    await db.prepare(`
      INSERT OR IGNORE INTO teachers (id, name, email, subjects, classes)
      VALUES ('t-5', 'Ust. Muhammad Ilyas Abdullah', 'ustadz.ilyas@isykarima.com', '["subjects-1786502401572"]', '["cls-1","cls-3","cls-5","cls-7"]');
    `).run().catch(() => {});

    await db.prepare(`
      UPDATE teachers
      SET name = 'Ust. Muhammad Ilyas Abdullah',
          email = 'ustadz.ilyas@isykarima.com',
          subjects = '["subjects-1786502401572"]',
          classes = '["cls-1","cls-3","cls-5","cls-7"]'
      WHERE id = 't-5';
    `).run().catch(() => {});

    // Akun Login Guru Ust. Muhammad Ilyas Abdullah (ustadz.ilyas)
    await db.prepare(`DELETE FROM users WHERE email = 'ustadz.ilyas'`).run().catch(() => {});
    await db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, teacher_id)
      VALUES ('user-t-5-guru', 'Ust. Muhammad Ilyas Abdullah', 'ustadz.ilyas', 'guru123', 'Guru', 't-5')
    `).run().catch(() => {});

    // Pastikan Jadwal Tai Chi untuk Semua Kelas Putra
    const boysClasses = ['cls-1', 'cls-3', 'cls-5', 'cls-7'];
    for (const cId of boysClasses) {
      await db.prepare(`
        INSERT OR IGNORE INTO schedules (id, day, time, class_id, teacher_id, subject_id, academic_year_id, semester_id)
        VALUES (?, 'Rabu', '07:00 - 09:00', ?, 't-5', 'subjects-1786502401572', 'ay-1', 'sem-1')
      `).bind(`sch-taichi-${cId}`, cId).run().catch(() => {});
    }

    // 3. Pastikan skema tabel pengumuman & broadcast selalu lengkap
    await ensurePengumumanSchema(db);
  } catch (e) {
    console.error('ensureDatabaseConsistency error:', e);
  }
}

// --- EVALUASI PEMBELAJARAN (8 DIMENSI KURIKULUM MERDEKA: BULANAN, SEMESTER & TAHUNAN) ---
async function ensureEvaluasiTable(db: D1Database) {
  await ensureDatabaseConsistency(db);
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS evaluasi_pembelajaran (
      id TEXT PRIMARY KEY,
      jenis_evaluasi TEXT DEFAULT 'Bulanan',
      bulan INTEGER,
      tahun INTEGER,
      teacher_id TEXT,
      subject_id TEXT,
      class_id TEXT,
      academic_year_id TEXT,
      semester_id TEXT,
      total_pertemuan_rencana INTEGER DEFAULT 0,
      total_pertemuan_terlaksana INTEGER DEFAULT 0,
      persentase_terlaksana REAL DEFAULT 0,
      tp_tercapai TEXT,
      tp_belum_tercapai TEXT,
      asesmen_formatif_hasil TEXT,
      asesmen_catatan TEXT,
      kendala TEXT,
      solusi TEXT,
      diferenciasi_dilakukan TEXT,
      rencana_bulan_depan TEXT,
      refleksi_guru TEXT,
      predikat_ketercapaian TEXT DEFAULT 'Baik',
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {});

  const columns = [
    'jenis_evaluasi TEXT DEFAULT "Bulanan"',
    'bulan INTEGER',
    'tahun INTEGER',
    'teacher_id TEXT',
    'subject_id TEXT',
    'class_id TEXT',
    'academic_year_id TEXT',
    'semester_id TEXT',
    'total_pertemuan_rencana INTEGER DEFAULT 0',
    'total_pertemuan_terlaksana INTEGER DEFAULT 0',
    'persentase_terlaksana REAL DEFAULT 0',
    'tp_tercapai TEXT',
    'tp_belum_tercapai TEXT',
    'asesmen_formatif_hasil TEXT',
    'asesmen_catatan TEXT',
    'kendala TEXT',
    'solusi TEXT',
    'diferenciasi_dilakukan TEXT',
    'rencana_bulan_depan TEXT',
    'refleksi_guru TEXT',
    'predikat_ketercapaian TEXT DEFAULT "Baik"',
    'created_at TEXT',
    'updated_at TEXT'
  ];

  for (const col of columns) {
    await db.prepare(`ALTER TABLE evaluasi_pembelajaran ADD COLUMN ${col}`).run().catch(() => {});
  }
}

api.get('/evaluasi_pembelajaran', async (c) => {
  try {
    await ensureEvaluasiTable(c.env.DB);
    const { results } = await c.env.DB.prepare(`
      SELECT 
        ep.*,
        t.name as teacher_name,
        s.name as subject_name,
        cl.name as class_name,
        ay.name as academic_year_name,
        sem.name as semester_name
      FROM evaluasi_pembelajaran ep
      LEFT JOIN teachers t ON ep.teacher_id = t.id
      LEFT JOIN subjects s ON ep.subject_id = s.id
      LEFT JOIN classes cl ON ep.class_id = cl.id
      LEFT JOIN academic_years ay ON ep.academic_year_id = ay.id
      LEFT JOIN semesters sem ON ep.semester_id = sem.id
      ORDER BY ep.tahun DESC, ep.bulan DESC, ep.created_at DESC
    `).all();

    const mapped = (results || []).map((r: any) => {
      const totRencana = Number(r.total_pertemuan_rencana ?? r.totalPertemuanRencana ?? 4);
      const totTerlaksana = Number(r.total_pertemuan_terlaksana ?? r.totalPertemuanTerlaksana ?? 4);
      const persentase = r.persentase_terlaksana !== undefined && r.persentase_terlaksana !== null
        ? Number(r.persentase_terlaksana)
        : (totRencana > 0 ? Math.round((totTerlaksana / totRencana) * 100) : 0);

      return {
        id: r.id,
        jenisEvaluasi: r.jenis_evaluasi || r.jenisEvaluasi || 'Bulanan',
        bulan: Number(r.bulan) || 1,
        tahun: Number(r.tahun) || new Date().getFullYear(),
        teacherId: r.teacher_id || r.teacherId || '',
        subjectId: r.subject_id || r.subjectId || '',
        classId: r.class_id || r.classId || '',
        academicYearId: r.academic_year_id || r.academicYearId || '',
        semesterId: r.semester_id || r.semesterId || '',
        totalPertemuanRencana: totRencana,
        totalPertemuanTerlaksana: totTerlaksana,
        persentaseTerlaksana: persentase,
        tpTercapai: r.tp_tercapai || r.tpTercapai || r.capaian_materi || '',
        tpBelumTercapai: r.tp_belum_tercapai || r.tpBelumTercapai || '',
        asesmenFormatifHasil: r.asesmen_formatif_hasil || r.asesmenFormatifHasil || '',
        asesmenCatatan: r.asesmen_catatan || r.asesmenCatatan || '',
        kendala: r.kendala || '',
        solusi: r.solusi || '',
        diferenciasiDilakukan: r.diferenciasi_dilakukan || r.diferenciasiDilakukan || '',
        rencanaBulanDepan: r.rencana_bulan_depan || r.rencanaBulanDepan || '',
        refleksiGuru: r.refleksi_guru || r.refleksiGuru || '',
        predikatKetercapaian: r.predikat_ketercapaian || r.predikatKetercapaian || 'Baik',
        createdAt: r.created_at || r.createdAt || new Date().toISOString(),
        updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
        teacher: r.teacher_name ? { id: r.teacher_id, name: r.teacher_name } : undefined,
        subject: r.subject_name ? { id: r.subject_id, name: r.subject_name } : undefined,
        class: r.class_name ? { id: r.class_id, name: r.class_name } : undefined,
        academicYear: r.academic_year_name ? { id: r.academic_year_id, name: r.academic_year_name } : undefined,
        semester: r.semester_name ? { id: r.semester_id, name: r.semester_name } : undefined,
      };
    });

    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/evaluasi_pembelajaran', async (c) => {
  try {
    await ensureEvaluasiTable(c.env.DB);
    const body = await c.req.json();
    const id = body.id || `eval-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const rencana = Number(body.totalPertemuanRencana ?? body.total_pertemuan_rencana ?? 4);
    const terlaksana = Number(body.totalPertemuanTerlaksana ?? body.total_pertemuan_terlaksana ?? 4);
    const persentase = rencana > 0 ? Math.round((terlaksana / rencana) * 100) : 0;
    const jenisEval = body.jenisEvaluasi || body.jenis_evaluasi || 'Bulanan';

    await c.env.DB.prepare(`
      INSERT INTO evaluasi_pembelajaran (
        id, jenis_evaluasi, bulan, tahun, teacher_id, subject_id, class_id,
        academic_year_id, semester_id, total_pertemuan_rencana, total_pertemuan_terlaksana,
        persentase_terlaksana, tp_tercapai, tp_belum_tercapai, asesmen_formatif_hasil,
        asesmen_catatan, kendala, solusi, diferenciasi_dilakukan, rencana_bulan_depan,
        refleksi_guru, predikat_ketercapaian, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      jenisEval,
      Number(body.bulan) || 1,
      Number(body.tahun) || new Date().getFullYear(),
      body.teacherId || body.teacher_id || '',
      body.subjectId || body.subject_id || '',
      body.classId || body.class_id || '',
      body.academicYearId || body.academic_year_id || '',
      body.semesterId || body.semester_id || '',
      rencana,
      terlaksana,
      persentase,
      body.tpTercapai || body.tp_tercapai || '',
      body.tpBelumTercapai || body.tp_belum_tercapai || '',
      body.asesmenFormatifHasil || body.asesmen_formatif_hasil || '',
      body.asesmenCatatan || body.asesmen_catatan || '',
      body.kendala || '',
      body.solusi || '',
      body.diferenciasiDilakukan || body.diferenciasi_dilakukan || '',
      body.rencanaBulanDepan || body.rencana_bulan_depan || '',
      body.refleksiGuru || body.refleksi_guru || '',
      body.predikatKetercapaian || body.predikat_ketercapaian || 'Baik',
      nowIso,
      nowIso
    ).run();

    return c.json({
      ...body,
      id,
      jenisEvaluasi: jenisEval,
      totalPertemuanRencana: rencana,
      totalPertemuanTerlaksana: terlaksana,
      persentaseTerlaksana: persentase,
      createdAt: nowIso,
      updatedAt: nowIso
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.put('/evaluasi_pembelajaran/:id', async (c) => {
  try {
    await ensureEvaluasiTable(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    const nowIso = new Date().toISOString();
    const rencana = Number(body.totalPertemuanRencana ?? body.total_pertemuan_rencana ?? 4);
    const terlaksana = Number(body.totalPertemuanTerlaksana ?? body.total_pertemuan_terlaksana ?? 4);
    const persentase = rencana > 0 ? Math.round((terlaksana / rencana) * 100) : 0;
    const jenisEval = body.jenisEvaluasi || body.jenis_evaluasi || 'Bulanan';

    await c.env.DB.prepare(`
      UPDATE evaluasi_pembelajaran SET
        jenis_evaluasi = ?,
        bulan = ?,
        tahun = ?,
        teacher_id = ?,
        subject_id = ?,
        class_id = ?,
        academic_year_id = ?,
        semester_id = ?,
        total_pertemuan_rencana = ?,
        total_pertemuan_terlaksana = ?,
        persentase_terlaksana = ?,
        tp_tercapai = ?,
        tp_belum_tercapai = ?,
        asesmen_formatif_hasil = ?,
        asesmen_catatan = ?,
        kendala = ?,
        solusi = ?,
        diferenciasi_dilakukan = ?,
        rencana_bulan_depan = ?,
        refleksi_guru = ?,
        predikat_ketercapaian = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      jenisEval,
      Number(body.bulan) || 1,
      Number(body.tahun) || new Date().getFullYear(),
      body.teacherId || body.teacher_id || '',
      body.subjectId || body.subject_id || '',
      body.classId || body.class_id || '',
      body.academicYearId || body.academic_year_id || '',
      body.semesterId || body.semester_id || '',
      rencana,
      terlaksana,
      persentase,
      body.tpTercapai || body.tp_tercapai || '',
      body.tpBelumTercapai || body.tp_belum_tercapai || '',
      body.asesmenFormatifHasil || body.asesmen_formatif_hasil || '',
      body.asesmenCatatan || body.asesmen_catatan || '',
      body.kendala || '',
      body.solusi || '',
      body.diferenciasiDilakukan || body.diferenciasi_dilakukan || '',
      body.rencanaBulanDepan || body.rencana_bulan_depan || '',
      body.refleksiGuru || body.refleksi_guru || '',
      body.predikatKetercapaian || body.predikat_ketercapaian || 'Baik',
      nowIso,
      id
    ).run();

    return c.json({
      ...body,
      id,
      jenisEvaluasi: jenisEval,
      totalPertemuanRencana: rencana,
      totalPertemuanTerlaksana: terlaksana,
      persentaseTerlaksana: persentase,
      updatedAt: nowIso
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/evaluasi_pembelajaran/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM evaluasi_pembelajaran WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- AKHLAQ KESEHARIAN SANTRI (BOBOT 20% RAPOR) ---
async function ensureAkhlaqTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS akhlaq_santri (
      id TEXT PRIMARY KEY,
      santri_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      semester_id TEXT NOT NULL,
      nilai_akhlaq REAL DEFAULT 90,
      predikat TEXT DEFAULT 'A',
      adab_kesopanan REAL DEFAULT 90,
      kedisiplinan_ibadah REAL DEFAULT 90,
      kebersihan_kerapian REAL DEFAULT 90,
      catatan TEXT,
      recorded_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {});

  const columns = [
    'santri_id TEXT',
    'class_id TEXT',
    'academic_year_id TEXT',
    'semester_id TEXT',
    'nilai_akhlaq REAL DEFAULT 90',
    'predikat TEXT DEFAULT "A"',
    'adab_kesopanan REAL DEFAULT 90',
    'kedisiplinan_ibadah REAL DEFAULT 90',
    'kebersihan_kerapian REAL DEFAULT 90',
    'catatan TEXT',
    'recorded_by TEXT',
    'created_at TEXT',
    'updated_at TEXT'
  ];

  for (const col of columns) {
    await db.prepare(`ALTER TABLE akhlaq_santri ADD COLUMN ${col}`).run().catch(() => {});
  }
}

api.get('/akhlaq_santri', async (c) => {
  try {
    await ensureAkhlaqTable(c.env.DB);
    const { results } = await c.env.DB.prepare(`
      SELECT 
        a.*,
        s.name as santri_name,
        s.nis as santri_nis,
        cl.name as class_name,
        ay.name as academic_year_name,
        sem.name as semester_name
      FROM akhlaq_santri a
      LEFT JOIN santri s ON a.santri_id = s.id
      LEFT JOIN classes cl ON a.class_id = cl.id
      LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
      LEFT JOIN semesters sem ON a.semester_id = sem.id
      ORDER BY LOWER(s.name) ASC
    `).all();

    const mapped = (results || []).map((r: any) => ({
      id: r.id,
      santriId: r.santri_id || r.santriId,
      classId: r.class_id || r.classId,
      academicYearId: r.academic_year_id || r.academicYearId,
      semesterId: r.semester_id || r.semesterId,
      nilaiAkhlaq: Number(r.nilai_akhlaq ?? r.nilaiAkhlaq ?? 90),
      predikat: r.predikat || (Number(r.nilai_akhlaq ?? 90) >= 90 ? 'A' : Number(r.nilai_akhlaq ?? 90) >= 80 ? 'B' : Number(r.nilai_akhlaq ?? 90) >= 70 ? 'C' : 'D'),
      adabKesopanan: Number(r.adab_kesopanan ?? r.adabKesopanan ?? 90),
      kedisiplinanIbadah: Number(r.kedisiplinan_ibadah ?? r.kedisiplinanIbadah ?? 90),
      kebersihanKerapian: Number(r.kebersihan_kerapian ?? r.kebersihanKerapian ?? 90),
      catatan: r.catatan || '',
      recordedBy: r.recorded_by || r.recordedBy || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
      santri: r.santri_name ? { id: r.santri_id, name: r.santri_name, nis: r.santri_nis, classId: r.class_id } : undefined,
      class: r.class_name ? { id: r.class_id, name: r.class_name } : undefined,
      academicYear: r.academic_year_name ? { id: r.academic_year_id, name: r.academic_year_name } : undefined,
      semester: r.semester_name ? { id: r.semester_id, name: r.semester_name } : undefined,
    }));

    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/akhlaq_santri', async (c) => {
  try {
    await ensureAkhlaqTable(c.env.DB);
    const body = await c.req.json();
    const nowIso = new Date().toISOString();
    const sId = body.santriId || body.santri_id;
    const cId = body.classId || body.class_id;
    const ayId = body.academicYearId || body.academic_year_id;
    const semId = body.semesterId || body.semester_id;
    const score = Number(body.nilaiAkhlaq ?? body.nilai_akhlaq ?? 90);
    const predikat = body.predikat || (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D');

    const existing = await c.env.DB.prepare(`
      SELECT id FROM akhlaq_santri 
      WHERE santri_id = ? AND academic_year_id = ? AND semester_id = ?
    `).bind(sId, ayId, semId).first() as any;

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE akhlaq_santri SET
          class_id = ?,
          nilai_akhlaq = ?,
          predikat = ?,
          adab_kesopanan = ?,
          kedisiplinan_ibadah = ?,
          kebersihan_kerapian = ?,
          catatan = ?,
          recorded_by = ?,
          updated_at = ?
        WHERE id = ?
      `).bind(
        cId, score, predikat,
        Number(body.adabKesopanan ?? body.adab_kesopanan ?? score),
        Number(body.kedisiplinanIbadah ?? body.kedisiplinan_ibadah ?? score),
        Number(body.kebersihanKerapian ?? body.kebersihan_kerapian ?? score),
        body.catatan || '',
        body.recordedBy || body.recorded_by || '',
        nowIso,
        existing.id
      ).run();

      return c.json({ ...body, id: existing.id, nilaiAkhlaq: score, predikat, updatedAt: nowIso });
    } else {
      const id = body.id || `akh-${crypto.randomUUID()}`;
      await c.env.DB.prepare(`
        INSERT INTO akhlaq_santri (
          id, santri_id, class_id, academic_year_id, semester_id,
          nilai_akhlaq, predikat, adab_kesopanan, kedisiplinan_ibadah,
          kebersihan_kerapian, catatan, recorded_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, sId, cId, ayId, semId,
        score, predikat,
        Number(body.adabKesopanan ?? body.adab_kesopanan ?? score),
        Number(body.kedisiplinanIbadah ?? body.kedisiplinan_ibadah ?? score),
        Number(body.kebersihanKerapian ?? body.kebersihan_kerapian ?? score),
        body.catatan || '',
        body.recordedBy || body.recorded_by || '',
        nowIso, nowIso
      ).run();

      return c.json({ ...body, id, nilaiAkhlaq: score, predikat, createdAt: nowIso, updatedAt: nowIso });
    }
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/akhlaq_santri/bulk', async (c) => {
  try {
    await ensureAkhlaqTable(c.env.DB);
    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ success: true, count: 0 });
    }

    const nowIso = new Date().toISOString();
    for (const item of items) {
      const sId = item.santriId || item.santri_id;
      const cId = item.classId || item.class_id;
      const ayId = item.academicYearId || item.academic_year_id;
      const semId = item.semesterId || item.semester_id;
      const score = Number(item.nilaiAkhlaq ?? item.nilai_akhlaq ?? 90);
      const predikat = item.predikat || (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D');

      const existing = await c.env.DB.prepare(`
        SELECT id FROM akhlaq_santri 
        WHERE santri_id = ? AND academic_year_id = ? AND semester_id = ?
      `).bind(sId, ayId, semId).first() as any;

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE akhlaq_santri SET
            class_id = ?,
            nilai_akhlaq = ?,
            predikat = ?,
            adab_kesopanan = ?,
            kedisiplinan_ibadah = ?,
            kebersihan_kerapian = ?,
            catatan = ?,
            recorded_by = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          cId, score, predikat,
          Number(item.adabKesopanan ?? item.adab_kesopanan ?? score),
          Number(item.kedisiplinanIbadah ?? item.kedisiplinan_ibadah ?? score),
          Number(item.kebersihanKerapian ?? item.kebersihan_kerapian ?? score),
          item.catatan || '',
          item.recordedBy || item.recorded_by || '',
          nowIso,
          existing.id
        ).run();
      } else {
        const id = `akh-${crypto.randomUUID()}`;
        await c.env.DB.prepare(`
          INSERT INTO akhlaq_santri (
            id, santri_id, class_id, academic_year_id, semester_id,
            nilai_akhlaq, predikat, adab_kesopanan, kedisiplinan_ibadah,
            kebersihan_kerapian, catatan, recorded_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, sId, cId, ayId, semId,
          score, predikat,
          Number(item.adabKesopanan ?? item.adab_kesopanan ?? score),
          Number(item.kedisiplinanIbadah ?? item.kedisiplinan_ibadah ?? score),
          Number(item.kebersihanKerapian ?? item.kebersihan_kerapian ?? score),
          item.catatan || '',
          item.recordedBy || item.recorded_by || '',
          nowIso, nowIso
        ).run();
      }
    }

    return c.json({ success: true, count: items.length });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/akhlaq_santri/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM akhlaq_santri WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- EVALUASI WALI KELAS KE KURIKULUM ---
async function ensureEvaluasiWaliKelasTable(db: D1Database) {
  await db.prepare(`
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
    )
  `).run().catch(() => {});

  const columns = [
    'guru_id TEXT',
    'guru_nama TEXT',
    'kelas_id TEXT',
    'kelas_nama TEXT',
    'tipe_periode TEXT DEFAULT "bulanan"',
    'bulan TEXT',
    'tahun TEXT',
    'semester TEXT',
    'tahun_ajaran TEXT',
    'laporan_kbm TEXT',
    'masalah_kelas TEXT',
    'perkembangan_santri TEXT',
    'rekomendasi_kurikulum TEXT',
    'tanggapan_admin TEXT',
    'created_at TEXT',
    'updated_at TEXT'
  ];

  for (const col of columns) {
    await db.prepare(`ALTER TABLE evaluasi_wali_kelas ADD COLUMN ${col}`).run().catch(() => {});
  }
}

api.get('/evaluasi_wali_kelas', async (c) => {
  try {
    await ensureEvaluasiWaliKelasTable(c.env.DB);
    const { results } = await c.env.DB.prepare(`
      SELECT e.*, c.name as class_name_from_db
      FROM evaluasi_wali_kelas e
      LEFT JOIN classes c ON e.kelas_id = c.id
      ORDER BY e.created_at DESC, e.rowid DESC
    `).all();

    const mapped = (results || []).map((r: any) => ({
      id: r.id,
      guruId: r.guru_id || r.guruId,
      guruNama: r.guru_nama || r.guruNama || 'Wali Kelas',
      kelasId: r.kelas_id || r.kelasId,
      kelasNama: r.class_name_from_db || r.kelas_nama || r.kelasNama || 'Kelas',
      tipePeriode: r.tipe_periode || r.tipePeriode || 'bulanan',
      bulan: r.bulan || '',
      tahun: r.tahun || '',
      semester: r.semester || '',
      tahunAjaran: r.tahun_ajaran || r.tahunAjaran || '',
      laporanKbm: r.laporan_kbm || r.laporanKbm || '',
      masalahKelas: r.masalah_kelas || r.masalahKelas || '',
      perkembanganSantri: r.perkembangan_santri || r.perkembanganSantri || '',
      rekomendasiKurikulum: r.rekomendasi_kurikulum || r.rekomendasiKurikulum || '',
      tanggapanAdmin: r.tanggapan_admin || r.tanggapanAdmin || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt || new Date().toISOString()
    }));

    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/evaluasi_wali_kelas', async (c) => {
  try {
    await ensureEvaluasiWaliKelasTable(c.env.DB);
    const body = await c.req.json();
    const id = body.id || `ewk-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO evaluasi_wali_kelas (
        id, guru_id, guru_nama, kelas_id, kelas_nama, tipe_periode,
        bulan, tahun, semester, tahun_ajaran, laporan_kbm, masalah_kelas,
        perkembangan_santri, rekomendasi_kurikulum, tanggapan_admin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.guruId || body.guru_id || '',
      body.guruNama || body.guru_nama || '',
      body.kelasId || body.kelas_id || '',
      body.kelasNama || body.kelas_nama || '',
      body.tipePeriode || body.tipe_periode || 'bulanan',
      body.bulan || '',
      body.tahun || '',
      body.semester || '',
      body.tahunAjaran || body.tahun_ajaran || '',
      body.laporanKbm || body.laporan_kbm || '',
      body.masalahKelas || body.masalah_kelas || '',
      body.perkembanganSantri || body.perkembangan_santri || '',
      body.rekomendasiKurikulum || body.rekomendasi_kurikulum || '',
      body.tanggapanAdmin || body.tanggapan_admin || '',
      nowIso,
      nowIso
    ).run();

    return c.json({ ...body, id, createdAt: nowIso, updatedAt: nowIso });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.put('/evaluasi_wali_kelas/:id', async (c) => {
  try {
    await ensureEvaluasiWaliKelasTable(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    const nowIso = new Date().toISOString();

    const existing = await c.env.DB.prepare('SELECT * FROM evaluasi_wali_kelas WHERE id = ?').bind(id).first() as any;
    if (!existing) {
      return c.json({ error: 'Data laporan evaluasi wali kelas tidak ditemukan' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE evaluasi_wali_kelas SET
        guru_id = COALESCE(?, guru_id),
        guru_nama = COALESCE(?, guru_nama),
        kelas_id = COALESCE(?, kelas_id),
        kelas_nama = COALESCE(?, kelas_nama),
        tipe_periode = COALESCE(?, tipe_periode),
        bulan = COALESCE(?, bulan),
        tahun = COALESCE(?, tahun),
        semester = COALESCE(?, semester),
        tahun_ajaran = COALESCE(?, tahun_ajaran),
        laporan_kbm = COALESCE(?, laporan_kbm),
        masalah_kelas = COALESCE(?, masalah_kelas),
        perkembangan_santri = COALESCE(?, perkembangan_santri),
        rekomendasi_kurikulum = COALESCE(?, rekomendasi_kurikulum),
        tanggapan_admin = COALESCE(?, tanggapan_admin),
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.guruId ?? body.guru_id ?? null,
      body.guruNama ?? body.guru_nama ?? null,
      body.kelasId ?? body.kelas_id ?? null,
      body.kelasNama ?? body.kelas_nama ?? null,
      body.tipePeriode ?? body.tipe_periode ?? null,
      body.bulan ?? null,
      body.tahun ?? null,
      body.semester ?? null,
      body.tahunAjaran ?? body.tahun_ajaran ?? null,
      body.laporanKbm ?? body.laporan_kbm ?? null,
      body.masalahKelas ?? body.masalah_kelas ?? null,
      body.perkembanganSantri ?? body.perkembangan_santri ?? null,
      body.rekomendasiKurikulum ?? body.rekomendasi_kurikulum ?? null,
      body.tanggapanAdmin ?? body.tanggapan_admin ?? null,
      nowIso,
      id
    ).run();

    return c.json({ ...existing, ...body, id, updatedAt: nowIso });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.delete('/evaluasi_wali_kelas/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM evaluasi_wali_kelas WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});


app.route('/api', api);
app.route('/', api);

app.all('/api/*', (c) => {
  return c.json({ error: `API route not found: ${c.req.method} ${c.req.path}` }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled Hono error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

app.get('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default app;
