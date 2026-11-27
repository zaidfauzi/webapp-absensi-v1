import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Select, Input, Label } from '../components/ui'
import { CalendarDays } from 'lucide-react'
import { toast } from 'sonner'

export default function SecuritySchedule() {
  const { employees } = useApp()
  const [manual, setManual] = useState(() => {
    try { return JSON.parse(localStorage.getItem('securitySchedules') || '[]') } catch { return [] }
  })
  const [mForm, setMForm] = useState({ employeeId: '', days: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'], in: '05:55', out: '17:00' })
  const [editingDay, setEditingDay] = useState(null)
  const [dayIn, setDayIn] = useState('')
  const [dayOut, setDayOut] = useState('')

  useEffect(() => { localStorage.setItem('securitySchedules', JSON.stringify(manual)) }, [manual])

  const toggleDay = (d) => setMForm((f) => ({
    ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]
  }))

  const saveManual = () => {
    if (!mForm.employeeId || mForm.days.length === 0) { toast.error('Pilih pegawai dan hari kerja'); return }
    const emp = employees.find((e) => e.id === mForm.employeeId)
    setManual((prev) => [...prev, { id: 'sec-' + Date.now(), employeeId: mForm.employeeId, name: emp?.name, days: mForm.days, in: mForm.in, out: mForm.out }])
    setMForm({ employeeId: '', days: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'], in: '05:55', out: '17:00' })
    toast.success('Jadwal security disimpan')
  }

  const removeManual = (id) => setManual((prev) => prev.filter((m) => m.id !== id))

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

  // filter security employees
  const securityEmps = employees.filter((e) => e.position === 'Security' || e.scheduleGroup === 'security')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Security</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Jadwal security (Senin–Minggu, 05:55–17:00)</p>
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold">Input Jadwal Kerja</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Pegawai (Security)</Label>
            <Select value={mForm.employeeId} onChange={(e) => setMForm({ ...mForm, employeeId: e.target.value })}>
              <option value="">Pilih pegawai</option>
              {securityEmps.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.position}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Hari Kerja</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => (
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
        <Button onClick={saveManual}>Simpan Jadwal Security</Button>

        {manual.length > 0 && (
          <div className="space-y-3 mt-3">
            <div className="text-sm font-medium">Daftar Jadwal Security (1 Pegawai 1 Minggu)</div>
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