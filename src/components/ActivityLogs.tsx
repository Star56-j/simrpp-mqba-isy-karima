import React from 'react';
import { 
  Search, 
  RefreshCw, 
  CalendarDays, 
  ShieldAlert, 
  User, 
  Filter, 
  Trash2,
  LogIn,
  LogOut,
  BookOpen,
  UserCheck,
  Award,
  Database,
  MessageSquare,
  Shield,
  Clock,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { ActivityLog } from '../types';
import { api } from '../api';

interface ActivityLogsProps {
  logs: ActivityLog[];
  onRefresh: () => void;
}

type SortOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type DatePeriod = 'all' | 'today' | 'week' | 'month';

export default function ActivityLogs({ logs: initialLogs, onRefresh }: ActivityLogsProps) {
  const [internalLogs, setInternalLogs] = React.useState<ActivityLog[]>(initialLogs || []);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('Semua');
  const [actionCategory, setActionCategory] = React.useState<string>('Semua');
  const [datePeriod, setDatePeriod] = React.useState<DatePeriod>('all');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('newest');
  const [clearing, setClearing] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 25;

  // Sync internalLogs when initialLogs prop updates
  React.useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setInternalLogs(initialLogs);
    }
  }, [initialLogs]);

  // Robust date parser for all timestamp formats
  const parseTimestamp = (rawTs: any): Date => {
    if (!rawTs) return new Date();
    if (rawTs instanceof Date) return isNaN(rawTs.getTime()) ? new Date() : rawTs;
    if (typeof rawTs === 'number') {
      return new Date(rawTs > 1e11 ? rawTs : rawTs * 1000);
    }
    const str = String(rawTs).trim();
    if (!isNaN(Number(str)) && str.length > 0) {
      const num = Number(str);
      return new Date(num > 1e11 ? num : num * 1000);
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Fetch logs on demand
  const handleRefreshLogs = async (silent = false) => {
    if (loading) return;
    if (!silent) setLoading(true);
    try {
      let data = await api.getActivityLogs();
      if (!data || data.length === 0) {
        await api.logActivity('Sistem Utama', 'Sistem Akademik MQBA Isy Karima aktif dan siap digunakan.');
        data = await api.getActivityLogs();
      }
      setInternalLogs(data || []);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch once on mount if initialLogs are empty
  React.useEffect(() => {
    if (!initialLogs || initialLogs.length === 0) {
      handleRefreshLogs();
    }
  }, []);

  // Auto-refresh interval (every 20s)
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefreshLogs(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearAll = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh log aktivitas sistem? Tindakan audit ini tidak dapat dibatalkan.')) {
      setClearing(true);
      try {
        await api.clearActivityLogs();
        setInternalLogs([]);
        if (onRefresh) onRefresh();
      } catch (e: any) {
        alert(e.message || 'Gagal menghapus log aktivitas.');
      } finally {
        setClearing(false);
      }
    }
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Waktu', 'Nama Pengguna', 'Peran', 'Aktivitas', 'Detail Aktivitas'];
    const rows = filteredLogs.map(log => {
      const timeStr = formatLogTimeFull(log.timestamp);
      const name = log.userName || (log as any).user_name || 'Pengguna';
      const role = log.userRole || (log as any).user_role || 'Admin';
      const action = log.action || '';
      const details = (log.details || '').replace(/"/g, '""');
      return `"${timeStr}","${name}","${role}","${action}","${details}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Log_Aktivitas_MQBA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Time formatter helpers
  const formatLogTimeFull = (rawTs: any) => {
    const date = parseTimestamp(rawTs);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace('.', ':') + ' WIB';
  };

  const getRelativeTime = (rawTs: any) => {
    const date = parseTimestamp(rawTs);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Baru saja';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Helper to categorize log action
  const getActionType = (action: string = '') => {
    const act = action.toLowerCase();
    if (act.includes('login') || act.includes('masuk')) return 'login';
    if (act.includes('logout') || act.includes('keluar')) return 'logout';
    if (act.includes('rpp') || act.includes('modul') || act.includes('silabus')) return 'rpp';
    if (act.includes('presensi') || act.includes('absen') || act.includes('kehadiran')) return 'attendance';
    if (act.includes('nilai') || act.includes('rapor') || act.includes('grade')) return 'grade';
    if (act.includes('santri') || act.includes('guru') || act.includes('jadwal') || act.includes('kelas') || act.includes('mapel')) return 'master';
    if (act.includes('tanya') || act.includes('evaluasi') || act.includes('pesan') || act.includes('akhlaq')) return 'consultation';
    return 'system';
  };

  const getActionBadge = (action: string = '') => {
    const type = getActionType(action);
    switch (type) {
      case 'login':
        return {
          icon: <LogIn className="w-3.5 h-3.5" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dotColor: 'bg-emerald-500'
        };
      case 'logout':
        return {
          icon: <LogOut className="w-3.5 h-3.5" />,
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotColor: 'bg-slate-400'
        };
      case 'rpp':
        return {
          icon: <BookOpen className="w-3.5 h-3.5" />,
          badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
          dotColor: 'bg-indigo-500'
        };
      case 'attendance':
        return {
          icon: <UserCheck className="w-3.5 h-3.5" />,
          badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dotColor: 'bg-amber-500'
        };
      case 'grade':
        return {
          icon: <Award className="w-3.5 h-3.5" />,
          badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          dotColor: 'bg-purple-500'
        };
      case 'master':
        return {
          icon: <Database className="w-3.5 h-3.5" />,
          badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
          dotColor: 'bg-sky-500'
        };
      case 'consultation':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
          dotColor: 'bg-teal-500'
        };
      default:
        return {
          icon: <Shield className="w-3.5 h-3.5" />,
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dotColor: 'bg-blue-500'
        };
    }
  };

  const getRoleBadge = (role: string = '') => {
    switch (role) {
      case 'Admin':
        return {
          label: 'Admin',
          class: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
        };
      case 'Guru':
        return {
          label: 'Guru',
          class: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60'
        };
      case 'WaliKelas':
        return {
          label: 'Wali Kelas',
          class: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
        };
      case 'WaliSantri':
        return {
          label: 'Wali Santri',
          class: 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60'
        };
      default:
        return {
          label: role || 'Pengguna',
          class: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        };
    }
  };

  // KPI Calculations
  const totalLogsCount = (internalLogs || []).length;
  
  const todayLogsCount = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (internalLogs || []).filter(l => {
      const d = parseTimestamp(l.timestamp).toISOString().split('T')[0];
      return d === todayStr;
    }).length;
  }, [internalLogs]);

  const loginEventsCount = React.useMemo(() => {
    return (internalLogs || []).filter(l => {
      const act = (l.action || '').toLowerCase();
      return act.includes('login') || act.includes('masuk');
    }).length;
  }, [internalLogs]);

  const mostActiveUser = React.useMemo(() => {
    if (!internalLogs || internalLogs.length === 0) return '—';
    const counts: Record<string, number> = {};
    for (const log of internalLogs) {
      const name = log.userName || (log as any).user_name;
      if (name && name !== 'Sistem Utama' && name !== 'Sistem') {
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    const entries = Object.entries(counts);
    if (entries.length === 0) return '—';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${entries[0][1]}x)`;
  }, [internalLogs]);

  // Filtering and Sorting
  const filteredLogs = React.useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = (internalLogs || []).filter(log => {
      if (!log) return false;
      const name = (log.userName || (log as any).user_name || '').toLowerCase();
      const role = log.userRole || (log as any).user_role || '';
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const timeDate = parseTimestamp(log.timestamp);
      const timeIso = timeDate.toISOString();

      // Search Query
      if (q) {
        const matchesQ = name.includes(q) || action.includes(q) || details.includes(q) || role.toLowerCase().includes(q) || timeIso.includes(q);
        if (!matchesQ) return false;
      }

      // Role Filter
      if (roleFilter !== 'Semua' && role !== roleFilter) {
        return false;
      }

      // Action Category Filter
      if (actionCategory !== 'Semua') {
        const type = getActionType(log.action);
        if (actionCategory === 'login' && type !== 'login' && type !== 'logout') return false;
        if (actionCategory === 'rpp' && type !== 'rpp') return false;
        if (actionCategory === 'attendance' && type !== 'attendance') return false;
        if (actionCategory === 'grade' && type !== 'grade') return false;
        if (actionCategory === 'master' && type !== 'master') return false;
        if (actionCategory === 'consultation' && type !== 'consultation') return false;
        if (actionCategory === 'system' && type !== 'system') return false;
      }

      // Date Period Filter
      if (datePeriod === 'today') {
        if (timeIso.split('T')[0] !== todayStr) return false;
      } else if (datePeriod === 'week') {
        if (timeDate < sevenDaysAgo) return false;
      } else if (datePeriod === 'month') {
        if (timeDate < thirtyDaysAgo) return false;
      }

      return true;
    });

    // Sorting by Time / Name
    return filtered.sort((a, b) => {
      const timeA = parseTimestamp(a.timestamp).getTime();
      const timeB = parseTimestamp(b.timestamp).getTime();

      if (sortOrder === 'newest') {
        return timeB - timeA; // Newest first
      } else if (sortOrder === 'oldest') {
        return timeA - timeB; // Oldest first
      } else if (sortOrder === 'name-asc') {
        const nameA = a.userName || (a as any).user_name || '';
        const nameB = b.userName || (b as any).user_name || '';
        return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
      } else if (sortOrder === 'name-desc') {
        const nameA = a.userName || (a as any).user_name || '';
        const nameB = b.userName || (b as any).user_name || '';
        return nameB.localeCompare(nameA, 'id', { sensitivity: 'base' });
      }
      return timeB - timeA;
    });
  }, [internalLogs, searchQuery, roleFilter, actionCategory, datePeriod, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, actionCategory, datePeriod, sortOrder]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-2 border border-sky-100 dark:border-sky-900/50">
            <Shield className="w-3.5 h-3.5" />
            Audit & Keamanan Sistem
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Log Aktivitas & Audit Pengguna
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pantau seluruh riwayat login dan aktivitas semua pengguna di web secara real-time dan terurut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Matikan refresh otomatis' : 'Aktifkan refresh otomatis tiap 20 detik'}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              autoRefresh 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'Live Auto-Refresh: ON' : 'Live Auto: OFF'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => handleRefreshLogs(false)}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyegarkan...' : 'Segarkan'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Clear Logs Button */}
          <button
            onClick={handleClearAll}
            disabled={clearing || totalLogsCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? 'Memproses...' : 'Hapus Log'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Total Log</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalLogsCount}
          </p>
          <span className="text-[11px] text-slate-400">Entri tersimpan di database</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Aktivitas Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {todayLogsCount}
          </p>
          <span className="text-[11px] text-slate-400">Aktivitas 24 jam terakhir</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Riwayat Login</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {loginEventsCount}
          </p>
          <span className="text-[11px] text-slate-400">Akses masuk terdata</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">Paling Aktif</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={mostActiveUser}>
            {mostActiveUser}
          </p>
          <span className="text-[11px] text-slate-400">Pengguna frekuensi tertinggi</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pengguna, peran, aksi, atau rincian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 gap-2">
            <ArrowUpDown className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Urutan</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-4"
            >
              <option value="newest" className="dark:bg-slate-900">Waktu Terbaru (Terbaru → Terlama)</option>
              <option value="oldest" className="dark:bg-slate-900">Waktu Terlama (Terlama → Terbaru)</option>
              <option value="name-asc" className="dark:bg-slate-900">Nama Pengguna (A - Z)</option>
              <option value="name-desc" className="dark:bg-slate-900">Nama Pengguna (Z - A)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center text-slate-400 font-semibold gap-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Role Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Semua" className="dark:bg-slate-900">Semua Peran</option>
              <option value="Admin" className="dark:bg-slate-900">Admin</option>
              <option value="Guru" className="dark:bg-slate-900">Guru</option>
              <option value="WaliKelas" className="dark:bg-slate-900">Wali Kelas</option>
              <option value="WaliSantri" className="dark:bg-slate-900">Wali Santri</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">Aktivitas:</span>
            <select
              value={actionCategory}
              onChange={(e) => setActionCategory(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Semua" className="dark:bg-slate-900">Semua Aktivitas</option>
              <option value="login" className="dark:bg-slate-900">Login & Logout</option>
              <option value="rpp" className="dark:bg-slate-900">RPP & Modul</option>
              <option value="attendance" className="dark:bg-slate-900">Presensi & Kehadiran</option>
              <option value="grade" className="dark:bg-slate-900">Nilai & Rapor</option>
              <option value="master" className="dark:bg-slate-900">Data Master & Santri</option>
              <option value="consultation" className="dark:bg-slate-900">Pesan & Diskusi</option>
              <option value="system" className="dark:bg-slate-900">Sistem</option>
            </select>
          </div>

          {/* Date Period Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">Waktu:</span>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value as DatePeriod)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900">Semua Periode</option>
              <option value="today" className="dark:bg-slate-900">Hari Ini</option>
              <option value="week" className="dark:bg-slate-900">7 Hari Terakhir</option>
              <option value="month" className="dark:bg-slate-900">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Quick Active Filter Badges */}
          {(roleFilter !== 'Semua' || actionCategory !== 'Semua' || datePeriod !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('Semua');
                setActionCategory('Semua');
                setDatePeriod('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 underline cursor-pointer ml-auto"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Log Feed Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Feed Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              Riwayat Aktivitas Terurut
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              {filteredLogs.length} Entri
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Urutan: <strong className="text-slate-700 dark:text-slate-300">
              {sortOrder === 'newest' ? 'Waktu Terbaru (Terbaru → Terlama)' :
               sortOrder === 'oldest' ? 'Waktu Terlama (Terlama → Terbaru)' :
               sortOrder === 'name-asc' ? 'Nama (A-Z)' : 'Nama (Z-A)'}
            </strong>
          </div>
        </div>

        {/* Feed List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => {
              const userName = log.userName || (log as any).user_name || (log.userId === 'system' ? 'Sistem Utama' : 'Ust. Aidil Aqli. S.Ag');
              const userRole = log.userRole || (log as any).user_role || 'Admin';
              const actionBadge = getActionBadge(log.action);
              const roleBadge = getRoleBadge(userRole);
              const relativeTime = getRelativeTime(log.timestamp);
              const fullTime = formatLogTimeFull(log.timestamp);

              return (
                <div 
                  key={log.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition group"
                >
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {/* User Avatar with Role Badge */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        userRole === 'Admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                        userRole === 'WaliKelas' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        userRole === 'WaliSantri' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                        'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}>
                        {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${actionBadge.dotColor}`} />
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {userName}
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${roleBadge.class}`}>
                          {roleBadge.label}
                        </span>

                        {/* Action Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionBadge.badgeClass}`}>
                          {actionBadge.icon}
                          <span>{log.action}</span>
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp details */}
                  <div className="flex flex-row md:flex-col md:items-end justify-between md:justify-center text-slate-400 gap-1 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/40">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-sky-600" />
                      <span>{relativeTime}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {fullTime}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-3 px-4">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {loading ? 'Sedang memuat entri log aktivitas...' : 'Tidak ada entri log yang sesuai.'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {loading 
                  ? 'Harap tunggu sejenak sementara sistem menyelaraskan data audit.' 
                  : 'Coba ubah kata kunci pencarian atau reset filter untuk menampilkan seluruh data log aktivitas.'}
              </p>
              {!loading && (
                <button
                  onClick={() => {
                    setRoleFilter('Semua');
                    setActionCategory('Semua');
                    setDatePeriod('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> dari <strong>{filteredLogs.length}</strong> entri
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer text-xs ${
                      currentPage === pageNum
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
