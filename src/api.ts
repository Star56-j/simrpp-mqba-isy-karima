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
  RaporDetail,
  Pengumuman,
  EvaluasiPembelajaran
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

const FALLBACK_SANTRI_DATA = [
  { name: "Ahmad Ajyad Syamil Sutrisno", classId: "cls-3" }, { name: "Ahmad Fakhry Athallah", classId: "cls-3" },
  { name: "Athilasyah Rifqi Sulistyo", classId: "cls-3" }, { name: "Baihaqi Hanif Abrorni", classId: "cls-3" },
  { name: "Fairuz Fahri Firmansyah", classId: "cls-3" }, { name: "Hasbi Nafsi Jalalullah", classId: "cls-3" },
  { name: "Hisyam Zuhdi", classId: "cls-3" }, { name: "Israr At Taufik", classId: "cls-3" },
  { name: "Keven Maghribi Darmaresta", classId: "cls-3" }, { name: "Khoirul Akbar Nur Hidayatulloh", classId: "cls-3" },
  { name: "M Rajendra Ali Mudzakir", classId: "cls-3" }, { name: "Muhammad Fatih Izzan An-Naqy", classId: "cls-3" },
  { name: "Muhammad Ilyas Anrisyab", classId: "cls-3" }, { name: "Muhammad Yahya Izzuddin", classId: "cls-3" },
  { name: "Muhammad Yusuf Rifa'i", classId: "cls-3" }, { name: "Ramdhan Ridhwanullah", classId: "cls-3" },
  { name: "Shofyan Abdillah Achmad", classId: "cls-3" }, { name: "Tsaabit Qawiyyul Himmah", classId: "cls-3" },
  { name: "Yahya", classId: "cls-3" },
  { name: "Abigail Madhalee Ariya Fatihah", classId: "cls-4" }, { name: "Alya Mukhbita", classId: "cls-4" },
  { name: "Ammara taqiyya khoirunnisa", classId: "cls-4" }, { name: "Annisauzzahro as-salamah Parapat", classId: "cls-4" },
  { name: "Ayesha khayla Salsabila", classId: "cls-4" }, { name: "Cataleya Azzahwa Fieary", classId: "cls-4" },
  { name: "Filzah Taqy Hilmiyah Hanief", classId: "cls-4" }, { name: "Marwa Az Zahira Ibrahim Pribadi", classId: "cls-4" },
  { name: "Maryam Muthiah Tafdlila", classId: "cls-4" }, { name: "Shabiha Nadira Azzahra", classId: "cls-4" },
  { name: "Syakila Nada Salsabila", classId: "cls-4" },
  { name: "Attahir Zarkasya Ramadhan", classId: "cls-1" }, { name: "Bintang Bumi Langit Biru", classId: "cls-1" },
  { name: "Handade Yonca Satya Harjuna", classId: "cls-1" }, { name: "Kenzie Iffat Itoniwa", classId: "cls-1" },
  { name: "Miqdaad Dzakiyy Hasan Faishal", classId: "cls-1" }, { name: "Sae Sibghotallah", classId: "cls-1" },
  { name: "Imtihan Syarifatul 'Ula", classId: "cls-2" }, { name: "Iskanda Aulia Neisya", classId: "cls-2" },
  { name: "Naura Auni Qonita", classId: "cls-2" },
  { name: "Adit Wahyu Pratama", classId: "cls-5" }, { name: "Azka Rasya Darmawan", classId: "cls-5" },
  { name: "Badar Farisul Qital", classId: "cls-5" }, { name: "Farzan Fiza Ananta", classId: "cls-5" },
  { name: "Hamidurohman Hudzaifi", classId: "cls-5" }, { name: "Hilmi Dzabihulloh", classId: "cls-5" },
  { name: "Muhammad Faathir Rusyada Azhar", classId: "cls-5" }, { name: "Nizar Haidar Rahman", classId: "cls-5" },
  { name: "Raushan Akhtar Majid", classId: "cls-5" }, { name: "Tristan Firafisa Parsa", classId: "cls-5" },
  { name: "Yafiq Alvaro", classId: "cls-5" }, { name: "Yuwhay Haura Anbiiya", classId: "cls-5" },
  { name: "Raisa Shakila Putri", classId: "cls-6" }, { name: "Shofiyyah Afnan", classId: "cls-6" },
  { name: "Dzakira Tsania Fahmi", classId: "cls-6" }, { name: "Rafanda Rayyan Adeeva", classId: "cls-6" },
  { name: "Hafidzah Mumtaazah Ni'matullah", classId: "cls-6" }, { name: "Hurin Iin Luluil Maknun", classId: "cls-6" },
  { name: "Queena Kayyisa Nararya", classId: "cls-6" },
  { name: "Abdurrahman Az Zubair", classId: "cls-7" }, { name: "Achmad Akmal Alhakim", classId: "cls-7" },
  { name: "Ahza Ibnu Hafiz", classId: "cls-7" }, { name: "Albanna Sheeva", classId: "cls-7" },
  { name: "Arman Abdurrahman Nasution", classId: "cls-7" }, { name: "Faiq Kamal Yazid Al-Bara", classId: "cls-7" },
  { name: "Jaisy Aliy Al Khalil", classId: "cls-7" }, { name: "Mirza Alzam Azhari", classId: "cls-7" },
  { name: "Moh Khalifatullah Rosyad Al Amin", classId: "cls-7" }, { name: "Muhammad Faruq Baharta", classId: "cls-7" },
  { name: "Muhammad Faqih Multazim", classId: "cls-7" }, { name: "Muhammad Zidan Dhiyauddin", classId: "cls-7" },
  { name: "Rafasya Muhammad Firdaus An'Naba", classId: "cls-7" }, { name: "Vajradhatu Keinan Noor", classId: "cls-7" },
  { name: "Ziyad Alhaq", classId: "cls-7" }
];

const FALLBACK_SANTRI_LIST: Santri[] = FALLBACK_SANTRI_DATA.map((s, idx) => ({
  id: `santri-${idx + 1}`,
  nis: `2026${String(idx + 1).padStart(3, '0')}`,
  name: s.name,
  classId: s.classId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

const FALLBACK_TEACHERS: Teacher[] = [
  { id: "teacher-1", name: "Ustadz Muhammad Arya Mukti, Al Hafizh", email: "aryamukti@mqba.sch.id" },
  { id: "teacher-2", name: "Ustadz Akmal Firmana, ST.", email: "akmal@mqba.sch.id" },
  { id: "teacher-3", name: "Ustadz Abdul Kholif", email: "abdulkholif@mqba.sch.id" },
  { id: "teacher-4", name: "Ustadz Sahmura Maula Maghribi, S.Mat.", email: "sahmura@mqba.sch.id" },
  { id: "teacher-5", name: "Ustadz Muhammad Hafizh Hibatullah, S.Si.", email: "hafizh@mqba.sch.id" },
  { id: "teacher-6", name: "Ustadz Faqih Hidayat, Lc.", email: "faqih@mqba.sch.id" },
  { id: "teacher-7", name: "Ustadz Muhammad Abdul Malik Ibrahim, S.Kom.", email: "abdulmalik@mqba.sch.id" },
  { id: "teacher-8", name: "Ustadz Dzulfikar Tri Bagaskara, S.Ag., M.Pd.", email: "dzulfikar@mqba.sch.id" },
  { id: "teacher-9", name: "Ustadzah Hasri Haryani Direja, S.Ds.", email: "hasri@mqba.sch.id" },
  { id: "teacher-10", name: "Ustadzah Saiba Musyayia", email: "saibamusyayia@mqba.sch.id" },
  { id: "teacher-11", name: "Ustadz Rezkidar", email: "rezkidar@mqba.sch.id" },
  { id: "teacher-12", name: "Ustadz Azri Robani Indra Robbi, S.Ag.", email: "azri@mqba.sch.id" },
  { id: "teacher-13", name: "Ustadzah Indri Nurbidari, S.Si", email: "indri@mqba.sch.id" },
  { id: "teacher-14", name: "Ustadzah Bela Dwi Lestari, S.Pd.", email: "bela@mqba.sch.id" },
  { id: "teacher-15", name: "Ustadzah Nurika Nuralifah, S.Ag.", email: "nurika@mqba.sch.id" },
  { id: "teacher-16", name: "Ustadzah Azizah Nur Aini, S.Pd.", email: "azizah@mqba.sch.id" },
  { id: "teacher-17", name: "Ustadz Umar Alamuddin, Lc., Al-Hafizh", email: "umar@mqba.sch.id" },
  { id: "teacher-18", name: "Ustadz Nashiruddin Karim, Lc., Al-Hafizh", email: "karim@mqba.sch.id" },
  { id: "teacher-19", name: "Ustadz Yunan Hidayat, Al Hafizh", email: "yunan@mqba.sch.id" },
  { id: "teacher-20", name: "Ustadz Muhammad Latief Amiruddin, S.T.", email: "latief@mqba.sch.id" },
  { id: "teacher-21", name: "Ustadzah Hasna Halimatun Basyaria, S.Ag., Al Hafizhah", email: "hasna@mqba.sch.id" },
  { id: "teacher-22", name: "Ustadz Tubagus Ahadiyat Rachmadi Luhur, S. Ag.", email: "tubagus@mqba.sch.id" },
  { id: "teacher-23", name: "Ustadz Fredy Susilo Supriyanto, S.Ag., Al Hafizh", email: "fredy@mqba.sch.id" },
  { id: "teacher-24", name: "Ustadz Aidil Aqli, S.Ag.", email: "aidil@mqba.sch.id" },
  { id: "teacher-25", name: "Ustadzah Aulia Anim Amanillah", email: "anim@mqba.sch.id" },
  { id: "teacher-26", name: "Ustadzah Lina Ayu Fitriyyah, S. Ag.", email: "lina@mqba.sch.id" },
  { id: "teacher-27", name: "Ustadz Farhan Akhandi", email: "farhan@mqba.sch.id" }
];

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetchJson<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password })
      });
      localStorage.setItem('simrpp_token', res.token);
      localStorage.setItem('simrpp_user', JSON.stringify(res.user));
      return res;
    } catch (err: any) {
      // Fallback for static hosts (Cloudflare Pages / Vercel static)
      const isAdmin = cleanEmail === 'aidilibnusalam3@gmail.com' || cleanEmail === 'admin@mqba.sch.id' || cleanEmail === 'admin' || cleanEmail === 'aqli';
      if (isAdmin && (password === 'parabek123' || password === 'admin123')) {
        const adminUser: User = {
          id: 'user-admin-1',
          name: 'Aqli',
          email: 'aidilibnusalam3@gmail.com',
          role: 'Admin'
        };
        const res = { token: 'user-admin-1', user: adminUser };
        localStorage.setItem('simrpp_token', res.token);
        localStorage.setItem('simrpp_user', JSON.stringify(res.user));
        return res;
      }

      // Check Guru fallback
      const inputPrefix = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const guru = FALLBACK_TEACHERS.find(t => {
        const teacherEmailClean = t.email.toLowerCase();
        const teacherPrefix = teacherEmailClean.split('@')[0];
        const teacherNameClean = t.name.toLowerCase();
        return teacherEmailClean === cleanEmail || teacherPrefix === inputPrefix || (inputPrefix.length >= 3 && teacherNameClean.includes(inputPrefix));
      });
      if (guru && (password === 'guru123' || password === 'parabek123')) {
        const guruUser: User = {
          id: `user-guru-${guru.id}`,
          name: guru.name,
          email: guru.email,
          role: 'Guru',
          teacherId: guru.id,
          teacher: guru
        };
        const res = { token: guruUser.id, user: guruUser };
        localStorage.setItem('simrpp_token', res.token);
        localStorage.setItem('simrpp_user', JSON.stringify(res.user));
        return res;
      }

      throw new Error(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    }
  },

  async waliLogin(name: string): Promise<{ token: string; user: User }> {
    const cleanName = name.trim();
    try {
      const res = await fetchJson<{ token: string; user: User }>('/api/auth/wali-login', {
        method: 'POST',
        body: JSON.stringify({ name: cleanName })
      });
      localStorage.setItem('simrpp_token', res.token);
      localStorage.setItem('simrpp_user', JSON.stringify(res.user));
      return res;
    } catch (err: any) {
      if (cleanName.length >= 2) {
        const waliUser: User = {
          id: `wali-${Date.now()}`,
          name: `Wali dari ${cleanName}`,
          email: '',
          role: 'WaliSantri',
          santriId: `santri-demo`
        };
        const res = { token: waliUser.id, user: waliUser };
        localStorage.setItem('simrpp_token', res.token);
        localStorage.setItem('simrpp_user', JSON.stringify(res.user));
        return res;
      }
      throw new Error(err.message || 'Data santri tidak ditemukan.');
    }
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
    return fetchJson<Teacher[]>('/api/teachers').catch(() => FALLBACK_TEACHERS);
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
    return fetchJson<Subject[]>('/api/subjects').catch(() => {
      const stored = localStorage.getItem('simrpp_subjects');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      const defaultSubs: Subject[] = [
        { id: "sub-2", name: "Tahsin", category: "Al-Qur'an" },
        { id: "sub-3", name: "Tajwid", category: "Al-Qur'an" },
        { id: "sub-20", name: "Muraja'ah Hafalan", category: "Al-Qur'an" },
        { id: "sub-5", name: "Aqidah", category: "Diniyah" },
        { id: "sub-6", name: "Akhlaq", category: "Diniyah" },
        { id: "sub-7", name: "Fiqih", category: "Diniyah" },
        { id: "sub-8", name: "Adab wa Tarbiyah", category: "Diniyah" },
        { id: "sub-9", name: "Siroh", category: "Diniyah" },
        { id: "sub-10", name: "Manhaji", category: "Diniyah" },
        { id: "sub-11", name: "Jazary", category: "Diniyah" },
        { id: "sub-12", name: "Khot", category: "Diniyah" },
        { id: "sub-13", name: "Arabiyah Baina Yadaik (ABY)", category: "Bahasa" },
        { id: "sub-14", name: "Bahasa Indonesia", category: "Bahasa" },
        { id: "sub-15", name: "Bahasa Inggris", category: "Bahasa" },
        { id: "sub-16", name: "Matematika", category: "Umum" },
        { id: "sub-17", name: "IPA", category: "Umum" },
        { id: "sub-18", name: "Furusiyah", category: "Umum" },
        { id: "sub-19", name: "Tai Chi / Olah Raga", category: "Umum" }
      ];
      localStorage.setItem('simrpp_subjects', JSON.stringify(defaultSubs));
      return defaultSubs;
    });
  },

  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    try {
      return await fetchJson<Subject>('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(subject)
      });
    } catch {
      const existing = await this.getSubjects();
      const newSub: Subject = { ...subject, id: `sub-${Date.now()}` };
      const updated = [...existing, newSub];
      localStorage.setItem('simrpp_subjects', JSON.stringify(updated));
      return newSub;
    }
  },

  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    try {
      return await fetchJson<Subject>(`/api/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subject)
      });
    } catch {
      const existing = await this.getSubjects();
      const updated = existing.map(s => s.id === id ? { ...s, ...subject } : s);
      localStorage.setItem('simrpp_subjects', JSON.stringify(updated));
      return updated.find(s => s.id === id) || existing[0];
    }
  },

  async deleteSubject(id: string): Promise<{ message: string }> {
    try {
      return await fetchJson<{ message: string }>(`/api/subjects/${id}`, {
        method: 'DELETE'
      });
    } catch {
      const existing = await this.getSubjects();
      const updated = existing.filter(s => s.id !== id);
      localStorage.setItem('simrpp_subjects', JSON.stringify(updated));
      return { message: 'Mata pelajaran berhasil dihapus' };
    }
  },

  // Classes (Admin)
  async getClasses(): Promise<SchoolClass[]> {
    return fetchJson<SchoolClass[]>('/api/classes').catch(() => [
      { id: "cls-1", name: "I'dad Putra", level: "I'dad" },
      { id: "cls-2", name: "I'dad Putri", level: "I'dad" },
      { id: "cls-3", name: "Kelas VII Putra", level: "Wustho" },
      { id: "cls-4", name: "Kelas VII Putri", level: "Wustho" },
      { id: "cls-5", name: "Kelas VIII Putra", level: "Wustho" },
      { id: "cls-6", name: "Kelas VIII Putri", level: "Wustho" },
      { id: "cls-7", name: "Kelas IX Putra", level: "Wustho" }
    ]);
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
    return fetchJson<AcademicYear[]>('/api/academic-years').catch(() => [{ id: "ay-1", name: "2026 / 2027" }]);
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
    return fetchJson<Semester[]>('/api/semesters').catch(() => [{ id: "sem-1", name: "Ganjil" }, { id: "sem-2", name: "Genap" }]);
  },

  // Teaching Schedules (Jadwal KBM)
  async getSchedules(): Promise<TeachingSchedule[]> {
    return fetchJson<TeachingSchedule[]>('/api/schedules').catch(() => {
      const stored = localStorage.getItem('simrpp_schedules');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      const defaultSchedules: TeachingSchedule[] = [
        { id: "sch-1", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-7", subjectId: "sub-12", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-2", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-6", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-3", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-8", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-4", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-11", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-5", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-6", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-7", day: "Sabtu", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-8", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-2", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-9", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-7", subjectId: "sub-12", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-10", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-11", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-12", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-8", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-13", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-14", day: "Sabtu", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-20", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-15", day: "Ahad", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-3", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-16", day: "Ahad", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-17", day: "Ahad", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-6", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-18", day: "Ahad", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-15", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-19", day: "Ahad", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-20", day: "Ahad", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-3", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-21", day: "Ahad", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-22", day: "Ahad", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-24", subjectId: "sub-6", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-23", day: "Ahad", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-24", day: "Ahad", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-22", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-25", day: "Ahad", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-26", day: "Ahad", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-27", day: "Ahad", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-28", day: "Ahad", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-29", day: "Senin", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-30", day: "Senin", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-31", day: "Senin", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-1", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-32", day: "Senin", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-13", subjectId: "sub-15", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-33", day: "Senin", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-11", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-34", day: "Senin", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-35", day: "Senin", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-36", day: "Senin", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-37", day: "Senin", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-38", day: "Senin", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-39", day: "Senin", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-40", day: "Senin", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-5", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-41", day: "Senin", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-42", day: "Senin", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-43", day: "Selasa", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-44", day: "Selasa", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-45", day: "Selasa", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-24", subjectId: "sub-18", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-46", day: "Selasa", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-14", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-47", day: "Selasa", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-48", day: "Selasa", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-49", day: "Selasa", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-50", day: "Selasa", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-51", day: "Selasa", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-10", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-52", day: "Selasa", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-5", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-53", day: "Selasa", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-16", subjectId: "sub-17", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-54", day: "Selasa", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-24", subjectId: "sub-14", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-55", day: "Selasa", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-20", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-56", day: "Selasa", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-57", day: "Rabu", time: "07:30 - 08:45", classId: "cls-3", teacherId: "teacher-24", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-58", day: "Rabu", time: "07:30 - 08:45", classId: "cls-4", teacherId: "teacher-7", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-59", day: "Rabu", time: "07:30 - 08:45", classId: "cls-5", teacherId: "teacher-24", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-60", day: "Rabu", time: "07:30 - 08:45", classId: "cls-6", teacherId: "teacher-7", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-61", day: "Rabu", time: "07:30 - 08:45", classId: "cls-7", teacherId: "teacher-24", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-62", day: "Rabu", time: "07:30 - 08:45", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-63", day: "Rabu", time: "07:30 - 08:45", classId: "cls-2", teacherId: "teacher-7", subjectId: "sub-19", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-64", day: "Rabu", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-65", day: "Rabu", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-66", day: "Rabu", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-67", day: "Rabu", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-68", day: "Rabu", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-69", day: "Rabu", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-70", day: "Rabu", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-71", day: "Rabu", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-72", day: "Rabu", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-10", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-73", day: "Rabu", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-3", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-74", day: "Rabu", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-75", day: "Rabu", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-22", subjectId: "sub-9", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-76", day: "Rabu", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-77", day: "Rabu", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-10", subjectId: "sub-3", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-78", day: "Kamis", time: "10:00 - 11:30", classId: "cls-3", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-79", day: "Kamis", time: "10:00 - 11:30", classId: "cls-4", teacherId: "teacher-9", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-80", day: "Kamis", time: "10:00 - 11:30", classId: "cls-5", teacherId: "teacher-4", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-81", day: "Kamis", time: "10:00 - 11:30", classId: "cls-6", teacherId: "teacher-6", subjectId: "sub-5", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-82", day: "Kamis", time: "10:00 - 11:30", classId: "cls-7", teacherId: "teacher-2", subjectId: "sub-16", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-83", day: "Kamis", time: "10:00 - 11:30", classId: "cls-1", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-84", day: "Kamis", time: "10:00 - 11:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-85", day: "Kamis", time: "12:30 - 13:30", classId: "cls-3", teacherId: "teacher-12", subjectId: "sub-2", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-86", day: "Kamis", time: "12:30 - 13:30", classId: "cls-4", teacherId: "teacher-6", subjectId: "sub-6", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-87", day: "Kamis", time: "12:30 - 13:30", classId: "cls-5", teacherId: "teacher-11", subjectId: "sub-7", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-88", day: "Kamis", time: "12:30 - 13:30", classId: "cls-6", teacherId: "teacher-7", subjectId: "sub-13", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-89", day: "Kamis", time: "12:30 - 13:30", classId: "cls-7", teacherId: "teacher-18", subjectId: "sub-8", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-90", day: "Kamis", time: "12:30 - 13:30", classId: "cls-1", teacherId: "teacher-6", subjectId: "sub-20", academicYearId: "ay-1", semesterId: "sem-1" },
        { id: "sch-91", day: "Kamis", time: "12:30 - 13:30", classId: "cls-2", teacherId: "teacher-8", subjectId: "sub-20", academicYearId: "ay-1", semesterId: "sem-1" }
      ];
      localStorage.setItem('simrpp_schedules', JSON.stringify(defaultSchedules));
      return defaultSchedules;
    });
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
    return fetchJson<Santri[]>(`/api/santri${classId ? `?classId=${classId}` : ''}`).catch(() => {
      if (classId) return FALLBACK_SANTRI_LIST.filter(s => s.classId === classId);
      return FALLBACK_SANTRI_LIST;
    });
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
  },

  // Pengumuman
  async getPengumuman(): Promise<Pengumuman[]> {
    return fetchJson<Pengumuman[]>('/api/pengumuman');
  },
  async createPengumuman(data: { title: string; content: string }): Promise<Pengumuman> {
    return fetchJson<Pengumuman>('/api/pengumuman', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deletePengumuman(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/api/pengumuman/${id}`, {
      method: 'DELETE',
    });
  },

  // Evaluasi Pembelajaran Bulanan
  async getEvaluasi(params?: { bulan?: number; tahun?: number; semesterId?: string; teacherId?: string; classId?: string; academicYearId?: string }): Promise<EvaluasiPembelajaran[]> {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])).toString() : '';
    return fetchJson<EvaluasiPembelajaran[]>(`/api/evaluasi${qs}`).catch(() => {
      const stored = localStorage.getItem('simrpp_evaluasi');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      const sampleData: EvaluasiPembelajaran[] = [
        {
          id: "eval-sample-1",
          bulan: 7,
          tahun: 2026,
          teacherId: "teacher-6",
          subjectId: "sub-5",
          classId: "cls-3",
          academicYearId: "ay-1",
          semesterId: "sem-1",
          totalPertemuanRencana: 4,
          totalPertemuanTerlaksana: 4,
          persentaseTerlaksana: 100,
          tpTercapai: "Santri memahami konsep dasar Aqidah Islamiah & Rukun Iman secara komprehensif.",
          tpBelumTercapai: "Beberapa santri masih memerlukan pendalaman dalil naqli.",
          asesmenFormatifHasil: "Rata-rata nilai kuis 88. 15 santri kategori Sangat Baik.",
          asesmenCatatan: "Kehadiran santri 100% dan antusias dalam berdiskusi.",
          kendala: "Waktu alokasi diskusi terasa terbatas.",
          solusi: "Menambah durasi sesi tanya jawab di akhir halaqah.",
          diferenciasiDilakukan: "Santri yang lebih cepat paham diberikan studi kasus tambahan.",
          rencanaBulanDepan: "Melanjutkan pembahasan Tauhid Uluhiyyah dan contoh penerapannya.",
          refleksiGuru: "Pembelajaran bulan ini berjalan efektif dan interaktif.",
          predikatKetercapaian: "Sangat Baik",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teacher: FALLBACK_TEACHERS.find(t => t.id === "teacher-6"),
          subject: { id: "sub-5", name: "Aqidah", category: "Diniyah" },
          class: { id: "cls-3", name: "Kelas VII Putra", level: "Wustho" },
          semester: { id: "sem-1", name: "Ganjil" }
        },
        {
          id: "eval-sample-2",
          bulan: 7,
          tahun: 2026,
          teacherId: "teacher-8",
          subjectId: "sub-15",
          classId: "cls-5",
          academicYearId: "ay-1",
          semesterId: "sem-1",
          totalPertemuanRencana: 4,
          totalPertemuanTerlaksana: 4,
          persentaseTerlaksana: 100,
          tpTercapai: "Santri mampu melakukan percakapan Bahasa Inggris dasar (Daily Conversation).",
          tpBelumTercapai: "Penguasaan grammar dasar (past tense) perlu penguatan.",
          asesmenFormatifHasil: "Rata-rata nilai praktek 84.",
          asesmenCatatan: "Santri berani berbicara di depan kelas.",
          kendala: "Kosa kata santri masih bervariasi.",
          solusi: "Memberikan kartu kosa kata harian (vocabulary card).",
          diferenciasiDilakukan: "Latihan percakapan berpasangan sesuai tingkat kelancaran.",
          rencanaBulanDepan: "Fokus pada reading comprehension & penambahan vocabulary.",
          refleksiGuru: "Kemajuan santri terlihat signifikan dalam aspek kebiasaan bicaranya.",
          predikatKetercapaian: "Baik",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teacher: FALLBACK_TEACHERS.find(t => t.id === "teacher-8"),
          subject: { id: "sub-15", name: "Bahasa Inggris", category: "Bahasa" },
          class: { id: "cls-5", name: "Kelas VIII Putra", level: "Wustho" },
          semester: { id: "sem-1", name: "Ganjil" }
        }
      ];
      localStorage.setItem('simrpp_evaluasi', JSON.stringify(sampleData));
      return sampleData;
    });
  },

  async createEvaluasi(data: Omit<EvaluasiPembelajaran, 'id' | 'createdAt' | 'updatedAt' | 'teacher' | 'subject' | 'class' | 'academicYear' | 'semester'>): Promise<EvaluasiPembelajaran> {
    try {
      return await fetchJson<EvaluasiPembelajaran>('/api/evaluasi', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const existing = await this.getEvaluasi();
      const pct = data.totalPertemuanRencana > 0 ? Math.round((data.totalPertemuanTerlaksana / data.totalPertemuanRencana) * 100) : 0;
      const newEv: EvaluasiPembelajaran = {
        ...data,
        id: `eval-${Date.now()}`,
        persentaseTerlaksana: pct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teacher: FALLBACK_TEACHERS.find(t => t.id === data.teacherId),
        subject: { id: data.subjectId, name: "Mata Pelajaran", category: "Umum" },
        class: { id: data.classId, name: "Kelas", level: "Wustho" },
        semester: { id: data.semesterId, name: "Ganjil" }
      };
      const updatedList = [newEv, ...existing];
      localStorage.setItem('simrpp_evaluasi', JSON.stringify(updatedList));
      return newEv;
    }
  },

  async updateEvaluasi(id: string, data: Partial<EvaluasiPembelajaran>): Promise<EvaluasiPembelajaran> {
    try {
      return await fetchJson<EvaluasiPembelajaran>(`/api/evaluasi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const existing = await this.getEvaluasi();
      const updatedList = existing.map(ev => ev.id === id ? { ...ev, ...data, updatedAt: new Date().toISOString() } : ev);
      localStorage.setItem('simrpp_evaluasi', JSON.stringify(updatedList));
      return updatedList.find(ev => ev.id === id) || existing[0];
    }
  },

  async deleteEvaluasi(id: string): Promise<{ message: string }> {
    try {
      return await fetchJson<{ message: string }>(`/api/evaluasi/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const existing = await this.getEvaluasi();
      const updatedList = existing.filter(ev => ev.id !== id);
      localStorage.setItem('simrpp_evaluasi', JSON.stringify(updatedList));
      return { message: 'Evaluasi berhasil dihapus' };
    }
  }
};
