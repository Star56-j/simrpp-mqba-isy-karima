import React from 'react';
import { 
  KeyRound, 
  Check, 
  X, 
  Trash2, 
  Clock, 
  User, 
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { PasswordResetRequest } from '../types';
import { api } from '../api';

export default function ResetRequests() {
  const [requests, setRequests] = React.useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [filter, setFilter] = React.useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getResetRequests();
      setRequests(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat daftar permintaan reset sandi.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menyetujui permintaan reset sandi untuk "${name}"?\nSandi pengajar tersebut akan direset ke sandi default "guru123".`)) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.approveResetRequest(id);
      setSuccessMessage(res.message);
      fetchRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyetujui permintaan.');
      setLoading(false);
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menolak permintaan reset sandi untuk "${name}"?`)) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.rejectResetRequest(id);
      setSuccessMessage(res.message);
      fetchRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menolak permintaan.');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus riwayat permintaan reset sandi untuk "${name}"?`)) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.deleteResetRequest(id);
      setSuccessMessage(res.message);
      fetchRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus riwayat.');
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Menunggu
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Permintaan Reset Kata Sandi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola pengajuan reset sandi dari Ustadz/Ustadzah yang lupa kata sandinya.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/30 dark:bg-rose-950/20 p-4 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="leading-relaxed font-semibold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/30 dark:bg-emerald-950/20 p-4 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="leading-relaxed font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-950/80 p-1 border border-slate-200/30 dark:border-slate-800/40">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  filter === tab 
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-white shadow-md' 
                    : 'text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab === 'All' ? 'Semua' : tab === 'Pending' ? 'Menunggu' : tab === 'Approved' ? 'Disetujui' : 'Ditolak'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengajar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/10">
                <th className="p-4 w-12 text-center">No</th>
                <th className="p-4">Nama Pengajar</th>
                <th className="p-4">Email / Username</th>
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 w-40 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, index) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                          {req.userName.replace(/Ust\.\s*|Usth\.\s*/g, '').charAt(0)}
                        </div>
                        <span>{req.userName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium font-mono text-xs">
                      {req.userEmail}
                    </td>
                    <td className="p-4 text-slate-550 dark:text-slate-400 font-medium text-xs">
                      {new Date(req.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(req.status)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {req.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(req.id, req.userName)}
                              disabled={loading}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 transition cursor-pointer"
                              title="Setujui & Reset Sandi"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(req.id, req.userName)}
                              disabled={loading}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition cursor-pointer"
                              title="Tolak Permintaan"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelete(req.id, req.userName)}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Hapus Riwayat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ditemukan permohonan reset sandi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card List */}
          <div className="block sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req, index) => (
                <div key={req.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {req.userName.replace(/Ust\.\s*|Usth\.\s*/g, '').charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{req.userName}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{req.userEmail}</p>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    📅 Diajukan: {new Date(req.createdAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50 dark:border-slate-800/80">
                    {req.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req.id, req.userName)}
                          disabled={loading}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.userName)}
                          disabled={loading}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(req.id, req.userName)}
                        disabled={loading}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Log</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ditemukan permohonan reset sandi yang cocok.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
