import type { DrinkOption, RsvpFormData } from '@/types'
import { DRINK_VALUES, LIMITS } from '@/lib/constants'

export interface ValidationError {
  field:   keyof RsvpFormData | 'submit'
  message: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Приводит произвольный ввод (JSON с клиента, старый черновик из localStorage)
 * к строгой форме RsvpFormData. Неизвестные поля — включая удалённое `attendance` — отбрасываются.
 */
export function normalizeRsvpPayload(input: unknown): RsvpFormData {
  const src = input && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {}

  const drinks = Array.isArray(src.drinks)
    ? [...new Set(src.drinks.filter((d): d is DrinkOption => typeof d === 'string' && DRINK_VALUES.has(d as DrinkOption)))]
    : []

  return {
    name:        str(src.name),
    drinks,
    customDrink: drinks.includes('custom') ? str(src.customDrink) : '',
  }
}

export function validateRsvpForm(data: Partial<RsvpFormData>): ValidationError[] {
  const errors: ValidationError[] = []
  const name = (data.name ?? '').trim()

  if (name.length < 2) {
    errors.push({ field: 'name', message: 'Введите имя — хотя бы 2 буквы' })
  } else if (name.length > LIMITS.name) {
    errors.push({ field: 'name', message: `Имя должно быть не длиннее ${LIMITS.name} символов` })
  }

  const drinks = data.drinks ?? []
  if (drinks.length === 0) {
    errors.push({ field: 'drinks', message: 'Выберите хотя бы один вариант напитков' })
  }

  if (drinks.includes('custom')) {
    const custom = (data.customDrink ?? '').trim()
    if (!custom) {
      errors.push({ field: 'customDrink', message: 'Напишите, какой напиток вы предпочитаете' })
    } else if (custom.length > LIMITS.customDrink) {
      errors.push({ field: 'customDrink', message: `Не длиннее ${LIMITS.customDrink} символов` })
    }
  }


  return errors
}
