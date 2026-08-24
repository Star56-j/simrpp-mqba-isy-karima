import React from 'react';
import { FileSpreadsheet, Printer, Download, MessageCircle } from 'lucide-react';

interface ExportBarProps {
  onExportExcel: () => void;
  onPrint: () => void;
  onDownloadPDF?: () => void;
  onWhatsApp: () => void;
  itemName?: string; // Optional, e.g., 'Data RPP'
}

export default function ExportBar({ onExportExcel, onPrint, onDownloadPDF, onWhatsApp, itemName = 'Data' }: ExportBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button
        onClick={onExportExcel}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        title={`Ekspor ${itemName} ke Excel`}
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Excel
      </button>

      <button
        onClick={onPrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        title={`Print Cetak Fisik ${itemName}`}
      >
        <Printer className="w-3.5 h-3.5" />
        Print
      </button>

      {onDownloadPDF && (
        <button
          onClick={onDownloadPDF}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          title={`Download File PDF ${itemName}`}
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      )}

      <button
        onClick={onWhatsApp}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors border border-green-200 dark:border-green-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        title={`Bagikan Laporan ${itemName} ke WhatsApp`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        WhatsApp
      </button>
    </div>
  );
}
