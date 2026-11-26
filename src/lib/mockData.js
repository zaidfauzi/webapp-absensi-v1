export const ROLES = {
  admin: 'Administrator',
  yayasan: 'Yayasan',
  kepsek: 'Kepala Sekolah',
  wakasek: 'Wakil Kepala Sekolah',
  tu: 'Tata Usaha',
  pegawai: 'Pegawai',
}

export const POSITIONS = ['Guru', 'Staff TU', 'Office Boy', 'Teknisi', 'Gardener', 'Security', 'Wakil Kepala Sekolah', 'Kepala Sekolah']

export const defaultSettings = {
  schoolName: 'SDIT Al-Falah',
  foundationName: 'Yayasan Al-Falah',
  slogan: 'Mencetak Generasi Rabbani & Berprestasi',
  address: 'Jl. Pendidikan No. 1, Kota Bandung, Jawa Barat 40123',
  phone: '(022) 1234567',
  email: 'info@sditalfalah.sch.id',
  website: 'www.sditalfalah.sch.id',
  logoUrl: '',
  themeDefault: 'light',
  allowUserTheme: true,
  lat: -6.9175,
  lng: 107.6191,
  radius: 100,
  toleranceMinutes: 5,
  faceVerification: true,
  antiFakeGps: true,
}

export const seedEmployees = [
  { id: 'e1', nip: '19800101', name: 'Ahmad Fauzi', gender: 'L', phone: '081200000001', email: 'ahmad@sdit.id', position: 'Kepala Sekolah', scheduleGroup: 'guru', status: 'aktif' },
  { id: 'e2', nip: '19810202', name: 'Siti Nurhaliza', gender: 'P', phone: '081200000002', email: 'siti@sdit.id', position: 'Wakil Kepala Sekolah', scheduleGroup: 'guru', status: 'aktif' },
  { id: 'e3', nip: '19820303', name: 'Budi Santoso', gender: 'L', phone: '081200000003', email: 'budi@sdit.id', position: 'Guru', scheduleGroup: 'guru', status: 'aktif' },
  { id: 'e4', nip: '19830404', name: 'Dewi Lestari', gender: 'P', phone: '081200000004', email: 'dewi@sdit.id', position: 'Guru', scheduleGroup: 'guru', status: 'aktif' },
  { id: 'e5', nip: '19840505', name: 'Rudi Hartono', gender: 'L', phone: '081200000005', email: 'rudi@sdit.id', position: 'Staff TU', scheduleGroup: 'guru', status: 'aktif' },
  { id: 'e6', nip: '19850606', name: 'Agus Prasetyo', gender: 'L', phone: '081200000006', email: 'agus@sdit.id', position: 'Office Boy', scheduleGroup: 'ob', status: 'aktif' },
  { id: 'e7', nip: '19860707', name: 'Yanto', gender: 'L', phone: '081200000007', email: 'yanto@sdit.id', position: 'Teknisi', scheduleGroup: 'teknisi', status: 'aktif' },
  { id: 'e8', nip: '19870808', name: 'Joko Susilo', gender: 'L', phone: '081200000008', email: 'joko@sdit.id', position: 'Gardener', scheduleGroup: 'gardener', status: 'aktif' },
  { id: 'e9', nip: '19880909', name: 'Hendra Wijaya', gender: 'L', phone: '081200000009', email: 'hendra@sdit.id', position: 'Security', scheduleGroup: 'security', status: 'aktif' },
  { id: 'e10', nip: '19891010', name: 'Rina Marlina', gender: 'P', phone: '081200000010', email: 'rina@sdit.id', position: 'Guru', scheduleGroup: 'guru', status: 'aktif' },
]

export const seedUsers = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', employeeId: null },
  { id: 'u2', username: 'yayasan', password: 'yayasan123', role: 'yayasan', employeeId: null },
  { id: 'u3', username: 'kepsek', password: 'kepsek123', role: 'kepsek', employeeId: 'e1' },
  { id: 'u4', username: 'wakasek', password: 'wakasek123', role: 'wakasek', employeeId: 'e2' },
  { id: 'u5', username: 'tu', password: 'tu123', role: 'tu', employeeId: 'e5' },
  { id: 'u6', username: '19820303', password: 'pegawai123', role: 'pegawai', employeeId: 'e3' },
  { id: 'u7', username: '19830404', password: 'pegawai123', role: 'pegawai', employeeId: 'e4' },
  { id: 'u8', username: '19850606', password: 'pegawai123', role: 'pegawai', employeeId: 'e6' },
  { id: 'u9', username: '19860707', password: 'pegawai123', role: 'pegawai', employeeId: 'e7' },
  { id: 'u10', username: '19880909', password: 'pegawai123', role: 'pegawai', employeeId: 'e9' },
]

export function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&bold=true`
}

// seed attendances for today
export function seedAttendances() {
  const today = new Date().toISOString().slice(0, 10)
  const rows = []
  const times = {
    e1: ['06:50', '15:05'],
    e2: ['06:52', '15:00'],
    e3: ['07:05', '14:55'],
    e4: ['06:58', '15:10'],
    e5: ['07:00', '15:00'],
    e6: ['06:05', '16:00'],
    e7: ['06:00', '16:00'],
    e8: ['06:10', '16:05'],
    e9: ['05:50', '17:00'],
    e10: ['07:15', '14:50'],
  }
  for (const e of seedEmployees) {
    const t = times[e.id]
    if (!t) continue
    const masuk = new Date(`${today}T${t[0]}:00`)
    const pulang = new Date(`${today}T${t[1]}:00`)
    const late = t[0] > '06:55' ? (new Date(`${today}T${t[0]}:00`) - new Date(`${today}T06:55:00`)) / 60000 : 0
    rows.push({
      id: `a-${e.id}`,
      employeeId: e.id,
      date: today,
      checkIn: masuk.toISOString(),
      checkOut: pulang.toISOString(),
      status: late > 0 ? 'terlambat' : 'hadir',
      lateMinutes: Math.max(0, Math.round(late)),
      earlyLeaveMinutes: 0,
      distance: 45,
      photoIn: null,
      photoOut: null,
    })
  }
  return rows
}

export const seedLeaveRequests = [
  { id: 'lr1', employeeId: 'e3', category: 'pribadi', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), reason: 'Keperluan keluarga', evidenceUrl: '', status: 'pending', approvedBy: null, note: '' },
]