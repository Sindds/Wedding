import { Pool } from 'pg'

/**
 * Изоляция тестов в отдельной схеме Postgres: Vitest запускает файлы параллельно,
 * и без этого два файла мешали бы друг другу в одной таблице.
 * Возвращает строку подключения, у которой search_path указывает на свою схему.
 */
export async function isolatedDatabaseUrl(baseUrl: string, schema: string): Promise<string> {
  const pool = new Pool({ connectionString: baseUrl })
  try {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await pool.query(`CREATE SCHEMA ${schema}`)
  } finally {
    await pool.end()
  }
  const url = new URL(baseUrl)
  url.searchParams.set('options', `-c search_path=${schema}`)
  return url.toString()
}
