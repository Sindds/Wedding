// @vitest-environment node
/**
 * Сквозная проверка API в режиме Postgres: форма → админка (чтение) → удаление → выгрузка.
 * Имитирует Vercel: VERCEL=1 + DATABASE_URL. Нужен TEST_DATABASE_URL (см. storage-postgres.test.ts).
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { isolatedDatabaseUrl } from '../pg-helpers'

const BASE = process.env.TEST_DATABASE_URL

describe.skipIf(!BASE)('API поверх Postgres (как на Vercel)', () => {
  let db: Pool
  let POST: typeof import('@/app/api/rsvp/route').POST
  let admin: typeof import('@/app/api/admin/route')
  let exp: typeof import('@/app/api/admin/export/route')
  const H = { 'x-admin-token': 'test-secret' }

  let URL_ = ''

  beforeAll(async () => {
    URL_ = await isolatedDatabaseUrl(BASE!, 'test_api')
    process.env.VERCEL = '1'
    process.env.DATABASE_URL = URL_
    process.env.RSVP_DATA_FILE = '/tmp/should-not-be-used.json' // на Vercel игнорируется
    process.env.ADMIN_TOKEN = 'test-secret'
    db = new Pool({ connectionString: URL_ })
    ;({ POST } = await import('@/app/api/rsvp/route'))
    admin = await import('@/app/api/admin/route')
    exp = await import('@/app/api/admin/export/route')
  })
  beforeEach(async () => { await db.query('DELETE FROM rsvp_entries').catch(() => undefined) })
  afterAll(async () => {
    await db.end()
    delete process.env.VERCEL; delete process.env.DATABASE_URL; delete process.env.RSVP_DATA_FILE
  })

  const send = (body: unknown) => POST(new NextRequest('http://localhost/api/rsvp', {
    method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
  }))
  const list = async () => (await admin.GET(new NextRequest('http://localhost/api/admin', { headers: H }))).json()

  it('ответ из формы попадает в базу и виден в админке', async () => {
    const res = await send({ name: 'Иван', drinks: ['wine', 'custom'], customDrink: 'Квас' })
    expect(res.status).toBe(201)
    const { id } = await res.json()

    const { rows } = await db.query('SELECT name, drinks, custom_drink FROM rsvp_entries WHERE id = $1', [id])
    expect(rows).toEqual([{ name: 'Иван', drinks: ['wine', 'custom'], custom_drink: 'Квас' }])

    const body = await list()
    expect(body.entries).toHaveLength(1)
    expect(body.entries[0]).toMatchObject({ id, name: 'Иван', customDrink: 'Квас' })
    expect(body.stats).toEqual({ total: 1, drinkCounts: { wine: 1, 'Квас': 1 } })
  })

  it('удаление из админки удаляет из базы', async () => {
    const a = await (await send({ name: 'Анна', drinks: ['champagne'] })).json()
    const b = await (await send({ name: 'Борис', drinks: ['beer'] })).json()
    const res = await admin.DELETE(new NextRequest('http://localhost/api/admin', {
      method: 'DELETE', body: JSON.stringify({ ids: [a.id] }), headers: H,
    }))
    expect(await res.json()).toEqual({ success: true, deleted: 1 })
    expect((await list()).entries.map((e: { id: string }) => e.id)).toEqual([b.id])
  })

  it('выгрузка Excel берёт данные из базы', async () => {
    await send({ name: 'Анна', drinks: ['champagne'] })
    const res = await exp.GET(new NextRequest('http://localhost/api/admin/export?category=guests', { headers: H }))
    expect(res.status).toBe(200)
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(1000)
  })

  it('недоступная база → понятная ошибка 500, а не падение', async () => {
    process.env.DATABASE_URL = 'postgres://nobody@127.0.0.1:1/none'
    const res = await admin.GET(new NextRequest('http://localhost/api/admin', { headers: H }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/базы данных/)
    const form = await send({ name: 'Иван', drinks: ['wine'] })
    expect(form.status).toBe(500)
    process.env.DATABASE_URL = URL_
  })

  it('Vercel без базы → 503 с подсказкой, что делать', async () => {
    delete process.env.DATABASE_URL
    const res = await admin.GET(new NextRequest('http://localhost/api/admin', { headers: H }))
    expect(res.status).toBe(503)
    expect((await res.json()).error).toMatch(/Storage/)
    process.env.DATABASE_URL = URL_
  })
})
