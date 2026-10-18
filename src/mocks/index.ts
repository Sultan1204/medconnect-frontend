/**
 * In-browser mock implementation of the API contract (docs/API_CONTRACT.md).
 * Installed as an axios adapter, so the real service modules, interceptors and error
 * handling run unchanged. DEMO ONLY — loaded exclusively when VITE_API_MODE=mock.
 */
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { AvailabilitySlot, ConsultationType, DoctorSummary, Review, User } from '@/types/domain'
import { DEMO_CODE, doctorFixtures, localize, specialtyFixtures, toDoctorProfile, userFixtures } from './fixtures'
import { riyadhDateKey } from '@/utils/format'

type Handler = (ctx: Ctx) => unknown | Promise<unknown>
interface Ctx {
  params: Record<string, string>
  query: Record<string, string>
  body: Record<string, unknown>
  locale: string
}

class MockHttpError {
  constructor(
    public status: number,
    public data: unknown,
  ) {}
}

const SESSION_KEY = 'mc.mock.session'
const sessionUserId = {
  get: (): number | null => {
    try {
      const v = sessionStorage.getItem(SESSION_KEY)
      return v ? Number(v) : null
    } catch {
      return null
    }
  },
  set: (id: number | null) => {
    try {
      if (id === null) sessionStorage.removeItem(SESSION_KEY)
      else sessionStorage.setItem(SESSION_KEY, String(id))
    } catch {
      /* ignore */
    }
  },
}

const pendingMfa = new Map<string, number>()

function publicUser(id: number): User {
  const { password: _password, ...user } = userFixtures.find((u) => u.id === id)!
  return user
}

function currentUser(): User {
  const id = sessionUserId.get()
  if (!id || !userFixtures.some((u) => u.id === id)) throw new MockHttpError(401, { message: 'Unauthenticated.' })
  return publicUser(id)
}

function validationError(errors: Record<string, string>, locale: string): never {
  throw new MockHttpError(422, {
    message: locale === 'en' ? 'The given data was invalid.' : 'البيانات المدخلة غير صالحة.',
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])),
  })
}

/** Deterministic pseudo-random so demo slots are stable across reloads. */
function seeded(n: number) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

/** Riyadh is UTC+3 all year (no DST). */
function riyadhInstant(dateKey: string, hour: number, minute: number): Date {
  return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`)
}

function slotsFor(doctorId: number, from: Date, to: Date): AvailabilitySlot[] {
  const doctor = doctorFixtures.find((d) => d.id === doctorId)
  if (!doctor) return []
  const types = doctor.offers.map((o) => o.type)
  const slots: AvailabilitySlot[] = []
  const now = Date.now()
  for (let day = new Date(from); day <= to; day = new Date(day.getTime() + 86_400_000)) {
    const key = riyadhDateKey(day)
    const dayNum = Number(key.replaceAll('-', ''))
    if (seeded(doctorId * 31 + dayNum) < 0.2) continue // some days off
    for (let h = 9; h < 21; h++) {
      for (const m of [0, 30]) {
        if (seeded(doctorId * 7 + dayNum + h * 60 + m) < 0.55) continue
        const start = riyadhInstant(key, h, m)
        if (start.getTime() < now + 30 * 60_000) continue
        slots.push({ starts_at: start.toISOString(), ends_at: new Date(start.getTime() + 30 * 60_000).toISOString(), consultation_types: types })
      }
    }
  }
  return slots
}

function nextAvailable(doctorId: number): string | null {
  const now = new Date()
  return slotsFor(doctorId, now, new Date(now.getTime() + 14 * 86_400_000))[0]?.starts_at ?? null
}

function summaries(locale: string): DoctorSummary[] {
  return doctorFixtures.map((d) => {
    const { bio: _b, experience: _e, experience_years: _y, ...summary } = toDoctorProfile(d, locale, nextAvailable(d.id))
    return summary
  })
}

const routes: Array<[method: string, pattern: string, handler: Handler]> = [
  ['get', '/sanctum/csrf-cookie', () => null],

  // ── Auth ──────────────────────────────────────────────────────────────
  ['get', '/api/v1/auth/me', () => ({ data: currentUser() })],
  [
    'post',
    '/api/v1/auth/login',
    ({ body, locale }) => {
      const identifier = String(body.identifier ?? '')
      const user = userFixtures.find((u) => u.phone === identifier || u.email === identifier)
      if (!user || user.password !== body.password) {
        validationError({ identifier: locale === 'en' ? 'These credentials do not match our records.' : 'بيانات الدخول غير صحيحة.' }, locale)
      }
      if (user.mfa_enabled) {
        const challenge = crypto.randomUUID()
        pendingMfa.set(challenge, user.id)
        return { status: 'mfa_required', challenge_id: challenge, channel: 'sms' }
      }
      sessionUserId.set(user.id)
      return { status: 'authenticated', user: publicUser(user.id) }
    },
  ],
  [
    'post',
    '/api/v1/auth/mfa/verify',
    ({ body, locale }) => {
      const id = pendingMfa.get(String(body.challenge_id))
      if (!id) throw new MockHttpError(419, { message: 'Challenge expired' })
      if (body.code !== DEMO_CODE) validationError({ code: locale === 'en' ? 'The code is incorrect.' : 'الرمز غير صحيح.' }, locale)
      pendingMfa.delete(String(body.challenge_id))
      sessionUserId.set(id)
      return { data: publicUser(id) }
    },
  ],
  [
    'post',
    '/api/v1/auth/register/patient',
    ({ body, locale }) => {
      if (userFixtures.some((u) => u.phone === body.phone)) {
        validationError({ phone: locale === 'en' ? 'This mobile number is already registered.' : 'رقم الجوال مسجّل مسبقًا.' }, locale)
      }
      const id = Math.max(...userFixtures.map((u) => u.id)) + 1
      userFixtures.push({ id, name: String(body.name), email: (body.email as string) || null, phone: String(body.phone), roles: ['patient'], locale: locale === 'en' ? 'en' : 'ar', phone_verified_at: null, mfa_enabled: false, password: String(body.password) })
      return { phone: body.phone }
    },
  ],
  [
    'post',
    '/api/v1/auth/register/doctor',
    ({ body, locale }) => {
      if (userFixtures.some((u) => u.phone === body.phone)) {
        validationError({ phone: locale === 'en' ? 'This mobile number is already registered.' : 'رقم الجوال مسجّل مسبقًا.' }, locale)
      }
      const id = Math.max(...userFixtures.map((u) => u.id)) + 1
      userFixtures.push({ id, name: String(body.name), email: String(body.email), phone: String(body.phone), roles: ['doctor'], locale: locale === 'en' ? 'en' : 'ar', phone_verified_at: null, mfa_enabled: false, doctor_status: 'draft', password: String(body.password) })
      return { phone: body.phone }
    },
  ],
  ['post', '/api/v1/auth/otp/send', () => ({ resend_available_in: 60 })],
  [
    'post',
    '/api/v1/auth/otp/verify',
    ({ body, locale }) => {
      if (body.code !== DEMO_CODE) validationError({ code: locale === 'en' ? 'The code is incorrect.' : 'الرمز غير صحيح.' }, locale)
      const user = userFixtures.find((u) => u.phone === body.phone)
      if (body.purpose === 'password_reset') return { reset_token: 'demo-reset-token' }
      if (!user) throw new MockHttpError(404, { message: 'Not found' })
      user.phone_verified_at = new Date().toISOString()
      sessionUserId.set(user.id)
      return { data: publicUser(user.id) }
    },
  ],
  ['post', '/api/v1/auth/forgot-password', () => null],
  [
    'post',
    '/api/v1/auth/reset-password',
    ({ body, locale }) => {
      if (body.token !== 'demo-reset-token') validationError({ token: locale === 'en' ? 'Invalid token.' : 'الرمز غير صالح.' }, locale)
      return null
    },
  ],
  [
    'post',
    '/api/v1/auth/logout',
    () => {
      sessionUserId.set(null)
      return null
    },
  ],

  // ── Catalogue ─────────────────────────────────────────────────────────
  [
    'get',
    '/api/v1/specialties',
    ({ locale }) => ({
      data: specialtyFixtures.map((s) => ({ id: s.id, slug: s.slug, name: localize(s.name, locale), description: localize(s.description, locale), icon: s.icon, doctors_count: doctorFixtures.filter((d) => d.specialtyId === s.id).length })),
    }),
  ],
  [
    'get',
    '/api/v1/specialties/:slug',
    ({ params, locale }) => {
      const s = specialtyFixtures.find((x) => x.slug === params.slug)
      if (!s) throw new MockHttpError(404, { message: 'Not found' })
      return { data: { id: s.id, slug: s.slug, name: localize(s.name, locale), description: localize(s.description, locale), icon: s.icon, doctors_count: doctorFixtures.filter((d) => d.specialtyId === s.id).length } }
    },
  ],
  ['get', '/api/v1/doctors/featured', ({ locale }) => ({ data: summaries(locale).filter((d) => d.is_verified).slice(0, 4) })],
  [
    'get',
    '/api/v1/doctors',
    ({ query, locale }) => {
      let list = summaries(locale)
      const q = query.search?.trim().toLowerCase()
      if (q) list = list.filter((d) => d.name.toLowerCase().includes(q) || d.specialty.name.toLowerCase().includes(q) || (d.title ?? '').toLowerCase().includes(q))
      if (query.specialty) list = list.filter((d) => d.specialty.slug === query.specialty)
      if (query.consultation_type) list = list.filter((d) => d.consultation_offers.some((o) => o.type === (query.consultation_type as ConsultationType)))
      if (query.language) list = list.filter((d) => d.languages.includes(query.language!))
      if (query.min_price) list = list.filter((d) => d.consultation_offers.some((o) => o.price.amount >= Number(query.min_price) * 100))
      if (query.max_price) list = list.filter((d) => d.consultation_offers.some((o) => o.price.amount <= Number(query.max_price) * 100))
      if (query.verified === 'true' || query.verified === '1') list = list.filter((d) => d.is_verified)
      if (query.available) {
        const today = riyadhDateKey(new Date())
        const limit = query.available === 'today' ? today : riyadhDateKey(new Date(Date.now() + 7 * 86_400_000))
        list = list.filter((d) => d.next_available_at && riyadhDateKey(new Date(d.next_available_at)) <= limit)
      }
      const perPage = Number(query.per_page ?? 9)
      const page = Math.max(1, Number(query.page ?? 1))
      const lastPage = Math.max(1, Math.ceil(list.length / perPage))
      return { data: list.slice((page - 1) * perPage, page * perPage), meta: { current_page: page, last_page: lastPage, per_page: perPage, total: list.length } }
    },
  ],
  [
    'get',
    '/api/v1/doctors/:id',
    ({ params, locale }) => {
      const d = doctorFixtures.find((x) => x.id === Number(params.id))
      if (!d) throw new MockHttpError(404, { message: 'Not found' })
      return { data: toDoctorProfile(d, locale, nextAvailable(d.id)) }
    },
  ],
  ['get', '/api/v1/doctors/:id/availability', ({ params, query }) => ({ data: slotsFor(Number(params.id), new Date(query.from!), new Date(query.to!)) })],
  [
    'get',
    '/api/v1/doctors/:id/reviews',
    ({ params, locale }) => {
      const d = doctorFixtures.find((x) => x.id === Number(params.id))
      const reviews: Review[] = d?.rating
        ? [5, 4, 5].map((rating, i) => ({ id: i + 1, rating, comment: locale === 'en' ? 'Demo review text.' : 'نص تقييم تجريبي.', created_at: new Date(Date.now() - (i + 1) * 5 * 86_400_000).toISOString(), author_display_name: locale === 'en' ? 'Patient' : 'مريض' }))
        : []
      return { data: reviews, meta: { current_page: 1, last_page: 1, per_page: 10, total: reviews.length } }
    },
  ],
  ['post', '/api/v1/contact', () => null],
]

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/')
  const s = path.split('/')
  if (p.length !== s.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i]!.startsWith(':')) params[p[i]!.slice(1)] = decodeURIComponent(s[i]!)
    else if (p[i] !== s[i]) return null
  }
  return params
}

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const url = new URL(`${config.baseURL ?? ''}${config.url ?? ''}`, window.location.origin)
  const method = (config.method ?? 'get').toLowerCase()
  const query: Record<string, string> = {}
  for (const [k, v] of Object.entries(config.params ?? {})) if (v !== undefined && v !== null && v !== '') query[k] = String(v)
  const body = typeof config.data === 'string' ? (JSON.parse(config.data || '{}') as Record<string, unknown>) : ((config.data ?? {}) as Record<string, unknown>)
  const locale = String(config.headers.get('Accept-Language') ?? 'ar')

  await new Promise((r) => setTimeout(r, 250 + Math.random() * 250))
  if (config.signal && 'aborted' in config.signal && config.signal.aborted) {
    throw new AxiosError('canceled', 'ERR_CANCELED', config)
  }

  const respond = (status: number, data: unknown): AxiosResponse => ({ data, status, statusText: String(status), headers: new AxiosHeaders(), config, request: {} })

  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue
    const params = match(pattern, url.pathname)
    if (!params) continue
    try {
      const data = await handler({ params, query, body, locale })
      return respond(data === null ? 204 : 200, data ?? '')
    } catch (e) {
      if (e instanceof MockHttpError) {
        const response = respond(e.status, e.data)
        throw new AxiosError(`Request failed with status code ${e.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
      }
      throw e
    }
  }
  const response = respond(404, { message: `Mock: no handler for ${method.toUpperCase()} ${url.pathname}` })
  throw new AxiosError('Not found', AxiosError.ERR_BAD_REQUEST, config, {}, response)
}

export function installMockApi(instance: AxiosInstance) {
  instance.defaults.adapter = adapter
  console.info('[MedConnect] Mock API enabled — demo data only.')
}
