import type { AvailabilitySlot, DoctorProfile, DoctorSearchParams, DoctorSummary, Paginated, Review, Specialty } from '@/types/domain'

export type Opts = { signal?: AbortSignal }

export interface CatalogApi {
  specialties(opts?: Opts): Promise<Specialty[]>
  specialty(slug: string, opts?: Opts): Promise<Specialty>
  searchDoctors(params: DoctorSearchParams, opts?: Opts): Promise<Paginated<DoctorSummary>>
  featuredDoctors(opts?: Opts): Promise<DoctorSummary[]>
  doctor(id: number | string, opts?: Opts): Promise<DoctorProfile>
  availability(id: number | string, from: string, to: string, opts?: Opts): Promise<AvailabilitySlot[]>
  reviews(id: number | string, page?: number, opts?: Opts): Promise<Paginated<Review>>
  sendContactMessage(payload: { name: string; email: string; subject: string; message: string }): Promise<void>
}
