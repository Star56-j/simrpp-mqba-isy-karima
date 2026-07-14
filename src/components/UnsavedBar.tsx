import React from 'react';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface UnsavedBarProps {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  label?: string;
}

export default function UnsavedBar({ isDirty, onSave, onDiscard, saving = false, label = 'Simpan Perubahan' }: UnsavedBarProps) {
  if (!isDirty) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center space-x-3 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50">
        <div className="flex items-center space-x-2 text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-bold">Ada perubahan yang belum disimpan</span>
        </div>
        <div className="w-px h-5 bg-slate-600" />
        <button
          onClick={onDiscard}
          disabled={saving}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition text-xs font-semibold text-slate-300 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Batalkan</span>
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-xs font-extrabold uppercase tracking-wide disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Menyimpan...' : label}</span>
        </button>
      </div>
    </div>
  );
}
