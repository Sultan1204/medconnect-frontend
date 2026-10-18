import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import DoctorCard from '@/components/doctors/DoctorCard.vue'
import { i18n } from '@/app/providers/i18n'
import type { DoctorSummary } from '@/types/domain'

const doctor = (overrides: Partial<DoctorSummary> = {}): DoctorSummary => ({
  id: 7,
  name: 'Dr. Test',
  title: 'Consultant',
  avatar_url: null,
  specialty: { id: 1, slug: 'family-medicine', name: 'Family medicine' },
  qualifications: ['MBBS'],
  languages: ['ar', 'en'],
  consultation_offers: [
    { type: 'video', price: { amount: 20000, currency: 'SAR' }, duration_minutes: 20 },
    { type: 'chat', price: { amount: 9000, currency: 'SAR' }, duration_minutes: 15 },
  ],
  is_verified: false,
  rating: null,
  next_available_at: null,
  ...overrides,
})

function render(d: DoctorSummary) {
  i18n.global.locale.value = 'en'
  return mount(DoctorCard, { props: { doctor: d }, global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } })
}

describe('DoctorCard', () => {
  it('does not show the verified badge unless the backend confirms verification', () => {
    expect(render(doctor()).find('[data-testid="verified-badge"]').exists()).toBe(false)
    expect(render(doctor({ is_verified: true })).find('[data-testid="verified-badge"]').exists()).toBe(true)
  })

  it('hides the rating when the backend provides none', () => {
    expect(render(doctor()).text()).not.toMatch(/Rated/)
    expect(render(doctor({ rating: { average: 4.5, count: 20 } })).text()).toMatch(/Rated 4.5 out of 5/)
  })

  it('shows the lowest backend price as "from"', () => {
    expect(render(doctor()).text()).toMatch(/From SAR\s?90/)
  })

  it('shows a no-availability message when there is no slot', () => {
    expect(render(doctor()).text()).toContain('No upcoming availability')
  })

  it('links to the profile and booking anchor', () => {
    const links = render(doctor()).findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(links).toContain('/doctors/7')
    expect(links).toContain('/doctors/7#booking')
  })
})
