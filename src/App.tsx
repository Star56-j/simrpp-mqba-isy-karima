import React from 'react';
import { api } from './api';
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
  AdminStats,
  GuruStats
} from './types';
import { Bell, Plus } from 'lucide-react';

// Component Imports
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import GuruDashboard from './components/GuruDashboard';
import MasterTeachers from './components/MasterTeachers';
import MasterSubjects from './components/MasterSubjects';
import MasterClasses from './components/MasterClasses';
import MasterSchedules from './components/MasterSchedules';
import ManageRPPs from './components/ManageRPPs';
import MyRPPs from './components/MyRPPs';
import ActivityLogs from './components/ActivityLogs';
import ProfileSettings from './components/ProfileSettings';
import AttendanceAdmin from './components/AttendanceAdmin';
import AttendanceGuru from './components/AttendanceGuru';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [currentView, setView] = React.useState<string>('login');
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    return localStorage.getItem('simrpp_theme') === 'dark' || 
      (!('simrpp_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showNotif, setShowNotif] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Tutup notif kalau klik di luar
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // App Master States
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = React.useState<Semester[]>([]);
  const [schedules, setSchedules] = React.useState<TeachingSchedule[]>([]);
  const [rpps, setRpps] = React.useState<RPP[]>([]);
  const [attendances, setAttendances] = React.useState<Attendance[]>([]);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);

  // Statistics
  const [adminStats, setAdminStats] = React.useState<AdminStats | null>(null);
  const [guruStats, setGuruStats] = React.useState<GuruStats | null>(null);

  const [loading, setLoading] = React.useState<boolean>(true);

  // Sync dark mode class
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('simrpp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('simrpp_theme', 'light');
    }
  }, [darkMode]);

  // Check login on startup
  React.useEffect(() => {
    const activeUser = api.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
      setView(activeUser.role === 'Admin' ? 'admin-dashboard' : 'guru-dashboard');
    }
  }, []);

  // Fetch all app data when logged in
  const fetchData = async (currentUser: User | null = user) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [tch, sbj, cls, ay, sem, sch, r, att] = await Promise.all([
        api.getTeachers().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getClasses().catch(() => []),
        api.getAcademicYears().catch(() => []),
        api.getSemesters().catch(() => []),
        api.getSchedules().catch(() => []),
        api.getRPPs().catch(() => []),
        api.getAttendances().catch(() => [])
      ]);

      setTeachers(tch);
      setSubjects(sbj);
      setClasses(cls);
      setAcademicYears(ay);
      setSemesters(sem);
      setSchedules(sch);
      setRpps(r);
      setAttendances(att);

      // Fetch Stats
      const statRes = await api.getDashboardStats().catch(() => null);
      if (statRes) {
        if (currentUser.role === 'Admin') {
          setAdminStats(statRes as AdminStats);
        } else {
          setGuruStats(statRes as GuruStats);
        }
      }

      // Fetch log history if Admin
      if (currentUser.role === 'Admin') {
        const logsRes = await api.getActivityLogs().catch(() => []);
        setActivityLogs(logsRes);
      }
    } catch (err) {
      console.error('Failed fetching master database logs:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchData(user);
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(loggedInUser.role === 'Admin' ? 'admin-dashboard' : 'guru-dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setView('login');
    setAdminStats(null);
    setGuruStats(null);
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Render view controller
  const renderContent = () => {
    if (loading && teachers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-700 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menghubungkan ke pangkalan data MQBA...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'admin-dashboard':
        return adminStats ? (
          <AdminDashboard 
            stats={adminStats} 
            onNavigate={(view) => setView(view)} 
            rpps={rpps} 
          />
        ) : null;

      case 'guru-dashboard':
        return guruStats ? (
          <GuruDashboard
            stats={guruStats}
            schedules={schedules}
            rpps={rpps}
            onNavigate={(view) => setView(view)}
          />
        ) : null;

      case 'master-teachers':
        return <MasterTeachers teachers={teachers} onRefresh={fetchData} />;

      case 'master-subjects':
        return <MasterSubjects subjects={subjects} onRefresh={fetchData} />;

      case 'master-classes':
        return (
          <MasterClasses 
            classes={classes} 
            academicYears={academicYears} 
            onRefresh={fetchData} 
          />
        );

      case 'master-schedules':
        return (
          <MasterSchedules 
            schedules={schedules}
            teachers={teachers}
            subjects={subjects}
            classes={classes}
            academicYears={academicYears}
            semesters={semesters}
            onRefresh={fetchData}
          />
        );

      case 'manage-rpps':
        return <ManageRPPs rpps={rpps} onRefresh={fetchData} />;

      case 'my-rpps':
        return (
          <MyRPPs
            rpps={rpps}
            subjects={subjects}
            classes={classes}
            academicYears={academicYears}
            onRefresh={fetchData}
          />
        );

      case 'activity-logs':
        return <ActivityLogs logs={activityLogs} onRefresh={fetchData} />;

      case 'attendance':
        return (
          <AttendanceAdmin
            teachers={teachers}
            academicYears={academicYears}
            semesters={semesters}
          />
        );

      case 'my-attendance':
        return (
          <AttendanceGuru
            academicYears={academicYears}
            semesters={semesters}
          />
        );

      case 'profile-settings':
        return <ProfileSettings onRefresh={fetchData} />;

      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Halaman belum tersedia.
          </div>
        );
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'admin-dashboard': return 'Dashboard Administrasi';
      case 'guru-dashboard': return 'Dashboard Pengajar';
      case 'master-teachers': return 'Data Guru (Ustadz/Ustadzah)';
      case 'master-subjects': return 'Mata Pelajaran (Mapel)';
      case 'master-classes': return 'Data Kelas';
      case 'master-schedules': return 'Jadwal KBM';
      case 'manage-rpps': return 'Persetujuan RPP';
      case 'my-rpps': return 'Rencana Pelaksanaan Pembelajaran (RPP)';
      case 'activity-logs': return 'Log Aktivitas';
      case 'attendance': return 'Absensi Guru';
      case 'my-attendance': return 'Absensi Saya';
      case 'profile-settings': return 'Pengaturan Profil';
      default: return 'SIMRPP MQBA';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-800 dark:text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        user={user}
        currentView={currentView}
        setView={setView}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Panel Content with Header & Footer */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Dynamic Polished Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <h2 className="text-slate-800 dark:text-slate-100 font-extrabold text-sm lg:text-base tracking-tight truncate">
              {getViewTitle()}
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase border border-emerald-100/50 dark:border-emerald-900/30">
              Semester Ganjil 2026/2027
            </span>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Quick Status */}
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Node</span>
              </span>
              <span>•</span>
              <span>Tahun Pelajaran: {academicYears[0]?.name || '2026/2027'}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(v => !v)}
                className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Notifikasi"
              >
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                <Bell className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
              </button>

              {showNotif && (
                <div className="absolute right-0 top-10 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Notifikasi</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                      {rpps.filter(r => r.status === 'Menunggu Persetujuan').length} baru
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                    {rpps.filter(r => r.status === 'Menunggu Persetujuan').length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      rpps.filter(r => r.status === 'Menunggu Persetujuan').slice(0, 8).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setView(user?.role === 'Admin' ? 'manage-rpps' : 'my-rpps'); setShowNotif(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            RPP: {r.subject?.name || r.subjectId}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {r.teacher?.name} • Kelas {r.class?.name} • Menunggu Review
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  {rpps.filter(r => r.status === 'Menunggu Persetujuan').length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => { setView(user?.role === 'Admin' ? 'manage-rpps' : 'my-rpps'); setShowNotif(false); }}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline w-full text-center"
                      >
                        Lihat semua RPP →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Action Button */}
            {user.role === 'Guru' ? (
              <button 
                onClick={() => setView('my-rpps')}
                className="px-3.5 py-1.5 lg:px-4 lg:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat RPP Baru</span>
                <span className="sm:hidden">Buat RPP</span>
              </button>
            ) : (
              <button 
                onClick={() => setView('master-teachers')}
                className="px-3.5 py-1.5 lg:px-4 lg:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wide shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tambah Guru</span>
                <span className="sm:hidden">Guru</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto w-full mx-auto space-y-6">
          {renderContent()}
        </main>

        {/* Polish Status Bar Footer */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 shrink-0 select-none">
          <div className="truncate">© 2026 Markaz Qur'an dan Bahasa Arab (MQBA) Isy Karima. All rights reserved.</div>
          <div className="flex items-center space-x-4 uppercase tracking-wider font-extrabold">
            <span>v1.0.4 - React Node</span>
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
