# SDIT Absensi & Monitoring Kedisiplinan

Web app absensi & monitoring kedisiplinan pegawai SDIT. React + Vite + Tailwind CSS, database Supabase.

## Fitur
- Login multi-role (RBAC), tema terang/gelap, PWA install
- Dashboard monitoring real-time, KPI, daftar terlambat/pulang cepat/tidak hadir, pegawai teladan
- Absensi rekam wajah + geofencing (Haversine) + anti-fake GPS + watermark foto
- CRUD data pegawai
- Jadwal & shift dinamis (rotasi OB 2-1, Teknisi/Gardener 1-1, security overnight)
- Pengajuan izin multi-level approval
- Laporan Excel/CSV/PDF dengan kop surat
- Pengaturan sistem white-label & koordinat sekolah

## Menjalankan
```bash
npm install
cp .env.example .env   # isi jika menggunakan Supabase
npm run dev
```
Tanpa Supabase, aplikasi berjalan dalam mode demo (data lokal).

## Supabase
1. Buat project di Supabase.
2. Jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di SQL Editor.
3. Isi `.env` dengan URL & anon key.
4. Aktifkan RLS sesuai kebutuhan produksi.

## Akun Demo
- admin / admin123
- kepsek / kepsek123
- tu / tu123
- 19820303 / pegawai123