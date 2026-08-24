import { Nilai } from '../types';

/**
 * Rumus Bobot Rapor Resmi (Total 100%):
 * - 20% Akhlaq Keseharian
 * - 10% Absensi / Kehadiran
 * - 10% Ujian Harian / Bulanan / Mid Semester (Rata-rata UH, Bulanan, UTS)
 * - 60% Ujian Semester Tulis (UAS)
 *
 * Ujian Lisan dipisahkan sendiri di kolom tersendiri (karena tidak semua mapel ada ujian lisannya).
 */
export interface RaporWeightedResult {
  midAvg: number;           // Rata-rata UH/Bulanan/Mid (UTS)
  uasTulis: number;         // Ujian Semester Tulis (UAS)
  uasLisan: number | null;  // Ujian Lisan (Terpisah)
  nilaiAkhirTulis: number;  // Hasil perhitungan bobot 20% Akhlaq + 10% Absensi + 10% Mid + 60% UAS Tulis
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
  // 20% Akhlaq + 10% Absensi + 10% Mid/Harian + 60% Ujian Semester Tulis (Total 100%)
  const nilaiAkhirTulis = Math.round(
    (akhlakScore * 0.20) + 
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

export function getPredikat(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function getPredikatLabel(score: number): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perbaikan' {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 80) return 'Baik';
  if (score >= 70) return 'Cukup';
  return 'Perlu Perbaikan';
}

export function generateCapaianDescription(subjectName: string, score: number, uasLisanScore?: number | null): string {
  let desc = '';
  if (score >= 90) {
    desc = `Menunjukkan penguasaan materi ${subjectName} yang sangat baik dan melampaui capaian pembelajaran.`;
  } else if (score >= 80) {
    desc = `Menunjukkan penguasaan materi ${subjectName} yang baik dan memenuhi capaian pembelajaran.`;
  } else if (score >= 70) {
    desc = `Cukup menguasai materi ${subjectName}, perlu meningkatkan latihan mandiri.`;
  } else {
    desc = `Perlu bimbingan dan perhatian lebih lanjut dalam menguasai materi dasar ${subjectName}.`;
  }

  if (typeof uasLisanScore === 'number' && uasLisanScore > 0) {
    desc += ` Ujian lisan teruji dengan predikat ${getPredikatLabel(uasLisanScore)}.`;
  }

  return desc;
}
