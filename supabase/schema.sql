-- Schema for SDIT Absensi & Monitoring Kedisiplinan
-- Run in Supabase SQL Editor

create table if not exists system_settings (
  id int primary key default 1,
  school_name text,
  foundation_name text,
  slogan text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  theme_default text default 'light',
  allow_user_theme boolean default true,
  lat double precision,
  lng double precision,
  radius int default 100,
  tolerance_minutes int default 5,
  face_verification boolean default true,
  anti_fake_gps boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists employees (
  id text primary key,
  nip text unique,
  name text not null,
  gender text,
  phone text,
  email text,
  position text,
  schedule_group text,
  status text default 'aktif',
  photo_url text,
  face_descriptor jsonb,
  created_at timestamptz default now()
);

create table if not exists users (
  id text primary key,
  username text unique not null,
  password_hash text not null,
  role text not null,
  employee_id text references employees(id),
  device_fingerprint text,
  created_at timestamptz default now()
);

create table if not exists attendances (
  id text primary key,
  employee_id text references employees(id),
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text,
  late_minutes int default 0,
  early_leave_minutes int default 0,
  distance int,
  lat double precision,
  lng double precision,
  photo_in text,
  photo_out text,
  created_at timestamptz default now(),
  unique(employee_id, date)
);

create table if not exists leave_requests (
  id text primary key,
  employee_id text references employees(id),
  category text,
  start_time timestamptz,
  end_time timestamptz,
  reason text,
  evidence_url text,
  status text default 'pending',
  approved_by text,
  note text,
  created_at timestamptz default now()
);

-- RLS
alter table system_settings enable row level security;
alter table employees enable row level security;
alter table users enable row level security;
alter table attendances enable row level security;
alter table leave_requests enable row level security;

-- Basic policies (permissive for demo; tighten in production)
create policy "public read settings" on system_settings for select using (true);
create policy "public all employees" on employees for all using (true) with check (true);
create policy "public all users" on users for all using (true) with check (true);
create policy "public all attendances" on attendances for all using (true) with check (true);
create policy "public all leave" on leave_requests for all using (true) with check (true);
create policy "public update settings" on system_settings for all using (true) with check (true);

-- seed settings row
insert into system_settings (id) values (1) on conflict (id) do nothing;