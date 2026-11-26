import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, Select, Input, Label } from '../components/ui'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { avatarUrl } from '../lib/mockData'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

export default function Reports() {
  const { employees, attendances, settings } = useApp()
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [empId, setEmpId] = useState('all')
  const [format, setFormat] = useState('xlsx')

  const buildRows = () => {
    let atts = attendances.filter((a) => a.date >= from && a.date <= to)
    if (empId !== 'all') atts = atts.filter((a) => a.employeeId === empId)
    return atts.map((a) => {
      const e = employees.find((x) => x.id === a.employeeId)
      return {
        Tanggal: a.date,
        NIP: e?.nip || '',
        Nama: e?.name || '',
        Jabatan: e?.position || '',
        'Jam Masuk': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID') : '-',
        'Jam Pulang': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID') : '-',
        Status: a.status,
        'Terlambat (mnt)': a.lateMinutes || 0,
        'Pulang Cepat (mnt)': a.earlyLeaveMinutes || 0,
        'Jarak (m)': a.distance || '',
      }
    })
  }

  const exportXlsx = () => {
    const rows = buildRows()
    const ws = XLSX.utils.json_to_sheet(rows)
    // auto width
    const cols = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length, 12) }))
    ws['!cols'] = cols
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi')
    XLSX.writeFile(wb, `laporan_absensi_${from}_${to}.xlsx`)
    toast.success('Excel diunduh')
  }

  const exportCsv = () => {
    const rows = buildRows()
    const ws = XLSX.utils.json_to_sheet(rows)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `laporan_absensi_${from}_${to}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV diunduh')
  }

  const exportPdf = () => {
    const rows = buildRows()
    const doc = new jsPDF('landscape')
    // letterhead
    doc.setFontSize(14); doc.text(settings.foundationName || '', 14, 12)
    doc.setFontSize(16); doc.text(settings.schoolName || '', 14, 20)
    doc.setFontSize(9); doc.text(settings.address || '', 14, 26)
    doc.text(`Telp: ${settings.phone} · Email: ${settings.email} · ${settings.website}`, 14, 31)
    doc.line(14, 34, 283, 34)
    doc.setFontSize(12); doc.text('Laporan Kehadiran Pegawai', 14, 42)
    doc.setFontSize(9); doc.text(`Periode: ${from} s/d ${to}`, 14, 48)
    autoTable(doc, {
      startY: 52,
      head: [['Tanggal','NIP','Nama','Jabatan','Masuk','Pulang','Status','Telat','PC']],
      body: rows.map((r) => [r.Tanggal, r.NIP, r.Nama, r.Jabatan, r['Jam Masuk'], r['Jam Pulang'], r.Status, r['Terlambat (mnt)'], r['Pulang Cepat (mnt)']]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    })
    const y = doc.lastAutoTable.finalY + 8
    doc.text('Tata Usaha', 14, y + 10)
    doc.text('Kepala Sekolah', 120, y + 10)
    doc.text('Yayasan', 220, y + 10)
    doc.save(`laporan_absensi_${from}_${to}.pdf`)
    toast.success('PDF diunduh')
  }

  const run = () => {
    if (format === 'xlsx') exportXlsx()
    else if (format === 'csv') exportCsv()
    else exportPdf()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Kehadiran</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Ekspor Excel, CSV, PDF dengan kop surat</p>
      </div>
      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div><Label>Dari</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>Sampai</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label>Pegawai</Label>
            <Select value={empId} onChange={(e) => setEmpId(e.target.value)}>
              <option value="all">Semua</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </div>
          <div><Label>Format</Label>
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (.pdf)</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={run}><Download size={16} /> Ekspor</Button>
          <span className="text-xs text-[var(--color-muted-foreground)] self-center">{buildRows().length} baris data</span>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Preview Data</h3>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="text-left text-[var(--color-muted-foreground)]">
              <tr><th className="py-1">Tanggal</th><th>Nama</th><th>Masuk</th><th>Pulang</th><th>Status</th><th>Telat</th></tr>
            </thead>
            <tbody>
              {buildRows().map((r, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  <td className="py-1">{r.Tanggal}</td><td>{r.Nama}</td><td>{r['Jam Masuk']}</td><td>{r['Jam Pulang']}</td><td>{r.Status}</td><td>{r['Terlambat (mnt)']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}