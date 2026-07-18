import React from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Santri, RaporDetail, KepribadianItem, KetahfizhanItem, EkstrakurikulerItem } from '../types';
import { api } from '../api';

interface RaporModalProps {
  santri: Santri;
  academicYearId: string;
  semesterId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function RaporModal({ santri, academicYearId, semesterId, onClose, onSave }: RaporModalProps) {
  const [rapor, setRapor] = React.useState<RaporDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Form states
  const [kepribadian, setKepribadian] = React.useState<KepribadianItem[]>([]);
  const [ketahfizhan, setKetahfizhan] = React.useState<KetahfizhanItem[]>([]);
  const [ekstrakurikuler, setEkstrakurikuler] = React.useState<EkstrakurikulerItem[]>([]);
  const [ketidakhadiran, setKetidakhadiran] = React.useState({ sakit: 0, izin: 0, tanpaKeterangan: 0 });
  const [catatanWaliKelas, setCatatanWaliKelas] = React.useState('');
  const [keputusanKenaikan, setKeputusanKenaikan] = React.useState('');

  React.useEffect(() => {
    api.getRaporDetail({ santriId: santri.id, academicYearId, semesterId }).then(res => {
      if (res.length > 0) {
        const data = res[0];
        setRapor(data);
        setKepribadian(data.kepribadian || []);
        setKetahfizhan(data.ketahfizhan || []);
        setEkstrakurikuler(data.ekstrakurikuler || []);
        setKetidakhadiran(data.ketidakhadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 });
        setCatatanWaliKelas(data.catatanWaliKelas || '');
        setKeputusanKenaikan(data.keputusanKenaikan || '');
      } else {
        // Init default empty values if not exists
        setKepribadian([
          { aspek: 'Kelakuan', predikat: '', deskripsi: '' },
          { aspek: 'Kerajinan', predikat: '', deskripsi: '' },
          { aspek: 'Kerapian', predikat: '', deskripsi: '' }
        ]);
        setKetahfizhan([
          { capaian: 'Hafalan Baru (Ziyadah)', penilaian: '' },
          { capaian: 'Pengulangan (Murojaah)', penilaian: '' }
        ]);
        setEkstrakurikuler([
          { namaKegiatan: 'Pramuka', nilai: '', keterangan: '' }
        ]);
      }
      setLoading(false);
    }).catch(err => {
      setError('Gagal memuat data rapor');
      setLoading(false);
    });
  }, [santri.id, academicYearId, semesterId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    const data = {
      santriId: santri.id,
      academicYearId,
      semesterId,
      kepribadian,
      ketahfizhan,
      ekstrakurikuler,
      ketidakhadiran,
      catatanWaliKelas,
      keputusanKenaikan
    };

    try {
      if (rapor) {
        await api.updateRaporDetail(rapor.id, data);
      } else {
        await api.createRaporDetail(data);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan detail rapor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Rapor Santri</h2>
            <p className="text-sm text-slate-500">{santri.name} (NIS: {santri.nis})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-xl">{error}</div>
          )}

          {/* Kepribadian */}
          <section>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2">A. KEPRIBADIAN</h3>
            <div className="space-y-3">
              {kepribadian.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" value={item.aspek} onChange={e => {
                    const newArr = [...kepribadian]; newArr[idx].aspek = e.target.value; setKepribadian(newArr);
                  }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Aspek" />
                  <input type="text" value={item.predikat} onChange={e => {
                    const newArr = [...kepribadian]; newArr[idx].predikat = e.target.value; setKepribadian(newArr);
                  }} className="w-24 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Predikat" />
                  <input type="text" value={item.deskripsi} onChange={e => {
                    const newArr = [...kepribadian]; newArr[idx].deskripsi = e.target.value; setKepribadian(newArr);
                  }} className="flex-[2] px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Deskripsi" />
                </div>
              ))}
              <button onClick={() => setKepribadian([...kepribadian, { aspek: '', predikat: '', deskripsi: '' }])} className="text-xs text-indigo-600 font-semibold flex items-center">
                <Plus className="w-3 h-3 mr-1"/> Tambah Aspek
              </button>
            </div>
          </section>

          {/* Ketahfizhan */}
          <section>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2">C. KETAHFIZHAN</h3>
            <div className="space-y-3">
              {ketahfizhan.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" value={item.capaian} onChange={e => {
                    const newArr = [...ketahfizhan]; newArr[idx].capaian = e.target.value; setKetahfizhan(newArr);
                  }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Capaian (Ziyadah/Murojaah)" />
                  <input type="text" value={item.penilaian} onChange={e => {
                    const newArr = [...ketahfizhan]; newArr[idx].penilaian = e.target.value; setKetahfizhan(newArr);
                  }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Penilaian (Mampu/Kurang)" />
                </div>
              ))}
              <button onClick={() => setKetahfizhan([...ketahfizhan, { capaian: '', penilaian: '' }])} className="text-xs text-indigo-600 font-semibold flex items-center">
                <Plus className="w-3 h-3 mr-1"/> Tambah Baris
              </button>
            </div>
          </section>

          {/* Ekstrakurikuler */}
          <section>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2">D. EKSTRAKURIKULER</h3>
            <div className="space-y-3">
              {ekstrakurikuler.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" value={item.namaKegiatan} onChange={e => {
                    const newArr = [...ekstrakurikuler]; newArr[idx].namaKegiatan = e.target.value; setEkstrakurikuler(newArr);
                  }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Nama Kegiatan" />
                  <input type="text" value={item.nilai} onChange={e => {
                    const newArr = [...ekstrakurikuler]; newArr[idx].nilai = e.target.value; setEkstrakurikuler(newArr);
                  }} className="w-24 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Nilai (A/B)" />
                  <input type="text" value={item.keterangan} onChange={e => {
                    const newArr = [...ekstrakurikuler]; newArr[idx].keterangan = e.target.value; setEkstrakurikuler(newArr);
                  }} className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Keterangan" />
                  <button onClick={() => {
                    const newArr = [...ekstrakurikuler]; newArr.splice(idx, 1); setEkstrakurikuler(newArr);
                  }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
              <button onClick={() => setEkstrakurikuler([...ekstrakurikuler, { namaKegiatan: '', nilai: '', keterangan: '' }])} className="text-xs text-indigo-600 font-semibold flex items-center">
                <Plus className="w-3 h-3 mr-1"/> Tambah Kegiatan
              </button>
            </div>
          </section>

          {/* Ketidakhadiran */}
          <section>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2">E. KETIDAKHADIRAN</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sakit (Hari)</label>
                <input type="number" min="0" value={ketidakhadiran.sakit} onChange={e => setKetidakhadiran({...ketidakhadiran, sakit: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Izin (Hari)</label>
                <input type="number" min="0" value={ketidakhadiran.izin} onChange={e => setKetidakhadiran({...ketidakhadiran, izin: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tanpa Keterangan (Hari)</label>
                <input type="number" min="0" value={ketidakhadiran.tanpaKeterangan} onChange={e => setKetidakhadiran({...ketidakhadiran, tanpaKeterangan: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
            </div>
          </section>

          {/* Catatan & Keputusan */}
          <section>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 border-b pb-2">F & G. CATATAN WALI KELAS & KEPUTUSAN</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Catatan Wali Kelas</label>
                <textarea rows={3} value={catatanWaliKelas} onChange={e => setCatatanWaliKelas(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Tuliskan catatan apresiasi / motivasi untuk santri"></textarea>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Keterangan Kenaikan Kelas (Jika semester Genap)</label>
                <input type="text" value={keputusanKenaikan} onChange={e => setKeputusanKenaikan(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm" placeholder="Contoh: NAIK/TIDAK NAIK ke kelas VIII" />
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition">Batal</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center">
            {saving ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2"/> Simpan Detail</>}
          </button>
        </div>
      </div>
    </div>
  );
}
