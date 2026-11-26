import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Input, Label } from '../components/ui'
import { avatarUrl } from '../lib/mockData'
import { toast } from 'sonner'

export default function Profile() {
  const { currentUser, employees } = useApp()
  const emp = employees.find((e) => e.id === currentUser?.employeeId)
  const [oldP, setOldP] = useState('')
  const [newP, setNewP] = useState('')
  const [confirm, setConfirm] = useState('')

  const change = () => {
    if (newP.length < 6) { toast.error('Password minimal 6 karakter'); return }
    if (newP !== confirm) { toast.error('Konfirmasi tidak cocok'); return }
    toast.success('Password berhasil diubah (demo)')
    setOldP(''); setNewP(''); setConfirm('')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profil Saya</h1>
      <Card className="p-5 flex items-center gap-4">
        <img src={avatarUrl(emp?.name || currentUser?.username)} className="h-16 w-16 rounded-full" />
        <div>
          <div className="font-bold text-lg">{emp?.name || currentUser?.username}</div>
          <div className="text-sm text-[var(--color-muted-foreground)]">{emp?.position || currentUser?.role} · {emp?.nip}</div>
          <div className="text-xs text-[var(--color-muted-foreground)]">{emp?.email}</div>
        </div>
      </Card>
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Ubah Password</h3>
        <div><Label>Password Lama</Label><Input type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} /></div>
        <div><Label>Password Baru</Label><Input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} /></div>
        <div><Label>Konfirmasi</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button onClick={change}>Simpan</Button>
      </Card>
    </div>
  )
}