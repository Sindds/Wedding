import type { AdminStats, RsvpEntry } from '@/types'
import { CUSTOM_FALLBACK_LABEL } from '@/lib/constants'

/** Статистика для админки: количество ответов и популярность напитков. */
export function computeStats(entries: RsvpEntry[]): AdminStats {
  const drinkCounts: Record<string, number> = {}
  for (const e of entries) {
    for (const d of e.drinks) {
      const key = d === 'custom' ? (e.customDrink.trim() || CUSTOM_FALLBACK_LABEL) : d
      drinkCounts[key] = (drinkCounts[key] ?? 0) + 1
    }
  }
  return { total: entries.length, drinkCounts }
}
