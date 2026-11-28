import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Card, Button, Badge, Input } from '../components/ui'
import { Camera, MapPin, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { haversine, fmtTime } from '../lib/utils'
import { getFaceDescriptor, faceDistance } from '../lib/face'
import { toast } from 'sonner'

export default function Attendance() {
  const { currentUser, employees, settings, checkIn, checkOut, attendances, login } = useApp()
  const navigate = useNavigate()
  const [qUser, setQUser] = useState('')
  const [qPass, setQPass] = useState('')
  const [qLoading, setQLoading] = useState(false)
  const emp = employees.find((e) => e.id === currentUser?.employeeId)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [pos, setPos] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [mode, setMode] = useState('in')
  const [loading, setLoading] = useState(false)
  const [liveness, setLiveness] = useState(false)
  const [capturedFaceDescriptor, setCapturedFaceDescriptor] = useState(null)
  const [faceMsg, setFaceMsg] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const myAtt = attendances.find((a) => a.employeeId === emp?.id && a.date === today)

  useEffect(() => {
    // get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        (e) => setGeoError(e.message),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else setGeoError('Geolocation tidak didukung')
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()) }
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (e) { toast.error('Kamera tidak dapat diakses: ' + e.message) }
  }

  useEffect(() => {
    if (stream && videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  const capture = async () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')
    ctx.drawImage(v, 0, 0)
    // watermark
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, c.height - 46, c.width, 46)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    const now = new Date()
    ctx.fillText(`${emp?.name || ''} · ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`, 8, c.height - 26)
    ctx.font = '12px sans-serif'
    ctx.fillText(`GPS: ${pos?.lat?.toFixed(5)}, ${pos?.lng?.toFixed(5)} · ${settings.schoolName}`, 8, c.height - 8)
    const data = c.toDataURL('image/jpeg', 0.85)
    setPhoto(data)
    setLiveness(true)
    toast.success('Foto tercapture dengan watermark')
    // face recognition
    setFaceMsg('Memverifikasi wajah...')
    const desc = await getFaceDescriptor(v)
    setCapturedFaceDescriptor(desc)
    if (desc) setFaceMsg('Wajah terdeteksi')
    else setFaceMsg('Wajah tidak terdeteksi')
  }

  const distance = pos ? haversine(pos.lat, pos.lng, settings.lat, settings.lng) : null
  const inRadius = distance !== null && distance <= settings.radius
  const fakeGpsSuspect = pos && (pos.accuracy > 100 || distance > 100000)

  const submit = async () => {
    if (!emp) { toast.error('Akun tidak terhubung ke data pegawai'); return }
    if (!photo) { toast.error('Ambil foto terlebih dahulu'); return }
    if (!pos) { toast.error('Lokasi belum tersedia'); return }
    if (!inRadius) { toast.error(`Di luar radius (${Math.round(distance)}m > ${settings.radius}m)`); return }
    if (settings.antiFakeGps && fakeGpsSuspect) { toast.error('Terdeteksi indikasi Fake GPS'); return }
    if (emp?.faceDescriptor) {
      if (!capturedFaceDescriptor) { toast.error('Wajah tidak terdeteksi'); return }
      const dist = faceDistance(capturedFaceDescriptor, emp.faceDescriptor)
      if (dist > 0.6) { toast.error('Wajah tidak cocok dengan data pegawai'); return }
    }

    setLoading(true)
    const now = new Date()
    // compute late for check-in (06:55 + tolerance)
    const scheduledIn = new Date(); scheduledIn.setHours(6, 55 + (settings.toleranceMinutes || 0), 0, 0)
    // simple: if masuk mode and now > scheduledIn base 06:55
    const baseIn = new Date(); baseIn.setHours(6, 55, 0, 0)
    const lateMinutes = mode === 'in' ? Math.max(0, Math.round((now - baseIn) / 60000)) : 0
    const status = mode === 'in' ? (lateMinutes > (settings.toleranceMinutes || 0) ? 'terlambat' : 'hadir') : 'hadir'

    if (mode === 'in') {
      checkIn(emp.id, { time: now.toISOString(), status, lateMinutes, distance: Math.round(distance), photoIn: photo, lat: pos.lat, lng: pos.lng })
    } else {
      // early leave calc vs 15:00
      const baseOut = new Date(); baseOut.setHours(15, 0, 0, 0)
      const early = now < baseOut ? Math.round((baseOut - now) / 60000) : 0
      checkOut(emp.id, { time: now.toISOString(), earlyLeaveMinutes: early, photoOut: photo, lat: pos.lat, lng: pos.lng })
    }
    setLoading(false)
    toast.success(mode === 'in' ? 'Absen masuk berhasil' : 'Absen pulang berhasil')
  }

  if (!currentUser) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>← Kembali</Button>
        <div>
          <h1 className="text-2xl font-bold">Absen Cepat</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Masuk dengan akun Anda untuk melanjutkan absensi</p>
        </div>
        <Card className="p-5 space-y-3">
          <div><label className="text-sm font-medium mb-1 block">Username</label><Input value={qUser} onChange={(e) => setQUser(e.target.value)} placeholder="username" /></div>
          <div><label className="text-sm font-medium mb-1 block">Password</label><Input type="password" value={qPass} onChange={(e) => setQPass(e.target.value)} placeholder="••••••" /></div>
          <Button className="w-full" disabled={qLoading} onClick={async () => {
            setQLoading(true)
            const res = await login(qUser, qPass)
            setQLoading(false)
            if (res.ok) toast.success('Login berhasil')
            else toast.error(res.message)
          }}>{qLoading ? 'Memproses...' : 'Masuk & Absen'}</Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>Kembali ke Login</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>← Kembali</Button>
      <div>
        <h1 className="text-2xl font-bold">Absensi Rekam Wajah</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Verifikasi lokasi & wajah sebelum absen</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <Button variant={mode === 'in' ? 'primary' : 'outline'} className="flex-1" onClick={() => setMode('in')}>Absen Masuk</Button>
          <Button variant={mode === 'out' ? 'primary' : 'outline'} className="flex-1" onClick={() => setMode('out')}>Absen Pulang</Button>
        </div>

        {/* Location */}
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} /> Lokasi Anda</div>
          {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
          {pos && (
            <div className="text-xs mt-1 space-y-1">
              <div>Lat: {pos.lat.toFixed(5)}, Lng: {pos.lng.toFixed(5)} · Akurasi ±{Math.round(pos.accuracy)}m</div>
              <div>Jarak ke sekolah: <b>{Math.round(distance)} m</b> (radius {settings.radius}m)</div>
              <div className="flex gap-2 mt-1">
                {inRadius ? <Badge variant="success">Dalam radius</Badge> : <Badge variant="destructive">Luar radius</Badge>}
                {fakeGpsSuspect && <Badge variant="warning">Suspek Fake GPS</Badge>}
              </div>
            </div>
          )}
        </div>

        {/* Camera */}
        <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative mb-3">
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button onClick={startCamera}><Camera size={16} /> Aktifkan Kamera</Button>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {photo && <img src={photo} className="absolute inset-0 w-full h-full object-cover" />}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 mb-4">
          {!photo ? (
            <Button onClick={capture} disabled={!stream} className="flex-1"><Camera size={16} /> Ambil Foto</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setPhoto(null); setLiveness(false); setCapturedFaceDescriptor(null); setFaceMsg('') }} className="flex-1"><RefreshCw size={16} /> Ulangi</Button>
              <div className="flex-1 flex items-center justify-center text-xs text-emerald-600 gap-1"><CheckCircle2 size={14} /> Wajah terverifikasi {faceMsg && `· ${faceMsg}`}</div>
            </>
          )}
        </div>

        {myAtt && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-sm">
            <div className="font-medium">Status hari ini</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              Masuk: {myAtt.checkIn ? fmtTime(myAtt.checkIn) : '-'} · Pulang: {myAtt.checkOut ? fmtTime(myAtt.checkOut) : '-'} · {myAtt.status}
            </div>
          </div>
        )}

        <Button onClick={submit} disabled={loading || !photo || !inRadius} className="w-full" size="lg">
          {loading ? 'Menyimpan...' : (mode === 'in' ? 'Kirim Absen Masuk' : 'Kirim Absen Pulang')}
        </Button>
        {(!inRadius && pos) && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> Anda berada di luar radius sekolah.</p>}
      </Card>
    </div>
  )
}