import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = ['/', '/doctors', '/doctors/104', '/specialties', '/login', '/register', '/contact', '/patient-safety']

async function scan(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

for (const path of pages) {
  test(`axe: ${path} (Arabic RTL, light)`, async ({ page }) => {
    await page.goto(path)
    expect(await scan(page)).toEqual([])
  })
}

test('axe: home in English LTR, dark theme', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mc.locale', 'en')
    localStorage.setItem('mc.theme', 'dark')
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  expect(await scan(page)).toEqual([])
})

test('axe: doctor search in dark theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mc.theme', 'dark'))
  await page.goto('/doctors')
  expect(await scan(page)).toEqual([])
})
