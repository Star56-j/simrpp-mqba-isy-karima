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
  FileSpreadsheet
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
    { id: 'master-schedules', label: 'Jadwal KBM', icon: Calendar },
    { id: 'manage-rpps', label: 'Persetujuan RPP', icon: FileText },
    { id: 'attendance', label: 'Absensi Guru', icon: FileSpreadsheet },
    { id: 'activity-logs', label: 'Activity Log', icon: Activity },
    { id: 'profile-settings', label: 'Profil Saya', icon: User },
  ] : [
    { id: 'guru-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-rpps', label: 'RPP Saya', icon: FileText },
    { id: 'my-attendance', label: 'Absensi Saya', icon: FileSpreadsheet },
    { id: 'profile-settings', label: 'Profil Saya', icon: User },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-emerald-800 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <img src="/logo-mqba.png" alt="Logo MQBA" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-xs font-bold leading-tight uppercase tracking-wider">SIMRPP MQBA</h1>
            <p className="text-[9px] text-emerald-100 font-medium">Isy Karima</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg hover:bg-emerald-700 transition"
            title="Toggle Tema"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-emerald-700 transition"
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
        fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-slate-100 flex flex-col justify-between shadow-xl transition-transform duration-300 transform 
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="px-4 pt-5 pb-4 border-b border-emerald-800/60">
          <div className="flex flex-col items-center text-center space-y-2">
            <img
              src="/logo-mqba.png"
              alt="Logo MQBA Isy Karima"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
            <div>
              <h2 className="font-extrabold text-sm text-white uppercase tracking-widest leading-tight">SIMRPP MQBA</h2>
              <p className="text-[10px] text-emerald-300 font-semibold tracking-wider mt-0.5 uppercase">Isy Karima</p>
            </div>
          </div>
        </div>

        {/* User Info Card + Actions */}
        <div className="px-6 py-4 border-b border-emerald-800/40 bg-emerald-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm border border-emerald-500 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-emerald-100 uppercase tracking-wide border border-emerald-600">
                {user.role}
              </span>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-emerald-800/50 transition flex-shrink-0"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-300" /> : <Moon className="w-4.5 h-4.5 text-emerald-300" />}
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
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 font-semibold' 
                    : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/40">
          <p className="text-[10px] text-emerald-600 text-center font-semibold uppercase tracking-wider">SIMRPP MQBA © 2026</p>
        </div>
      </aside>
    </>
  );
}
