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
  const [users] = useState(initial?.users || seedUsers)
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
        const [{ data: emps }, { data: atts }, { data: leaves }, { data: sets }] = await Promise.all([
          supabase.from('employees').select('*'),
          supabase.from('attendances').select('*'),
          supabase.from('leave_requests').select('*'),
          supabase.from('system_settings').select('*').limit(1),
        ])
        if (emps?.length) setEmployees(emps.map(toCamelObj))
        if (atts?.length) setAttendances(atts.map(toCamelObj))
        if (leaves?.length) setLeaveRequests(leaves.map(toCamelObj))
        if (sets?.length) setSettings({ ...defaultSettings, ...toCamelObj(sets[0]) })
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

  const login = useCallback((username, password) => {
    const u = users.find((x) => x.username === username && x.password === password)
    if (!u) return { ok: false, message: 'Username atau password salah' }
    setCurrentUser(u)
    return { ok: true, user: u }
  }, [users])

  const logout = useCallback(() => setCurrentUser(null), [])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const addEmployee = useCallback((emp) => {
    const row = { ...emp, id: 'e' + Date.now() }
    setEmployees((prev) => [...prev, row])
    if (hasSupabase) supabase.from('employees').insert(toSnakeObj(row)).then(() => {})
  }, [])
  const updateEmployee = useCallback((id, patch) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    if (hasSupabase) supabase.from('employees').update(toSnakeObj(patch)).eq('id', id).then(() => {})
  }, [])
  const deleteEmployee = useCallback((id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    if (hasSupabase) supabase.from('employees').delete().eq('id', id).then(() => {})
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