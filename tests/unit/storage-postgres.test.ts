// @vitest-environment node
/**
 * Проверка Postgres-хранилища на настоящей базе.
 * Запускается, только если задан TEST_DATABASE_URL (отдельная тестовая база — таблица очищается!):
 *   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/rsvp_test npm test
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { Pool } from 'pg'
import { createPostgresStorage, TABLE } from '@/lib/storage-postgres'
import type { RsvpEntry } from '@/types'
import { isolatedDatabaseUrl } from '../pg-helpers'

const URL_ = process.env.TEST_DATABASE_URL

const entry = (i: number, extra: Partial<RsvpEntry> = {}): RsvpEntry => ({
  id: `id-${i}`, submittedAt: new Date(Date.UTC(2026, 9, 1, 0, 0, i)).toISOString(),
  name: `Гость ${i}`, drinks: ['wine'], customDrink: '', ...extra,
})

describe.skipIf(!URL_)('postgres storage (нужен TEST_DATABASE_URL)', () => {
  let admin: Pool
  let s: ReturnType<typeof createPostgresStorage>

  beforeAll(async () => {
    const url = await isolatedDatabaseUrl(URL_!, 'test_storage')
    admin = new Pool({ connectionString: url })
    s = createPostgresStorage(url)
  })
  beforeEach(async () => {
    await admin.query(`DELETE FROM ${TABLE}`).catch(() => undefined) // таблицы может ещё не быть
  })
  afterAll(async () => {
    await s?.close()
    await admin?.end()
  })

  it('сама создаёт таблицу при первом обращении', async () => {
    expect(await s.readEntries()).toEqual([])
    const { rows } = await admin.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'test_storage' AND table_name = $1 ORDER BY ordinal_position`, [TABLE])
    expect(rows.map((r) => r.column_name)).toEqual(['id', 'name', 'drinks', 'custom_drink', 'submitted_at'])
  })

  it('сохраняет и читает все поля без искажений (кириллица, несколько напитков, свой напиток)', async () => {
    const e = entry(1, { name: 'Анна-Мария Ёлкина', drinks: ['champagne', 'custom'], customDrink: 'Сидр «Яблочный»' })
    await s.addEntry(e)
    expect(await s.readEntries()).toEqual([e])
  })

  it('не теряет ответы при 40 одновременных отправках', async () => {
    await Promise.all(Array.from({ length: 40 }, (_, i) => s.addEntry(entry(i))))
    const all = await s.readEntries()
    expect(all).toHaveLength(40)
    expect(new Set(all.map((x) => x.id)).size).toBe(40)
  })

  it('отдаёт записи в порядке отправки', async () => {
    await s.addEntry(entry(3)); await s.addEntry(entry(1)); await s.addEntry(entry(2))
    expect((await s.readEntries()).map((x) => x.id)).toEqual(['id-1', 'id-2', 'id-3'])
  })

  it('удаляет по id и возвращает число удалённых; чужие и «кривые» id не ломают запрос', async () => {
    for (let i = 0; i < 3; i++) await s.addEntry(entry(i))
    expect(await s.deleteEntries(['id-1', 'missing', "'; DROP TABLE rsvp_entries; --"])).toBe(1)
    expect((await s.readEntries()).map((x) => x.id)).toEqual(['id-0', 'id-2'])
  })

  it('имя с SQL-символами сохраняется как обычный текст (параметризованные запросы)', async () => {
    const e = entry(7, { name: "Robert'); DROP TABLE rsvp_entries;--" })
    await s.addEntry(e)
    expect((await s.readEntries())[0].name).toBe(e.name)
  })

  it('повторный id отклоняется базой (PRIMARY KEY), а не перезаписывает ответ', async () => {
    await s.addEntry(entry(1))
    await expect(s.addEntry(entry(1, { name: 'Другой' }))).rejects.toThrow()
    expect((await s.readEntries())[0].name).toBe('Гость 1')
  })
})
