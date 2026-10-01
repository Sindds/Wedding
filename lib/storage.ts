import path from 'node:path'
import type { RsvpEntry } from '@/types'
import { createFileStorage } from '@/lib/storage-file'
import { createPostgresStorage } from '@/lib/storage-postgres'

/** Общий интерфейс хранилища ответов. API-маршруты работают только с ним. */
export interface Storage {
  readEntries(): Promise<RsvpEntry[]>
  addEntry(entry: RsvpEntry): Promise<void>
  /** Возвращает количество реально удалённых записей. */
  deleteEntries(ids: string[]): Promise<number>
}

export type StorageKind = 'file' | 'postgres'

export class StorageConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageConfigError'
  }
}

type Env = Record<string, string | undefined>

/**
 * Какое хранилище использовать — по переменным окружения:
 *
 * 1. RSVP_DATA_FILE задан и это НЕ Vercel → файл (явный выбор: тесты, e2e).
 *    Нужно, чтобы e2e-тесты не писали в боевую базу, даже если DATABASE_URL лежит в .env.local.
 * 2. DATABASE_URL (или POSTGRES_URL) задан → Postgres. Обе переменные создаёт интеграция Neon на Vercel.
 * 3. Это Vercel, а базы нет → ошибка. Раньше ответы молча писались во временный файл и пропадали.
 * 4. Иначе → файл data/rsvp.json (локальная разработка без базы).
 */
export function resolveStorageConfig(env: Env = process.env):
  | { kind: 'file'; file: string }
  | { kind: 'postgres'; url: string } {
  const onVercel = Boolean(env.VERCEL)
  const dbUrl = env.DATABASE_URL || env.POSTGRES_URL

  if (env.RSVP_DATA_FILE && !onVercel) return { kind: 'file', file: env.RSVP_DATA_FILE }
  if (dbUrl) return { kind: 'postgres', url: dbUrl }
  if (onVercel) {
    throw new StorageConfigError(
      'На Vercel не подключена база данных: нет переменной DATABASE_URL. ' +
      'Подключите Neon в разделе Storage проекта и сделайте Redeploy (см. README → «Деплой на Vercel»).',
    )
  }
  return { kind: 'file', file: path.join(process.cwd(), 'data', 'rsvp.json') }
}

let instance: Storage | null = null
let instanceKey = ''

/** Хранилище для API-маршрутов. Создаётся один раз и переиспользуется между запросами. */
export function getStorage(): Storage {
  const cfg = resolveStorageConfig()
  const key = cfg.kind === 'file' ? `file:${cfg.file}` : `pg:${cfg.url}`
  if (!instance || instanceKey !== key) {
    instance = cfg.kind === 'file' ? createFileStorage(cfg.file) : createPostgresStorage(cfg.url)
    instanceKey = key
  }
  return instance
}
