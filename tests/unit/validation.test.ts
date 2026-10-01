import { describe, it, expect } from 'vitest'
import { validateRsvpForm, normalizeRsvpPayload } from '@/lib/validation'
import { LIMITS } from '@/lib/constants'

const valid = { name: 'Иван Петров', drinks: ['wine'], customDrink: '' } as const

describe('validateRsvpForm', () => {
  it('принимает корректную форму', () => {
    expect(validateRsvpForm({ ...valid, drinks: ['wine'] })).toEqual([])
  })

  it('требует имя минимум из 2 символов', () => {
    expect(validateRsvpForm({ ...valid, drinks: ['wine'], name: '' }).map(e => e.field)).toContain('name')
    expect(validateRsvpForm({ ...valid, drinks: ['wine'], name: ' я ' }).map(e => e.field)).toContain('name')
  })

  it(`ограничивает имя ${LIMITS.name} символами`, () => {
    const errs = validateRsvpForm({ ...valid, drinks: ['wine'], name: 'а'.repeat(LIMITS.name + 1) })
    expect(errs.find(e => e.field === 'name')?.message).toMatch(String(LIMITS.name))
  })

  it('требует выбрать хотя бы один напиток', () => {
    expect(validateRsvpForm({ ...valid, drinks: [] }).map(e => e.field)).toContain('drinks')
  })

  it('требует текст своего варианта, если выбран «Свой вариант»', () => {
    expect(validateRsvpForm({ ...valid, drinks: ['custom'], customDrink: '  ' }).map(e => e.field)).toContain('customDrink')
    expect(validateRsvpForm({ ...valid, drinks: ['custom'], customDrink: 'Морс' })).toEqual([])
  })


  it('больше не знает о поле attendance («вторая половинка» удалена)', () => {
    // даже старое значение «не приду» не отключает проверку напитков
    const legacy = { ...valid, drinks: [], attendance: 'no' } as unknown as Parameters<typeof validateRsvpForm>[0]
    const errs = validateRsvpForm(legacy)
    expect(errs.map(e => e.field)).not.toContain('attendance')
    expect(errs.map(e => e.field)).toContain('drinks')
  })
})

describe('normalizeRsvpPayload', () => {
  it('возвращает пустую форму для мусора на входе', () => {
    for (const bad of [null, undefined, 42, 'str', []]) {
      expect(normalizeRsvpPayload(bad)).toEqual({ name: '', drinks: [], customDrink: '' })
    }
  })

  it('обрезает пробелы и отбрасывает неизвестные поля, включая attendance', () => {
    const out = normalizeRsvpPayload({ name: '  Мария ', drinks: ['wine'], customDrink: '', wishes: ' ок ', attendance: 'yes_partner', hack: 1 })
    expect(out).toEqual({ name: 'Мария', drinks: ['wine'], customDrink: '' })
    expect(out).not.toHaveProperty('attendance')
    expect(out).not.toHaveProperty('wishes') // раздел пожеланий удалён
  })

  it('фильтрует неизвестные и повторяющиеся напитки, не падает на не-массиве', () => {
    expect(normalizeRsvpPayload({ name: 'А', drinks: ['wine', 'wine', 'rm -rf', 7] }).drinks).toEqual(['wine'])
    expect(normalizeRsvpPayload({ name: 'А', drinks: 'wine' }).drinks).toEqual([])
  })

  it('очищает свой вариант, если «Свой вариант» не выбран', () => {
    expect(normalizeRsvpPayload({ name: 'А', drinks: ['beer'], customDrink: 'Сидр' }).customDrink).toBe('')
    expect(normalizeRsvpPayload({ name: 'А', drinks: ['custom'], customDrink: ' Сидр ' }).customDrink).toBe('Сидр')
  })
})
