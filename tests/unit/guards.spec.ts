import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { createAuthGuard, safeRedirect } from '@/app/router/guards'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/domain'

vi.mock('@/services/api/auth', () => ({ authApi: { me: vi.fn().mockResolvedValue(null) } }))

const route = (path: string, meta: RouteLocationNormalized['meta'] = {}, query = {}) =>
  ({ path, fullPath: path, meta, query }) as unknown as RouteLocationNormalized

const user = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: 'Test',
  email: null,
  phone: '+966500000001',
  roles: ['patient'],
  locale: 'ar',
  phone_verified_at: null,
  mfa_enabled: false,
  ...overrides,
})

describe('safeRedirect', () => {
  it.each(['/patient/dashboard', '/doctors?x=1'])('allows %s', (v) => expect(safeRedirect(v)).toBe(v))
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', undefined, 3])('rejects %s', (v) =>
    expect(safeRedirect(v)).toBeNull(),
  )
})

describe('auth guard', () => {
  let auth: ReturnType<typeof useAuthStore>
  const guard = () => createAuthGuard(() => auth)

  beforeEach(() => {
    setActivePinia(createPinia())
    auth = useAuthStore()
  })

  const run = (to: RouteLocationNormalized) => (guard() as unknown as (to: RouteLocationNormalized) => Promise<unknown>)(to)

  it('sends guests to login with a redirect back', async () => {
    auth.setUser(null)
    expect(await run(route('/patient/appointments', { requiresAuth: true }))).toEqual({ path: '/login', query: { redirect: '/patient/appointments' } })
  })

  it('lets a patient into the patient portal', async () => {
    auth.setUser(user())
    expect(await run(route('/patient/dashboard', { requiresAuth: true, roles: ['patient'] }))).toBe(true)
  })

  it('redirects a patient away from the admin portal to their home', async () => {
    auth.setUser(user())
    expect(await run(route('/admin/dashboard', { requiresAuth: true, roles: ['admin'] }))).toBe('/patient/dashboard')
  })

  it('redirects authenticated users away from guest-only pages', async () => {
    auth.setUser(user({ roles: ['doctor'], doctor_status: 'approved' }))
    expect(await run(route('/login', { guestOnly: true }))).toBe('/doctor/dashboard')
  })

  it('honours a safe redirect on guest-only pages', async () => {
    auth.setUser(user())
    expect(await run(route('/login', { guestOnly: true }, { redirect: '/doctors/101' }))).toBe('/doctors/101')
  })

  it('blocks unapproved doctors from live consultation routes', async () => {
    auth.setUser(user({ roles: ['doctor'], doctor_status: 'under_review' }))
    expect(await run(route('/doctor/consultations/5', { requiresAuth: true, roles: ['doctor'], requiresApprovedDoctor: true }))).toBe('/doctor/verification')
  })

  it('allows approved doctors into live consultation routes', async () => {
    auth.setUser(user({ roles: ['doctor'], doctor_status: 'approved' }))
    expect(await run(route('/doctor/consultations/5', { requiresAuth: true, roles: ['doctor'], requiresApprovedDoctor: true }))).toBe(true)
  })

  it('picks the highest-priority portal for multi-role users', () => {
    auth.setUser(user({ roles: ['patient', 'admin'] }))
    expect(auth.homePath).toBe('/admin/dashboard')
  })
})
