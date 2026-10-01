import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'
import type { DrinkOption, RsvpEntry } from '@/types'
import type { Storage } from '@/lib/storage'

/**
 * Хранилище ответов в PostgreSQL (на Vercel — Neon из Vercel Marketplace).
 *
 * Почему так устроено:
 * 1. Пул соединений создаётся один раз на экземпляр функции и переиспользуется между запросами.
 *    attachDatabasePool закрывает простаивающие соединения до «заморозки» функции на Vercel,
 *    чтобы они не копились в базе. Вне Vercel эта функция ничего не делает.
 *    Источник: https://vercel.com/kb/guide/connection-pooling-with-functions
 * 2. Таблица создаётся сама при первом обращении (CREATE TABLE IF NOT EXISTS) —
 *    не нужно ничего запускать руками. Та же схема лежит в db/schema.sql.
 * 3. Одновременные отправки формы не теряются: каждая — отдельный INSERT,
 *    а не «прочитать весь файл → дописать → записать», как в файловом хранилище.
 */

export const TABLE = 'rsvp_entries'

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  id           text        PRIMARY KEY,
  name         text        NOT NULL,
  drinks       text[]      NOT NULL DEFAULT '{}',
  custom_drink text        NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ${TABLE}_submitted_at_idx ON ${TABLE} (submitted_at);
`

/**
 * Neon выдаёт строку с sslmode=require. Драйвер pg 8.x сейчас трактует require как verify-full
 * (сертификат сервера проверяется), но предупреждает, что в pg 9 смысл станет слабее.
 * Явно закрепляем verify-full: поведение то же, что сейчас, и не изменится после обновления pg.
 */
export function normalizeConnectionString(cs: string): string {
  try {
    const url = new URL(cs)
    const mode = url.searchParams.get('sslmode')
    if (mode === 'require' || mode === 'prefer' || mode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full')
      return url.toString()
    }
  } catch {
    // Нестандартная строка — отдаём драйверу как есть, он сам сообщит об ошибке
  }
  return cs
}

interface Row {
  id:           string
  name:         string
  drinks:       string[]
  custom_drink: string
  submitted_at: Date
}

const toEntry = (r: Row): RsvpEntry => ({
  id:          r.id,
  name:        r.name,
  drinks:      r.drinks as DrinkOption[],
  customDrink: r.custom_drink,
  submittedAt: r.submitted_at.toISOString(),
})

/** Коды Postgres, которые означают «таблица уже создана параллельным запросом». */
const ALREADY_EXISTS = new Set(['42P07', '23505'])

export function createPostgresStorage(connectionString: string): Storage & { close(): Promise<void> } {
  const pool = new Pool({
    connectionString: normalizeConnectionString(connectionString),
    // Короткий таймаут простоя — рекомендация Vercel для пулов в функциях (≈5 с)
    idleTimeoutMillis: 5_000,
    // Бесплатная база Neon «засыпает» без запросов; первое подключение после сна дольше обычного
    connectionTimeoutMillis: 15_000,
  })
  attachDatabasePool(pool)

  let ready: Promise<void> | null = null

  function ensureSchema(): Promise<void> {
    if (!ready) {
      ready = pool.query(SCHEMA_SQL).then(
        () => undefined,
        (err: { code?: string }) => {
          if (err?.code && ALREADY_EXISTS.has(err.code)) return
          ready = null // не кэшируем ошибку: следующий запрос попробует снова
          throw err
        },
      )
    }
    return ready
  }

  return {
    async readEntries() {
      await ensureSchema()
      const { rows } = await pool.query<Row>(
        `SELECT id, name, drinks, custom_drink, submitted_at
           FROM ${TABLE}
          ORDER BY submitted_at, id`,
      )
      return rows.map(toEntry)
    },

    async addEntry(entry: RsvpEntry) {
      await ensureSchema()
      // Параметры $1…$5 — защита от SQL-инъекций: значения не вклеиваются в текст запроса
      await pool.query(
        `INSERT INTO ${TABLE} (id, name, drinks, custom_drink, submitted_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.id, entry.name, entry.drinks, entry.customDrink, entry.submittedAt],
      )
    },

    /** Возвращает количество реально удалённых записей. */
    async deleteEntries(ids: string[]) {
      await ensureSchema()
      const res = await pool.query(`DELETE FROM ${TABLE} WHERE id = ANY($1::text[])`, [ids])
      return res.rowCount ?? 0
    },

    close: () => pool.end(),
  }
}
