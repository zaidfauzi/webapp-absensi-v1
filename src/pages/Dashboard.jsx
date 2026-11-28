import { useApp } from '../context/AppContext'
import { Card, Badge } from '../components/ui'
import { Users, CheckCircle2, XCircle, Clock, LogOut as Out, Award, TrendingUp } from 'lucide-react'
import { avatarUrl } from '../lib/mockData'

export default function Dashboard() {
  const { employees, attendances, settings } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const todayAtt = attendances.filter((a) => a.date === today)
  const total = employees.length
  const hadir = todayAtt.filter((a) => a.checkIn).length
  const terlambat = todayAtt.filter((a) => a.status === 'terlambat').length
  const izinSakit = todayAtt.filter((a) => ['izin','sakit'].includes(a.status)).length
  const alpha = total - hadir - izinSakit
  const pulangCepat = todayAtt.filter((a) => (a.earlyLeaveMinutes || 0) > 0).length
  const pct = total ? Math.round((hadir / total) * 100) : 0

  const lateList = todayAtt.filter((a) => a.status === 'terlambat').map((a) => ({
    att: a, emp: employees.find((e) => e.id === a.employeeId)
  }))
  const earlyList = todayAtt.filter((a) => (a.earlyLeaveMinutes || 0) > 0).map((a) => ({
    att: a, emp: employees.find((e) => e.id === a.employeeId)
  }))
  const absentList = employees.filter((e) => !todayAtt.find((a) => a.employeeId === e.id && a.checkIn)).map((e) => ({ emp: e }))

  // employee of the month: most disciplined (no late, present all, earliest avg checkin)
  const score = employees.map((e) => {
    const atts = attendances.filter((a) => a.employeeId === e.id)
    const late = atts.reduce((s, a) => s + (a.lateMinutes || 0), 0)
    const present = atts.filter((a) => a.checkIn).length
    return { e, late, present, score: present * 10 - late }
  }).sort((a, b) => b.score - a.score)
  const eom = score[0]

  const kpis = [
    { label: 'Total Pegawai', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Sudah Absen', value: `${hadir} (${pct}%)`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },

    { label: 'Terlambat', value: terlambat, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    { label: 'Pulang Cepat', value: pulangCepat, icon: Out, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Monitoring</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {settings.schoolName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${k.bg}`}><k.icon className={k.color} size={20} /></div>
              <div className="min-w-0">
                <div className="text-xs text-[var(--color-muted-foreground)] truncate">{k.label}</div>
                <div className="text-lg font-bold truncate">{k.value}</div>
                {k.sub && <div className="text-[10px] text-[var(--color-muted-foreground)]">{k.sub}</div>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Diagram Absensi Hari Ini</h3>
        <div className="flex items-end gap-3 h-40">
          {[
            { label: 'Hadir', value: hadir, color: 'bg-emerald-500' },
            { label: 'Terlambat', value: terlambat, color: 'bg-amber-500' },
            { label: 'Izin/Sakit', value: izinSakit, color: 'bg-blue-500' },
            { label: 'Alpha', value: alpha, color: 'bg-red-500' },
            { label: 'Pulang Cepat', value: pulangCepat, color: 'bg-purple-500' },
          ].map((d) => {
            const max = Math.max(hadir, terlambat, izinSakit, alpha, pulangCepat, 1)
            const h = Math.round((d.value / max) * 100)
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-medium">{d.value}</div>
                <div className="w-full bg-[var(--color-muted)] rounded-t-lg overflow-hidden" style={{ height: '100%' }}>
                  <div className={`${d.color} w-full rounded-t-lg transition-all`} style={{ height: `${h}%`, marginTop: `${100 - h}%` }} />
                </div>
                <div className="text-[10px] text-[var(--color-muted-foreground)] text-center">{d.label}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock size={16} className="text-amber-600" /> Pegawai Terlambat</h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {lateList.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">Tidak ada</p>}
            {lateList.map(({ att, emp }) => (
              <div key={att.id} className="flex items-center gap-3">
                <img src={avatarUrl(emp?.name)} className="h-9 w-9 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{emp?.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">{emp?.position} · masuk {new Date(att.checkIn).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <Badge variant="warning">+{att.lateMinutes} mnt</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><XCircle size={16} className="text-red-600" /> Tidak Hadir</h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {absentList.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">Semua hadir</p>}
            {absentList.map(({ emp }) => (
              <div key={emp.id} className="flex items-center gap-3">
                <img src={avatarUrl(emp?.name)} className="h-9 w-9 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{emp?.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">{emp?.position}</div>
                </div>
                <Badge variant="destructive">Alpha</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
        <div className="flex items-center gap-4">
          <Award className="text-amber-500" size={32} />
          <div>
            <div className="text-xs text-[var(--color-muted-foreground)]">Apresiasi Pegawai Teladan</div>
            <div className="text-lg font-bold">{eom?.e?.name}</div>
            <div className="text-sm text-[var(--color-muted-foreground)]">{eom?.e?.position} · Kehadiran konsisten, 0 menit terlambat</div>
          </div>
          <img src={avatarUrl(eom?.e?.name)} className="h-12 w-12 rounded-full ml-auto" />
        </div>
      </Card>
    </div>
  )
}