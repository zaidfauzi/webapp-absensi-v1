import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [exportOpen, setExportOpen] = useState(false)
  const [reportSettingsOpen, setReportSettingsOpen] = useState(false)
  const [reportSettings, setReportSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('reportSettings') || '{}') } catch { return {} }
  })

  useEffect(() => { localStorage.setItem('reportSettings', JSON.stringify(reportSettings)) }, [reportSettings])
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
    const rs = { title: 'Laporan Kehadiran Pegawai', orientation: 'landscape', showSignature: true, footerNote: '', ...reportSettings }
    const doc = new jsPDF(rs.orientation === 'portrait' ? 'portrait' : 'landscape')
    const pageWidth = doc.internal.pageSize.getWidth()
    // letterhead
    doc.setFontSize(14); doc.text(settings.foundationName || '', 14, 12)
    doc.setFontSize(16); doc.text(settings.schoolName || '', 14, 20)
    doc.setFontSize(9); doc.text(settings.address || '', 14, 26)
    doc.text(`Telp: ${settings.phone} · Email: ${settings.email} · ${settings.website}`, 14, 31)
    doc.line(14, 34, pageWidth - 14, 34)
    doc.setFontSize(13); doc.text(rs.title || 'Laporan Kehadiran Pegawai', 14, 42)
    doc.setFontSize(9); doc.text(`Periode: ${from} s/d ${to}`, 14, 48)
    if (rs.footerNote) { doc.setFontSize(8); doc.text(rs.footerNote, 14, 52) }
    autoTable(doc, {
      startY: rs.footerNote ? 56 : 52,
      head: [['Tanggal','NIP','Nama','Jabatan','Masuk','Pulang','Status','Telat','PC']],
      body: rows.map((r) => [r.Tanggal, r.NIP, r.Nama, r.Jabatan, r['Jam Masuk'], r['Jam Pulang'], r.Status, r['Terlambat (mnt)'], r['Pulang Cepat (mnt)']]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    })
    const y = doc.lastAutoTable.finalY + 8
    if (rs.showSignature !== false) {
      doc.text('Tata Usaha', 14, y + 10)
      doc.text('Kepala Sekolah', pageWidth / 2 - 20, y + 10)
      doc.text('Yayasan', pageWidth - 40, y + 10)
    }
    // page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 8)
    }
    doc.save(`laporan_absensi_${from}_${to}.pdf`)
    toast.success('PDF diunduh')
  }

  const run = () => {
    exportXlsx()
  }

  const printReport = () => {
    const rows = buildRows()
    const rs = { title: 'Laporan Kehadiran Pegawai', orientation: 'landscape', showSignature: true, footerNote: '', ...reportSettings }
    const w = window.open('', '_blank')
    if (!w) { toast.error('Popup diblokir browser'); return }
    const thStyle = 'border:1px solid #999;padding:4px;background:#0f766e;color:#fff;font-size:10px;'
    const tdStyle = 'border:1px solid #ddd;padding:4px;font-size:10px;'
    const html = `
      <html><head><title>${rs.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .letterhead { text-align: center; margin-bottom: 10px; }
        .letterhead h2 { margin: 0; font-size: 16px; }
        .letterhead h3 { margin: 0; font-size: 12px; color: #555; }
        .line { border-top: 2px solid #0f766e; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .sig { margin-top: 40px; display: flex; justify-content: space-between; }
        .sig div { text-align: center; width: 30%; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="letterhead">
        <h2>${settings.foundationName || ''}</h2>
        <h2>${settings.schoolName || ''}</h2>
        <h3>${settings.address || ''}</h3>
        <h3>Telp: ${settings.phone || ''} · Email: ${settings.email || ''} · ${settings.website || ''}</h3>
      </div>
      <div class="line"></div>
      <h3>${rs.title || 'Laporan Kehadiran Pegawai'}</h3>
      <p style="font-size:11px;">Periode: ${from} s/d ${to}</p>
      ${rs.footerNote ? `<p style="font-size:10px;">${rs.footerNote}</p>` : ''}
      <table>
        <thead><tr>
          <th style="${thStyle}">Tanggal</th><th style="${thStyle}">NIP</th><th style="${thStyle}">Nama</th><th style="${thStyle}">Jabatan</th><th style="${thStyle}">Masuk</th><th style="${thStyle}">Pulang</th><th style="${thStyle}">Status</th><th style="${thStyle}">Telat</th><th style="${thStyle}">PC</th>
        </tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>
            <td style="${tdStyle}">${r.Tanggal}</td><td style="${tdStyle}">${r.NIP}</td><td style="${tdStyle}">${r.Nama}</td><td style="${tdStyle}">${r.Jabatan}</td><td style="${tdStyle}">${r['Jam Masuk']}</td><td style="${tdStyle}">${r['Jam Pulang']}</td><td style="${tdStyle}">${r.Status}</td><td style="${tdStyle}">${r['Terlambat (mnt)']}</td><td style="${tdStyle}">${r['Pulang Cepat (mnt)']}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${rs.showSignature !== false ? `<div class="sig"><div>Tata Usaha<br/><br/><br/>____________</div><div>Kepala Sekolah<br/><br/><br/>____________</div><div>Yayasan<br/><br/><br/>____________</div></div>` : ''}
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>
    `
    w.document.write(html)
    w.document.close()
  }

  // Rekap per pegawai
  const recapEmployee = () => {
    const map = {}
    buildRows().forEach((r) => {
      if (!map[r.Nama]) map[r.Nama] = { nama: r.Nama, nip: r.NIP, jabatan: r.Jabatan, hadir: 0, terlambat: 0, pulangCepat: 0, izin: 0, alpha: 0, telatMenit: 0, pcMenit: 0 }
      const e = map[r.Nama]
      if (r['Jam Masuk'] !== '-') e.hadir++
      if (r.Status === 'terlambat') e.terlambat++
      if ((r['Pulang Cepat (mnt)'] || 0) > 0) e.pulangCepat++
      if (['izin','sakit'].includes(r.Status)) e.izin++
      if (r['Jam Masuk'] === '-') e.alpha++
      e.telatMenit += r['Terlambat (mnt)'] || 0
      e.pcMenit += r['Pulang Cepat (mnt)'] || 0
    })
    return Object.values(map)
  }

  // Rekap per jabatan
  const recapPosition = () => {
    const map = {}
    buildRows().forEach((r) => {
      if (!map[r.Jabatan]) map[r.Jabatan] = { jabatan: r.Jabatan, hadir: 0, terlambat: 0, pulangCepat: 0, izin: 0, alpha: 0 }
      const p = map[r.Jabatan]
      if (r['Jam Masuk'] !== '-') p.hadir++
      if (r.Status === 'terlambat') p.terlambat++
      if ((r['Pulang Cepat (mnt)'] || 0) > 0) p.pulangCepat++
      if (['izin','sakit'].includes(r.Status)) p.izin++
      if (r['Jam Masuk'] === '-') p.alpha++
    })
    return Object.values(map)
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

        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setExportOpen(true)}><Download size={16} /> Ekspor</Button>
          <Button variant="outline" onClick={() => setReportSettingsOpen(true)}>Pengaturan Laporan</Button>
          <Button onClick={printReport}><Download size={16} /> Cetak</Button>
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

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setExportOpen(false)} />
          <Card className="relative z-10 w-full max-w-sm p-5 space-y-3">
            <h3 className="font-semibold">Pilih Format Ekspor</h3>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { exportXlsx(); setExportOpen(false) }}>Excel (.xlsx)</Button>
              <Button variant="outline" onClick={() => { exportCsv(); setExportOpen(false) }}>CSV (.csv)</Button>
              <Button variant="outline" onClick={() => { exportPdf(); setExportOpen(false) }}>PDF (.pdf)</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setExportOpen(false)}>Batal</Button>
          </Card>
        </div>
      )}

      {reportSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportSettingsOpen(false)} />
          <Card className="relative z-10 w-full max-w-md p-5 space-y-3">
            <h3 className="font-semibold">Pengaturan Laporan (Cetak)</h3>
            <div>
              <Label>Judul Laporan</Label>
              <Input value={reportSettings.title || ''} onChange={(e) => setReportSettings({ ...reportSettings, title: e.target.value })} placeholder="Laporan Kehadiran Pegawai" />
            </div>
            <div>
              <Label>Orientasi PDF</Label>
              <select className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={reportSettings.orientation || 'landscape'} onChange={(e) => setReportSettings({ ...reportSettings, orientation: e.target.value })}>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={reportSettings.showSignature !== false} onChange={(e) => setReportSettings({ ...reportSettings, showSignature: e.target.checked })} />
              <span className="text-sm">Tampilkan blok tanda tangan</span>
            </div>
            <div>
              <Label>Catatan Footer</Label>
              <Input value={reportSettings.footerNote || ''} onChange={(e) => setReportSettings({ ...reportSettings, footerNote: e.target.value })} placeholder="Catatan tambahan..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReportSettingsOpen(false)}>Tutup</Button>
              <Button className="flex-1" onClick={() => setReportSettingsOpen(false)}>Simpan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}