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
  AdminStats,
  GuruStats
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
