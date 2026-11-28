import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Button, Input, Card } from '../components/ui'
import { Eye, EyeOff, Smartphone, LogIn, Download, Camera } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const { login, toggleTheme, theme, settings } = useApp()
  const navigate = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(u, p)
    setLoading(false)
    if (res.ok) { toast.success('Login berhasil'); navigate('/') }
    else toast.error(res.message)
  }

  const quick = (path) => navigate(path)

  const install = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt()
      window.deferredPrompt = null
    } else {
      toast.info('Gunakan menu browser: Add to Home Screen / Install App')
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[var(--color-primary)] to-teal-900 text-white p-10">
        <div className="max-w-md text-center">
          {settings.logoUrl ? <img src={settings.logoUrl} className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur object-contain mx-auto mb-6" /> : <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold mx-auto mb-6">S</div>}
          <h1 className="text-3xl font-bold mb-2">{settings.schoolName}</h1>
          <p className="text-white/80">{settings.slogan}</p>
          <p className="mt-6 text-sm text-white/60">{settings.address}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-6 relative">
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--color-muted)]">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <Card className="w-full max-w-md p-8 backdrop-blur">
          <div className="text-center mb-6">
            {settings.logoUrl ? <img src={settings.logoUrl} className="h-14 w-14 rounded-xl object-contain mx-auto mb-3" /> : <div className="h-14 w-14 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">S</div>}
            <h2 className="text-xl font-bold">Masuk ke Sistem</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">Absensi & Monitoring Kedisiplinan</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Username / NIP</label>
              <Input value={u} onChange={(e) => setU(e.target.value)} placeholder="admin" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <div className="relative">
                <Input type={show ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn size={16} /> {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => quick('/attendance')}><Camera size={14} /> Absen Masuk</Button>
            <Button variant="outline" size="sm" onClick={() => quick('/attendance')}><Camera size={14} /> Absen Pulang</Button>
          </div>

          <Button variant="accent" className="w-full mt-3" onClick={install}>
            <Download size={16} /> Install Aplikasi (APK)
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={async () => {
            try {
              localStorage.clear()
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations()
                await Promise.all(regs.map((r) => r.unregister()))
              }
              window.location.reload()
            } catch (e) { alert(e.message) }
          }}>
            Reset Cache & Reload
          </Button>

          <details className="mt-4 text-xs text-[var(--color-muted-foreground)]">
            <summary className="cursor-pointer">Akun demo</summary>
            <div className="mt-2 space-y-1 font-mono">
              <div>admin / admin123</div>
              <div>kepsek / kepsek123</div>
              <div>tu / tu123</div>
              <div>19820303 / pegawai123</div>
            </div>
          </details>
        </Card>
      </div>
    </div>
  )
}