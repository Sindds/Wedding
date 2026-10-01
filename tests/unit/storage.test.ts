// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createFileStorage as createStorage } from '@/lib/storage-file'
import type { RsvpEntry } from '@/types'

let dir: string
let file: string
const entry = (i: number): RsvpEntry => ({
  id: `id-${i}`, submittedAt: new Date(2026, 9, 1, 0, 0, i).toISOString(),
  name: `Гость ${i}`, drinks: ['wine'], customDrink: '',
})

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsvp-'))
  file = path.join(dir, 'nested', 'rsvp.json')
})

describe('storage', () => {
  it('создаёт файл при первом чтении', async () => {
    const s = createStorage(file)
    expect(await s.readEntries()).toEqual([])
    expect(fs.existsSync(file)).toBe(true)
  })

  it('не теряет ответы при одновременной отправке (гонка read-modify-write)', async () => {
    const s = createStorage(file)
    await Promise.all(Array.from({ length: 40 }, (_, i) => s.addEntry(entry(i))))
    const all = await s.readEntries()
    expect(all).toHaveLength(40)
    expect(new Set(all.map(e => e.id)).size).toBe(40)
  })

  it('удаляет по id', async () => {
    const s = createStorage(file)
    for (let i = 0; i < 3; i++) await s.addEntry(entry(i))
    expect(await s.deleteEntries(['id-1', 'missing'])).toBe(1)
    expect((await s.readEntries()).map(e => e.id)).toEqual(['id-0', 'id-2'])
  })

  it('битый JSON не затирается молча — сохраняется резервная копия', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, '{ битый json', 'utf-8')
    const s = createStorage(file)
    expect(await s.readEntries()).toEqual([])
    await s.addEntry(entry(1))
    const backups = fs.readdirSync(path.dirname(file)).filter(f => f.includes('corrupt'))
    expect(backups.length).toBe(1)
    expect(fs.readFileSync(path.join(path.dirname(file), backups[0]), 'utf-8')).toBe('{ битый json')
  })

  it('запись атомарная: после записи нет временных файлов', async () => {
    const s = createStorage(file)
    await s.addEntry(entry(1))
    expect(fs.readdirSync(path.dirname(file)).filter(f => f.endsWith('.tmp'))).toEqual([])
  })
})
