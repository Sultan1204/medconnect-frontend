import { expect, test, type Page } from '@playwright/test'

// Demo accounts from src/mocks/fixtures.ts (mock mode only).
async function login(page: Page, phone: string, password = 'Demo1234') {
  await page.goto('/login')
  await page.getByLabel('رقم الجوال أو البريد الإلكتروني').fill(phone)
  await page.getByLabel(/^كلمة المرور/).fill(password)
  await page.getByRole('button', { name: 'دخول' }).click()
}

test.describe('authentication & role routing', () => {
  test('client-side validation is announced', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'دخول' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page.getByLabel('رقم الجوال أو البريد الإلكتروني')).toHaveAttribute('aria-invalid', 'true')
  })

  test('wrong credentials show the server error', async ({ page }) => {
    await login(page, '0500000001', 'Wrong1234')
    await expect(page.getByText('بيانات الدخول غير صحيحة.')).toBeVisible()
  })

  test('patient lands on the patient portal and can log out', async ({ page }) => {
    await login(page, '0500000001')
    await expect(page).toHaveURL('/patient/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('مرحبًا')
    // Patient cannot open the admin portal.
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL('/patient/dashboard')
  })

  test('protected route redirects to login and back', async ({ page }) => {
    await page.goto('/patient/appointments')
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)patient(%2F|\/)appointments/)
    await page.getByLabel('رقم الجوال أو البريد الإلكتروني').fill('0500000001')
    await page.getByLabel(/^كلمة المرور/).fill('Demo1234')
    await page.getByRole('button', { name: 'دخول' }).click()
    await expect(page).toHaveURL('/patient/appointments')
  })

  test('admin login requires MFA', async ({ page }) => {
    await login(page, '0500000005')
    await expect(page).toHaveURL(/\/mfa/)
    await page.getByLabel('رمز التحقق').fill('123456')
    await page.getByRole('button', { name: 'تحقق' }).click()
    await expect(page).toHaveURL('/admin/dashboard')
  })

  test('unapproved doctor sees verification warning and cannot open consultations', async ({ page }) => {
    await login(page, '0500000003')
    await expect(page).toHaveURL('/doctor/dashboard')
    await expect(page.getByRole('main').getByText('قيد المراجعة', { exact: true })).toBeVisible()
    await page.goto('/doctor/consultations/1')
    await expect(page).toHaveURL('/doctor/verification')
  })

  test('patient registration → OTP → dashboard', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('الاسم الكامل').fill('مستخدم اختبار')
    await page.getByLabel('رقم الجوال').fill('0551234567')
    await page.getByLabel(/^كلمة المرور/).fill('Test1234')
    await page.getByLabel('تأكيد كلمة المرور').fill('Test1234')
    await page.locator('input[type="checkbox"]').nth(0).check()
    await page.locator('input[type="checkbox"]').nth(1).check()
    await page.getByRole('button', { name: 'إنشاء الحساب' }).click()
    await expect(page).toHaveURL('/verify-phone')
    await page.getByLabel('رمز التحقق').fill('123456')
    await page.getByRole('button', { name: 'تحقق' }).click()
    await expect(page).toHaveURL('/patient/dashboard')
  })
})
