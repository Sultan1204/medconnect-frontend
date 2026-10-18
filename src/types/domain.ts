/**
 * Domain types mirroring the API contract in docs/API_CONTRACT.md.
 * Replace with types generated from the backend OpenAPI spec (Scramble) once the
 * /api/v1 endpoints exist: `npm run api:types` (see README).
 */

export type Role = 'patient' | 'doctor' | 'pharmacist' | 'admin'

export type ConsultationType = 'chat' | 'video'

/** Monetary amount in the smallest unit (halalas). Formatting only — never compute balances client-side. */
export interface Money {
  amount: number
  currency: 'SAR'
}

export interface User {
  id: number
  name: string
  email: string | null
  phone: string
  roles: Role[]
  locale: 'ar' | 'en'
  phone_verified_at: string | null
  mfa_enabled: boolean
  /** Only present for doctors: backend-confirmed verification state. */
  doctor_status?: DoctorVerificationStatus
}

export type DoctorVerificationStatus = 'draft' | 'submitted' | 'under_review' | 'more_info_required' | 'approved' | 'rejected' | 'suspended'

export interface Specialty {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  doctors_count: number
}

export interface ConsultationOffer {
  type: ConsultationType
  price: Money
  duration_minutes: number
}

export interface Rating {
  average: number
  count: number
}

export interface DoctorSummary {
  id: number
  name: string
  title: string | null
  avatar_url: string | null
  specialty: Pick<Specialty, 'id' | 'slug' | 'name'>
  qualifications: string[]
  languages: string[]
  consultation_offers: ConsultationOffer[]
  /** True only when the backend has confirmed professional license verification. */
  is_verified: boolean
  /** Null when the backend has not enough valid reviews to publish a rating. */
  rating: Rating | null
  next_available_at: string | null
}

export interface DoctorProfile extends DoctorSummary {
  bio: string | null
  experience_years: number | null
  experience: Array<{ title: string; organization: string; from_year: number; to_year: number | null }>
}

export interface AvailabilitySlot {
  starts_at: string
  ends_at: string
  consultation_types: ConsultationType[]
}

export interface Review {
  id: number
  rating: number
  comment: string | null
  created_at: string
  /** Display name already anonymised by the backend. */
  author_display_name: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface DoctorSearchParams {
  search?: string
  specialty?: string
  consultation_type?: ConsultationType
  language?: string
  min_price?: number
  max_price?: number
  available?: 'today' | 'week'
  verified?: boolean
  page?: number
  per_page?: number
}
