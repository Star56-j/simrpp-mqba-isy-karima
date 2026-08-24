---
name: simrpp-academic-auditor
description: >-
  Skill khusus untuk audit menyeluruh, penyelesaian error & bug, serta penegakan integritas data pada sistem SIM RPP & Akademik MQBA Isy Karima.
---

# SIM RPP & Akademik MQBA Isy Karima — AI Bug Auditor & Resolver

Skill ini ditanam untuk memvalidasi dan menyelesaikan seluruh bug, anomali data, serta memastikan konsistensi sistemik pada aplikasi SIM RPP MQBA Isy Karima.

---

## 1. Aturan Integritas Database & ID Generation
- **Aturan Wajib**: Selalu gunakan `crypto.randomUUID()` ketimbang `Date.now()` untuk men-generate ID database, terutama jika digunakan di dalam perulangan (`bulk insert` / `looping`), guna menghindari error `UNIQUE constraint failed` akibat waktu eksekusi yang bersamaan dalam hitungan milidetik.
- **Foreign Keys**: Pastikan relasi `teacher_id`, `class_id`, `subject_id`, `academic_year_id`, dan `semester_id` selalu terisi dengan ID valid dan tidak pernah tersimpan sebagai string `'pengajar'`, `undefined`, atau string kosong `""`.

---

## 2. Resolusi Guru & Mata Pelajaran (Teaching Schedules)
- **Multi-Kelas per Mapel**: Jika seorang ustadz mengampu mapel yang sama di lebih dari 1 kelas (misal: Bahasa Indonesia di Kelas 1 dan Kelas 2), sistem harus menggabungkan visualisasinya secara rapi dalam format `Bahasa Indonesia (Kelas 1, Kelas 2)` tanpa memecah ustadz menjadi baris terpisah atau membagi hitungan kehadiran.
- **Default View**: Rekap kehadiran default menggunakan mode **"Gabungan Per-Guru"** (1 baris per ustadz dengan total jam/hari masuk) dan menyediakan opsi toggle **"Rincian Per-Mapel"** untuk rincian detail.

---

## 3. Sinkronisasi Antar-Media Ekspor (Web, Print, PDF, Excel)
Setiap perubahan pada tabel data/rekapitulasi harus selalu mencakup 4 representasi:
1. **Web Table UI**: Rendering responsive dengan interaktivitas dan styling Tailwind/CSS.
2. **HTML Print Dialog (`printRekapKehadiran.ts` / `printUtils.ts`)**: Layout cetak resmi kop surat MQBA Isy Karima dengan kolom yang simetris.
3. **PDF Downloader (`pdfDownloader.ts`)**: AutoTable jsPDF dengan ukuran kolom proporsional pada kertas A4 landscape/portrait.
4. **Excel Downloader (`exportExcel.ts`)**: File SheetJS (`.xlsx`) dengan merge header berjenjang dan formula persentase yang akurat.

---

## 4. Validasi Form & Fitur Edit
- Dropdown `Guru / Pengajar` dan `Mata Pelajaran` pada modal edit tidak boleh dalam kondisi `disabled` jika admin/ustadz perlu mengoreksi pemilik catatan absensi.
- Modal edit rekap harus mendukung pengeditan langsung angka realisasi `Hadir`, `Izin`, `Sakit`, dan `Alpha` dengan re-kalkulasi otomatis `% Hadir` dan sinkronisasi ke database.

---

## 5. Prosedur Audit & Build Verification
Sebelum menyatakan pekerjaan selesai:
1. Jalankan `npm run build` dan pastikan hasil kompilasi **0 errors** (`Exit Code: 0`).
2. Jalankan deployment produksi `npx wrangler pages deploy dist --project-name akademikmqbaisykarima`.
3. Verifikasi ketiadaan unhandled promise rejections pada worker functions (`functions/api/[[route]].ts`).
