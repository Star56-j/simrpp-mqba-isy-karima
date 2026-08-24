import {
  User, Teacher, Subject, SchoolClass, AcademicYear, Semester, TeachingSchedule, RPP, ActivityLog,
  Attendance, AttendanceSummary, SantriAttendance, SantriAttendanceSummary, WaliKelas, Santri, Nilai,
  AdminStats, GuruStats, RaporDetail, Pengumuman, EvaluasiPembelajaran, PasswordResetRequest, TanyaAdmin, EvaluasiWaliKelas, AkhlaqSantri, TanyaWaliKelas
} from './types';

const getHeaders = () => {
  const token = localStorage.getItem('simrpp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errData: any = await response.json().catch(() => ({}));
    throw new Error(errData?.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async logActivity(action: string, details: string, userOverride?: any): Promise<void> {
    try {
      let activeUser: any = userOverride || {};
      if (!activeUser.name) {
        try { activeUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}'); } catch {}
      }
      const userName = activeUser.name || 'Ust. Aidil Aqli. S.Ag';
      const userRole = activeUser.role || 'Admin';
      const userId = activeUser.id || activeUser.teacherId || 'admin';

      await fetchJson('/api/activity_logs', {
        method: 'POST',
        body: JSON.stringify({ userId, userName, userRole, action, details })
      });
    } catch (e) { console.warn('Failed to log activity', e); }
  },

  async getActivityLogs(): Promise<ActivityLog[]> { return fetchJson<ActivityLog[]>('/api/activity_logs').catch(() => []); },
  async clearActivityLogs(): Promise<void> { await fetchJson('/api/activity_logs/clear_all', { method: 'DELETE' }); },
  
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    await this.logActivity('Login Sistem', `Pengguna ${res.user.name} (${res.user.role}) berhasil masuk ke sistem.`, res.user);
    return res;
  },

  async waliLogin(name: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/wali-login', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    await this.logActivity('Login Wali', `Wali Santri (${res.user.name}) berhasil masuk ke portal wali.`, res.user);
    return res;
  },

  logout(): void {
    const u = this.getCurrentUser();
    if (u) {
      this.logActivity('Logout Sistem', `Pengguna ${u.name} (${u.role}) keluar dari sistem.`, u).catch(() => {});
    }
    localStorage.removeItem('simrpp_token');
    localStorage.removeItem('simrpp_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('simrpp_user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    // Legacy fix: if teacherId is missing but teacher_id exists, map it and save
    if (!user.teacherId && user.teacher_id) {
      user.teacherId = user.teacher_id;
      localStorage.setItem('simrpp_user', JSON.stringify(user));
    }
    return user;
  },

  async updateProfile(name: string, email: string): Promise<User> {
    const user = this.getCurrentUser();
    if(user) {
       user.name = name; user.email = email;
       localStorage.setItem('simrpp_user', JSON.stringify(user));
       return user;
    }
    throw new Error("No user");
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> { return { message: 'OK' }; },

  async getDashboardStats(teacherId?: string): Promise<AdminStats | GuruStats> {
    const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : '';
    return fetchJson<AdminStats | GuruStats>(`/api/dashboard/stats${query}`);
  },

  async getTeachers(): Promise<Teacher[]> {
    const res = await fetchJson<Teacher[]>('/api/teachers');
    return (res || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
  },
  async createTeacher(teacher: Omit<Teacher, 'id'> & { password?: string }): Promise<Teacher> { return fetchJson<Teacher>('/api/teachers', { method: 'POST', body: JSON.stringify(teacher) }); },
  async updateTeacher(id: string, teacher: Partial<Teacher> & { password?: string }): Promise<Teacher> { return fetchJson<Teacher>(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(teacher) }); },
  async deleteTeacher(id: string): Promise<{ message: string }> { await fetchJson(`/api/teachers/${id}`, { method: 'DELETE' }); return { message: 'OK' }; },

  async getSubjects(): Promise<Subject[]> { return fetchJson<Subject[]>('/api/subjects'); },
  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> { return fetchJson<Subject>('/api/subjects', { method: 'POST', body: JSON.stringify(subject) }); },
  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> { return fetchJson<Subject>(`/api/subjects/${id}`, { method: 'PUT', body: JSON.stringify(subject) }); },
  async deleteSubject(id: string): Promise<void> { await fetchJson(`/api/subjects/${id}`, { method: 'DELETE' }); },

  async getClasses(): Promise<SchoolClass[]> { return fetchJson<SchoolClass[]>('/api/classes'); },
  async createClass(cls: Omit<SchoolClass, 'id'>): Promise<SchoolClass> { return fetchJson<SchoolClass>('/api/classes', { method: 'POST', body: JSON.stringify(cls) }); },
  async updateClass(id: string, cls: Partial<SchoolClass>): Promise<SchoolClass> { return fetchJson<SchoolClass>(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(cls) }); },
  async deleteClass(id: string): Promise<void> { await fetchJson(`/api/classes/${id}`, { method: 'DELETE' }); },

  async getAcademicYears(): Promise<AcademicYear[]> { return fetchJson<AcademicYear[]>('/api/academic_years'); },
  async createAcademicYear(name: string): Promise<AcademicYear> { return fetchJson<AcademicYear>('/api/academic_years', { method: 'POST', body: JSON.stringify({ name }) }); },
  async updateAcademicYear(id: string, name: string): Promise<AcademicYear> { return fetchJson<AcademicYear>(`/api/academic_years/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); },
  async deleteAcademicYear(id: string): Promise<void> { await fetchJson(`/api/academic_years/${id}`, { method: 'DELETE' }); },

  async getSemesters(): Promise<Semester[]> { return fetchJson<Semester[]>('/api/semesters'); },

  async getSchedules(): Promise<TeachingSchedule[]> { return fetchJson<TeachingSchedule[]>('/api/schedules'); },
  async createSchedule(schedule: Omit<TeachingSchedule, 'id'>): Promise<TeachingSchedule> { return fetchJson<TeachingSchedule>('/api/schedules', { method: 'POST', body: JSON.stringify(schedule) }); },
  async updateSchedule(id: string, schedule: Partial<TeachingSchedule>): Promise<TeachingSchedule> { return fetchJson<TeachingSchedule>(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(schedule) }); },
  async deleteSchedule(id: string): Promise<void> { await fetchJson(`/api/schedules/${id}`, { method: 'DELETE' }); },
  async copySemester(payload: any): Promise<{ count: number }> { return { count: 0 }; }, // Mock

  async getRPPs(): Promise<RPP[]> {
    const raw = await fetchJson<any[]>('/api/rpps').catch(() => []);
    return raw.map(r => {
      let syllabusItems = r.syllabusItems || r.syllabus_items || [];
      if (typeof syllabusItems === 'string') {
        try { syllabusItems = JSON.parse(syllabusItems); } catch { syllabusItems = []; }
      }
      return {
        ...r,
        teacherId: r.teacherId || r.teacher_id || '',
        subjectId: r.subjectId || r.subject_id || '',
        classId: r.classId || r.class_id || '',
        academicYearId: r.academicYearId || r.academic_year_id || '',
        profilPelajar: r.profilPelajar || r.profil_pelajar || '',
        sarana: r.sarana || r.sarana || '',
        capaiPembelajaran: r.capaiPembelajaran || r.capai_pembelajaran || r.capaian_pembelajaran || '',
        tujuanPembelajaran: r.tujuanPembelajaran || r.tujuan_pembelajaran || '',
        alurTP: r.alurTP || r.alur_tp || r.alur_t_p || '',
        materiGanjil: r.materiGanjil || r.materi_ganjil || '',
        materiGenap: r.materiGenap || r.materi_genap || '',
        totalMeetingsGanjil: Number(r.totalMeetingsGanjil ?? r.total_meetings_ganjil ?? 16),
        totalMeetingsGenap: Number(r.totalMeetingsGenap ?? r.total_meetings_genap ?? 16),
        pendahuluan: r.pendahuluan || '',
        kegiatanInti: r.kegiatanInti || r.kegiatan_inti || '',
        penutup: r.penutup || '',
        metode: r.metode || '',
        media: r.media || '',
        asesmenDiagnostik: r.asesmenDiagnostik || r.asesmen_diagnostik || '',
        asesmenFormatif: r.asesmenFormatif || r.asesmen_formatif || '',
        asesmenSumatif: r.asesmenSumatif || r.asesmen_sumatif || '',
        diferensiasi: r.diferensiasi || '',
        pengayaan: r.pengayaan || '',
        catatan: r.catatan || '',
        syllabusItems: Array.isArray(syllabusItems) ? syllabusItems : [],
        attachmentUrl: r.attachmentUrl || r.attachment_url || '',
        attachmentName: r.attachmentName || r.attachment_name || '',
        status: r.status || 'Draft',
        revisionNotes: r.revisionNotes || r.revision_notes || '',
        createdAt: r.createdAt || r.created_at || new Date().toISOString(),
        updatedAt: r.updatedAt || r.updated_at || new Date().toISOString(),
      };
    });
  },
  async createRPP(rpp: Partial<RPP>): Promise<RPP> { 
    const res = await fetchJson<RPP>('/api/rpps', { method: 'POST', body: JSON.stringify(rpp) });
    this.logActivity('Buat RPP', `Membuat RPP: ${(rpp as any).subject || (rpp as any).title || 'Mata Pelajaran'}`).catch(() => {});
    return res;
  },
  async createRPPBulk(data: { rppList: any[] }): Promise<void> { 
    await Promise.all(data.rppList.map(r => this.createRPP(r))); 
    this.logActivity('Impor RPP', `Menambahkan ${data.rppList.length} berkas RPP secara massal.`).catch(() => {});
  },
  async updateRPP(id: string, rpp: Partial<RPP>): Promise<RPP> { 
    const res = await fetchJson<RPP>(`/api/rpps/${id}`, { method: 'PUT', body: JSON.stringify(rpp) });
    this.logActivity('Update RPP', `Memperbarui dokumen RPP ${(rpp as any).subject || (rpp as any).title || ''}`).catch(() => {});
    return res;
  },
  async reviewRPP(id: string, status: 'Disetujui' | 'Revisi', revisionNotes: string): Promise<RPP> { 
    const res = await fetchJson<RPP>(`/api/rpps/${id}`, { method: 'PUT', body: JSON.stringify({ status, revisionNotes }) });
    this.logActivity('Review RPP', `Status verifikasi RPP diubah menjadi "${status}"`).catch(() => {});
    return res;
  },
  async deleteRPP(id: string): Promise<void> { 
    await fetchJson(`/api/rpps/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus RPP', 'Menghapus 1 dokumen RPP dari sistem.').catch(() => {});
  },

  async getAttendances(params?: any): Promise<Attendance[]> { 
    let raw = await fetchJson<any[]>('/api/attendances').catch(() => []);
    const normalized: Attendance[] = raw.map(a => ({
      ...a,
      teacherId: a.teacherId || a.teacher_id,
      subjectId: a.subjectId || a.subject_id,
      subjectName: a.subjectName || a.subject_name || (a.subject && a.subject.name) || '',
      academicYearId: a.academicYearId || a.academic_year_id,
      semesterId: a.semesterId || a.semester_id,
      recordedBy: a.recordedBy || a.recorded_by,
      createdAt: a.createdAt || a.created_at,
      updatedAt: a.updatedAt || a.updated_at
    }));
    let res = normalized;
    if (params?.teacherId) res = res.filter(a => a.teacherId === params.teacherId);
    if (params?.subjectId) res = res.filter(a => a.subjectId === params.subjectId);
    if (params?.date) res = res.filter(a => a.date === params.date);
    if (params?.academicYearId) res = res.filter(a => a.academicYearId === params.academicYearId);
    if (params?.semesterId) res = res.filter(a => a.semesterId === params.semesterId);
    if (params?.year && !params?.month) res = res.filter(a => a.date?.startsWith(params.year));
    if (params?.year && params?.month) {
      const mStr = String(params.month).padStart(2, '0');
      res = res.filter(a => a.date?.startsWith(`${params.year}-${mStr}`));
    }
    return res;
  },
  async createAttendance(data: Omit<Attendance, 'id' | 'recordedBy' | 'createdAt' | 'updatedAt'>): Promise<Attendance> { 
    const res = await fetchJson<Attendance>('/api/attendances', { method: 'POST', body: JSON.stringify(data) }); 
    this.logActivity('Presensi Guru', `Mencatat kehadiran guru mengajar (Status: ${data.status || 'Hadir'})`).catch(() => {});
    return res;
  },
  async createAttendanceBulk(data: { attendances: any[]; overwriteMonth?: boolean; year?: string; month?: string }): Promise<void> {
    await fetchJson('/api/attendances/bulk', { method: 'POST', body: JSON.stringify(data) });
    this.logActivity('Presensi Guru Massal', `Menyimpan ${data.attendances?.length || 0} data presensi guru bulanan.`).catch(() => {});
  },
  async selfAttendance(data: any): Promise<Attendance> { 
    const u = this.getCurrentUser();
    const resolvedTeacherId = data.teacherId || u?.teacherId || (u as any)?.teacher_id || (u?.teacher && u.teacher.id) || u?.id || 't-12';
    const res = await fetchJson<Attendance>('/api/attendances', { method: 'POST', body: JSON.stringify({ ...data, teacherId: resolvedTeacherId }) }); 
    this.logActivity('Presensi Mandiri', `Guru mencatat presensi mandiri (Status: ${data.status || 'Hadir'})`).catch(() => {});
    return res;
  },
  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> { 
    const res = await fetchJson<Attendance>(`/api/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }); 
    this.logActivity('Update Presensi', 'Memperbarui data kehadiran guru mengajar.').catch(() => {});
    return res;
  },
  async deleteAttendance(id: string): Promise<void> { 
    await fetchJson(`/api/attendances/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus Presensi', 'Menghapus data kehadiran guru.').catch(() => {});
  },
  
  async getAttendanceSummary(params?: any): Promise<AttendanceSummary[]> {
    const attendances = await this.getAttendances(params);
    const summary: Record<string, AttendanceSummary> = {};
    attendances.forEach(a => {
      const tId = a.teacherId;
      if (!tId) return;
      if (!summary[tId]) {
        const tName = a.teacher?.name || (a as any).teacherName || (a as any).recordedBy || 'Guru';
        summary[tId] = { teacherId: tId, teacherName: tName, hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, persentaseHadir: 0 };
      }
      if (a.status === 'Hadir') summary[tId].hadir++;
      if (a.status === 'Izin') summary[tId].izin++;
      if (a.status === 'Sakit') summary[tId].sakit++;
      if (a.status === 'Alpha') summary[tId].alpha++;
      summary[tId].total++;
    });
    
    // Calculate percentage
    return Object.values(summary).map(s => {
      s.persentaseHadir = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return s;
    });
  },

  async getSantriAttendances(params?: any): Promise<SantriAttendance[]> {
    let raw = await fetchJson<SantriAttendance[]>('/api/santri_attendances').catch(() => []);
    const normalized: SantriAttendance[] = raw.map((a: any) => ({
      ...a,
      classId: a.classId || a.class_id,
      subjectId: a.subjectId || a.subject_id,
      subjectName: a.subjectName || a.subject_name || (a.subject && a.subject.name) || '',
      santriId: a.santriId || a.santri_id,
      academicYearId: a.academicYearId || a.academic_year_id,
      semesterId: a.semesterId || a.semester_id,
      teacherId: a.teacherId || a.teacher_id,
      recordedBy: a.recordedBy || a.recorded_by,
      createdAt: a.createdAt || a.created_at,
      updatedAt: a.updatedAt || a.updated_at
    }));
    let res = normalized;
    if (params?.classId) res = res.filter(a => a.classId === params.classId);
    if (params?.subjectId) res = res.filter(a => a.subjectId === params.subjectId);
    if (params?.teacherId) res = res.filter(a => a.teacherId === params.teacherId);
    if (params?.date) res = res.filter(a => a.date === params.date);
    if (params?.academicYearId) res = res.filter(a => a.academicYearId === params.academicYearId);
    if (params?.semesterId) res = res.filter(a => a.semesterId === params.semesterId);
    if (params?.year && !params?.month) res = res.filter(a => a.date?.startsWith(params.year));
    if (params?.year && params?.month) {
      const mStr = String(params.month).padStart(2, '0');
      res = res.filter(a => a.date?.startsWith(`${params.year}-${mStr}`));
    }
    return res;
  },
  async createSantriAttendance(data: any): Promise<SantriAttendance> { 
    const res = await fetchJson<SantriAttendance>('/api/santri_attendances', { method: 'POST', body: JSON.stringify(data) }); 
    this.logActivity('Presensi Santri', `Mencatat presensi santri (Tanggal: ${data.date || '-'})`).catch(() => {});
    return res;
  },
  async createSantriAttendanceGuru(data: any): Promise<SantriAttendance> { 
    const res = await fetchJson<SantriAttendance>('/api/santri_attendances', { method: 'POST', body: JSON.stringify(data) }); 
    this.logActivity('Presensi Santri', `Guru menginput presensi harian santri`).catch(() => {});
    return res;
  },
  async updateSantriAttendance(id: string, data: Partial<SantriAttendance>): Promise<SantriAttendance> { 
    const res = await fetchJson<SantriAttendance>(`/api/santri_attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }); 
    this.logActivity('Update Presensi Santri', 'Memperbarui rekap presensi santri').catch(() => {});
    return res;
  },
  async deleteSantriAttendance(id: string): Promise<void> { 
    await fetchJson(`/api/santri_attendances/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus Presensi Santri', 'Menghapus catatan presensi santri').catch(() => {});
  },
  async createSantriAttendanceBulk(data: { attendances: any[]; overwriteMonth?: boolean; classId?: string; year?: string; month?: string }): Promise<void> {
    await fetchJson('/api/santri_attendances/bulk', { method: 'POST', body: JSON.stringify(data) });
    this.logActivity('Presensi Santri Massal', `Menyimpan data presensi santri kelas secara massal.`).catch(() => {});
  },
  
  async getSantriAttendanceSummary(params?: any): Promise<SantriAttendanceSummary[]> {
    const attendances = await this.getSantriAttendances(params);
    const summary: Record<string, SantriAttendanceSummary> = {};
    const classDates: Record<string, Set<string>> = {};
    
    attendances.forEach(a => {
      if (!a.classId) return;
      if (!summary[a.classId]) {
        summary[a.classId] = { 
          classId: a.classId, 
          className: a.class?.name || (a as any).className || 'Kelas', 
          hadir: 0, 
          izin: 0, 
          sakit: 0, 
          alpha: 0, 
          total: 0, 
          rataHadir: 0 
        };
        classDates[a.classId] = new Set();
      }
      classDates[a.classId].add(a.date);
      
      if (a.status) {
        if (a.status === 'Hadir') summary[a.classId].hadir++;
        if (a.status === 'Izin') summary[a.classId].izin++;
        if (a.status === 'Sakit') summary[a.classId].sakit++;
        if (a.status === 'Alpha') summary[a.classId].alpha++;
      } else {
        // Fallback for old data
        summary[a.classId].hadir += (a.jumlahHadir || 0);
        summary[a.classId].izin += (a.jumlahIzin || 0);
        summary[a.classId].sakit += (a.jumlahSakit || 0);
        summary[a.classId].alpha += (a.jumlahAlpha || 0);
      }
    });
    
    return Object.values(summary).map(s => {
      s.total = classDates[s.classId].size;
      const totLogged = s.hadir + s.sakit + s.izin + s.alpha;
      s.rataHadir = totLogged > 0 ? Math.round((s.hadir / totLogged) * 100) : 0;
      (s as any).persentaseHadir = s.rataHadir;
      return s;
    });
  },

  async getWaliKelas(params?: any): Promise<WaliKelas[]> { 
    const [raw, teachers, classes] = await Promise.all([
      fetchJson<any[]>('/api/wali_kelas').catch(() => []),
      this.getTeachers().catch(() => []),
      this.getClasses().catch(() => [])
    ]);
    return raw.map(r => {
      const teacherId = r.teacher_id || r.teacherId;
      const classId = r.class_id || r.classId;
      const academicYearId = r.academic_year_id || r.academicYearId;
      const semesterId = r.semester_id || r.semesterId;
      const teacher = teachers.find(t => t.id === teacherId);
      const schoolClass = classes.find(c => c.id === classId);
      return {
        id: r.id,
        teacherId,
        classId,
        academicYearId,
        semesterId,
        teacher,
        class: schoolClass,
        teacher_id: teacherId,
        class_id: classId,
        teacher_name: teacher?.name,
        class_name: schoolClass?.name
      };
    });
  },
  async createWaliKelas(data: any): Promise<WaliKelas> { 
    const res = await fetchJson<WaliKelas>('/api/wali_kelas', { method: 'POST', body: JSON.stringify(data) }); 
    this.logActivity('Tunjuk Wali Kelas', 'Menetapkan penugasan wali kelas baru.').catch(() => {});
    return res;
  },
  async updateWaliKelas(id: string, data: Partial<WaliKelas>): Promise<WaliKelas> { 
    const res = await fetchJson<WaliKelas>(`/api/wali_kelas/${id}`, { method: 'PUT', body: JSON.stringify(data) }); 
    this.logActivity('Update Wali Kelas', 'Memperbarui data penugasan wali kelas.').catch(() => {});
    return res;
  },
  async deleteWaliKelas(id: string): Promise<void> { 
    await fetchJson(`/api/wali_kelas/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus Wali Kelas', 'Menghapus data penugasan wali kelas.').catch(() => {});
  },

  async getSantri(classId?: string): Promise<Santri[]> {
    let res = await fetchJson<Santri[]>('/api/santri');
    if (classId) res = res.filter(s => s.classId === classId);
    return (res || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
  },
  async createSantri(data: any): Promise<Santri> { 
    const res = await fetchJson<Santri>('/api/santri', { method: 'POST', body: JSON.stringify(data) }); 
    this.logActivity('Tambah Santri', `Menambahkan santri baru: ${data.name || ''}`).catch(() => {});
    return res;
  },
  async updateSantri(id: string, data: Partial<Santri>): Promise<Santri> { 
    const res = await fetchJson<Santri>(`/api/santri/${id}`, { method: 'PUT', body: JSON.stringify(data) }); 
    this.logActivity('Update Santri', `Memperbarui biodata santri: ${data.name || ''}`).catch(() => {});
    return res;
  },
  async deleteSantri(id: string): Promise<void> { 
    await fetchJson(`/api/santri/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus Santri', 'Menghapus data santri dari database.').catch(() => {});
  },

  async getNilai(params?: any): Promise<Nilai[]> {
    let raw = await fetchJson<any[]>('/api/nilai').catch(() => []);
    const normalized: Nilai[] = raw.map(r => ({
      id: r.id,
      santriId: r.santri_id || r.santriId,
      subjectId: r.subject_id || r.subjectId,
      classId: r.class_id || r.classId,
      academicYearId: r.academic_year_id || r.academicYearId,
      semesterId: r.semester_id || r.semesterId,
      teacherId: r.teacher_id || r.teacherId,
      harian: typeof r.harian === 'number' ? r.harian : Number(r.harian) || 0,
      bulanan: typeof r.bulanan === 'number' ? r.bulanan : Number(r.bulanan) || 0,
      uts: typeof r.uts === 'number' ? r.uts : Number(r.uts) || 0,
      uas: typeof r.uas === 'number' ? r.uas : Number(r.uas) || 0,
      uasLisan: typeof r.uas_lisan === 'number' ? r.uas_lisan : (typeof r.uasLisan === 'number' ? r.uasLisan : Number(r.uasLisan || r.uas_lisan) || 0),
      notes: r.notes || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt || new Date().toISOString()
    }));

    let res = normalized;
    if (params?.classId) res = res.filter(n => n.classId === params.classId || (n as any).class_id === params.classId);
    if (params?.subjectId) res = res.filter(n => n.subjectId === params.subjectId || (n as any).subject_id === params.subjectId);
    if (params?.academicYearId) res = res.filter(n => n.academicYearId === params.academicYearId || (n as any).academic_year_id === params.academicYearId);
    if (params?.semesterId) res = res.filter(n => n.semesterId === params.semesterId || (n as any).semester_id === params.semesterId);
    if (params?.santriId) res = res.filter(n => n.santriId === params.santriId || (n as any).santri_id === params.santriId);
    return res;
  },
  async createNilai(data: any): Promise<Nilai> { 
    const payload = {
      ...data,
      santri_id: data.santriId || data.santri_id,
      subject_id: data.subjectId || data.subject_id,
      class_id: data.classId || data.class_id,
      academic_year_id: data.academicYearId || data.academic_year_id,
      semester_id: data.semesterId || data.semester_id,
      teacher_id: data.teacherId || data.teacher_id,
      uas_lisan: data.uasLisan ?? data.uas_lisan ?? 0
    };
    const res = await fetchJson<Nilai>('/api/nilai', { method: 'POST', body: JSON.stringify(payload) }); 
    this.logActivity('Input Nilai', 'Menyimpan nilai akademik santri.').catch(() => {});
    return res;
  },
  async updateNilai(id: string, data: Partial<Nilai> & Record<string, any>): Promise<Nilai> { 
    const payload = {
      ...data,
      santri_id: data.santriId || data.santri_id,
      subject_id: data.subjectId || data.subject_id,
      class_id: data.classId || data.class_id,
      academic_year_id: data.academicYearId || data.academic_year_id,
      semester_id: data.semesterId || data.semester_id,
      teacher_id: data.teacherId || data.teacher_id,
      uas_lisan: data.uasLisan ?? data.uas_lisan
    };
    const res = await fetchJson<Nilai>(`/api/nilai/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); 
    this.logActivity('Update Nilai', 'Memperbarui nilai akademik santri.').catch(() => {});
    return res;
  },
  async deleteNilai(id: string): Promise<void> { 
    await fetchJson(`/api/nilai/${id}`, { method: 'DELETE' }); 
    this.logActivity('Hapus Nilai', 'Menghapus entri nilai santri.').catch(() => {});
  },
  async createNilaiBulk(data: { nilaiList: any[] }): Promise<void> { 
    await Promise.all(data.nilaiList.map(n => this.createNilai(n))); 
    this.logActivity('Input Nilai Massal', `Menyimpan ${data.nilaiList.length} data nilai santri secara massal.`).catch(() => {});
  },

  async getRaporDetail(params?: any): Promise<RaporDetail[]> {
    let res = await fetchJson<RaporDetail[]>('/api/rapor_detail');
    if (params?.santriId) res = res.filter(r => r.santriId === params.santriId);
    return res;
  },
  async createRaporDetail(data: any): Promise<RaporDetail> { return fetchJson<RaporDetail>('/api/rapor_detail', { method: 'POST', body: JSON.stringify(data) }); },
  async updateRaporDetail(id: string, data: Partial<RaporDetail>): Promise<RaporDetail> { return fetchJson<RaporDetail>(`/api/rapor_detail/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteRaporDetail(id: string): Promise<void> { await fetchJson(`/api/rapor_detail/${id}`, { method: 'DELETE' }); },
  async createRaporDetailBulk(data: { raporList: any[] }): Promise<void> { await Promise.all(data.raporList.map(r => this.createRaporDetail(r))); },

  async getAkhlaqSantri(params?: { classId?: string; academicYearId?: string; semesterId?: string; santriId?: string }): Promise<AkhlaqSantri[]> {
    let res = await fetchJson<AkhlaqSantri[]>('/api/akhlaq_santri').catch(() => []);
    if (params?.classId) res = res.filter(a => a.classId === params.classId || (a as any).class_id === params.classId);
    if (params?.academicYearId) res = res.filter(a => a.academicYearId === params.academicYearId || (a as any).academic_year_id === params.academicYearId);
    if (params?.semesterId) res = res.filter(a => a.semesterId === params.semesterId || (a as any).semester_id === params.semesterId);
    if (params?.santriId) res = res.filter(a => a.santriId === params.santriId || (a as any).santri_id === params.santriId);
    return res;
  },
  async saveAkhlaqSantri(data: any): Promise<AkhlaqSantri> {
    return fetchJson<AkhlaqSantri>('/api/akhlaq_santri', { method: 'POST', body: JSON.stringify(data) });
  },
  async saveAkhlaqSantriBulk(data: { items: any[] }): Promise<{ success: boolean; count: number }> {
    return fetchJson<{ success: boolean; count: number }>('/api/akhlaq_santri/bulk', { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteAkhlaqSantri(id: string): Promise<void> {
    await fetchJson(`/api/akhlaq_santri/${id}`, { method: 'DELETE' });
  },

  async uploadAttachment(file: File): Promise<{ url: string, name: string }> { return { url: 'uploaded-url', name: file.name }; },
  
  async getPengumuman(): Promise<Pengumuman[]> { return fetchJson<Pengumuman[]>('/api/pengumuman').catch(()=>[]); },
  async createPengumuman(data: Partial<Pengumuman>): Promise<Pengumuman> { return fetchJson<Pengumuman>('/api/pengumuman', { method: 'POST', body: JSON.stringify(data) }); },
  async deletePengumuman(id: string): Promise<void> { await fetchJson(`/api/pengumuman/${id}`, { method: 'DELETE' }); },

  async getEvaluasi(params?: any): Promise<EvaluasiPembelajaran[]> {
    let res = await fetchJson<EvaluasiPembelajaran[]>('/api/evaluasi_pembelajaran').catch(() => []);
    if (params?.classId) res = res.filter(e => e.classId === params.classId);
    return res;
  },
  async createEvaluasi(data: any): Promise<EvaluasiPembelajaran> { return fetchJson<EvaluasiPembelajaran>('/api/evaluasi_pembelajaran', { method: 'POST', body: JSON.stringify(data) }); },
  async updateEvaluasi(id: string, data: Partial<EvaluasiPembelajaran>): Promise<EvaluasiPembelajaran> { return fetchJson<EvaluasiPembelajaran>(`/api/evaluasi_pembelajaran/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteEvaluasi(id: string): Promise<void> { await fetchJson(`/api/evaluasi_pembelajaran/${id}`, { method: 'DELETE' }); },
  async getResetRequests(): Promise<PasswordResetRequest[]> { return fetchJson<PasswordResetRequest[]>('/api/reset_requests').catch(() => []); },
  async approveResetRequest(id: string): Promise<{ message: string }> { return fetchJson<{ message: string }>(`/api/reset_requests/${id}/approve`, { method: 'POST' }); },
  async rejectResetRequest(id: string): Promise<{ message: string }> { return fetchJson<{ message: string }>(`/api/reset_requests/${id}/reject`, { method: 'POST' }); },
  async deleteResetRequest(id: string): Promise<{ message: string }> { return fetchJson<{ message: string }>(`/api/reset_requests/${id}`, { method: 'DELETE' }); },
  async getResetQuestion(email: string): Promise<{ hasQuestion: boolean; question?: string }> { return { hasQuestion: false }; },
  async resetSelf(email: string, answer: string, newPass: string): Promise<{ message: string }> { return { message: 'Success' }; },
  async requestAdminReset(email: string): Promise<{ message: string }> { return { message: 'Success' }; },
  async submitResetAnswer(answer: string): Promise<{ message: string }> { return { message: 'Success' }; },

  async getTanyaAdmin(): Promise<TanyaAdmin[]> {
    return fetchJson<TanyaAdmin[]>('/api/tanya_admin').catch(() => []);
  },
  async createTanyaAdmin(data: any): Promise<TanyaAdmin> {
    return fetchJson<TanyaAdmin>('/api/tanya_admin', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateTanyaAdmin(id: string, data: Partial<TanyaAdmin>): Promise<TanyaAdmin> {
    return fetchJson<TanyaAdmin>(`/api/tanya_admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteTanyaAdmin(id: string): Promise<void> {
    await fetchJson(`/api/tanya_admin/${id}`, { method: 'DELETE' });
  },
  async getEvaluasiWaliKelas(): Promise<EvaluasiWaliKelas[]> {
    const raw = await fetchJson<any[]>('/api/evaluasi_wali_kelas').catch(() => []);
    return raw.map(r => ({
      id: r.id,
      guruId: r.guru_id || r.guruId,
      guruNama: r.guru_nama || r.guruNama,
      kelasId: r.kelas_id || r.kelasId,
      kelasNama: r.kelas_nama || r.kelasNama,
      tipePeriode: r.tipe_periode || r.tipePeriode || 'bulanan',
      bulan: r.bulan,
      tahun: r.tahun,
      semester: r.semester,
      tahunAjaran: r.tahun_ajaran || r.tahunAjaran,
      laporanKbm: r.laporan_kbm || r.laporanKbm || '',
      masalahKelas: r.masalah_kelas || r.masalahKelas || '',
      perkembanganSantri: r.perkembangan_santri || r.perkembanganSantri || '',
      rekomendasiKurikulum: r.rekomendasi_kurikulum || r.rekomendasiKurikulum || '',
      tanggapanAdmin: r.tanggapan_admin || r.tanggapanAdmin || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt
    }));
  },
  async createEvaluasiWaliKelas(data: any): Promise<EvaluasiWaliKelas> {
    return fetchJson<EvaluasiWaliKelas>('/api/evaluasi_wali_kelas', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateEvaluasiWaliKelas(id: string, data: Partial<EvaluasiWaliKelas>): Promise<EvaluasiWaliKelas> {
    return fetchJson<EvaluasiWaliKelas>(`/api/evaluasi_wali_kelas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteEvaluasiWaliKelas(id: string): Promise<void> {
    await fetchJson(`/api/evaluasi_wali_kelas/${id}`, { method: 'DELETE' });
  },

  async getTanyaWaliKelas(): Promise<TanyaWaliKelas[]> {
    const raw = await fetchJson<any[]>('/api/tanya_wali_kelas').catch(() => []);
    return raw.map(r => ({
      id: r.id,
      santriId: r.santri_id || r.santriId,
      santriName: r.santri_name || r.santriName,
      classId: r.class_id || r.classId,
      className: r.class_name || r.className,
      waliSantriId: r.wali_santri_id || r.waliSantriId,
      waliSantriName: r.wali_santri_name || r.waliSantriName,
      waliKelasId: r.wali_kelas_id || r.waliKelasId,
      waliKelasName: r.wali_kelas_name || r.waliKelasName,
      subject: r.subject || '',
      message: r.message || '',
      waliReply: r.wali_reply || r.waliReply || '',
      replyAt: r.reply_at || r.replyAt || '',
      status: r.status || 'Pending',
      imageUrl: r.image_url || r.imageUrl || '',
      fileUrl: r.file_url || r.fileUrl || '',
      fileName: r.file_name || r.fileName || '',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || r.updatedAt
    }));
  },
  async createTanyaWaliKelas(data: any): Promise<TanyaWaliKelas> {
    return fetchJson<TanyaWaliKelas>('/api/tanya_wali_kelas', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateTanyaWaliKelas(id: string, data: Partial<TanyaWaliKelas>): Promise<TanyaWaliKelas> {
    return fetchJson<TanyaWaliKelas>(`/api/tanya_wali_kelas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteTanyaWaliKelas(id: string): Promise<void> {
    await fetchJson(`/api/tanya_wali_kelas/${id}`, { method: 'DELETE' });
  },
  async setSecurityQuestion(question: string, answer: string): Promise<{ message: string }> { return { message: 'Success' }; },
};
