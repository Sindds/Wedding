import type { DrinkOption, RsvpEntry } from '@/types'

/** Единый источник списка напитков (раньше дублировался в форме, админке и Excel). */
export const DRINK_OPTIONS: ReadonlyArray<{ value: DrinkOption; label: string }> = [
  { value: 'wine',       label: 'Вино' },
  { value: 'champagne',  label: 'Шампанское' },
  { value: 'whiskey',    label: 'Виски' },
  { value: 'vodka',      label: 'Кальвадос' },
  { value: 'beer',       label: 'Пиво' },
  { value: 'no_alcohol', label: 'Без алкоголя' },
  { value: 'custom',     label: 'Свой вариант' },
]

export const DRINK_VALUES = new Set<DrinkOption>(DRINK_OPTIONS.map((o) => o.value))

export const DRINK_LABELS: Record<string, string> = Object.fromEntries(
  DRINK_OPTIONS.map((o) => [o.value, o.label]),
)

export const CUSTOM_FALLBACK_LABEL = 'Свой вариант'

/** Ограничения длины — одинаковые на клиенте и сервере. */
export const LIMITS = {
  name:        80,
  customDrink: 60,
  /** Максимальный размер тела POST /api/rsvp в байтах. */
  bodyBytes:   8_192,
} as const

/** Человекочитаемое название напитка в ответе гостя. */
export function drinkLabel(entry: Pick<RsvpEntry, 'customDrink'>, drink: string): string {
  if (drink === 'custom') return entry.customDrink.trim() || CUSTOM_FALLBACK_LABEL
  return DRINK_LABELS[drink] ?? drink
}
