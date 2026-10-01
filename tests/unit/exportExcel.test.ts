// @vitest-environment node
import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { generateExcel } from '@/lib/exportExcel'
import type { RsvpEntry } from '@/types'

const entries: RsvpEntry[] = [
  { id: '1', submittedAt: '2026-10-01T10:00:00.000Z', name: 'Анна', drinks: ['wine', 'custom'], customDrink: 'Морс' },
  { id: '2', submittedAt: '2026-10-02T10:00:00.000Z', name: 'Олег', drinks: ['wine'], customDrink: '' },
]

async function load(buf: Buffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf as unknown as ArrayBuffer)
  return wb
}

describe('generateExcel', () => {
  it('«Всё» содержит листы ответов и напитков, без колонки статуса', async () => {
    const wb = await load(await generateExcel(entries, 'all'))
    expect(wb.worksheets.map(w => w.name)).toEqual(['Все ответы', 'Напитки'])
    const header = (wb.getWorksheet('Все ответы')!.getRow(1).values as unknown[]).filter(Boolean)
    expect(header).toEqual(['Дата', 'Имя', 'Напитки']) // колонки «Пожелания» больше нет
    expect(header).not.toContain('Статус')
  })

  it('лист напитков содержит сводку с количеством', async () => {
    const wb = await load(await generateExcel(entries, 'drinks'))
    const ws = wb.getWorksheet('Напитки')!
    const rows: unknown[][] = []
    ws.eachRow(r => rows.push((r.values as unknown[]).slice(1)))
    expect(rows).toContainEqual(['', 'Вино', 2])
    expect(rows).toContainEqual(['', 'Морс', 1])
  })

  it('пустой список не ломает выгрузку', async () => {
    const wb = await load(await generateExcel([], 'all'))
    expect(wb.worksheets.length).toBe(2)
  })
})
