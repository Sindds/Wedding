import { test, expect } from '@playwright/test'

test('R1+R2: нет хэдера и раздела подарков', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header')).toHaveCount(0)
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await expect(page.locator('#gifts')).toHaveCount(0)
  await expect(page.getByText(/вместо цветов/i)).toHaveCount(0)
  await expect(page.getByText(/подарк/i)).toHaveCount(0)
})

test('R11: без ошибок в консоли при загрузке и прокрутке до конца', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.mouse.wheel(0, 4000)
  await page.waitForTimeout(1200)
  await page.goto('/admin')
  expect(errors).toEqual([])
})

test('R7: при «уменьшить движение» — мягкое проявление без сдвигов и размытия', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const early = await page.getByTestId('name-a').evaluate((el) => parseFloat(getComputedStyle(el).opacity))
  expect(early, 'появление есть (в начале имя ещё проявляется)').toBeLessThan(1)
  const letter = page.locator('[data-testid=name-a] .name-letter').first()
  await expect(letter).toHaveCSS('transform', 'none')
  await expect(letter).toHaveCSS('filter', 'none')
  for (const id of ['name-a', 'name-b', 'chart-photo']) await expect(page.getByTestId(id)).toHaveCSS('opacity', '1', { timeout: 4000 })
})

test.describe('Без JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('главный экран виден сразу', async ({ page }) => {
    await page.goto('/')
    for (const sel of ['[data-testid=name-a]', '[data-testid=name-b]', '[data-testid=chart-photo]', '.chart-ring', '.hero-lead', '.hero-sub', '#details-title'])
      await expect(page.locator(sel).first(), sel).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-constellation] .chart-line:not(.chart-line--dash)').first()).toHaveCSS('stroke-dasharray', 'none')
    await expect(page.locator('.clock-sweep').first()).toHaveCSS('transform', 'none') // часы показывают 16:00
  })
})

test('Если скрипты не загрузились — контент всё равно появляется', async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', (r) => r.abort())
  await page.goto('/')
  for (const sel of ['[data-testid=name-a]', '[data-testid=chart-photo]', '.hero-lead'])
    await expect(page.locator(sel).first(), sel).toHaveCSS('opacity', '1', { timeout: 5000 })
})

test('R7: без ограничений анимация есть: имена появляются и становятся чёткими', async ({ page }) => {
  await page.goto('/')
  const early = await page.getByTestId('name-a').evaluate((el) => parseFloat(getComputedStyle(el).opacity))
  expect(early, 'в начале анимации имя ещё не полностью видно').toBeLessThan(1)
  await page.waitForTimeout(3000)
  await expect(page.getByTestId('name-a')).toHaveCSS('opacity', '1')
})

test('R14: каллиграфические шрифты применены к текстам и загружены', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  // next/font даёт семейству собственное имя, поэтому сверяемся с переменными, которые он создал из файлов шрифтов
  const family = (v: string) => page.evaluate((name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).split(',')[0].trim().replace(/['"]/g, ''), v)
  const script = await family('--font-great-vibes')
  const hand = await family('--font-bad-script')
  expect(script).not.toBe('')
  expect(hand).not.toBe('')
  const first = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/['"]/g, ''))
  expect(await first('[data-testid=name-a]')).toBe(script)
  expect(await first('#details-title')).toBe(script)
  for (const sel of ['.hero-lead', '.hero-sub', 'label[for=guest-name]', '#rsvp button[type=submit]', '#guest-name']) {
    expect(await first(sel), sel).toBe(hand)
  }
  // файлы реально загружены (а не подставлен запасной шрифт)
  const loaded = await page.evaluate(([a, b]) => document.fonts.check(`40px "${a}"`) && document.fonts.check(`20px "${b}"`), [script, hand])
  expect(loaded).toBe(true)
})

test('R20: при «уменьшить движение» падающие звёзды и вращение неба выключены', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const meteors = page.getByTestId('meteor')
  for (let i = 0; i < await meteors.count(); i++) await expect(meteors.nth(i)).toHaveCSS('display', 'none')
  await expect(page.locator('.sky-rotor')).toHaveCSS('animation-name', 'none')
})

test('Фразы поменялись местами и стилями: приглашение — выше и ярким стилем, дата — ниже и приглушённым', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const invite = page.locator('#hero p', { hasText: 'Мы приглашаем Вас на наш свадебный тусич' })
  const date = page.locator('#hero p', { hasText: 'начало в 16:00' })
  const [iBox, dBox] = [(await invite.boundingBox())!, (await date.boundingBox())!]
  expect(iBox.y + iBox.height, 'приглашение выше даты').toBeLessThanOrEqual(dBox.y)
  // Для каждого токена — свой новый элемент: если перекрашивать один и тот же, в режиме «уменьшить движение»
  // срабатывает переход 0.01ms и браузер ещё отдаёт прежний цвет
  const tokens = await page.evaluate(() => {
    const read = (v: string) => {
      const probe = document.createElement('span'); probe.style.color = `var(${v})`
      document.body.appendChild(probe); const c = getComputedStyle(probe).color; probe.remove(); return c
    }
    return { text: read('--color-text'), soft: read('--color-text-soft') }
  })
  expect(tokens.text).not.toBe(tokens.soft)
  await expect(invite).toHaveCSS('color', tokens.text)   // бывший стиль даты
  await expect(date).toHaveCSS('color', tokens.soft)     // бывший стиль приглашения
})

// Регрессия: при «уменьшить движение» линии созвездий оставались штрихом нулевой длины и были невидимы
for (const mode of ['reduce', 'no-preference'] as const) {
  test(`Линии созвездий видны (движение: ${mode})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mode })
    await page.goto('/')
    await page.waitForTimeout(4500)
    const lines = await page.locator('[data-constellation] .chart-line:not(.chart-line--dash)').evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el); const len = (el as SVGLineElement).getTotalLength()
        const dash = cs.strokeDasharray === 'none' ? [len, 0] : cs.strokeDasharray.split(/[ ,]+/).map(parseFloat)
        const pathLen = parseFloat(el.getAttribute('pathLength') || '0') || len
        // видимая доля: длина штриха относительно всей линии (в единицах pathLength)
        return { visible: cs.opacity !== '0' && dash[0] / pathLen >= 0.99 }
      }))
    expect(lines.length).toBeGreaterThanOrEqual(25)
    expect(lines.filter((l) => !l.visible).length, 'невидимых линий').toBe(0)
  })
}

// Анимации не должны незаметно пропасть: замеряем их в браузере во время прокрутки
test('Анимации: секции проявляются и выезжают, стрелки часов докручиваются до 16:00, форма появляется', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForTimeout(3500)
  const angle = (loc: ReturnType<typeof page.locator>) => loc.evaluate((e) => {
    const m = getComputedStyle(e).transform
    if (m === 'none') return 0
    const v = m.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
    return Math.round((Math.atan2(v[1], v[0]) * 180) / Math.PI)
  })

  await page.evaluate(() => document.querySelector('#details')!.scrollIntoView())
  const ops: number[] = []; const moves: string[] = []
  for (let i = 0; i < 8; i++) {
    ops.push(await page.locator('.detail').first().evaluate((e) => parseFloat(getComputedStyle(e).opacity)))
    moves.push(await page.locator('.detail').first().evaluate((e) => getComputedStyle(e).transform))
    await page.waitForTimeout(120)
  }
  expect(ops[0], 'в начале секция ещё не видна').toBeLessThan(1)
  expect(ops.at(-1), 'в конце видна полностью').toBe(1)
  expect(moves.slice(0, 4).some((m) => m !== 'none' && m !== 'matrix(1, 0, 0, 1, 0, 0)'), 'блок выезжает').toBe(true)

  await page.evaluate(() => document.querySelector('.clock')!.scrollIntoView({ block: 'center' }))
  const hour: number[] = []; const minute: number[] = []
  for (let i = 0; i < 12; i++) {
    hour.push(await angle(page.locator('.clock-sweep').nth(1))); minute.push(await angle(page.locator('.clock-sweep').nth(0)))
    await page.waitForTimeout(200)
  }
  expect(new Set(hour).size, `часовая стрелка движется: ${hour}`).toBeGreaterThan(3)
  expect(new Set(minute).size, `минутная стрелка крутится: ${minute}`).toBeGreaterThan(3)
  expect([hour.at(-1), minute.at(-1)], 'остановились на 16:00').toEqual([0, 0])

  await page.evaluate(() => document.querySelector('#rsvp')!.scrollIntoView())
  const form: number[] = []
  for (let i = 0; i < 10; i++) {
    form.push(await page.getByTestId('rsvp-panel').evaluate((e) => parseFloat(getComputedStyle(e).opacity)))
    await page.waitForTimeout(150)
  }
  expect(form[0]).toBeLessThan(1)
  expect(form.at(-1)!).toBeGreaterThanOrEqual(0.999)
})
