import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const [w, h] of [[320, 568], [1440, 900]] as Array<[number, number]>) {
  test(`R10: axe без серьёзных нарушений — ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForTimeout(3500) // дождаться окончания мягкого проявления, иначе контраст считается по полупрозрачному тексту
    const { violations } = await new AxeBuilder({ page }).analyze()
    const serious = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
    expect(serious).toEqual([])
  })
}

test('R10: админка — axe без серьёзных нарушений', async ({ page }) => {
  await page.goto('/admin')
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
})
