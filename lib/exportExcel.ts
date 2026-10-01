import ExcelJS from 'exceljs'
import type { RsvpEntry, ExportCategory } from '@/types'
import { drinkLabel } from '@/lib/constants'

// Цвета Excel-выгрузки задаются в ARGB — это формат файла, а не CSS, поэтому они здесь, а не в tokens.css
const XL = {
  headerBg:  'FF2B2D6B', // --ink-800
  headerFg:  'FFFFE2A8', // --candle-200
  rowEven:   'FFEEF0FB',
  rowOdd:    'FFFFFFFF',
  text:      'FF1B1C4B', // --ink-900
  border:    'FFD5D9F2',
} as const

function fmt(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.headerBg } }
    cell.font      = { bold: true, color: { argb: XL.headerFg }, name: 'Calibri', size: 12 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  row.height = 28
}

function styleRow(row: ExcelJS.Row, even: boolean) {
  row.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: even ? XL.rowEven : XL.rowOdd } }
    cell.font      = { name: 'Calibri', size: 11, color: { argb: XL.text } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    cell.border    = { bottom: { style: 'hair', color: { argb: XL.border } } }
  })
  row.height = 22
}

const drinksOf = (e: RsvpEntry) => e.drinks.map((d) => drinkLabel(e, d)).join(', ') || '—'

function buildAll(wb: ExcelJS.Workbook, entries: RsvpEntry[]) {
  const ws = wb.addWorksheet('Все ответы')
  ws.columns = [
    { key: 'date',   header: 'Дата',      width: 18 },
    { key: 'name',   header: 'Имя',       width: 26 },
    { key: 'drinks', header: 'Напитки',   width: 40 },
  ]
  styleHeader(ws.getRow(1))
  entries.forEach((e, i) => styleRow(ws.addRow({
    date: fmt(e.submittedAt), name: e.name, drinks: drinksOf(e),
  }), i % 2 === 0))
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

function buildGuests(wb: ExcelJS.Workbook, entries: RsvpEntry[]) {
  const ws = wb.addWorksheet('Гости')
  ws.columns = [
    { key: 'n',    header: '№',           width: 6 },
    { key: 'name', header: 'Имя',         width: 30 },
    { key: 'date', header: 'Дата ответа', width: 18 },
  ]
  styleHeader(ws.getRow(1))
  entries.forEach((e, i) => styleRow(ws.addRow({ n: i + 1, name: e.name, date: fmt(e.submittedAt) }), i % 2 === 0))
  ws.addRow([])
  const total = ws.addRow(['', 'Всего гостей:', entries.length])
  total.font = { bold: true, color: { argb: XL.text } }
}

function buildDrinks(wb: ExcelJS.Workbook, entries: RsvpEntry[]) {
  const ws = wb.addWorksheet('Напитки')
  ws.columns = [
    { key: 'name',   header: 'Имя',     width: 26 },
    { key: 'drinks', header: 'Напитки', width: 40 },
    { key: 'date',   header: 'Дата',    width: 18 },
  ]
  styleHeader(ws.getRow(1))
  entries.forEach((e, i) => styleRow(ws.addRow({ name: e.name, drinks: drinksOf(e), date: fmt(e.submittedAt) }), i % 2 === 0))

  const counts: Record<string, number> = {}
  for (const e of entries) for (const d of e.drinks) {
    const label = drinkLabel(e, d)
    counts[label] = (counts[label] ?? 0) + 1
  }
  ws.addRow([])
  ws.addRow(['Сводка:']).font = { bold: true }
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, n]) => ws.addRow(['', label, n]))
}

export async function generateExcel(entries: RsvpEntry[], category: ExportCategory): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'Wedding RSVP'
  wb.created  = new Date()
  wb.modified = new Date()

  switch (category) {
    case 'all':    buildAll(wb, entries); buildDrinks(wb, entries); break
    case 'guests': buildGuests(wb, entries); break
    case 'drinks': buildDrinks(wb, entries); break
  }

  return Buffer.from(await wb.xlsx.writeBuffer())
}
