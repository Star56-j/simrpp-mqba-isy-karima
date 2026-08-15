import { Nilai } from '../types';

/**
 * Rumus Bobot Rapor Resmi:
 * - 30% Akhlaq
 * - 10% Absensi
 * - 10% Ujian Harian / Bulanan / Mid Semester (Rata-rata UH, Bulanan, UTS)
 * - 60% Ujian Semester Tulis (UAS)
 *
 * Ujian Lisan dipisahkan sendiri di kolom tersendiri (karena tidak semua mapel ada ujian lisannya).
 */
export interface RaporWeightedResult {
  midAvg: number;           // Rata-rata UH/Bulanan/Mid (UTS)
  uasTulis: number;         // Ujian Semester Tulis (UAS)
  uasLisan: number | null;  // Ujian Lisan (Terpisah)
  nilaiAkhirTulis: number;  // Hasil perhitungan bobot 30% Akhlaq + 10% Absensi + 10% Mid + 60% UAS Tulis
}

export function computeRaporScore(
  n: Nilai,
  akhlakScore: number = 90,
  attendanceScore: number = 100
): RaporWeightedResult {
  // 1. Hitung Rata-rata Ujian Harian, Bulanan, dan UTS (Mid)
  const harianMidArr = [n.harian, n.bulanan, n.uts].filter(v => typeof v === 'number' && v > 0);
  const midAvg = harianMidArr.length > 0 
    ? Math.round(harianMidArr.reduce((a, b) => a + b, 0) / harianMidArr.length) 
    : (n.harian || n.uts || 0);

  // 2. Ujian Semester Tulis (UAS)
  const uasTulis = n.uas || 0;

  // 3. Ujian Lisan (Dipisahkan sendiri)
  const uasLisan = (typeof n.uasLisan === 'number' && n.uasLisan > 0) ? n.uasLisan : null;

  // 4. Hitung Bobot Terimbang (Nilai Akhir Rapor)
  // 30% Akhlaq + 10% Absensi + 10% Mid/Harian + 60% Ujian Semester Tulis
  const nilaiAkhirTulis = Math.round(
    (akhlakScore * 0.30) + 
    (attendanceScore * 0.10) + 
    (midAvg * 0.10) + 
    (uasTulis * 0.60)
  );

  return {
    midAvg,
    uasTulis,
    uasLisan,
    nilaiAkhirTulis: nilaiAkhirTulis > 0 ? nilaiAkhirTulis : (n.uas || midAvg || 0)
  };
}
