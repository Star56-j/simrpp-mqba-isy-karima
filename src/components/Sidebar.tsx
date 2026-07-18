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
  Crown
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
    { id: 'activity-logs', label: 'Activity Log', icon: Activity },
    { id: 'profile-settings', label: 'Profil Saya', icon: User },
  ] : [
    { id: 'guru-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-rpps', label: 'RPP Saya', icon: FileText },
    { id: 'my-attendance', label: 'Absensi Saya', icon: FileSpreadsheet },
    { id: 'my-santri-attendance', label: 'Absensi Santri', icon: Users2 },
    { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
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
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
            <div>
              <h2 className="font-extrabold text-sm text-white uppercase tracking-widest leading-tight">Akademik MQBA Isy Karima</h2>
              <p className="text-[10px] text-indigo-300 font-semibold tracking-wider mt-0.5 uppercase">Sistem Akademik</p>
            </div>
          </div>
        </div>

        {/* User Info Card + Actions */}
        <div className="px-6 py-4 border-b border-indigo-800/40 bg-indigo-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm border border-indigo-500 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold bg-indigo-700 text-indigo-100 uppercase tracking-wide border border-indigo-600">
                {user.role}
              </span>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-indigo-800/50 transition flex-shrink-0"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-300" /> : <Moon className="w-4.5 h-4.5 text-indigo-300" />}
            </button>
            {/* Logout */}
            <button
              onClick={() => { if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) onLogout(); }}
              className="p-2 rounded-lg hover:bg-rose-950/40 transition flex-shrink-0"
              title="Keluar Sistem"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-300" />
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
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/20 font-semibold' 
                    : 'text-indigo-100 hover:bg-indigo-800/50 hover:text-white'
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
