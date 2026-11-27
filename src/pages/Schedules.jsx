import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Badge, Select, Input, Label } from '../components/ui'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function Schedules() {
  const { employees } = useApp()
  const [tab, setTab] = useState('manual')
  const [rotation, setRotation] = useState('auto')
  const [manual, setManual] = useState(() => {
    try { return JSON.parse(localStorage.getItem('manualSchedules') || '[]') } catch { return [] }
  })
  const [mForm, setMForm] = useState({ employeeId: '', days: [], in: '06:55', out: '15:00' })

  useEffect(() => { localStorage.setItem('manualSchedules', JSON.stringify(manual)) }, [manual])

  const guruStaff = employees.filter((e) => e.scheduleGroup === 'guru' || ['Guru','Staff TU'].includes(e.position))

  const toggleDay = (d) => setMForm((f) => ({
    ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]
  }))

  const saveManual = () => {
    if (!mForm.employeeId || mForm.days.length === 0) { toast.error('Pilih pegawai dan hari kerja'); return }
    const emp = employees.find((e) => e.id === mForm.employeeId)
    setManual((prev) => [...prev, { id: 'ms-' + Date.now(), employeeId: mForm.employeeId, name: emp?.name, days: mForm.days, in: mForm.in, out: mForm.out }])
    setMForm({ employeeId: '', days: [], in: '06:55', out: '15:00' })
    toast.success('Jadwal manual disimpan')
  }

  const removeManual = (id) => setManual((prev) => prev.filter((m) => m.id !== id))

  const [editingDay, setEditingDay] = useState(null)
  const [dayIn, setDayIn] = useState('')
  const [dayOut, setDayOut] = useState('')

  const openDayEdit = (entryId) => {
    const entry = manual.find((m) => m.id === entryId)
    if (!entry) return
    setEditingDay(entryId)
    setDayIn(entry.in)
    setDayOut(entry.out)
  }

  const saveDayEdit = () => {
    if (!editingDay) return
    setManual((prev) => prev.map((m) => (m.id === editingDay ? { ...m, in: dayIn, out: dayOut } : m)))
    toast.success('Jam kerja diperbarui')
    setEditingDay(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal & Shift</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Pengaturan jam kerja dinamis per kategori</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === 'manual' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('manual')}>Jadwal Manual</Button>
        <Button variant={tab === 'rotation' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('rotation')}>Rotasi Otomatis</Button>
        <Button variant={tab === 'calendar' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('calendar')}>Kalender</Button>
      </div>

      {tab === 'manual' && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Jadwal Manual Guru & Staff (Per Individu)</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Pegawai (Guru/Staff)</Label>
              <Select value={mForm.employeeId} onChange={(e) => setMForm({ ...mForm, employeeId: e.target.value })}>
                <option value="">Pilih pegawai</option>
                {guruStaff.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.position}</option>)}
              </Select>
            </div>
            <div>
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Sen','Sel','Rab','Kam','Jum','Sab'].map((d) => (
                  <label key={d} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={mForm.days.includes(d)} onChange={() => toggleDay(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Jam Masuk</Label><Input type="time" value={mForm.in} onChange={(e) => setMForm({ ...mForm, in: e.target.value })} /></div>
            <div><Label>Jam Pulang</Label><Input type="time" value={mForm.out} onChange={(e) => setMForm({ ...mForm, out: e.target.value })} /></div>
          </div>
          <Button onClick={saveManual}>Simpan Jadwal Manual</Button>

          {manual.length > 0 && (
            <div className="space-y-3 mt-3">
              <div className="text-sm font-medium">Daftar Jadwal Manual (1 Pegawai 1 Minggu)</div>
              {Object.values(manual.reduce((acc, m) => {
                if (!acc[m.employeeId]) acc[m.employeeId] = { name: m.name, entries: [] }
                acc[m.employeeId].entries.push(m)
                return acc
              }, {})).map((g, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{g.name}</div>
                    <Button size="sm" variant="destructive" onClick={() => {
                      const ids = g.entries.map((e) => e.id)
                      setManual((prev) => prev.filter((m) => !ids.includes(m.id)))
                    }}>Hapus</Button>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] mb-2">1 minggu</div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => {
                      const hit = g.entries.find((e) => e.days.includes(d))
                      return (
                        <div key={d} onClick={() => hit && openDayEdit(hit.id)} className={`p-1 rounded ${hit ? 'bg-[var(--color-primary)] text-white cursor-pointer hover:opacity-80' : 'bg-[var(--color-muted)]'}`}>
                          <div className="font-bold">{d}</div>
                          <div className="text-[10px]">{hit ? `${hit.in}–${hit.out}` : '-'}</div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'rotation' && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Auto-Rotation Pola</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-muted)]">
              <span>Office Boy: pola 2-1 (2 minggu normal, 1 minggu piket)</span>
              <Badge variant="success">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-muted)]">
              <span>Teknisi & Gardener: pola 1-1</span>
              <Badge variant="success">Aktif</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={rotation} onChange={(e) => setRotation(e.target.value)} className="max-w-xs">
              <option value="auto">Rotasi Otomatis</option>
              <option value="manual">Manual</option>
            </Select>
            <Button onClick={() => toast.success('Rotasi dijalankan')}><RefreshCw size={14} /> Jalankan Rotasi Minggu Ini</Button>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">Rotasi otomatis memastikan setiap akhir pekan ada OB/Teknisi/Gardener bertugas.</p>
        </Card>
      )}

      {tab === 'calendar' && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><CalendarDays size={16} /> Kalender Jadwal</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => <div key={d} className="font-bold py-1">{d}</div>)}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square border border-[var(--color-border)] rounded-lg flex items-center justify-center hover:bg-[var(--color-muted)] cursor-pointer">
                {(i % 30) + 1}
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-3">Klik tanggal untuk mengedit/menutup jadwal piket & hari libur.</p>
        </Card>
      )}

      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingDay(null)} />
          <Card className="relative z-10 w-full max-w-sm p-5 space-y-3">
            <h3 className="font-semibold">Edit Jam Kerja</h3>
            <div><Label>Jam Masuk</Label><Input type="time" value={dayIn} onChange={(e) => setDayIn(e.target.value)} /></div>
            <div><Label>Jam Pulang</Label><Input type="time" value={dayOut} onChange={(e) => setDayOut(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingDay(null)}>Batal</Button>
              <Button className="flex-1" onClick={saveDayEdit}>Simpan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}