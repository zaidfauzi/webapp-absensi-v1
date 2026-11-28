-- Bersihkan data demo, pertahankan akses Administrator
-- Jalankan di Supabase SQL Editor setelah deploy (opsional)

-- Hapus data transaksi
truncate table public.attendances restart identity cascade;
truncate table public.leave_requests restart identity cascade;

-- Hapus pegawai demo (semua), pertahankan tabel kosong
truncate table public.employees restart identity cascade;

-- Hapus user demo kecuali administrator
delete from public.users where role <> 'admin';

-- Pastikan minimal 1 akun admin ada (jika belum)
insert into public.users (id, username, password_hash, role, employee_id)
select 'u-admin', 'admin', 'admin123', 'admin', null
where not exists (select 1 from public.users where role = 'admin');

-- Reset settings ke default (opsional)
update public.system_settings set
  school_name = 'SDIT Al-Falah',
  foundation_name = 'Yayasan Al-Falah',
  slogan = 'Mencetak Generasi Rabbani & Berprestasi',
  address = 'Jl. Pendidikan No. 1, Kota Bandung, Jawa Barat 40123',
  phone = '(022) 1234567',
  email = 'info@sditalfalah.sch.id',
  website = 'www.sditalfalah.sch.id',
  logo_url = null,
  lat = -6.9175,
  lng = 107.6191,
  radius = 100,
  tolerance_minutes = 5
where id = 1;