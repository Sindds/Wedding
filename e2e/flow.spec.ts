import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('R8: пустая отправка → ошибки и фокус на имени', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.getByRole('button', { name: /отправить ответ/i }).click()
  await expect(page.getByText(/введите имя/i)).toBeVisible()
  await expect(page.getByText(/выберите хотя бы один/i)).toBeVisible()
  await expect(page.locator('#guest-name')).toBeFocused()
})

test('R8: полный сценарий гостя на телефоне', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.locator('#guest-name').fill('Иван Петров')
  await page.getByRole('button', { name: 'Шампанское' }).click()
  await page.getByRole('button', { name: 'Свой вариант' }).click()
  await page.getByLabel(/ваш вариант напитка/i).fill('Морс')
  await page.getByRole('button', { name: /отправить ответ/i }).click()
  await expect(page.getByText(/спасибо, иван!/i)).toBeVisible()
})

test('R9: админка — неверный пароль, вход, ответ виден, выгрузка xlsx', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel(/пароль/i).fill('wrong')
  await page.getByRole('button', { name: /войти/i }).click()
  // у Next.js есть свой пустой role=alert (route announcer) — ищем именно наш алерт
  await expect(page.getByRole('alert').filter({ hasText: /неверный пароль/i })).toBeVisible()

  await page.getByLabel(/пароль/i).fill('e2e-secret')
  await page.getByRole('button', { name: /войти/i }).click()
  await expect(page.getByText('Иван Петров')).toBeVisible()
  await expect(page.getByTestId('stat-total')).toContainText(/\d+/)
  await expect(page.getByText(/вторая половинка|с партнёром/i)).toHaveCount(0)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /скачать всё/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^rsvp_all_\d{4}-\d{2}-\d{2}\.xlsx$/)
})
