import {
  User, Teacher, Subject, SchoolClass, AcademicYear, Semester, TeachingSchedule, RPP, ActivityLog,
  Attendance, AttendanceSummary, SantriAttendance, SantriAttendanceSummary, WaliKelas, Santri, Nilai,
  AdminStats, GuruStats, RaporDetail, Pengumuman, EvaluasiPembelajaran, PasswordResetRequest, TanyaAdmin, EvaluasiWaliKelas
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
  async logActivity(action: string, details: string): Promise<void> {
    try {
      let activeUser: any = {};
      try { activeUser = JSON.parse(localStorage.getItem('simrpp_user') || '{}'); } catch {}
      await fetchJson('/api/activity_logs', {
        method: 'POST',
        body: JSON.stringify({ userId: activeUser.id || 'system', userName: activeUser.name || 'Sistem', userRole: activeUser.role || 'Sistem', action, details })
      });
    } catch (e) { console.warn('Failed to log activity', e); }
  },

  async getActivityLogs(): Promise<ActivityLog[]> { return fetchJson<ActivityLog[]>('/api/activity_logs').catch(() => []); },
  
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    this.logActivity('Login', `Pengguna ${res.user.name} (${res.user.role}) berhasil masuk ke sistem.`);
    return res;
  },

  async waliLogin(name: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/wali-login', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    this.logActivity('Login Wali', `Wali Santri (${res.user.name}) berhasil masuk ke portal wali.`);
    return res;
  },

  logout(): void {
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

  async getDashboardStats(): Promise<AdminStats | GuruStats> {
    return fetchJson<AdminStats | GuruStats>('/api/dashboard/stats');
  },

  async getTeachers(): Promise<Teacher[]> { return fetchJson<Teacher[]>('/api/teachers'); },
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

  async getRPPs(): Promise<RPP[]> { return fetchJson<RPP[]>('/api/rpps'); },
  async createRPP(rpp: Partial<RPP>): Promise<RPP> { return fetchJson<RPP>('/api/rpps', { method: 'POST', body: JSON.stringify(rpp) }); },
  async createRPPBulk(data: { rppList: any[] }): Promise<void> { await Promise.all(data.rppList.map(r => this.createRPP(r))); },
  async updateRPP(id: string, rpp: Partial<RPP>): Promise<RPP> { return fetchJson<RPP>(`/api/rpps/${id}`, { method: 'PUT', body: JSON.stringify(rpp) }); },
  async reviewRPP(id: string, status: 'Disetujui' | 'Revisi', revisionNotes: string): Promise<RPP> { return fetchJson<RPP>(`/api/rpps/${id}`, { method: 'PUT', body: JSON.stringify({ status, revisionNotes }) }); },
  async deleteRPP(id: string): Promise<void> { await fetchJson(`/api/rpps/${id}`, { method: 'DELETE' }); },

  async getAttendances(params?: any): Promise<Attendance[]> { 
    let res = await fetchJson<Attendance[]>('/api/attendances');
    if (params?.teacherId) res = res.filter(a => a.teacherId === params.teacherId);
    if (params?.date) res = res.filter(a => a.date === params.date);
    return res;
  },
  async createAttendance(data: Omit<Attendance, 'id' | 'recordedBy' | 'createdAt' | 'updatedAt'>): Promise<Attendance> { return fetchJson<Attendance>('/api/attendances', { method: 'POST', body: JSON.stringify(data) }); },
  async createAttendanceBulk(data: { attendances: any[]; overwriteMonth?: boolean; year?: string; month?: string }): Promise<void> {
    await fetchJson('/api/attendances/bulk', { method: 'POST', body: JSON.stringify(data) });
  },
  async selfAttendance(data: any): Promise<Attendance> { 
    const u = this.getCurrentUser();
    return fetchJson<Attendance>('/api/attendances', { method: 'POST', body: JSON.stringify({ ...data, teacherId: u?.teacherId }) }); 
  },
  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> { return fetchJson<Attendance>(`/api/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteAttendance(id: string): Promise<void> { await fetchJson(`/api/attendances/${id}`, { method: 'DELETE' }); },
  
  async getAttendanceSummary(params?: any): Promise<AttendanceSummary[]> {
    const attendances = await this.getAttendances(params);
    const summary: Record<string, AttendanceSummary> = {};
    attendances.forEach(a => {
      if (!summary[a.teacherId]) {
        summary[a.teacherId] = { teacherId: a.teacherId, teacherName: a.teacher?.name || 'Guru', hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, persentaseHadir: 0 };
      }
      if (a.status === 'Hadir') summary[a.teacherId].hadir++;
      if (a.status === 'Izin') summary[a.teacherId].izin++;
      if (a.status === 'Sakit') summary[a.teacherId].sakit++;
      if (a.status === 'Alpha') summary[a.teacherId].alpha++;
      summary[a.teacherId].total++;
    });
    
    // Calculate percentage
    return Object.values(summary).map(s => {
      s.persentaseHadir = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
      return s;
    });
  },

  async getSantriAttendances(params?: any): Promise<SantriAttendance[]> {
    let res = await fetchJson<SantriAttendance[]>('/api/santri_attendances');
    if (params?.classId) res = res.filter(a => a.classId === params.classId);
    if (params?.date) res = res.filter(a => a.date === params.date);
    return res;
  },
  async createSantriAttendance(data: any): Promise<SantriAttendance> { return fetchJson<SantriAttendance>('/api/santri_attendances', { method: 'POST', body: JSON.stringify(data) }); },
  async createSantriAttendanceGuru(data: any): Promise<SantriAttendance> { return fetchJson<SantriAttendance>('/api/santri_attendances', { method: 'POST', body: JSON.stringify(data) }); },
  async updateSantriAttendance(id: string, data: Partial<SantriAttendance>): Promise<SantriAttendance> { return fetchJson<SantriAttendance>(`/api/santri_attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteSantriAttendance(id: string): Promise<void> { await fetchJson(`/api/santri_attendances/${id}`, { method: 'DELETE' }); },
  async createSantriAttendanceBulk(data: { attendances: any[]; overwriteMonth?: boolean; classId?: string; year?: string; month?: string }): Promise<void> {
    await fetchJson('/api/santri_attendances/bulk', { method: 'POST', body: JSON.stringify(data) });
  },
  
  async getSantriAttendanceSummary(params?: any): Promise<SantriAttendanceSummary[]> {
    const attendances = await this.getSantriAttendances(params);
    const summary: Record<string, SantriAttendanceSummary> = {};
    const classDates: Record<string, Set<string>> = {};
    
    attendances.forEach(a => {
      if (!summary[a.classId]) {
        summary[a.classId] = { classId: a.classId, className: a.class?.name || 'Kelas', hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0, rataHadir: 0 };
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
      s.rataHadir = s.total > 0 ? Math.round(s.hadir / s.total) : 0;
      return s;
    });
  },

  async getWaliKelas(params?: any): Promise<WaliKelas[]> { return fetchJson<WaliKelas[]>('/api/wali_kelas'); },
  async createWaliKelas(data: any): Promise<WaliKelas> { return fetchJson<WaliKelas>('/api/wali_kelas', { method: 'POST', body: JSON.stringify(data) }); },
  async updateWaliKelas(id: string, data: Partial<WaliKelas>): Promise<WaliKelas> { return fetchJson<WaliKelas>(`/api/wali_kelas/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteWaliKelas(id: string): Promise<void> { await fetchJson(`/api/wali_kelas/${id}`, { method: 'DELETE' }); },

  async getSantri(classId?: string): Promise<Santri[]> {
    let res = await fetchJson<Santri[]>('/api/santri');
    if (classId) res = res.filter(s => s.classId === classId);
    return res;
  },
  async createSantri(data: any): Promise<Santri> { return fetchJson<Santri>('/api/santri', { method: 'POST', body: JSON.stringify(data) }); },
  async updateSantri(id: string, data: Partial<Santri>): Promise<Santri> { return fetchJson<Santri>(`/api/santri/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteSantri(id: string): Promise<void> { await fetchJson(`/api/santri/${id}`, { method: 'DELETE' }); },

  async getNilai(params?: any): Promise<Nilai[]> {
    let res = await fetchJson<Nilai[]>('/api/nilai');
    if (params?.classId) res = res.filter(n => n.classId === params.classId);
    if (params?.subjectId) res = res.filter(n => n.subjectId === params.subjectId);
    return res;
  },
  async createNilai(data: any): Promise<Nilai> { return fetchJson<Nilai>('/api/nilai', { method: 'POST', body: JSON.stringify(data) }); },
  async updateNilai(id: string, data: Partial<Nilai>): Promise<Nilai> { return fetchJson<Nilai>(`/api/nilai/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteNilai(id: string): Promise<void> { await fetchJson(`/api/nilai/${id}`, { method: 'DELETE' }); },
  async createNilaiBulk(data: { nilaiList: any[] }): Promise<void> { await Promise.all(data.nilaiList.map(n => this.createNilai(n))); },

  async getRaporDetail(params?: any): Promise<RaporDetail[]> {
    let res = await fetchJson<RaporDetail[]>('/api/rapor_detail');
    if (params?.santriId) res = res.filter(r => r.santriId === params.santriId);
    return res;
  },
  async createRaporDetail(data: any): Promise<RaporDetail> { return fetchJson<RaporDetail>('/api/rapor_detail', { method: 'POST', body: JSON.stringify(data) }); },
  async updateRaporDetail(id: string, data: Partial<RaporDetail>): Promise<RaporDetail> { return fetchJson<RaporDetail>(`/api/rapor_detail/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async createRaporDetailBulk(data: { raporList: any[] }): Promise<void> { await Promise.all(data.raporList.map(r => this.createRaporDetail(r))); },

  async uploadAttachment(file: File): Promise<{ url: string, name: string }> { return { url: 'uploaded-url', name: file.name }; },
  
  async getPengumuman(): Promise<Pengumuman[]> { return fetchJson<Pengumuman[]>('/api/pengumuman').catch(()=>[]); },
  async createPengumuman(data: { title: string; content: string }): Promise<Pengumuman> { return fetchJson<Pengumuman>('/api/pengumuman', { method: 'POST', body: JSON.stringify(data) }); },
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
  async setSecurityQuestion(question: string, answer: string): Promise<{ message: string }> { return { message: 'Success' }; },
};
