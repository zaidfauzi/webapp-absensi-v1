import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Input, Select, Label, Badge, Textarea } from '../components/ui'
import { Plus, Check, X as XIcon, Paperclip } from 'lucide-react'
import { avatarUrl } from '../lib/mockData'
import { toast } from 'sonner'

const categories = [
  { value: 'dinas', label: 'Izin Keluar Keperluan Dinas' },
  { value: 'pribadi', label: 'Izin Keluar Urusan Pribadi' },
  { value: 'sakit_kerja', label: 'Sakit Ketika Bekerja' },
  { value: 'urusan_sekolah', label: 'Keluar Karena Urusan Sekolah' },
]

export default function Leave() {
  const { currentUser, employees, leaveRequests, addLeaveRequest, updateLeaveRequest } = useApp()
  const role = currentUser?.role
  const canApprove = ['kepsek','wakasek','yayasan','admin'].includes(role)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ category: 'pribadi', startTime: '', endTime: '', reason: '', evidenceUrl: '' })
  const [note, setNote] = useState('')

  const myEmp = employees.find((e) => e.id === currentUser?.employeeId)

  // filter list based on role
  const visible = leaveRequests.filter((lr) => {
    if (role === 'pegawai') return lr.employeeId === currentUser?.employeeId
    return true
  })

  const submit = () => {
    if (!form.startTime || !form.endTime || !form.reason) { toast.error('Lengkapi data'); return }
    addLeaveRequest({ employeeId: currentUser?.employeeId, ...form })
    toast.success('Pengajuan dikirim')
    setOpen(false)
    setForm({ category: 'pribadi', startTime: '', endTime: '', reason: '', evidenceUrl: '' })
  }

  const approve = (lr, approved) => {
    // multi-level: if requester is kepsek (e1), approver must be yayasan
    const requester = employees.find((e) => e.id === lr.employeeId)
    const requesterUser = null
    // determine if allowed
    let allowed = true
    // find user of requester
    // simple: kepsek employee id e1 -> yayasan only
    if (requester?.id === 'e1' && role !== 'yayasan' && role !== 'admin') allowed = false
    if (!allowed) { toast.error('Persetujuan harus oleh Yayasan'); return }
    updateLeaveRequest(lr.id, { status: approved ? 'approved' : 'rejected', approvedBy: currentUser.id, note })
    toast.success(approved ? 'Disetujui' : 'Ditolak')
    setNote('')
  }

  const statusBadge = (s) => s === 'approved' ? 'success' : s === 'rejected' ? 'destructive' : 'warning'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan Izin</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Izin keluar, sakit, urusan sekolah</p>
        </div>
        {role !== 'yayasan' && <Button onClick={() => setOpen(true)}><Plus size={16} /> Ajukan Izin</Button>}
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          {visible.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">Belum ada pengajuan</p>}
          {visible.map((lr) => {
            const emp = employees.find((e) => e.id === lr.employeeId)
            return (
              <div key={lr.id} className="border border-[var(--color-border)] rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <img src={avatarUrl(emp?.name)} className="h-10 w-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{emp?.name}</span>
                      <Badge variant="info">{categories.find((c) => c.value === lr.category)?.label}</Badge>
                      <Badge variant={statusBadge(lr.status)}>{lr.status}</Badge>
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      {new Date(lr.startTime).toLocaleString('id-ID')} → {new Date(lr.endTime).toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm mt-1">{lr.reason}</div>
                    {lr.evidenceUrl && <div className="text-xs mt-1 text-blue-600 flex items-center gap-1"><Paperclip size={12} /> Bukti terlampir</div>}
                    {lr.note && <div className="text-xs mt-1 italic">Catatan: {lr.note}</div>}
                  </div>
                </div>
                {canApprove && lr.status === 'pending' && (
                  <div className="mt-3 flex gap-2 items-center">
                    <Input placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={() => approve(lr, true)}><Check size={14} /> Setujui</Button>
                    <Button size="sm" variant="destructive" onClick={() => approve(lr, false)}><XIcon size={14} /> Tolak</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <Card className="relative z-10 w-full max-w-lg p-6">
            <h3 className="font-bold mb-4">Ajukan Izin</h3>
            <div className="space-y-3">
              <div><Label>Kategori</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Mulai</Label><Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
                <div><Label>Selesai</Label><Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              </div>
              <div><Label>Alasan</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <div><Label>Bukti (URL foto/surat)</Label><Input value={form.evidenceUrl} onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Batal</Button>
              <Button className="flex-1" onClick={submit}>Kirim</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}