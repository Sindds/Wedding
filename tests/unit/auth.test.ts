import { describe, it, expect } from 'vitest'
import { checkAdminToken } from '@/lib/auth'

describe('checkAdminToken', () => {
  it('fail-closed: без ADMIN_TOKEN доступ закрыт (раньше был дефолтный пароль)', () => {
    expect(checkAdminToken('wedding2026', undefined)).toBe('misconfigured')
    expect(checkAdminToken('', '')).toBe('misconfigured')
  })
  it('неверный или пустой токен', () => {
    expect(checkAdminToken('nope', 'secret')).toBe('unauthorized')
    expect(checkAdminToken(null, 'secret')).toBe('unauthorized')
    expect(checkAdminToken('secret-longer', 'secret')).toBe('unauthorized')
  })
  it('верный токен', () => {
    expect(checkAdminToken('secret', 'secret')).toBe('ok')
  })
})
