import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Input, Label, Select } from '../components/ui'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'sonner'
import L from 'leaflet'

// fix marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' })

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng) } })
  return null
}

export default function Settings() {
  const { settings, updateSettings } = useApp()
  const [form, setForm] = useState({ ...settings })

  const save = () => {
    updateSettings(form)
    toast.success('Pengaturan disimpan')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Identitas sekolah, tema, konfigurasi absensi</p>
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Identitas Sekolah (White-Label)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Nama Sekolah</Label><Input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} /></div>
          <div><Label>Nama Yayasan</Label><Input value={form.foundationName} onChange={(e) => setForm({ ...form, foundationName: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Slogan</Label><Input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Logo Sekolah</Label>
            <div className="flex items-center gap-3">
              {form.logoUrl && <img src={form.logoUrl} className="h-12 w-12 rounded-lg object-contain border border-[var(--color-border)]" />}
              <Input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const r = new FileReader()
                r.onload = () => setForm((prev) => ({ ...prev, logoUrl: r.result }))
                r.readAsDataURL(f)
              }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Tampilan Aplikasi</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Tema Bawaan</Label>
            <Select value={form.themeDefault} onChange={(e) => setForm({ ...form, themeDefault: e.target.value })}>
              <option value="light">Terang</option><option value="dark">Gelap</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.allowUserTheme} onChange={(e) => setForm({ ...form, allowUserTheme: e.target.checked })} />
            <span className="text-sm">Izinkan pengguna memilih tema sendiri</span>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Konfigurasi Absensi & Lokasi</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>Latitude</Label><Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })} /></div>
          <div><Label>Longitude</Label><Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })} /></div>
          <div><Label>Radius (m)</Label><Input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: parseInt(e.target.value) })} /></div>
          <div><Label>Toleransi Telat (mnt)</Label><Input type="number" value={form.toleranceMinutes} onChange={(e) => setForm({ ...form, toleranceMinutes: parseInt(e.target.value) })} /></div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.faceVerification} onChange={(e) => setForm({ ...form, faceVerification: e.target.checked })} />
            <span className="text-sm">Verifikasi Wajah</span>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.antiFakeGps} onChange={(e) => setForm({ ...form, antiFakeGps: e.target.checked })} />
            <span className="text-sm">Anti-Fake GPS</span>
          </div>
        </div>
        <div className="h-64 rounded-xl overflow-hidden border border-[var(--color-border)] mt-3">
          <MapContainer center={[form.lat, form.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[form.lat, form.lng]} />
            <ClickHandler onPick={(lat, lng) => setForm({ ...form, lat, lng })} />
          </MapContainer>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">Klik peta untuk menentukan titik koordinat sekolah.</p>
      </Card>

      <Button onClick={save} size="lg">Simpan Pengaturan</Button>
    </div>
  )
}