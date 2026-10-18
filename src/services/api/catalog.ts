import type {
  AvailabilitySlot,
  DoctorProfile,
  DoctorSearchParams,
  DoctorSummary,
  Paginated,
  Review,
  Specialty,
} from '@/types/domain'
import { http } from './http'

type Opts = { signal?: AbortSignal }

/** Public catalogue: specialties, doctor discovery and doctor profiles. */
export const catalogApi = {
  async specialties(opts: Opts = {}): Promise<Specialty[]> {
    const { data } = await http.get<{ data: Specialty[] }>('/specialties', opts)
    return data.data
  },

  async specialty(slug: string, opts: Opts = {}): Promise<Specialty> {
    const { data } = await http.get<{ data: Specialty }>(`/specialties/${encodeURIComponent(slug)}`, opts)
    return data.data
  },

  async searchDoctors(params: DoctorSearchParams, opts: Opts = {}): Promise<Paginated<DoctorSummary>> {
    const { data } = await http.get<Paginated<DoctorSummary>>('/doctors', { ...opts, params })
    return data
  },

  async featuredDoctors(opts: Opts = {}): Promise<DoctorSummary[]> {
    const { data } = await http.get<{ data: DoctorSummary[] }>('/doctors/featured', opts)
    return data.data
  },

  async doctor(id: number | string, opts: Opts = {}): Promise<DoctorProfile> {
    const { data } = await http.get<{ data: DoctorProfile }>(`/doctors/${encodeURIComponent(String(id))}`, opts)
    return data.data
  },

  async availability(id: number | string, from: string, to: string, opts: Opts = {}): Promise<AvailabilitySlot[]> {
    const { data } = await http.get<{ data: AvailabilitySlot[] }>(`/doctors/${encodeURIComponent(String(id))}/availability`, {
      ...opts,
      params: { from, to },
    })
    return data.data
  },

  async reviews(id: number | string, page = 1, opts: Opts = {}): Promise<Paginated<Review>> {
    const { data } = await http.get<Paginated<Review>>(`/doctors/${encodeURIComponent(String(id))}/reviews`, {
      ...opts,
      params: { page },
    })
    return data
  },

  async sendContactMessage(payload: { name: string; email: string; subject: string; message: string }): Promise<void> {
    await http.post('/contact', payload)
  },
}
