// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { NextRequest } from 'next/server'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsvp-api-'))
process.env.RSVP_DATA_FILE = path.join(dir, 'rsvp.json')
// Эти тесты проверяют файловый режим — убираем переменные, которые включили бы Postgres
delete process.env.DATABASE_URL
delete process.env.POSTGRES_URL
delete process.env.VERCEL

const { POST } = await import('@/app/api/rsvp/route')
const admin = await import('@/app/api/admin/route')
const exp = await import('@/app/api/admin/export/route')

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new NextRequest('http://localhost/api/rsvp', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } }))

beforeEach(() => {
  fs.writeFileSync(process.env.RSVP_DATA_FILE!, '[]')
  process.env.ADMIN_TOKEN = 'test-secret'
})
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('POST /api/rsvp', () => {
  it('201 и запись без поля attendance', async () => {
    const res = await post(JSON.stringify({ name: 'Иван', drinks: ['wine'], attendance: 'no', wishes: 'старое поле' }))
    expect(res.status).toBe(201)
    const saved = JSON.parse(fs.readFileSync(process.env.RSVP_DATA_FILE!, 'utf-8'))
    expect(saved).toHaveLength(1)
    expect(saved[0]).not.toHaveProperty('attendance')
    expect(saved[0]).not.toHaveProperty('wishes')
    expect(saved[0]).toMatchObject({ name: 'Иван', drinks: ['wine'] })
  })

  it('422 при ошибке валидации', async () => {
    const res = await post(JSON.stringify({ name: 'И', drinks: [] }))
    expect(res.status).toBe(422)
    expect((await res.json()).success).toBe(false)
  })

  it('400 на битый JSON (раньше — 500)', async () => {
    const res = await post('{not json')
    expect(res.status).toBe(400)
  })

  it('413 на слишком большое тело запроса', async () => {
    const res = await post(JSON.stringify({ name: 'Иван', drinks: ['wine'], comment: 'x'.repeat(20_000) }))
    expect(res.status).toBe(413)
  })
})

describe('GET /api/admin', () => {
  const get = (headers: Record<string, string> = {}, qs = '') =>
    admin.GET(new NextRequest(`http://localhost/api/admin${qs}`, { headers }))

  it('503, если ADMIN_TOKEN не задан (fail-closed)', async () => {
    delete process.env.ADMIN_TOKEN
    expect((await get({ 'x-admin-token': 'wedding2026' })).status).toBe(503)
  })

  it('401 при неверном токене и при токене в query-строке', async () => {
    expect((await get({ 'x-admin-token': 'bad' })).status).toBe(401)
    expect((await get({}, '?token=test-secret')).status).toBe(401)
  })

  it('200 и статистика без «второй половинки»', async () => {
    await post(JSON.stringify({ name: 'Анна', drinks: ['champagne'] }))
    const res = await get({ 'x-admin-token': 'test-secret' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stats).toEqual({ total: 1, drinkCounts: { champagne: 1 } })
  })

  it('DELETE: 400 на битый JSON', async () => {
    const res = await admin.DELETE(new NextRequest('http://localhost/api/admin', {
      method: 'DELETE', body: '{', headers: { 'x-admin-token': 'test-secret' },
    }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/export', () => {
  it('отдаёт xlsx по заголовку авторизации', async () => {
    await post(JSON.stringify({ name: 'Анна', drinks: ['champagne'] }))
    const res = await exp.GET(new NextRequest('http://localhost/api/admin/export?category=drinks', {
      headers: { 'x-admin-token': 'test-secret' },
    }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
    expect(res.headers.get('content-disposition')).toContain('rsvp_drinks_')
  })

  it('401 без токена', async () => {
    const res = await exp.GET(new NextRequest('http://localhost/api/admin/export'))
    expect(res.status).toBe(401)
  })
})
