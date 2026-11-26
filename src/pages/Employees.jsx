import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Input, Select, Label, Badge } from '../components/ui'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { avatarUrl } from '../lib/mockData'
import { toast } from 'sonner'

const empty = { nip: '', name: '', gender: 'L', phone: '', email: '', position: 'Guru', scheduleGroup: 'guru', status: 'aktif', role: 'pegawai', password: '', photoUrl: '' }

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState(false)

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.nip.includes(q))

  const openNew = () => { setForm(empty); setEditing(null); setOpen(true) }
  const openEdit = (e) => { setForm({ ...e }); setEditing(e.id); setOpen(true) }

  const save = () => {
    if (!form.name || !form.nip) { toast.error('NIP dan nama wajib'); return }
    if (editing) { updateEmployee(editing, form); toast.success('Pegawai diperbarui') }
    else { addEmployee(form); toast.success('Pegawai ditambahkan') }
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Master Pegawai</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{employees.length} pegawai aktif</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Tambah</Button>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input className="pl-9" placeholder="Cari nama / username..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--color-muted-foreground)]">
              <tr>
                <th className="py-2">Pegawai</th><th>Username</th><th>Jabatan</th><th>Grup</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2 flex items-center gap-2">
                    <img src={e.photoUrl || avatarUrl(e.name)} className="h-8 w-8 rounded-full object-cover" />
                    <div><div className="font-medium">{e.name}</div><div className="text-xs text-[var(--color-muted-foreground)]">{e.email}</div></div>
                  </td>
                  <td>{e.nip}</td>
                  <td>{e.position}</td>
                  <td className="capitalize">{e.scheduleGroup}</td>
                  <td><Badge variant={e.status === 'aktif' ? 'success' : 'default'}>{e.status}</Badge></td>
                  <td className="text-right">
                    <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-[var(--color-muted)] rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => { deleteEmployee(e.id); toast.success('Dihapus') }} className="p-1.5 hover:bg-[var(--color-muted)] rounded-lg text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <Card className="relative z-10 w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{editing ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
              <button onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Username (Login)</Label><Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="username untuk login" /></div>
              <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Jenis Kelamin</Label><Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></Select></div>
              <div><Label>No HP</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label>Password Akun</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" /></div>
              <div className="col-span-2">
                <Label>Foto Profil</Label>
                <div className="flex items-center gap-3">
                  {form.photoUrl && <img src={form.photoUrl} className="h-12 w-12 rounded-full object-cover" />}
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const r = new FileReader()
                    r.onload = () => setForm((prev) => ({ ...prev, photoUrl: r.result }))
                    r.readAsDataURL(f)
                  }} />
                </div>
              </div>
              <div><Label>Jabatan</Label>
                <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  {['Guru','Staff TU','Office Boy','Teknisi','Gardener','Security','Wakil Kepala Sekolah','Kepala Sekolah'].map((p) => <option key={p}>{p}</option>)}
                </Select>
              </div>
              <div><Label>Grup Jadwal</Label>
                <Select value={form.scheduleGroup} onChange={(e) => setForm({ ...form, scheduleGroup: e.target.value })}>
                  <option value="guru">Guru/Staff</option><option value="ob">Office Boy</option><option value="teknisi">Teknisi</option><option value="gardener">Gardener</option><option value="security">Security</option>
                </Select>
              </div>
              <div><Label>Status</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></Select></div>
              <div><Label>Hak Akses</Label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Administrator</option>
                <option value="yayasan">Yayasan</option>
                <option value="kepsek">Kepala Sekolah</option>
                <option value="wakasek">Wakil Kepala Sekolah</option>
                <option value="tu">Tata Usaha</option>
                <option value="pegawai">Pegawai</option>
              </Select></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Batal</Button>
              <Button className="flex-1" onClick={save}>Simpan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}