import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Select, Input, Label } from '../components/ui'
import { CalendarDays } from 'lucide-react'
import { toast } from 'sonner'

export default function Schedules() {
  const { employees } = useApp()
  const [tab, setTab] = useState('manual')
  const [manual, setManual] = useState(() => {
    try { return JSON.parse(localStorage.getItem('manualSchedules') || '[]') } catch { return [] }
  })
  const [mForm, setMForm] = useState({ employeeId: '', days: [], in: '06:55', out: '15:00' })
  const [posFilterGuru, setPosFilterGuru] = useState('')

  const [special, setSpecial] = useState(() => {
    try { return JSON.parse(localStorage.getItem('specialSchedules') || '[]') } catch { return [] }
  })
  const [sForm, setSForm] = useState({ employeeId: '', days: [], in: '06:00', out: '15:30' })
  const [posFilter, setPosFilter] = useState('')
  const [editingDayS, setEditingDayS] = useState(null)
  const [dayInS, setDayInS] = useState('')
  const [dayOutS, setDayOutS] = useState('')

  useEffect(() => { localStorage.setItem('manualSchedules', JSON.stringify(manual)) }, [manual])
  useEffect(() => { localStorage.setItem('specialSchedules', JSON.stringify(special)) }, [special])

  const guruStaff = employees.filter((e) => e.scheduleGroup === 'guru' || ['Guru','Staff TU'].includes(e.position))

  const toggleDay = (d) => setMForm((f) => ({
    ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]
  }))

  const toggleDayS = (d) => setSForm((f) => ({
    ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]
  }))

  const saveSpecial = () => {
    if (!sForm.employeeId || sForm.days.length === 0) { toast.error('Pilih pegawai dan hari kerja'); return }
    const emp = employees.find((e) => e.id === sForm.employeeId)
    setSpecial((prev) => [...prev, { id: 'ss-' + Date.now(), employeeId: sForm.employeeId, name: emp?.name, days: sForm.days, in: sForm.in, out: sForm.out }])
    setSForm({ employeeId: '', days: [], in: '06:00', out: '15:30' })
    toast.success('Jadwal khusus disimpan')
  }

  const removeSpecial = (id) => setSpecial((prev) => prev.filter((m) => m.id !== id))

  const openDayEditS = (entryId) => {
    const entry = special.find((m) => m.id === entryId)
    if (!entry) return
    setEditingDayS(entryId)
    setDayInS(entry.in)
    setDayOutS(entry.out)
  }

  const saveDayEditS = () => {
    if (!editingDayS) return
    setSpecial((prev) => prev.map((m) => (m.id === editingDayS ? { ...m, in: dayInS, out: dayOutS } : m)))
    toast.success('Jam kerja diperbarui')
    setEditingDayS(null)
  }

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
        <Button variant={tab === 'manual' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('manual')}>Jadwal Guru & Staff</Button>
        <Button variant={tab === 'special' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('special')}>Jadwal Khusus</Button>
        <Button variant={tab === 'calendar' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('calendar')}>Kalender</Button>
      </div>

      {tab === 'manual' && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Input Jadwal Kerja</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Jabatan</Label>
              <Select value={posFilterGuru} onChange={(e) => { setPosFilterGuru(e.target.value); setMForm({ ...mForm, employeeId: '' }) }}>
                <option value="">Semua Jabatan</option>
                {Array.from(new Set(guruStaff.map((e) => e.position))).map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label>Pegawai (Guru/Staff)</Label>
              <Select value={mForm.employeeId} onChange={(e) => setMForm({ ...mForm, employeeId: e.target.value })}>
                <option value="">Pilih pegawai</option>
                {guruStaff.filter((e) => !posFilterGuru || e.position === posFilterGuru).map((e) => <option key={e.id} value={e.id}>{e.name} - {e.position}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2">
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



      {tab === 'special' && (
        <> 
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Input Jadwal Kerja</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Jabatan</Label>
              <Select value={posFilter} onChange={(e) => { setPosFilter(e.target.value); setSForm({ ...sForm, employeeId: '' }) }}>
                <option value="">Semua Jabatan</option>
                {Array.from(new Set(employees.map((e) => e.position))).map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label>Pegawai</Label>
              <Select value={sForm.employeeId} onChange={(e) => setSForm({ ...sForm, employeeId: e.target.value })}>
                <option value="">Pilih pegawai</option>
                {employees.filter((e) => !posFilter || e.position === posFilter).map((e) => <option key={e.id} value={e.id}>{e.name} - {e.position}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => (
                  <label key={d} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={sForm.days.includes(d)} onChange={() => toggleDayS(d)} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Jam Masuk</Label><Input type="time" value={sForm.in} onChange={(e) => setSForm({ ...sForm, in: e.target.value })} /></div>
            <div><Label>Jam Pulang</Label><Input type="time" value={sForm.out} onChange={(e) => setSForm({ ...sForm, out: e.target.value })} /></div>
          </div>
          <Button onClick={saveSpecial}>Simpan Jadwal Khusus</Button>

          {special.length > 0 && (
            <div className="space-y-3 mt-3">
              <div className="text-sm font-medium">Daftar Jadwal Khusus (1 Pegawai 1 Minggu)</div>
              {Object.values(special.reduce((acc, m) => {
                if (!acc[m.employeeId]) acc[m.employeeId] = { name: m.name, entries: [] }
                acc[m.employeeId].entries.push(m)
                return acc
              }, {})).map((g, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{g.name}</div>
                    <Button size="sm" variant="destructive" onClick={() => {
                      const ids = g.entries.map((e) => e.id)
                      setSpecial((prev) => prev.filter((m) => !ids.includes(m.id)))
                    }}>Hapus</Button>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] mb-2">1 minggu</div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => {
                      const hit = g.entries.find((e) => e.days.includes(d))
                      return (
                        <div key={d} onClick={() => hit && openDayEditS(hit.id)} className={`p-1 rounded ${hit ? 'bg-[var(--color-primary)] text-white cursor-pointer hover:opacity-80' : 'bg-[var(--color-muted)]'}`}>
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

        {editingDayS && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditingDayS(null)} />
            <Card className="relative z-10 w-full max-w-sm p-5 space-y-3">
              <h3 className="font-semibold">Edit Jam Kerja</h3>
              <div><Label>Jam Masuk</Label><Input type="time" value={dayInS} onChange={(e) => setDayInS(e.target.value)} /></div>
              <div><Label>Jam Pulang</Label><Input type="time" value={dayOutS} onChange={(e) => setDayOutS(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingDayS(null)}>Batal</Button>
                <Button className="flex-1" onClick={saveDayEditS}>Simpan</Button>
              </div>
            </Card>
          </div>
        )}
        </>
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