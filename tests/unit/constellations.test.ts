// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { AQUARIUS, TAURUS, layoutConstellation, CHART } from '@/components/chart/constellations'

const deg = Math.PI / 180
/** Угловое расстояние между звёздами на небе (градусы) */
function sep(a: { ra: number; dec: number }, b: { ra: number; dec: number }) {
  const c = Math.sin(a.dec * deg) * Math.sin(b.dec * deg) + Math.cos(a.dec * deg) * Math.cos(b.dec * deg) * Math.cos((a.ra - b.ra) * deg)
  return Math.acos(Math.min(1, c)) / deg
}

describe('Созвездия — настоящие звёзды из каталога', () => {
  it('Водолей: 15 звёзд и линии фигуры из каталога, Садальмелик и Садалсууд на своих местах', () => {
    expect(AQUARIUS.stars).toHaveLength(15)
    expect(AQUARIUS.lines.length).toBeGreaterThanOrEqual(14)
    const alpha = AQUARIUS.stars.find((s) => s.name === 'Садальмелик')!
    const beta = AQUARIUS.stars.find((s) => s.name === 'Садалсууд')!
    expect(alpha.ra).toBeCloseTo(331.45, 1); expect(alpha.dec).toBeCloseTo(-0.32, 1)
    expect(beta.ra).toBeCloseTo(322.89, 1); expect(beta.dec).toBeCloseTo(-5.57, 1)
  })

  it('Телец: 12 звёзд фигуры, Альдебаран — самая яркая, Плеяды есть отдельным скоплением', () => {
    expect(TAURUS.stars).toHaveLength(12)
    const brightest = [...TAURUS.stars].sort((a, b) => a.mag - b.mag)[0]
    expect(brightest.name).toBe('Альдебаран')
    expect(TAURUS.extras?.length).toBeGreaterThanOrEqual(6)
    expect(TAURUS.extras!.every((s) => s.ra > 55 && s.ra < 58 && s.dec > 23 && s.dec < 25)).toBe(true)
  })

  it('каждая линия соединяет существующие звёзды', () => {
    for (const c of [AQUARIUS, TAURUS]) {
      const ids = new Set(c.stars.map((s) => s.id))
      for (const [a, b] of c.lines) { expect(ids.has(a) && ids.has(b), `${c.id}: ${a}–${b}`).toBe(true) }
    }
  })
})

describe('Раскладка на карте неба', () => {
  const placed = [layoutConstellation(AQUARIUS), layoutConstellation(TAURUS)]

  it('форма не искажена: расстояния на карте пропорциональны угловым (±8%)', () => {
    for (const [i, c] of [AQUARIUS, TAURUS].entries()) {
      const p = placed[i]; const ratios: number[] = []
      for (let a = 0; a < c.stars.length; a++) for (let b = a + 1; b < c.stars.length; b++) {
        const d = Math.hypot(p.stars[a].x - p.stars[b].x, p.stars[a].y - p.stars[b].y)
        ratios.push(d / sep(c.stars[a], c.stars[b]))
      }
      const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length
      for (const r of ratios) expect(Math.abs(r / mean - 1), c.id).toBeLessThanOrEqual(0.08)
    }
  })

  it('все звёзды в кольце вокруг фото: не заходят на фото и за край карты', () => {
    for (const p of placed) for (const s of [...p.stars, ...p.extras]) {
      const r = Math.hypot(s.x - CHART.c, s.y - CHART.c)
      expect(r - s.size, `${p.id}: звезда наезжает на фото`).toBeGreaterThanOrEqual(CHART.haloR + 4)
      expect(r + s.size, `${p.id}: звезда за делениями карты`).toBeLessThanOrEqual(CHART.innerR)
    }
  })

  it('звёзды не залезают на надпись с датой по верхней дуге', () => {
    for (const p of placed) for (const s of [...p.stars, ...p.extras]) {
      const r = Math.hypot(s.x - CHART.c, s.y - CHART.c)
      const ang = ((Math.atan2(s.y - CHART.c, s.x - CHART.c) / deg) + 360) % 360
      const inTextSector = ang > CHART.textFrom && ang < CHART.textTo
      expect(inTextSector && r + s.size > CHART.textR, `${p.id}: звезда на надписи`).toBe(false)
    }
  })

  it('Водолей целиком слева (у девушки), Телец целиком справа (у парня)', () => {
    const [aqr, tau] = placed
    expect(Math.max(...aqr.stars.map((s) => s.x))).toBeLessThan(CHART.c)
    expect(Math.min(...[...tau.stars, ...tau.extras].map((s) => s.x))).toBeGreaterThan(CHART.c)
  })

  it('фигура крупная — занимает заметную часть своей стороны', () => {
    for (const p of placed) {
      const xs = p.stars.map((s) => s.x), ys = p.stars.map((s) => s.y)
      expect(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)), p.id).toBeGreaterThanOrEqual(150)
    }
  })

  it('размер звезды зависит от яркости: ярче (меньше звёздная величина) — крупнее', () => {
    const tau = placed[1]
    const ald = tau.stars[TAURUS.stars.findIndex((s) => s.name === 'Альдебаран')]
    expect(Math.max(...tau.stars.map((s) => s.size))).toBe(ald.size)
  })
})
