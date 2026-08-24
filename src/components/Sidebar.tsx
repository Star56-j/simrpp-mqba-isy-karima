import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, Calendar, 
  FileText, User, Lock, LogOut, Moon, Sun, Activity, 
  FileSpreadsheet, Users2, Crown, Megaphone, HelpCircle,
  ChevronDown, ChevronRight, MessageSquare
} from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType;
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export default function Sidebar({ 
  user, 
  currentView, 
  setView, 
  onLogout, 
  darkMode, 
  setDarkMode,
  isOpen,
  setIsOpen
}: SidebarProps) {
  const isWaliKelas = user.role === 'WaliKelas';
  const isAdmin = user.role === 'Admin';

  const menuGroups: MenuGroup[] = useMemo(() => {
    if (isAdmin) {
      return [
        {
          title: 'UTAMA & DASHBOARD',
          items: [
            { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ]
        },
        {
          title: 'DATA MASTER AKADEMIK',
          items: [
            { id: 'master-teachers', label: 'Data Guru', icon: Users },
            { id: 'master-classes', label: 'Data Kelas', icon: GraduationCap },
            { id: 'master-subjects', label: 'Mata Pelajaran', icon: BookOpen },
            { id: 'master-santri', label: 'Data Santri', icon: Users2 },
            { id: 'wali-kelas', label: 'Wali Kelas', icon: Crown },
          ]
        },
        {
          title: 'KBM & RPP',
          items: [
            { id: 'master-schedules', label: 'Jadwal KBM', icon: Calendar },
            { id: 'manage-rpps', label: 'Persetujuan RPP', icon: FileText },
          ]
        },
        {
          title: 'ABSENSI & KEHADIRAN',
          items: [
            { id: 'attendance', label: 'Absensi Guru', icon: FileSpreadsheet },
            { id: 'santri-attendance', label: 'Absensi Santri', icon: Users2 },
          ]
        },
        {
          title: 'PENILAIAN & RAPOR',
          items: [
            { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
            { id: 'rekap-rapor-wali-kelas', label: 'Rekap Rapor Kelas', icon: FileSpreadsheet },
          ]
        },
        {
          title: 'EVALUASI & LAPORAN',
          items: [
            { id: 'evaluasi-pembelajaran', label: 'Evaluasi Mapel Guru', icon: Activity },
            { id: 'evaluasi-wali-kelas', label: 'Evaluasi Wali Kelas', icon: FileText },
          ]
        },
        {
          title: 'SISTEM & KOMUNIKASI',
          items: [
            { id: 'tanya-wali-kelas', label: 'Konsultasi Wali Santri', icon: MessageSquare },
            { id: 'tanya-admin', label: 'Tanya Admin', icon: HelpCircle },
            { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
            { id: 'activity-logs', label: 'Activity Log', icon: Activity },
            { id: 'reset-requests', label: 'Reset Sandi Guru', icon: Lock },
            { id: 'profile-settings', label: 'Profil Saya', icon: User },
          ]
        }
      ];
    }

    if (isWaliKelas) {
      return [
        {
          title: 'UTAMA & DASHBOARD',
          items: [
            { id: 'guru-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ]
        },
        {
          title: 'ABSENSI & RAPOR KELAS',
          items: [
            { id: 'my-santri-attendance', label: 'Absensi Santri', icon: Users2 },
            { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
            { id: 'rekap-rapor-wali-kelas', label: 'Rekap Rapor Kelas', icon: FileSpreadsheet },
          ]
        },
        {
          title: 'EVALUASI & KONSULTASI',
          items: [
            { id: 'tanya-wali-kelas', label: 'Konsultasi Wali Santri', icon: MessageSquare },
            { id: 'evaluasi-wali-kelas', label: 'Evaluasi Wali Kelas', icon: FileText },
            { id: 'tanya-admin', label: 'Tanya Admin', icon: HelpCircle },
            { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
            { id: 'profile-settings', label: 'Profil Saya', icon: User },
          ]
        }
      ];
    }

    return [
      {
        title: 'UTAMA & DASHBOARD',
        items: [
          { id: 'guru-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      },
      {
        title: 'KEGIATAN GURU',
        items: [
          { id: 'my-rpps', label: 'RPP Saya', icon: FileText },
          { id: 'my-attendance', label: 'Absensi Saya', icon: FileSpreadsheet },
          { id: 'my-santri-attendance', label: 'Absensi Santri', icon: Users2 },
        ]
      },
      {
        title: 'PENILAIAN & EVALUASI',
        items: [
          { id: 'nilai-santri', label: 'Nilai & Rapor', icon: BookOpen },
          { id: 'evaluasi-pembelajaran', label: 'Evaluasi Bulanan Mapel', icon: Activity },
        ]
      },
      {
        title: 'INFORMASI & KONSULTASI',
        items: [
          { id: 'tanya-wali-kelas', label: 'Konsultasi Wali Santri', icon: MessageSquare },
          { id: 'tanya-admin', label: 'Tanya Admin', icon: HelpCircle },
          { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
          { id: 'profile-settings', label: 'Profil Saya', icon: User },
        ]
      }
    ];
  }, [isAdmin, isWaliKelas]);

  // State untuk collapsible group per bab
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 text-slate-100 flex flex-col justify-between shadow-2xl transition-transform duration-300 transform 
        lg:translate-x-0 lg:static lg:h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{background: 'linear-gradient(180deg, #0c4a6e 0%, #075985 40%, #0369a1 100%)'}}>
        {/* Logo Section */}
        <div className="px-4 pt-5 pb-4 border-b border-sky-800/40">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <img
                src="/logo-mqba.png"
                alt="Logo MQBA Isy Karima"
                className="w-16 h-16 object-contain drop-shadow-lg animate-float"
              />
              <div className="absolute -inset-1 rounded-full" style={{background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'}} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white uppercase tracking-widest leading-tight">Akademik MQBA</h2>
              <p className="text-[10px] text-sky-300 font-semibold tracking-wider mt-0.5 uppercase">Isy Karima</p>
            </div>
            {/* Islamic star divider */}
            <div className="text-sky-400/50 text-[10px] tracking-widest" aria-hidden="true">✦ ✦ ✦</div>
          </div>
        </div>

        {/* User Info Card + Actions */}
        <div className="px-3 py-2.5 m-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-inner flex flex-col justify-center">
          <div className="flex items-center space-x-3 text-left w-full">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md flex-shrink-0 bg-gradient-to-br from-sky-400 to-sky-600 ring-2 ring-transparent transition overflow-hidden">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-white truncate tracking-wide leading-tight" title={user.name}>{user.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-sky-900/80 text-sky-200 uppercase tracking-widest border border-sky-600/50">
                  {user.role === 'WaliSantri' ? 'Wali Santri' : user.role}
                </span>
                
                {/* Actions next to role */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-1 rounded bg-white/5 hover:bg-white/20 text-sky-200 transition cursor-pointer"
                    title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) onLogout(); }}
                    className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-200 transition cursor-pointer"
                    title="Keluar Sistem"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Grouped into Bab & Sub-Bab) */}
        <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto">
          {menuGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title];

            return (
              <div key={group.title} className="space-y-1">
                {/* Group Header (Bab) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black tracking-widest text-sky-200/80 hover:text-white uppercase transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-3 rounded-full bg-sky-300/80 group-hover:bg-white transition-colors" />
                    <span>{group.title}</span>
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-sky-300/70 group-hover:text-white transition" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-sky-300/70 group-hover:text-white transition" />
                  )}
                </button>

                {/* Sub-Bab Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1.5">
                    {group.items.map((item) => {
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
                            w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-[0.98]
                            ${isActive 
                              ? 'bg-white/25 text-white shadow-sm border border-white/20 font-black' 
                              : 'text-white/85 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-sky-200'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3" style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <p className="text-[10px] text-white/70 text-center font-semibold uppercase tracking-wider">MQBA Isy Karima © 2026</p>
        </div>
      </aside>
    </>
  );
}
