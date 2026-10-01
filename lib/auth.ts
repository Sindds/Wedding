import { timingSafeEqual } from 'node:crypto'

export type AuthResult = 'ok' | 'unauthorized' | 'misconfigured'

/**
 * Проверка пароля администратора.
 * - fail-closed: если ADMIN_TOKEN не задан, доступ закрыт (раньше подставлялся пароль по умолчанию);
 * - сравнение за постоянное время (timingSafeEqual), чтобы не давать подсказок по таймингу.
 */
export function checkAdminToken(
  provided: string | null | undefined,
  expected: string | undefined = process.env.ADMIN_TOKEN,
): AuthResult {
  if (!expected) return 'misconfigured'
  if (!provided) return 'unauthorized'
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return 'unauthorized'
  return timingSafeEqual(a, b) ? 'ok' : 'unauthorized'
}
