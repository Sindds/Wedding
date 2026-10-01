/**
 * Все данные приглашения — в одном месте.
 * Чтобы сделать из проекта шаблон для другой пары, достаточно поправить этот файл.
 */
const ADDRESS = 'Саратов, ул. Волновая, 18'

export const WEDDING = {
  partnerA:   'Дмитрий',
  partnerB:   'Марина',
  dateISO:    '2026-12-12',
  dateHuman:  '12 декабря 2026',
  year:       2026,
  /** Месяц для календаря: 0 — январь … 11 — декабрь */
  monthIndex: 11,
  monthName:  'Декабрь',
  day:        12,
  weekday:    'суббота',
  timeISO:    '16:00',
  venue:      'Частный дом',
  address:    ADDRESS,
  mapUrl:     `https://yandex.ru/maps/?text=${encodeURIComponent(ADDRESS)}`,
  /** Фото пары в /public. Кадр построен так, чтобы оба лица целиком попадали в круг. */
  photoSrc:   '/photo.webp',
  photoAlt:   'Наше фото: Дмитрий и Марина',
  /** Фото дома в /public. Рамка повторяет пропорции снимка, поэтому дом виден целиком. */
  housePhotoSrc: '/house.webp',
  housePhotoAlt: 'Дом, где пройдёт праздник',
  housePhotoWidth: 1200,
  housePhotoHeight: 716,
} as const
