import { test, expect, type Page } from '@playwright/test'

// 280 — Galaxy Fold, 320 — iPhone SE 1-го поколения, дальше популярные телефоны, планшеты и десктопы
const VIEWPORTS: Array<[number, number]> = [
  [280, 653], [320, 568], [360, 740], [375, 667], [390, 844], [414, 896],
  [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080],
]

async function insideViewport(page: Page, testId: string, width: number) {
  const box = await page.getByTestId(testId).boundingBox()
  expect(box, `${testId} должен быть на странице`).not.toBeNull()
  expect(box!.x, `${testId}: левый край за экраном на ${width}px`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${testId}: правый край за экраном на ${width}px`).toBeLessThanOrEqual(width)
}

for (const [w, h] of VIEWPORTS) {
  test(`R4+R5: ${w}×${h} — нет горизонтальной прокрутки, имена и карта в пределах экрана`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' }) // сразу конечная раскладка
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'горизонтальная прокрутка').toBeLessThanOrEqual(0)

    await insideViewport(page, 'name-a', w)
    await insideViewport(page, 'name-b', w)
    await insideViewport(page, 'star-chart', w)
    await insideViewport(page, 'rsvp-panel', w)
    for (const id of ['calendar', 'clock', 'house-photo']) await insideViewport(page, id, w)

    // R15: всё по центру. На телефоне — каждый блок; на широком экране детали стоят в три колонки,
    // поэтому там проверяем имена, карту, заголовки и форму
    const ids = w < 768
      ? ['names', 'star-chart', 'calendar', 'clock', 'house-photo', 'rsvp-panel']
      : ['names', 'star-chart', 'rsvp-panel']
    for (const id of ids) {
      const b = (await page.getByTestId(id).boundingBox())!
      expect(Math.abs(b.x + b.width / 2 - w / 2), `${id} по центру на ${w}px`).toBeLessThanOrEqual(2)
    }
    for (const sel of ['#details-title', '#rsvp-title']) {
      const align = await page.locator(sel).evaluate((el) => getComputedStyle(el).textAlign)
      expect(align, `${sel} выровнен по центру`).toBe('center')
    }

    // R13: фото занимает не меньше 45% диаметра карты и загружено
    const chart = (await page.getByTestId('star-chart').boundingBox())!
    const photo = (await page.getByTestId('chart-photo').boundingBox())!
    expect(photo.width / chart.width, 'доля фото в карте').toBeGreaterThanOrEqual(0.45)
    const loaded = await page.getByTestId('chart-photo').locator('img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)
    expect(loaded, 'фото загружено').toBe(true)

    // имена вместе и целиком над фото
    const namesBox = (await page.getByTestId('names').boundingBox())!
    expect(namesBox.y + namesBox.height, 'имена выше фото').toBeLessThanOrEqual(photo.y)

    // дом виден целиком: рамка повторяет пропорции фото (1444×861), значит ничего не обрезано
    const house = await page.getByTestId('house-photo').locator('img').evaluate((i: HTMLImageElement) => {
      const r = i.getBoundingClientRect()
      return { loaded: i.complete && i.naturalWidth > 0, natural: i.naturalWidth / i.naturalHeight, shown: r.width / r.height, fit: getComputedStyle(i).objectFit }
    })
    expect(house.loaded, 'фото дома загружено').toBe(true)
    expect(Math.abs(house.shown / house.natural - 1), 'пропорции рамки = пропорциям фото').toBeLessThanOrEqual(0.01)

    // R16: цифра 12 целиком внутри сердечка
    const heart = (await page.locator('[data-day="12"] svg').boundingBox())!
    const num = (await page.locator('[data-day="12"] .cal-heart-num').boundingBox())!
    expect(num.x >= heart.x && num.x + num.width <= heart.x + heart.width && num.y >= heart.y && num.y + num.height <= heart.y + heart.height, '12 внутри сердца').toBe(true)

    // «большим шрифтом» — имена не должны мельчать ради влезания
    const size = await page.getByTestId('name-a').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size, 'кегль имени').toBeGreaterThanOrEqual(w < 768 ? 40 : 64)
  })
}

test('R6: на телефоне цели касания ≥ 44 px, шрифт полей ≥ 16 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  const buttons = page.locator('#rsvp button')
  const n = await buttons.count()
  expect(n).toBeGreaterThanOrEqual(8)
  for (let i = 0; i < n; i++) {
    const b = await buttons.nth(i).boundingBox()
    expect(b!.height, `кнопка ${i}`).toBeGreaterThanOrEqual(44)
    expect(b!.x + b!.width).toBeLessThanOrEqual(320)
  }
  for (const sel of ['#guest-name']) {
    const fs = await page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(fs, sel).toBeGreaterThanOrEqual(16)
  }
})

test('R4: имена в пределах экрана и после полной анимации (движение не отключено)', async ({ page }) => {
  for (const [w, h] of [[320, 568], [1024, 768], [1280, 800]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.waitForTimeout(3500)
    await insideViewport(page, 'name-a', w)
    await insideViewport(page, 'name-b', w)
  }
})

// Регрессия: Motion перезаписывал transform, и круг фото съезжал с центра карты
test('Регрессия: фото-«луна» точно в центре карты неба после анимации', async ({ page }) => {
  for (const [w, h] of [[320, 568], [390, 844], [1024, 768], [1440, 900]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.waitForTimeout(2500)
    const chart = (await page.getByTestId('star-chart').boundingBox())!
    const photo = (await page.getByTestId('chart-photo').boundingBox())!
    const dx = Math.abs(chart.x + chart.width / 2 - (photo.x + photo.width / 2))
    const dy = Math.abs(chart.y + chart.height / 2 - (photo.y + photo.height / 2))
    expect(dx, `смещение по X на ${w}px`).toBeLessThanOrEqual(2)
    expect(dy, `смещение по Y на ${w}px`).toBeLessThanOrEqual(2)
  }
})

// Регрессия: на широком невысоком экране «Марина» уходила за первый экран
test('Оба имени и фото целиком помещаются в первый экран', async ({ page }) => {
  for (const [w, h] of [[390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    for (const id of ['name-a', 'chart-photo', 'name-b']) {
      const b = (await page.getByTestId(id).boundingBox())!
      expect(b.y + b.height, `${id} в первом экране ${w}×${h}`).toBeLessThanOrEqual(h)
    }
  }
})

// Регрессия: на телефоне переносилось «Дмитрий и / Марина» вместо «Дмитрий / и Марина»
test('«и» всегда на одной строке с «Марина»', async ({ page }) => {
  for (const [w, h] of [[280, 653], [320, 568], [390, 844], [768, 1024], [1440, 900]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const amp = (await page.locator('.names-amp').boundingBox())!
    const b = (await page.getByTestId('name-b').boundingBox())!
    const ampMid = amp.y + amp.height / 2
    expect(ampMid >= b.y && ampMid <= b.y + b.height, `«и» на строке «Марина» при ${w}px`).toBe(true)
  }
})

// Порядок в первом экране: фото → текст приглашения → дата и время
test('текст приглашения визуально выше даты на всех ширинах', async ({ page }) => {
  for (const [w, h] of [[280, 653], [390, 844], [1024, 768], [1440, 900]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const photo = (await page.getByTestId('chart-photo').boundingBox())!
    // ищем по тексту, а не по классам: классы теперь по роли (hero-lead / hero-sub)
    const text = (await page.locator('#hero p', { hasText: 'Мы приглашаем Вас' }).boundingBox())!
    const date = (await page.locator('#hero p', { hasText: 'начало в 16:00' }).boundingBox())!
    expect(text.y, `текст ниже фото при ${w}px`).toBeGreaterThan(photo.y + photo.height)
    expect(text.y + text.height, `текст выше даты при ${w}px`).toBeLessThanOrEqual(date.y)
  }
})

test('Водолей слева от фото, Телец справа, звёзды не заходят на фото', async ({ page }) => {
  for (const [w, h] of [[280, 653], [390, 844], [1440, 900]] as Array<[number, number]>) {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const res = await page.evaluate(() => {
      const ph = document.querySelector('[data-testid=chart-photo]')!.getBoundingClientRect()
      const cx = ph.left + ph.width / 2, cy = ph.top + ph.height / 2, R = ph.width / 2
      const check = (id: string) => [...document.querySelectorAll(`[data-constellation="${id}"] .chart-star`)].map((c) => {
        const r = c.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2
        return { x, clear: Math.hypot(x - cx, y - cy) - r.width / 2 >= R }
      })
      return { cx, aqr: check('aquarius'), tau: check('taurus') }
    })
    expect(res.aqr.length).toBe(15)
    expect(res.aqr.every((s) => s.x < res.cx && s.clear), `Водолей слева и не на фото (${w}px)`).toBe(true)
    expect(res.tau.every((s) => s.x > res.cx && s.clear), `Телец справа и не на фото (${w}px)`).toBe(true)
  }
})
