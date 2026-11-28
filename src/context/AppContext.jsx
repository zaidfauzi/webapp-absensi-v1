import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  defaultSettings, seedEmployees, seedUsers, seedAttendances, seedLeaveRequests, avatarUrl,
} from '../lib/mockData'
import { supabase, hasSupabase } from '../lib/supabase'

function snakeToCamel(s) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) }
function camelToSnake(s) { return s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()) }
function toCamelObj(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out = {}
  for (const k in obj) out[snakeToCamel(k)] = obj[k]
  return out
}
function toSnakeObj(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const out = {}
  for (const k in obj) out[camelToSnake(k)] = obj[k]
  return out
}

const KEY = 'sdit_absensi_v1_state'

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const initial = loadState()
  const [users, setUsers] = useState(initial?.users || seedUsers)
  const [employees, setEmployees] = useState(initial?.employees || seedEmployees)
  const [attendances, setAttendances] = useState(initial?.attendances || seedAttendances())
  const [leaveRequests, setLeaveRequests] = useState(initial?.leaveRequests || seedLeaveRequests)
  const [settings, setSettings] = useState(initial?.settings || defaultSettings)
  const [schedules] = useState(initial?.schedules || {})
  const [currentUser, setCurrentUser] = useState(initial?.currentUser || null)
  const [theme, setTheme] = useState(() => initial?.theme || defaultSettings.themeDefault || 'light')

  // Load from Supabase if configured
  useEffect(() => {
    if (!hasSupabase) return
    ;(async () => {
      try {
        const [{ data: emps }, { data: atts }, { data: leaves }, { data: sets }, { data: usrs }] = await Promise.all([
          supabase.from('employees').select('*'),
          supabase.from('attendances').select('*'),
          supabase.from('leave_requests').select('*'),
          supabase.from('system_settings').select('*').limit(1),
          supabase.from('users').select('*'),
        ])
        if (emps?.length) setEmployees(emps.map(toCamelObj))
        if (atts?.length) setAttendances(atts.map(toCamelObj))
        if (leaves?.length) setLeaveRequests(leaves.map(toCamelObj))
        if (sets?.length) setSettings({ ...defaultSettings, ...toCamelObj(sets[0]) })
        if (usrs?.length) setUsers(usrs.map(toCamelObj))
      } catch (e) { console.warn('Supabase load failed, using local data', e) }
    })()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ users, employees, attendances, leaveRequests, settings, schedules, currentUser, theme }))
  }, [users, employees, attendances, leaveRequests, settings, schedules, currentUser, theme])

  const login = useCallback(async (username, password) => {
    if (hasSupabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle()
        if (!error && data) {
          const u = toCamelObj(data)
          if (u.password === password || u.passwordHash === password) {
            setCurrentUser(u)
            return { ok: true, user: u }
          }
          return { ok: false, message: 'Password salah' }
        }
      } catch (e) { console.warn('Supabase login failed', e) }
    }
    const u = users.find((x) => x.username === username && (x.password === password || x.passwordHash === password))
    if (!u) return { ok: false, message: 'Username atau password salah' }
    setCurrentUser(u)
    return { ok: true, user: u }
  }, [users])

  const logout = useCallback(() => setCurrentUser(null), [])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const addEmployee = useCallback((emp) => {
    const { password, ...empData } = emp
    const id = 'e' + Date.now()
    const row = { ...empData, id, password: undefined }
    delete row.password
    setEmployees((prev) => [...prev, row])
    if (hasSupabase) supabase.from('employees').insert(toSnakeObj(row)).then(() => {})
    // create login account if password provided
    if (password) {
      const userId = 'u' + Date.now()
      const userRow = { id: userId, username: emp.nip, passwordHash: password, role: emp.role || 'pegawai', employeeId: id }
      setUsers((prev) => [...prev, userRow])
      if (hasSupabase) supabase.from('users').insert(toSnakeObj(userRow)).then((r) => { if (r.error) console.warn(r.error) })
    }
  }, [])
  const updateEmployee = useCallback((id, patch) => {
    const { password, ...empPatch } = patch
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...empPatch } : e)))
    if (hasSupabase && Object.keys(empPatch).length) supabase.from('employees').update(toSnakeObj(empPatch)).eq('id', id).then(() => {})
    // sync user account
    if (password || patch.nip || patch.role) {
      setUsers((prev) => prev.map((u) => (u.employeeId === id ? { ...u, username: patch.nip || u.username, role: patch.role || u.role, password: password || u.password, passwordHash: password || u.passwordHash } : u)))
      const userPatch = {}
      if (patch.nip) userPatch.username = patch.nip
      if (patch.role) userPatch.role = patch.role
      if (password) userPatch.passwordHash = password
      if (Object.keys(userPatch).length && hasSupabase) {
        supabase.from('users').update(toSnakeObj(userPatch)).eq('employee_id', id).then(() => {})
      }
      if (password) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.employeeId === id)
          if (exists) return prev
          const newRow = { id: 'u' + Date.now(), username: patch.nip || id, password, passwordHash: password, role: patch.role || 'pegawai', employeeId: id }
          if (hasSupabase) supabase.from('users').insert(toSnakeObj(newRow)).then(() => {})
          return [...prev, newRow]
        })
      }
    }
  }, [])
  const deleteEmployee = useCallback((id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setUsers((prev) => prev.filter((u) => u.employeeId !== id))
    if (hasSupabase) {
      supabase.from('employees').delete().eq('id', id).then(() => {})
      supabase.from('users').delete().eq('employee_id', id).then(() => {})
    }
  }, [])

  const checkIn = useCallback((employeeId, payload) => {
    const today = new Date().toISOString().slice(0, 10)
    const row = { id: 'a-' + Date.now(), employeeId, date: today, checkOut: null, status: payload.status || 'hadir', lateMinutes: payload.lateMinutes || 0, earlyLeaveMinutes: 0, ...payload }
    setAttendances((prev) => {
      const existing = prev.find((a) => a.employeeId === employeeId && a.date === today)
      if (existing) return prev.map((a) => (a.id === existing.id ? { ...a, checkIn: payload.time, ...payload } : a))
      return [...prev, row]
    })
    if (hasSupabase) supabase.from('attendances').upsert(toSnakeObj(row)).then(() => {})
  }, [])
  const checkOut = useCallback((employeeId, payload) => {
    const today = new Date().toISOString().slice(0, 10)
    setAttendances((prev) => prev.map((a) => (a.employeeId === employeeId && a.date === today ? { ...a, checkOut: payload.time, ...payload } : a)))
    if (hasSupabase) {
      const existing = attendances.find((a) => a.employeeId === employeeId && a.date === today)
      if (existing) supabase.from('attendances').update(toSnakeObj(payload)).eq('id', existing.id).then(() => {})
    }
  }, [attendances])

  const addLeaveRequest = useCallback((lr) => {
    const row = { ...lr, id: 'lr' + Date.now(), status: 'pending', approvedBy: null, note: '' }
    setLeaveRequests((prev) => [...prev, row])
    if (hasSupabase) supabase.from('leave_requests').insert(toSnakeObj(row)).then(() => {})
  }, [])
  const updateLeaveRequest = useCallback((id, patch) => {
    setLeaveRequests((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    if (hasSupabase) supabase.from('leave_requests').update(toSnakeObj(patch)).eq('id', id).then(() => {})
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch }
      if (hasSupabase) supabase.from('system_settings').upsert({ id: 1, ...toSnakeObj(next) }).then(() => {})
      return next
    })
  }, [])

  const value = {
    hasSupabase, users, employees, attendances, leaveRequests, settings, schedules, currentUser,
    theme, toggleTheme, login, logout, addEmployee, updateEmployee, deleteEmployee,
    checkIn, checkOut, addLeaveRequest, updateLeaveRequest, updateSettings, avatarUrl,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() { return useContext(Ctx) }