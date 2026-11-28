import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useState, useMemo } from 'react'
import { Button } from './ui'
import { LayoutDashboard, Users, CalendarDays, ClipboardList, FileBarChart, Settings, LogOut, Moon, Sun, Menu, X, Camera, User } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','yayasan','kepsek','wakasek','tu'] },
  { to: '/attendance', label: 'Absensi', icon: Camera, roles: ['admin','yayasan','kepsek','wakasek','tu','pegawai'] },
  { to: '/employees', label: 'Pegawai', icon: Users, roles: ['admin','tu'] },
  { to: '/schedules', label: 'Jadwal', icon: CalendarDays, roles: ['admin','tu','kepsek','wakasek'] },
  { to: '/leave', label: 'Izin', icon: ClipboardList, roles: ['admin','yayasan','kepsek','wakasek','tu','pegawai'] },
  { to: '/reports', label: 'Laporan', icon: FileBarChart, roles: ['admin','yayasan','kepsek','wakasek','tu'] },
  { to: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
  { to: '/profile', label: 'Profil', icon: User, roles: ['admin','yayasan','kepsek','wakasek','tu','pegawai'] },
]

export default function Layout({ children }) {
  const { currentUser, logout, theme, toggleTheme, settings, employees, attendances } = useApp()
  const [widgetOpen, setWidgetOpen] = useState(true)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const role = currentUser?.role
  const items = navItems.filter((n) => n.roles.includes(role))

  const { topRajin, topTelat } = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthAtt = attendances.filter((a) => a.date?.startsWith(ym))
    const stats = employees.map((e) => {
      const rows = monthAtt.filter((a) => a.employeeId === e.id)
      const telat = rows.filter((a) => a.status === 'terlambat' || (a.lateMinutes || 0) > 0).length
      const tepat = rows.filter((a) => a.checkIn && !(a.status === 'terlambat') && !(a.lateMinutes > 0)).length
      return { e, telat, tepat, total: rows.length }
    }).filter((s) => s.total > 0)
    const topRajin = [...stats].sort((a, b) => b.tepat - a.tepat || a.telat - b.telat).slice(0, 2)
    const topTelat = [...stats].sort((a, b) => b.telat - a.telat).slice(0, 2)
    return { topRajin, topTelat }
  }, [employees, attendances])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="p-5 border-b border-[var(--color-border)] flex items-center gap-3">
          {settings.logoUrl ? <img src={settings.logoUrl} className="h-10 w-10 rounded-xl object-contain" /> : <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">S</div>}
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{settings.schoolName}</div>
            <div className="text-xs text-[var(--color-muted-foreground)] truncate">{ROLES_LABEL(role)}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition', isActive ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-muted)]')}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button onClick={() => setWidgetOpen((o) => !o)} className="w-full flex items-center justify-between text-xs font-semibold text-[var(--color-muted-foreground)] mb-2">
            <span>Ringkasan Bulan Ini</span>
            <span>{widgetOpen ? '▾' : '▸'}</span>
          </button>
          {widgetOpen && (
            <div className="space-y-2 text-xs">
              <div>
                <div className="font-medium mb-1">Top Rajin</div>
                {topRajin.length === 0 && <div className="text-[var(--color-muted-foreground)]">Belum ada data</div>}
                {topRajin.map((s) => (
                  <div key={s.e.id} className="flex items-center justify-between">
                    <span className="truncate">{s.e.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{s.tepat} tepat</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-medium mb-1">Sering Telat</div>
                {topTelat.length === 0 && <div className="text-[var(--color-muted-foreground)]">Belum ada data</div>}
                {topTelat.map((s) => (
                  <div key={s.e.id} className="flex items-center justify-between">
                    <span className="truncate">{s.e.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{s.telat} telat</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[var(--color-border)] space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--color-muted)]">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-destructive)] hover:bg-[var(--color-muted)]">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-bold text-sm">{settings.schoolName}</span>
        </div>
        <button onClick={toggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--color-card)] p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">{settings.schoolName}</span>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {items.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition', isActive ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-muted)]')}>
                  <n.icon size={18} /> {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-[var(--color-border)] pt-3 space-y-1">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-destructive)] hover:bg-[var(--color-muted)]">
                <LogOut size={18} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="md:hidden h-14" />
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-card)] flex">
        {items.slice(0, 5).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cn('flex-1 flex flex-col items-center py-2 text-[10px]', isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]')}>
            <n.icon size={20} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="md:hidden h-16" />
    </div>
  )
}

function cn(...c) { return c.filter(Boolean).join(' ') }

const ROLES_LABEL = (r) => ({ admin:'Administrator', yayasan:'Yayasan', kepsek:'Kepala Sekolah', wakasek:'Wakil Kepala Sekolah', tu:'Tata Usaha', pegawai:'Pegawai' }[r] || r)