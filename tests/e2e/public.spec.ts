import { expect, test } from '@playwright/test'

test.describe('public website', () => {
  test('homepage renders in Arabic RTL by default', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('استشر طبيبك من أي مكان')
    await expect(page.getByTestId('demo-banner')).toBeVisible()
  })

  test('language switch flips to English LTR and persists', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // On phones the switcher lives in the collapsible menu.
    const menu = page.getByRole('button', { name: 'فتح القائمة' })
    if (await menu.isVisible()) await menu.click()
    await page.getByTestId('language-switcher').filter({ visible: true }).first().click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Consult your doctor from anywhere')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('hero search leads to filtered doctor results', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('searchbox').first().fill('ريم')
    await page.getByRole('searchbox').first().press('Enter')
    await expect(page).toHaveURL(/\/doctors\?search=/)
    await expect(page.getByTestId('doctor-card')).toHaveCount(1)
  })

  test('doctor filters update URL and results', async ({ page }) => {
    await page.goto('/doctors')
    await expect(page.getByTestId('doctor-card').first()).toBeVisible()
    const filtersToggle = page.getByRole('button', { name: 'عرض الفلاتر' })
    if (await filtersToggle.isVisible()) await filtersToggle.click()
    await page.getByLabel('نوع الاستشارة').selectOption('chat')
    await expect(page).toHaveURL(/consultation_type=chat/)
    await page.getByLabel('الأطباء الموثّقون فقط').check()
    await expect(page).toHaveURL(/verified=1/)
    // Demo data: 6 verified doctors offer chat. Waiting for the count avoids reading stale results.
    const cards = page.getByTestId('doctor-card')
    await expect(cards).toHaveCount(6)
    for (const card of await cards.all()) await expect(card.getByTestId('verified-badge')).toBeVisible()
  })

  test('doctor profile allows picking a slot; booking requires login', async ({ page }) => {
    await page.goto('/doctors/104')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('عمر')
    // Find the first day that has slots.
    const days = page.locator('input[name="booking-day"]')
    const count = await days.count()
    for (let i = 0; i < count; i++) {
      await days.nth(i).check({ force: true })
      if ((await page.locator('input[name="booking-slot"]').count()) > 0) break
    }
    await page.locator('input[name="booking-slot"]').first().check({ force: true })
    await page.getByRole('button', { name: 'متابعة الحجز' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  for (const path of ['/', '/doctors', '/doctors/104', '/specialties', '/login', '/register', '/contact']) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  }

  test('unknown routes show the 404 page', async ({ page }) => {
    await page.goto('/no-such-page')
    await expect(page.getByRole('heading', { name: 'الصفحة غير موجودة' })).toBeVisible()
  })
})
