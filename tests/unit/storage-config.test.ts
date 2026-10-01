// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolveStorageConfig, StorageConfigError } from '@/lib/storage'
import { normalizeConnectionString } from '@/lib/storage-postgres'

const NEON = 'postgresql://user:p%40ss@ep-cool-name-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

describe('выбор хранилища (resolveStorageConfig)', () => {
  it('локально без базы — файл data/rsvp.json', () => {
    const cfg = resolveStorageConfig({})
    expect(cfg.kind).toBe('file')
    if (cfg.kind === 'file') expect(cfg.file).toMatch(/data[\\/]rsvp\.json$/)
  })

  it('DATABASE_URL задан — Postgres', () => {
    expect(resolveStorageConfig({ DATABASE_URL: NEON })).toEqual({ kind: 'postgres', url: NEON })
  })

  it('POSTGRES_URL тоже подходит (совместимость со старыми шаблонами Vercel)', () => {
    expect(resolveStorageConfig({ POSTGRES_URL: NEON })).toEqual({ kind: 'postgres', url: NEON })
  })

  it('локально RSVP_DATA_FILE важнее DATABASE_URL — e2e не пишут в боевую базу', () => {
    expect(resolveStorageConfig({ RSVP_DATA_FILE: 'x.json', DATABASE_URL: NEON }))
      .toEqual({ kind: 'file', file: 'x.json' })
  })

  it('на Vercel без базы — понятная ошибка вместо тихой потери ответов', () => {
    expect(() => resolveStorageConfig({ VERCEL: '1' })).toThrow(StorageConfigError)
    expect(() => resolveStorageConfig({ VERCEL: '1' })).toThrow(/DATABASE_URL/)
  })

  it('на Vercel файловый режим запрещён даже при RSVP_DATA_FILE', () => {
    expect(() => resolveStorageConfig({ VERCEL: '1', RSVP_DATA_FILE: 'x.json' })).toThrow(StorageConfigError)
    expect(resolveStorageConfig({ VERCEL: '1', RSVP_DATA_FILE: 'x.json', DATABASE_URL: NEON }).kind).toBe('postgres')
  })
})

describe('normalizeConnectionString', () => {
  it('sslmode=require → verify-full, остальное без изменений', () => {
    const out = new URL(normalizeConnectionString(NEON))
    expect(out.searchParams.get('sslmode')).toBe('verify-full')
    expect(out.searchParams.get('channel_binding')).toBe('require')
    expect(out.hostname).toBe('ep-cool-name-pooler.eu-central-1.aws.neon.tech')
    expect(out.password).toBe('p%40ss') // закодированный пароль не портится
  })

  it('строку без sslmode (локальный Postgres) не трогает', () => {
    const local = 'postgres://postgres@127.0.0.1:5432/rsvp'
    expect(normalizeConnectionString(local)).toBe(local)
  })

  it('нестандартную строку возвращает как есть', () => {
    expect(normalizeConnectionString('не url')).toBe('не url')
  })
})
