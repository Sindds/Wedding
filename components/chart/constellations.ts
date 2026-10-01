/**
 * Созвездия Водолея и Тельца — настоящие звёзды, а не значки зодиака.
 *
 * Координаты звёзд (J2000), звёздные величины и линии фигур взяты из открытого каталога
 * d3-celestial: https://github.com/ofrohn/d3-celestial (data/stars.6.json, constellations.lines.json),
 * © 2015 Olaf Frohn, лицензия BSD-3-Clause.
 *
 * Проекция — стереографическая (как на звёздных картах: сохраняет форму фигур), восток слева, север сверху.
 * Раскладка (поворот, масштаб, центр) подобрана перебором: фигура максимально крупная и при этом
 * не заходит на фото, за деления карты и на надпись с датой. Поворот допустим — небо над головой
 * «проворачивается» в течение ночи, форма созвездия от этого не меняется.
 */

/** Геометрия карты в единицах viewBox (640×640) */
export const CHART = { c: 320, photoR: 160, haloR: 174, innerR: 286, textR: 258, textFrom: 205, textTo: 335 } as const

export type SkyStar = { id: string; name: string; ra: number; dec: number; mag: number; warm?: boolean }
export type Constellation = {
  id: 'aquarius' | 'taurus'
  title: string
  stars: SkyStar[]
  lines: Array<[string, string]>
  extras?: SkyStar[]
  layout: { ra0: number; dec0: number; rotate: number; scale: number; cx: number; cy: number; offX: number; offY: number }
}

export const AQUARIUS: Constellation = {
  id: 'aquarius',
  title: 'Водолей',
  stars: [
    { id: 'hip102618', name: 'Альбали', ra: 311.919, dec: -9.496, mag: 3.78 },
    { id: 'hip103045', name: 'Альбулан', ra: 313.163, dec: -8.983, mag: 4.73 },
    { id: 'hip106278', name: 'Садалсууд', ra: 322.89, dec: -5.571, mag: 2.9 },
    { id: 'hip109074', name: 'Садальмелик', ra: 331.446, dec: -0.32, mag: 2.95 },
    { id: 'hip110395', name: 'Садахбия', ra: 335.414, dec: -1.387, mag: 3.86 },
    { id: 'hip110960', name: 'Садальтагер', ra: 337.208, dec: -0.02, mag: 3.65 },
    { id: 'hip111497', name: 'эта Водолея', ra: 338.839, dec: -0.117, mag: 4.04 },
    { id: 'hip112961', name: 'Гидор', ra: 343.154, dec: -7.58, mag: 3.73 },
    { id: 'hip115033', name: 'пси² Водолея', ra: 349.476, dec: -9.182, mag: 4.41 },
    { id: 'hip114341', name: '88 Водолея', ra: 347.362, dec: -21.172, mag: 3.68 },
    { id: 'hip109139', name: 'йота Водолея', ra: 331.609, dec: -13.87, mag: 4.29 },
    { id: 'hip110003', name: 'Анха', ra: 334.209, dec: -7.783, mag: 4.17 },
    { id: 'hip110672', name: 'Сеат', ra: 336.319, dec: 1.377, mag: 4.8 },
    { id: 'hip115438', name: '98 Водолея', ra: 350.743, dec: -20.101, mag: 3.96 },
    { id: 'hip116901', name: '104 Водолея', ra: 355.441, dec: -17.817, mag: 4.82 },
  ],
  lines: [
    ['hip102618', 'hip103045'],
    ['hip103045', 'hip106278'],
    ['hip106278', 'hip109074'],
    ['hip109074', 'hip110395'],
    ['hip110395', 'hip110960'],
    ['hip110960', 'hip111497'],
    ['hip111497', 'hip112961'],
    ['hip112961', 'hip115033'],
    ['hip115033', 'hip114341'],
    ['hip106278', 'hip109139'],
    ['hip109074', 'hip110003'],
    ['hip110960', 'hip110672'],
    ['hip115438', 'hip115033'],
    ['hip115033', 'hip116901'],
  ],
  layout: { ra0: 335.8519, dec0: -8.3137, rotate: -54, scale: 6.6029, cx: 96, cy: 296, offX: 0.0689, offY: 0.0021 },
}

export const TAURUS: Constellation = {
  id: 'taurus',
  title: 'Телец',
  stars: [
    { id: 'hip26451', name: 'Тяньгуань', ra: 84.411, dec: 21.142, mag: 2.97 },
    { id: 'hip21421', name: 'Альдебаран', ra: 68.98, dec: 16.509, mag: 0.87, warm: true },
    { id: 'hip20894', name: 'Чамукуй', ra: 67.166, dec: 15.871, mag: 3.4 },
    { id: 'hip20205', name: 'Прима Гиад', ra: 64.948, dec: 15.628, mag: 3.65 },
    { id: 'hip20455', name: 'Секунда Гиад', ra: 65.734, dec: 17.543, mag: 3.77 },
    { id: 'hip20889', name: 'Айн', ra: 67.154, dec: 19.18, mag: 3.53 },
    { id: 'hip25428', name: 'Элнат', ra: 81.573, dec: 28.608, mag: 1.65 },
    { id: 'hip18724', name: 'лямбда Тельца', ra: 60.17, dec: 12.49, mag: 3.41 },
    { id: 'hip16083', name: 'кси Тельца', ra: 51.792, dec: 9.733, mag: 3.73 },
    { id: 'hip18907', name: 'ню Тельца', ra: 60.789, dec: 5.989, mag: 3.91 },
    { id: 'hip15900', name: 'омикрон Тельца', ra: 51.203, dec: 9.029, mag: 3.61 },
    { id: 'hip16852', name: '10 Тельца', ra: 54.218, dec: 0.402, mag: 4.29 },
  ],
  lines: [
    ['hip26451', 'hip21421'],
    ['hip21421', 'hip20894'],
    ['hip20894', 'hip20205'],
    ['hip20205', 'hip20455'],
    ['hip20455', 'hip20889'],
    ['hip20889', 'hip25428'],
    ['hip20205', 'hip18724'],
    ['hip18724', 'hip16083'],
    ['hip16083', 'hip18907'],
    ['hip16083', 'hip15900'],
    ['hip15900', 'hip16852'],
  ],
  // Плеяды: в линии фигуры не входят, но это самая узнаваемая часть Тельца
  extras: [
    { id: 'hip17702', name: 'Альциона', ra: 56.871, dec: 24.105, mag: 2.85 },
    { id: 'hip17847', name: 'Атлас', ra: 57.291, dec: 24.053, mag: 3.62 },
    { id: 'hip17499', name: 'Электра', ra: 56.219, dec: 24.113, mag: 3.72 },
    { id: 'hip17573', name: 'Майя', ra: 56.457, dec: 24.368, mag: 3.87 },
    { id: 'hip17608', name: 'Меропа', ra: 56.582, dec: 23.948, mag: 4.14 },
    { id: 'hip17531', name: 'Тайгета', ra: 56.302, dec: 24.467, mag: 4.3 },
    { id: 'hip17851', name: 'Плейона', ra: 57.297, dec: 24.137, mag: 5.05 },
  ],
  layout: { ra0: 64.5316, dec0: 14.5514, rotate: 39, scale: 7.3212, cx: 544, cy: 296, offX: 4.3204, offY: -1.1651 },
}

/** Фоновые звёзды карты — вне созвездий и вне надписи */
export const FIELD_STARS: Array<[number, number]> = [[470.1, 446.0], [435.2, 478.6], [393.4, 501.7], [347.3, 514.1], [299.5, 514.9], [253.0, 504.2], [210.4, 482.5], [174.3, 451.1], [497.7, 469.1], [456.4, 507.7]]

const D = Math.PI / 180

/** Радиус звезды зависит от яркости: чем меньше звёздная величина, тем крупнее */
export function starSize(mag: number, cluster = false): number {
  const s = Math.min(5.2, Math.max(1.6, 1.6 + (4.8 - mag) * 0.85))
  return Math.round((cluster ? s * 0.7 : s) * 100) / 100
}

function stereo(s: SkyStar, ra0: number, dec0: number): [number, number] {
  const ra = s.ra * D, dec = s.dec * D, a0 = ra0 * D, d0 = dec0 * D
  const k = 2 / (1 + Math.sin(d0) * Math.sin(dec) + Math.cos(d0) * Math.cos(dec) * Math.cos(ra - a0))
  const x = k * Math.cos(dec) * Math.sin(ra - a0)
  const y = k * (Math.cos(d0) * Math.sin(dec) - Math.sin(d0) * Math.cos(dec) * Math.cos(ra - a0))
  return [-x / D, -y / D] // восток — влево, север — вверх
}

export type PlacedStar = { id: string; name: string; x: number; y: number; size: number; warm: boolean }
export type PlacedConstellation = {
  id: Constellation['id']
  title: string
  stars: PlacedStar[]
  extras: PlacedStar[]
  lines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>
  connector: { x1: number; y1: number; x2: number; y2: number }
}

/** Переводит небесные координаты в координаты карты по параметрам раскладки */
export function layoutConstellation(c: Constellation): PlacedConstellation {
  const { ra0, dec0, rotate, scale, cx, cy, offX, offY } = c.layout
  const t = rotate * D, cos = Math.cos(t), sin = Math.sin(t)
  const place = (s: SkyStar, cluster: boolean): PlacedStar => {
    const [px, py] = stereo(s, ra0, dec0)
    const rx = px * cos - py * sin - offX, ry = px * sin + py * cos - offY
    return { id: s.id, name: s.name, x: rx * scale + cx, y: ry * scale + cy, size: starSize(s.mag, cluster), warm: !!s.warm }
  }
  const stars = c.stars.map((s) => place(s, false))
  const extras = (c.extras ?? []).map((s) => place(s, true))
  const byId = new Map(stars.map((s) => [s.id, s]))
  const lines = c.lines.map(([a, b]) => {
    const p = byId.get(a)!, q = byId.get(b)!
    return { key: `${a}-${b}`, x1: p.x, y1: p.y, x2: q.x, y2: q.y }
  })
  // пунктир от ближайшей к фото звезды до его ореола — «созвездия сходятся к нам»
  const near = stars.reduce((m, s) => (Math.hypot(s.x - CHART.c, s.y - CHART.c) < Math.hypot(m.x - CHART.c, m.y - CHART.c) ? s : m))
  const d = Math.hypot(near.x - CHART.c, near.y - CHART.c)
  const connector = { x1: near.x, y1: near.y, x2: CHART.c + (CHART.haloR * (near.x - CHART.c)) / d, y2: CHART.c + (CHART.haloR * (near.y - CHART.c)) / d }
  return { id: c.id, title: c.title, stars, extras, lines, connector }
}
