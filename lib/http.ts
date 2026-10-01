import { NextRequest, NextResponse } from 'next/server'
import { checkAdminToken } from '@/lib/auth'
import { StorageConfigError } from '@/lib/storage'

/**
 * Проверка доступа к админ-API. Токен принимается только в заголовке x-admin-token:
 * в query-строке (?token=) он оседал в истории браузера и логах сервера.
 * Возвращает NextResponse с ошибкой или null, если доступ разрешён.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const result = checkAdminToken(req.headers.get('x-admin-token'))
  if (result === 'misconfigured') {
    console.error('[admin] ADMIN_TOKEN не задан — доступ к админке закрыт')
    return NextResponse.json({ error: 'Админка не настроена: задайте переменную ADMIN_TOKEN на сервере' }, { status: 503 })
  }
  if (result === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** Читает JSON-тело с ограничением размера. */
export async function readJsonBody(
  req: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; data: unknown } | { ok: false; status: 400 | 413 }> {
  const text = await req.text()
  if (Buffer.byteLength(text, 'utf-8') > maxBytes) return { ok: false, status: 413 }
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400 }
  }
}

/**
 * Ответ на ошибку хранилища для админ-API.
 * Ошибку настройки (нет DATABASE_URL на Vercel) показываем как есть — в ней нет секретов, и она подсказывает,
 * что делать. Прочие ошибки базы пишем в лог Vercel, а наружу отдаём общий текст.
 */
export function storageErrorResponse(err: unknown, context: string): NextResponse {
  console.error(`[${context}]`, err)
  if (err instanceof StorageConfigError) {
    return NextResponse.json({ error: err.message }, { status: 503 })
  }
  return NextResponse.json({ error: 'Ошибка базы данных — подробности в логах сервера' }, { status: 500 })
}
