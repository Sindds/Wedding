import { describe, it, expect } from 'vitest'
import { computeStats } from '@/lib/stats'
import type { RsvpEntry } from '@/types'

const e = (over: Partial<RsvpEntry>): RsvpEntry => ({
  id: Math.random().toString(36), submittedAt: '2026-10-01T10:00:00.000Z',
  name: 'Гость', drinks: [], customDrink: '', ...over,
})

describe('computeStats', () => {
  it('пустой список', () => {
    expect(computeStats([])).toEqual({ total: 0, drinkCounts: {} })
  })

  it('считает ответы и напитки, свой вариант — по тексту', () => {
    const stats = computeStats([
      e({ drinks: ['wine', 'champagne'] }),
      e({ drinks: ['wine'] }),
      e({ drinks: ['custom'], customDrink: 'Морс' }),
      e({ drinks: ['custom'], customDrink: '' }),
    ])
    expect(stats.total).toBe(4)
    expect(stats.drinkCounts).toEqual({ wine: 2, champagne: 1, 'Морс': 1, 'Свой вариант': 1 })
  })

  it('не содержит статистики по «второй половинке»', () => {
    const stats = computeStats([e({ drinks: ['beer'] })]) as unknown as Record<string, unknown>
    for (const k of ['withPartner', 'solo', 'notAttending', 'attending']) expect(stats).not.toHaveProperty(k)
  })
})
