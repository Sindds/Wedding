import fs from 'node:fs/promises'
import path from 'node:path'
import type { RsvpEntry } from '@/types'
import type { Storage } from '@/lib/storage'

/**
 * Файловое хранилище ответов (JSON).
 *
 * Что исправлено относительно исходной версии:
 * 1. Очередь операций: одновременные отправки больше не затирают друг друга
 *    (раньше read-modify-write без блокировки терял ответы).
 * 2. Атомарная запись: пишем во временный файл и переименовываем.
 * 3. Битый JSON не затирается молча — сохраняется копия rsvp.corrupt-<время>.json.
 *
 * Очередь работает в пределах одного процесса Node — этого достаточно для `next start` и локальной разработки.
 * На Vercel файловая система временная — там используется Postgres (lib/storage-postgres.ts).
 */
export function createFileStorage(file: string): Storage {
  let queue: Promise<unknown> = Promise.resolve()

  function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task)
    queue = run.catch(() => undefined)
    return run
  }

  async function ensureFile(): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true })
    try {
      await fs.access(file)
    } catch {
      await fs.writeFile(file, '[]', 'utf-8')
    }
  }

  async function readUnsafe(): Promise<RsvpEntry[]> {
    await ensureFile()
    const raw = await fs.readFile(file, 'utf-8')
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as RsvpEntry[]) : []
    } catch {
      const backup = file.replace(/\.json$/, '') + `.corrupt-${Date.now()}.json`
      await fs.copyFile(file, backup)
      console.error(`[storage] Повреждённый ${path.basename(file)} сохранён как ${path.basename(backup)}`)
      await fs.writeFile(file, '[]', 'utf-8')
      return []
    }
  }

  async function writeUnsafe(entries: RsvpEntry[]): Promise<void> {
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
    await fs.writeFile(tmp, JSON.stringify(entries, null, 2), 'utf-8')
    await fs.rename(tmp, file)
  }

  return {
    readEntries: () => exclusive(readUnsafe),

    addEntry: (entry: RsvpEntry) =>
      exclusive(async () => {
        const entries = await readUnsafe()
        entries.push(entry)
        await writeUnsafe(entries)
      }),

    /** Возвращает количество реально удалённых записей. */
    deleteEntries: (ids: string[]) =>
      exclusive(async () => {
        const entries = await readUnsafe()
        const idSet = new Set(ids)
        const kept = entries.filter((e) => !idSet.has(e.id))
        await writeUnsafe(kept)
        return entries.length - kept.length
      }),
  }
}
