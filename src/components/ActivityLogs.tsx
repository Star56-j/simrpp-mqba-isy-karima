import React from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  CalendarDays,
  ShieldAlert,
  User,
  Filter
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsProps {
  logs: ActivityLog[];
  onRefresh: () => void;
}

export default function ActivityLogs({ logs, onRefresh }: ActivityLogsProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('Semua');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'Semua' || log.userRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Log Aktivitas Sistem
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Audit keamanan dan pelacakan aktivitas kurikulum pengajar MQBA Isy Karima.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-indigo-600" />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci, nama pengguna, atau deskripsi aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center bg-slate-50 dark:bg-slate-950/25 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-2" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Peran</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer w-full md:w-auto"
          >
            <option value="Semua">Semua Peran</option>
            <option value="Admin">Admin</option>
            <option value="Guru">Guru</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25">
          <span className="text-xs text-slate-400">
            Menampilkan <strong>{filteredLogs.length}</strong> entri log aktivitas.
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition"
              >
                <div className="flex items-start space-x-4 min-w-0">
                  <div className={`p-2 rounded-xl flex-shrink-0
                    ${log.userRole === 'Admin' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/25 dark:text-indigo-400'}
                  `}>
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{log.userName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                        ${log.userRole === 'Admin' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}
                      `}>
                        {log.userRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                      <strong className="text-slate-700 dark:text-slate-300">[{log.action}]</strong> — {log.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono flex-shrink-0 self-end md:self-start">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-300" />
                  <span>
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-sm font-medium">Log aktivitas kosong.</p>
              <p className="text-xs">Tidak ditemukan entri log dengan kata kunci pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
