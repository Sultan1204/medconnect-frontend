import type { RouteRecordRaw } from 'vue-router'
import { PORTALS } from '@/app/navigation'
import type { Role } from '@/types/domain'

const ComingSoon = () => import('@/features/portal/pages/ComingSoonPage.vue')

const publicRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/features/public/pages/HomePage.vue') },
  { path: '/doctors', name: 'doctors', component: () => import('@/features/doctors/pages/DoctorSearchPage.vue') },
  { path: '/doctors/:id', name: 'doctor', component: () => import('@/features/doctors/pages/DoctorProfilePage.vue'), props: true },
  { path: '/specialties', name: 'specialties', component: () => import('@/features/public/pages/SpecialtiesPage.vue') },
  { path: '/specialties/:slug', name: 'specialty', component: () => import('@/features/public/pages/SpecialtyPage.vue'), props: true },
  { path: '/how-it-works', name: 'how-it-works', component: () => import('@/features/public/pages/HowItWorksPage.vue') },
  { path: '/about', name: 'about', component: () => import('@/features/public/pages/AboutPage.vue') },
  { path: '/contact', name: 'contact', component: () => import('@/features/public/pages/ContactPage.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/features/public/pages/FaqPage.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/features/public/pages/LegalPage.vue'), props: { kind: 'privacy' } },
  { path: '/terms', name: 'terms', component: () => import('@/features/public/pages/LegalPage.vue'), props: { kind: 'terms' } },
  { path: '/patient-safety', name: 'patient-safety', component: () => import('@/features/public/pages/PatientSafetyPage.vue') },
].map((r) => ({ ...r, meta: { layout: 'public' as const } }))

const authRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/features/auth/pages/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('@/features/auth/pages/RegisterPatientPage.vue'), meta: { guestOnly: true } },
  { path: '/register/doctor', name: 'register-doctor', component: () => import('@/features/auth/pages/RegisterDoctorPage.vue'), meta: { guestOnly: true } },
  { path: '/verify-phone', name: 'verify-phone', component: () => import('@/features/auth/pages/OtpVerifyPage.vue') },
  { path: '/mfa/setup', name: 'mfa-setup', component: () => import('@/features/auth/pages/MfaSetupPage.vue') },
  { path: '/mfa', name: 'mfa', component: () => import('@/features/auth/pages/MfaPage.vue'), meta: { guestOnly: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/features/auth/pages/ForgotPasswordPage.vue'), meta: { guestOnly: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/features/auth/pages/ResetPasswordPage.vue'), meta: { guestOnly: true } },
].map((r) => ({ ...r, meta: { ...r.meta, layout: 'auth' as const } }))

/** Pages implemented so far; every other portal route renders the phase placeholder. */
const implemented: Partial<Record<Role, Record<string, RouteRecordRaw['component']>>> = {
  patient: { dashboard: () => import('@/features/patients/pages/PatientDashboardPage.vue') },
  doctor: { dashboard: () => import('@/features/doctors/pages/DoctorDashboardPage.vue') },
}

/** Detail routes listed in the specification, rendered as placeholders until their phase. */
const detailRoutes: Partial<Record<Role, Array<{ path: string; phase: number; approvedDoctor?: boolean }>>> = {
  patient: [
    { path: 'book/:doctorId', phase: 4 },
    { path: 'appointments/:id', phase: 4 },
    { path: 'consultations/:id', phase: 6 },
  ],
  doctor: [{ path: 'consultations/:id', phase: 6, approvedDoctor: true }],
  pharmacist: [{ path: 'prescriptions/:id', phase: 7 }],
}

const portalRoutes: RouteRecordRaw[] = (Object.keys(PORTALS) as Role[]).flatMap((role) => {
  const portal = PORTALS[role]
  const base = { layout: 'portal' as const, requiresAuth: true, roles: [role], portal: role }
  const children: RouteRecordRaw[] = portal.items.map((item) => ({
    path: `${portal.base}/${item.path}`,
    name: `${role}-${item.path.replace('/', '-')}`,
    component: implemented[role]?.[item.path] ?? ComingSoon,
    meta: { ...base, titleKey: item.labelKey, phase: item.phase },
  }))
  for (const d of detailRoutes[role] ?? []) {
    children.push({
      path: `${portal.base}/${d.path}`,
      component: ComingSoon,
      meta: { ...base, phase: d.phase, requiresApprovedDoctor: d.approvedDoctor },
    })
  }
  children.push({ path: portal.base, redirect: `${portal.base}/dashboard` })
  return children
})

export const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...authRoutes,
  ...portalRoutes,
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/public/pages/NotFoundPage.vue'), meta: { layout: 'public' } },
]
