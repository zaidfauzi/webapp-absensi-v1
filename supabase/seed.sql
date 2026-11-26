-- Seed data (optional)
insert into employees (id, nip, name, gender, phone, email, position, schedule_group, status) values
('e1','19800101','Ahmad Fauzi','L','081200000001','ahmad@sdit.id','Kepala Sekolah','guru','aktif'),
('e2','19810202','Siti Nurhaliza','P','081200000002','siti@sdit.id','Wakil Kepala Sekolah','guru','aktif'),
('e3','19820303','Budi Santoso','L','081200000003','budi@sdit.id','Guru','guru','aktif')
on conflict (id) do nothing;

insert into users (id, username, password_hash, role, employee_id) values
('u1','admin','admin123','admin',null),
('u3','kepsek','kepsek123','kepsek','e1'),
('u6','19820303','pegawai123','pegawai','e3')
on conflict (id) do nothing;