import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  FileText, 
  History, 
  User, 
  Lock, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Activity,
  FileSpreadsheet,
  Users2,
  Crown,
  Megaphone
} from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType;
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function Sidebar({ 
  user, 
  currentView, 
  setView, 
  onLogout, 
  darkMode, 
  setDarkMode 
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = user.role === 'Admin' ? [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master-teachers', label: 'Data Guru', icon: Users },
    { id: 'master-subjects', label: 'Mata Pelajaran', icon: BookOpen },
    { id: 'master-classes', label: 'Data Kelas', icon: GraduationCap },
    { id: 'master-santri', label: 'Data Santri', icon: Users2 },
    { id: 'master-schedules', label: 'Jadwal KBM', icon: Calendar },
    { id: 'my-rpps', label: 'Buat RPP', icon: FileText },
    { id: 'manage-rpps', label: 'Persetujuan RPP', icon: FileText },
    { id: 'attendance', label: 'Rekap Absensi Guru', icon: FileSpreadsheet },
    { id: 'my-attendance', label: 'Isi Absensi Guru', icon: FileSpreadsheet },
    { id: 'santri-attendance', label: 'Rekap Absensi Santri', icon: Users2 },
    { id: 'my-santri-attendance', label: 'Isi Absensi Santri', icon: Users2 },
    { id: 'wali-kelas', label: 'Wali Kelas', icon: Crown },
    { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'activity-logs', label: 'Activity Log', icon: Activity },
    { id: 'profile-settings', label: 'Profil Saya', icon: User },
  ] : [
    { id: 'guru-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-rpps', label: 'RPP Saya', icon: FileText },
    { id: 'my-attendance', label: 'Absensi Saya', icon: FileSpreadsheet },
    { id: 'my-santri-attendance', label: 'Absensi Santri', icon: Users2 },
    { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'profile-settings', label: 'Profil Saya', icon: User },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-indigo-800 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <img src="/logo-mqba.png" alt="Logo MQBA" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-xs font-bold leading-tight uppercase tracking-wider">Akademik MQBA Isy Karima</h1>
            <p className="text-[9px] text-indigo-100 font-medium">Sistem Akademik</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg hover:bg-indigo-700 transition"
            title="Toggle Tema"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-indigo-700 transition"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-slate-100 flex flex-col justify-between shadow-xl transition-transform duration-300 transform 
        lg:translate-x-0 lg:static lg:h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="px-4 pt-5 pb-4 border-b border-indigo-800/60">
          <div className="flex flex-col items-center text-center space-y-2">
            <img
              src="/logo-mqba.png"
              alt="Logo MQBA Isy Karima"
              className="w-20 h-20 object-contain drop-shadow-lg animate-float"
            />
            <div>
              <h2 className="font-extrabold text-sm text-white uppercase tracking-widest leading-tight">Akademik MQBA Isy Karima</h2>
              <p className="text-[10px] text-indigo-300 font-semibold tracking-wider mt-0.5 uppercase">Sistem Akademik</p>
            </div>
          </div>
        </div>

        {/* User Info Card + Actions */}
        <div className="px-4 py-4.5 border-b border-indigo-800/40 bg-indigo-950/40 m-3 rounded-2xl border border-indigo-700/20 shadow-inner">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-sm text-white shadow-md border border-indigo-400/30 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate tracking-wide leading-tight">{user.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[8px] font-black bg-indigo-800/80 text-amber-300 uppercase tracking-widest border border-indigo-700/50">
                {user.role === 'WaliSantri' ? 'Wali Santri' : user.role}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-indigo-800/30">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-indigo-900/50 hover:bg-indigo-800 text-indigo-100 transition cursor-pointer"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>
            
            {/* Quick dashboard shortcut */}
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              MQBA SYS
            </span>

            {/* Logout */}
            <button
              onClick={() => { if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) onLogout(); }}
              className="p-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 hover:text-rose-200 transition cursor-pointer"
              title="Keluar Sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-250 cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/40 border border-indigo-500/20' 
                    : 'text-indigo-200/90 hover:bg-indigo-800/40 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-indigo-800/60 bg-indigo-950/40">
          <p className="text-[10px] text-indigo-600 text-center font-semibold uppercase tracking-wider">Akademik MQBA Isy Karima © 2026</p>
        </div>
      </aside>
    </>
  );
}
