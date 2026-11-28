import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Badge, Label, Input, Button } from '../components/ui'
import { toast } from 'sonner'
import { Users, CheckCircle2, XCircle, Clock, LogOut as Out, Award, TrendingUp } from 'lucide-react'
import { avatarUrl } from '../lib/mockData'

export default function Dashboard() {
  const { employees, attendances, settings } = useApp()
  const [discStart, setDiscStart] = useState(new Date().toISOString().slice(0, 10))
  const [discEnd, setDiscEnd] = useState(new Date().toISOString().slice(0, 10))
  const [discResults, setDiscResults] = useState([])
  const [discHistory, setDiscHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('disciplineHistory') || '[]') } catch { return [] }
  })
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

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthAttendances = attendances.filter((a) => a.date?.startsWith(currentMonth))

  const computeDiscipline = () => {
    const rows = attendances.filter((a) => a.date >= discStart && a.date <= discEnd)
    const distinctDays = new Set(rows.map((a) => a.date)).size || 1
    const results = employees.map((emp) => {
      const empRows = rows.filter((a) => a.employeeId === emp.id)
      const hadir = empRows.filter((a) => a.checkIn).length
      const terlambat = empRows.filter((a) => a.status === 'terlambat').length
      const izin = empRows.filter((a) => ['izin','sakit'].includes(a.status)).length
      const alpa = Math.max(0, distinctDays - hadir - izin)
      let scoreVal = Math.round((hadir / distinctDays) * 100) - (terlambat * 2) - (alpa * 5)
      scoreVal = Math.max(0, Math.min(100, scoreVal))
      const predikat = scoreVal >= 90 ? 'Sangat Baik' : scoreVal >= 75 ? 'Baik' : scoreVal >= 60 ? 'Cukup' : 'Kurang'
      return { emp, hadir, terlambat, izin, alpa, score: scoreVal, predikat }
    })
    setDiscResults(results)
  }

  const saveDisciplineHistory = () => {
    if (discResults.length === 0) { toast.error('Hitung penilaian terlebih dahulu'); return }
    const entry = { id: 'dh-' + Date.now(), start: discStart, end: discEnd, results: discResults }
    setDiscHistory((prev) => {
      const next = [entry, ...prev]
      localStorage.setItem('disciplineHistory', JSON.stringify(next))
      return next
    })
    toast.success('Riwayat penilaian disimpan')
  }

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

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Riwayat Absensi Bulan Ini</h3>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="text-left text-[var(--color-muted-foreground)]">
              <tr><th className="py-1">Tanggal</th><th>Pegawai</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr>
            </thead>
            <tbody>
              {monthAttendances.sort((a, b) => b.date.localeCompare(a.date)).map((a) => {
                const e = employees.find((x) => x.id === a.employeeId)
                return (
                  <tr key={a.id} className="border-t border-[var(--color-border)]">
                    <td className="py-1">{a.date}</td>
                    <td>{e?.name || a.employeeId}</td>
                    <td>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{a.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold">Penilaian Kedisiplinan Periodik</h3>
        <div className="flex gap-3 flex-wrap items-end">
          <div><Label>Dari</Label><Input type="date" value={discStart} onChange={(e) => setDiscStart(e.target.value)} /></div>
          <div><Label>Sampai</Label><Input type="date" value={discEnd} onChange={(e) => setDiscEnd(e.target.value)} /></div>
          <Button onClick={computeDiscipline}>Hitung</Button>
          <Button variant="outline" onClick={saveDisciplineHistory}>Simpan Riwayat</Button>
        </div>

        {discResults.length > 0 && (
          <div className="overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--color-muted-foreground)]">
                <tr><th className="py-1">Pegawai</th><th>Hadir</th><th>Terlambat</th><th>Izin</th><th>Alpa</th><th>Skor</th><th>Predikat</th></tr>
              </thead>
              <tbody>
                {discResults.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="py-1">{r.emp.name}</td>
                    <td>{r.hadir}</td>
                    <td>{r.terlambat}</td>
                    <td>{r.izin}</td>
                    <td>{r.alpa}</td>
                    <td className="font-bold">{r.score}</td>
                    <td>{r.predikat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {discHistory.length > 0 && (
          <div className="space-y-2 mt-3">
            <div className="text-sm font-medium">Riwayat Penilaian</div>
            {discHistory.map((h) => (
              <details key={h.id} className="p-3 rounded-xl bg-[var(--color-muted)] text-sm">
                <summary className="cursor-pointer font-medium">{h.start} s/d {h.end} ({h.results.length} pegawai)</summary>
                <div className="mt-2 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-[var(--color-muted-foreground)]">
                      <tr><th className="py-1">Pegawai</th><th>Skor</th><th>Predikat</th></tr>
                    </thead>
                    <tbody>
                      {h.results.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--color-border)]">
                          <td className="py-1">{r.emp.name}</td>
                          <td>{r.score}</td>
                          <td>{r.predikat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}