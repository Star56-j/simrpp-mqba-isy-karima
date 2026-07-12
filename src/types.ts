export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Guru';
  teacherId?: string;
  teacher?: Teacher;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface Subject {
  id: string;
  name: string;
  category: 'Al-Qur\'an' | 'Diniyah' | 'Bahasa' | 'Umum';
}

export interface SchoolClass {
  id: string;
  name: string;
  level: 'I\'dad' | 'Wustho';
}

export interface AcademicYear {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: 'Ganjil' | 'Genap';
}

export interface TeachingSchedule {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  time: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  class?: SchoolClass;
  teacher?: Teacher;
  subject?: Subject;
  academicYear?: AcademicYear;
  semester?: Semester;
}

export interface RPP {
  id: string;
  scheduleId: string;
  teacherId: string;
  date: string;
  meetingNo: string;
  subjectId: string;
  classId: string;
  academicYearId: string;
  semesterId: string;
  learningObjectives: string;
  materials: string;
  method: string;
  media: string;
  learningSteps: string;
  assessment: string;
  notes: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
  revisionNotes?: string;
  updatedAt: string;
  createdAt: string;
  class?: SchoolClass;
  subject?: Subject;
  teacher?: Teacher;
  academicYear?: AcademicYear;
  semester?: Semester;
  schedule?: TeachingSchedule;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  teachers: number;
  subjects: number;
  classes: number;
  schedules: number;
  rpp: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    revision: number;
  };
  activityLogs: ActivityLog[];
}

export interface GuruStats {
  mySchedulesCount: number;
  rpp: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    revision: number;
  };
}
