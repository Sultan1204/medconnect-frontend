import type {
  AvailabilitySlot,
  ConsultationOffer,
  DoctorProfile,
  DoctorSummary,
  Paginated,
  Review,
  Specialty,
} from '@/types/domain'
import { riyadhDateKey } from '@/utils/format'
import { http } from './http'
import type { CatalogApi } from './catalog.types'

/* ------------------------------------------------------------------ backend shapes */

interface ApiSpecialty {
  id: string
  slug: string
  name: string
  description: string | null
}

interface ApiDoctor {
  id: string
  name: string
  title: string | null
  bio: string | null
  years_of_experience: number | null
  languages: string[]
  specialties: ApiSpecialty[]
  consultation_types: Array<{ type: 'video' | 'chat'; fee: { amount: number; currency: string }; is_free: boolean }>
  rating: { average: number | null; count: number }
  verification: { status: string }
}

interface ApiPage<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/** Icon names understood by components/doctors/SpecialtyIcon.vue, keyed by backend slug. */
const SPECIALTY_ICONS: Record<string, string> = {
  'family-medicine': 'home',
  pediatrics: 'baby',
  psychiatry: 'brain',
  cardiology: 'heart-pulse',
  dermatology: 'scan-face',
  ent: 'ear',
  gastroenterology: 'apple',
}

/** Default session length shown on offers; the booking step shows the real slot length. */
const DEFAULT_DURATION_MINUTES = 30

/* ------------------------------------------------------------------ mappers */

function toSpecialty(s: ApiSpecialty): Specialty {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    icon: SPECIALTY_ICONS[s.slug] ?? null,
    doctors_count: null,
  }
}

function toOffers(d: ApiDoctor): ConsultationOffer[] {
  return d.consultation_types.map((c) => ({
    type: c.type,
    price: { amount: c.fee.amount, currency: 'SAR' },
    duration_minutes: DEFAULT_DURATION_MINUTES,
  }))
}

function toSummary(d: ApiDoctor): DoctorSummary {
  const primary = d.specialties[0]
  return {
    id: d.id,
    name: d.name,
    title: d.title,
    avatar_url: null,
    specialty: primary ? { id: primary.id, slug: primary.slug, name: primary.name } : { id: '', slug: '', name: '' },
    qualifications: [],
    languages: d.languages,
    consultation_offers: toOffers(d),
    is_verified: d.verification.status === 'verified' || d.verification.status === 'approved',
    rating: d.rating.average === null ? null : { average: d.rating.average, count: d.rating.count },
    next_available_at: null,
  }
}

function toProfile(d: ApiDoctor): DoctorProfile {
  return { ...toSummary(d), bio: d.bio, experience_years: d.years_of_experience, experience: [] }
}

function toPage<A, B>(page: ApiPage<A>, map: (a: A) => B): Paginated<B> {
  const { current_page, last_page, per_page, total } = page.meta
  return { data: page.data.map(map), meta: { current_page, last_page, per_page, total } }
}

/* ------------------------------------------------------------------ API */

export const httpCatalogApi: CatalogApi = {
  async specialties(opts = {}) {
    const { data } = await http.get<{ data: ApiSpecialty[] }>('/specialties', opts)
    return data.data.map(toSpecialty)
  },

  async specialty(slug, opts = {}) {
    // The API has no single-specialty endpoint; the list is small and cached server-side.
    const items = await httpCatalogApi.specialties(opts)
    const found = items.find((s) => s.slug === slug)
    if (!found) throw Object.assign(new Error('Specialty not found'), { kind: 'not_found' })
    return found
  },

  async searchDoctors(params, opts = {}) {
    const query: Record<string, string | number> = {}
    if (params.search) query.q = params.search
    if (params.specialty) query.specialty = params.specialty
    if (params.consultation_type) query.consultation_type = params.consultation_type
    if (params.language) query.language = params.language
    // The UI filters in riyals; the API works in halalas.
    if (params.min_price !== undefined) query.min_price = Math.round(params.min_price * 100)
    if (params.max_price !== undefined) query.max_price = Math.round(params.max_price * 100)
    if (params.available === 'today') query.available_on = riyadhDateKey(new Date())
    if (params.page) query.page = params.page
    if (params.per_page) query.per_page = params.per_page
    const { data } = await http.get<ApiPage<ApiDoctor>>('/doctors', { ...opts, params: query })
    return toPage(data, toSummary)
  },

  async featuredDoctors(opts = {}) {
    // No dedicated endpoint: the best-rated listed doctors.
    const { data } = await http.get<ApiPage<ApiDoctor>>('/doctors', { ...opts, params: { sort: '-rating', per_page: 6 } })
    return data.data.map(toSummary)
  },

  async doctor(id, opts = {}) {
    const { data } = await http.get<{ data: ApiDoctor }>(`/doctors/${encodeURIComponent(String(id))}`, opts)
    return toProfile(data.data)
  },

  async availability(id, from, to, opts = {}) {
    const { data } = await http.get<{ data: AvailabilitySlot[] }>(`/doctors/${encodeURIComponent(String(id))}/availability`, {
      ...opts,
      params: { from: riyadhDateKey(new Date(from)), to: riyadhDateKey(new Date(to)) },
    })
    return data.data.map((s) => ({ starts_at: s.starts_at, ends_at: s.ends_at, consultation_types: s.consultation_types }))
  },

  async reviews(id, page = 1, opts = {}) {
    const { data } = await http.get<ApiPage<{ id: string; rating: number; comment: string | null; published_at: string | null }>>(
      `/doctors/${encodeURIComponent(String(id))}/reviews`,
      { ...opts, params: { page } },
    )
    return toPage(data, (r): Review => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.published_at ?? '',
      // The API never exposes who wrote a review.
      author_display_name: '',
    }))
  },

  async sendContactMessage(payload) {
    await http.post('/contact', payload)
  },
}
