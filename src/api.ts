import {
  User,
  Teacher,
  Subject,
  SchoolClass,
  AcademicYear,
  Semester,
  TeachingSchedule,
  RPP,
  ActivityLog,
  Attendance,
  AttendanceSummary,
  SantriAttendance,
  SantriAttendanceSummary,
  WaliKelas,
  Santri,
  Nilai,
  AdminStats,
  GuruStats,
  RaporDetail
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
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    return res;
  },

  async waliLogin(name: string): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/wali-login', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    localStorage.setItem('simrpp_token', res.token);
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    return res;
  },

  logout(): void {
    localStorage.removeItem('simrpp_token');
    localStorage.removeItem('simrpp_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('simrpp_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async updateProfile(name: string, email: string): Promise<User> {
    const res = await fetchJson<{ message: string; user: User }>('/api/auth/profile/update', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    });
    localStorage.setItem('simrpp_user', JSON.stringify(res.user));
    return res.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Stats
  async getDashboardStats(): Promise<AdminStats | GuruStats> {
    return fetchJson<AdminStats | GuruStats>('/api/dashboard/stats');
  },

  // Teachers (Admin)
  async getTeachers(): Promise<Teacher[]> {
    return fetchJson<Teacher[]>('/api/teachers');
  },

  async createTeacher(teacher: Omit<Teacher, 'id'> & { password?: string }): Promise<Teacher> {
    return fetchJson<Teacher>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher)
    });
  },

  async updateTeacher(id: string, teacher: Partial<Teacher> & { password?: string }): Promise<Teacher> {
    return fetchJson<Teacher>(`/api/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher)
    });
  },

  async deleteTeacher(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/teachers/${id}`, {
      method: 'DELETE'
    });
  },

  // Subjects (Admin)
  async getSubjects(): Promise<Subject[]> {
    return fetchJson<Subject[]>('/api/subjects');
  },

  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    return fetchJson<Subject>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(subject)
    });
  },

  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    return fetchJson<Subject>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject)
    });
  },

  async deleteSubject(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/subjects/${id}`, {
      method: 'DELETE'
    });
  },

  // Classes (Admin)
  async getClasses(): Promise<SchoolClass[]> {
    return fetchJson<SchoolClass[]>('/api/classes');
  },

  async createClass(cls: Omit<SchoolClass, 'id'>): Promise<SchoolClass> {
    return fetchJson<SchoolClass>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(cls)
    });
  },

  async updateClass(id: string, cls: Partial<SchoolClass>): Promise<SchoolClass> {
    return fetchJson<SchoolClass>(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cls)
    });
  },

  async deleteClass(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/classes/${id}`, {
      method: 'DELETE'
    });
  },

  // Academic Years & Semesters
  async getAcademicYears(): Promise<AcademicYear[]> {
    return fetchJson<AcademicYear[]>('/api/academic-years');
  },

  async createAcademicYear(name: string): Promise<AcademicYear> {
    return fetchJson<AcademicYear>('/api/academic-years', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  async updateAcademicYear(id: string, name: string): Promise<AcademicYear> {
    return fetchJson<AcademicYear>(`/api/academic-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },

  async deleteAcademicYear(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/academic-years/${id}`, {
      method: 'DELETE'
    });
  },

  async getSemesters(): Promise<Semester[]> {
    return fetchJson<Semester[]>('/api/semesters');
  },

  // Teaching Schedules (Jadwal KBM)
  async getSchedules(): Promise<TeachingSchedule[]> {
    return fetchJson<TeachingSchedule[]>('/api/schedules');
  },

  async createSchedule(schedule: Omit<TeachingSchedule, 'id'>): Promise<TeachingSchedule> {
    return fetchJson<TeachingSchedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
  },

  async updateSchedule(id: string, schedule: Partial<TeachingSchedule>): Promise<TeachingSchedule> {
    return fetchJson<TeachingSchedule>(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule)
    });
  },

  async deleteSchedule(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/schedules/${id}`, {
      method: 'DELETE'
    });
  },

  async copySemester(payload: {
    fromAcademicYearId: string;
    fromSemesterId: string;
    toAcademicYearId: string;
    toSemesterId: string;
  }): Promise<{ message: string; count: number }> {
    return fetchJson<{ message: string; count: number }>('/api/schedules/copy-semester', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // RPPs
  async getRPPs(): Promise<RPP[]> {
    return fetchJson<RPP[]>('/api/rpps');
  },

  async createRPP(rpp: Partial<RPP>): Promise<RPP> {
    return fetchJson<RPP>('/api/rpps', {
      method: 'POST',
      body: JSON.stringify(rpp)
    });
  },

  async createRPPBulk(data: { rppList: any[] }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/rpp/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRPP(id: string, rpp: Partial<RPP>): Promise<RPP> {
    return fetchJson<RPP>(`/api/rpps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rpp)
    });
  },

  async reviewRPP(id: string, status: 'Disetujui' | 'Revisi', revisionNotes: string): Promise<RPP> {
    return fetchJson<RPP>(`/api/rpps/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, revisionNotes })
    });
  },

  async deleteRPP(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/rpps/${id}`, {
      method: 'DELETE'
    });
  },

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return fetchJson<ActivityLog[]>('/api/activity-logs');
  },

  // Attendance
  async getAttendances(params?: {
    teacherId?: string;
    month?: string;
    year?: string;
    semesterId?: string;
    academicYearId?: string;
  }): Promise<Attendance[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<Attendance[]>(`/api/attendances${q ? '?' + q : ''}`);
  },

  async createAttendance(data: Omit<Attendance, 'id' | 'recordedBy' | 'createdAt' | 'updatedAt'>): Promise<Attendance> {
    return fetchJson<Attendance>('/api/attendances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Guru mengisi absensi diri sendiri (hanya Hadir/Izin/Sakit, tidak bisa Alpha)
  async selfAttendance(data: { date: string; status: 'Hadir' | 'Izin' | 'Sakit'; notes?: string; academicYearId: string; semesterId: string }): Promise<Attendance> {
    return fetchJson<Attendance>('/api/attendances/self', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> {
    return fetchJson<Attendance>(`/api/attendances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAttendance(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/attendances/${id}`, { method: 'DELETE' });
  },

  async getAttendanceSummary(params?: {
    month?: string;
    year?: string;
    semesterId?: string;
    academicYearId?: string;
  }): Promise<AttendanceSummary[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<AttendanceSummary[]>(`/api/attendances/summary${q ? '?' + q : ''}`);
  },

  // Santri Attendance
  async getSantriAttendances(params?: {
    classId?: string;
    month?: string;
    year?: string;
    semesterId?: string;
    academicYearId?: string;
  }): Promise<SantriAttendance[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<SantriAttendance[]>(`/api/santri-attendances${q ? '?' + q : ''}`);
  },

  async createSantriAttendance(data: Omit<SantriAttendance, 'id' | 'recordedBy' | 'createdAt' | 'updatedAt'>): Promise<SantriAttendance> {
    return fetchJson<SantriAttendance>('/api/santri-attendances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createSantriAttendanceGuru(data: Omit<SantriAttendance, 'id' | 'recordedBy' | 'createdAt' | 'updatedAt'>): Promise<SantriAttendance> {
    return fetchJson<SantriAttendance>('/api/santri-attendances/guru', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSantriAttendance(id: string, data: Partial<SantriAttendance>): Promise<SantriAttendance> {
    return fetchJson<SantriAttendance>(`/api/santri-attendances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSantriAttendance(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/santri-attendances/${id}`, { method: 'DELETE' });
  },

  async createSantriAttendanceBulk(data: { attendances: any[] }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/santri-attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSantriAttendanceSummary(params?: {
    month?: string;
    year?: string;
    semesterId?: string;
    academicYearId?: string;
  }): Promise<SantriAttendanceSummary[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<SantriAttendanceSummary[]>(`/api/santri-attendances/summary${q ? '?' + q : ''}`);
  },

  // Wali Kelas
  async getWaliKelas(params?: {
    teacherId?: string;
    classId?: string;
    academicYearId?: string;
    semesterId?: string;
  }): Promise<WaliKelas[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<WaliKelas[]>(`/api/wali-kelas${q ? '?' + q : ''}`);
  },

  async createWaliKelas(data: Omit<WaliKelas, 'id' | 'assignedBy' | 'createdAt' | 'updatedAt'>): Promise<WaliKelas> {
    return fetchJson<WaliKelas>('/api/wali-kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWaliKelas(id: string, data: Partial<WaliKelas>): Promise<WaliKelas> {
    return fetchJson<WaliKelas>(`/api/wali-kelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteWaliKelas(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/wali-kelas/${id}`, { method: 'DELETE' });
  },

  // Santri
  async getSantri(classId?: string): Promise<Santri[]> {
    return fetchJson<Santri[]>(`/api/santri${classId ? `?classId=${classId}` : ''}`);
  },

  async createSantri(data: Omit<Santri, 'id' | 'createdAt' | 'updatedAt'>): Promise<Santri> {
    return fetchJson<Santri>('/api/santri', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSantri(id: string, data: Partial<Santri>): Promise<Santri> {
    return fetchJson<Santri>(`/api/santri/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSantri(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/santri/${id}`, { method: 'DELETE' });
  },

  // Nilai
  async getNilai(params?: { santriId?: string; classId?: string; subjectId?: string; academicYearId?: string; semesterId?: string; teacherId?: string }): Promise<Nilai[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<Nilai[]>(`/api/nilai${q ? '?' + q : ''}`);
  },

  async createNilai(data: Omit<Nilai, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nilai> {
    return fetchJson<Nilai>('/api/nilai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateNilai(id: string, data: Partial<Nilai>): Promise<Nilai> {
    return fetchJson<Nilai>(`/api/nilai/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteNilai(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/nilai/${id}`, { method: 'DELETE' });
  },

  async createNilaiBulk(data: { nilaiList: any[] }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/nilai/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Rapor Detail
  async getRaporDetail(params?: { santriId?: string; academicYearId?: string; semesterId?: string }): Promise<RaporDetail[]> {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== ''))).toString() : '';
    return fetchJson<RaporDetail[]>(`/api/rapor-detail${q ? '?' + q : ''}`);
  },

  async createRaporDetail(data: Omit<RaporDetail, 'id' | 'createdAt' | 'updatedAt'>): Promise<RaporDetail> {
    return fetchJson<RaporDetail>('/api/rapor-detail', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRaporDetail(id: string, data: Partial<RaporDetail>): Promise<RaporDetail> {
    return fetchJson<RaporDetail>(`/api/rapor-detail/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async createRaporDetailBulk(data: { raporList: any[] }): Promise<{ message: string }> {
    return fetchJson<{ message: string }>('/api/rapor-detail/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload File Attachment (converts File to base64, uploads via JSON api)
  async uploadAttachment(file: File): Promise<{ url: string; name: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await fetchJson<{ url: string; name: string }>('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData: fileData
            })
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      reader.readAsDataURL(file);
    });
  }
};
