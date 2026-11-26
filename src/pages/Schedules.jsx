import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Badge, Select } from '../components/ui'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const templates = [
  { group: 'Guru & Staff', items: [
    { hari: 'Senin–Kamis (Normal)', jam: '06:55 – 15:00' },
    { hari: 'Piket (1x/minggu)', jam: '06:30 – 15:30' },
    { hari: 'Piket Jumat', jam: '06:30 – 13:30' },
    { hari: 'Jumat & Sabtu (Non-piket)', jam: '06:55 – 11:30' },
  ]},
  { group: 'Office Boy', items: [
    { hari: '2 minggu normal', jam: '06:00 – 16:00' },
    { hari: '1 minggu piket', jam: '06:00 – 17:00' },
    { hari: 'Rotasi', jam: 'pola 2-1 bergilir (termasuk Sabtu & Minggu)' },
  ]},
  { group: 'Teknisi & Gardener', items: [
    { hari: '1 minggu normal', jam: '06:00 – 16:00' },
    { hari: '1 minggu piket', jam: '06:00 – 17:00' },
    { hari: 'Rotasi', jam: 'pola 1-1 bergilir' },
  ]},
  { group: 'Security', items: [
    { hari: 'Shift Pagi', jam: '05:55 – 17:00' },
    { hari: 'Shift Malam (lintas hari)', jam: '16:55 (H) – 06:00 (H+1)' },
  ]},
]

export default function Schedules() {
  const { employees } = useApp()
  const [tab, setTab] = useState('template')
  const [rotation, setRotation] = useState('auto')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal & Shift</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Pengaturan jam kerja dinamis per kategori</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'template' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('template')}>Template Shift</Button>
        <Button variant={tab === 'rotation' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('rotation')}>Rotasi Otomatis</Button>
        <Button variant={tab === 'calendar' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('calendar')}>Kalender</Button>
      </div>

      {tab === 'template' && (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.group} className="p-4">
              <h3 className="font-semibold mb-3">{t.group}</h3>
              <div className="space-y-2">
                {t.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-[var(--color-border)] pb-1">
                    <span>{it.hari}</span>
                    <span className="font-mono text-[var(--color-muted-foreground)]">{it.jam}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
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
    </div>
  )
}