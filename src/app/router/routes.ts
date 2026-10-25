import type { RouteRecordRaw } from 'vue-router'
import { PORTALS } from '@/app/navigation'
import { env } from '@/config/env'
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

const live = !env.isMock
/** Real-API pages (used when VITE_API_MODE=http); in mock mode the earlier placeholders/dashboards remain. */
const app = {
  patient: {
    dashboard: () => import('@/features/app/patient/DashboardPage.vue'),
    appointments: () => import('@/features/app/common/AppointmentsPage.vue'),
    consultations: () => import('@/features/app/common/ConsultationsListPage.vue'),
    messages: () => import('@/features/app/common/ConsultationsListPage.vue'),
    'medical-records': () => import('@/features/app/patient/MedicalRecordsPage.vue'),
    prescriptions: () => import('@/features/app/patient/PrescriptionsPage.vue'),
    pharmacies: () => import('@/features/app/common/BranchesPage.vue'),
    payments: () => import('@/features/app/patient/PaymentsPage.vue'),
    complaints: () => import('@/features/app/patient/ComplaintsPage.vue'),
    notifications: () => import('@/features/app/common/NotificationsPage.vue'),
    profile: () => import('@/features/app/patient/ProfilePage.vue'),
    settings: () => import('@/features/app/common/SettingsPage.vue'),
  },
  doctor: {
    dashboard: () => import('@/features/app/doctor/DashboardPage.vue'),
    verification: () => import('@/features/app/doctor/VerificationPage.vue'),
    availability: () => import('@/features/app/doctor/AvailabilityPage.vue'),
    appointments: () => import('@/features/app/common/AppointmentsPage.vue'),
    consultations: () => import('@/features/app/common/ConsultationsListPage.vue'),
    patients: () => import('@/features/app/doctor/PatientsPage.vue'),
    'clinical-notes': () => import('@/features/app/common/ConsultationsListPage.vue'),
    prescriptions: () => import('@/features/app/common/ConsultationsListPage.vue'),
    earnings: () => import('@/features/app/doctor/EarningsPage.vue'),
    notifications: () => import('@/features/app/common/NotificationsPage.vue'),
    profile: () => import('@/features/app/doctor/ProfilePage.vue'),
    settings: () => import('@/features/app/common/SettingsPage.vue'),
  },
  pharmacist: {
    dashboard: () => import('@/features/app/pharmacy/DashboardPage.vue'),
    prescriptions: () => import('@/features/app/pharmacy/DispensingPage.vue'),
    dispensing: () => import('@/features/app/pharmacy/DispensingPage.vue'),
    branches: () => import('@/features/app/common/BranchesPage.vue'),
    staff: () => import('@/features/app/pharmacy/StaffPage.vue'),
    notifications: () => import('@/features/app/common/NotificationsPage.vue'),
    profile: () => import('@/features/app/pharmacy/ProfilePage.vue'),
    settings: () => import('@/features/app/common/SettingsPage.vue'),
  },
  admin: {
    dashboard: () => import('@/features/app/admin/DashboardPage.vue'),
    users: () => import('@/features/app/admin/UsersPage.vue'),
    patients: () => import('@/features/app/admin/UsersPage.vue'),
    doctors: () => import('@/features/app/admin/DoctorsPage.vue'),
    'doctors/pending': () => import('@/features/app/admin/DoctorsPage.vue'),
    pharmacies: () => import('@/features/app/admin/PharmaciesPage.vue'),
    specialties: () => import('@/features/app/admin/SpecialtiesPage.vue'),
    appointments: () => import('@/features/app/admin/ListPage.vue'),
    consultations: () => import('@/features/app/admin/ListPage.vue'),
    payments: () => import('@/features/app/admin/PaymentsPage.vue'),
    refunds: () => import('@/features/app/admin/PaymentsPage.vue'),
    settlements: () => import('@/features/app/admin/SettlementsPage.vue'),
    reviews: () => import('@/features/app/admin/ReviewsPage.vue'),
    complaints: () => import('@/features/app/admin/ComplaintsPage.vue'),
    notifications: () => import('@/features/app/common/NotificationsPage.vue'),
    'audit-logs': () => import('@/features/app/admin/ListPage.vue'),
    contact: () => import('@/features/app/admin/ListPage.vue'),
    'data-requests': () => import('@/features/app/admin/ListPage.vue'),
    'guardian-links': () => import('@/features/app/admin/ListPage.vue'),
    settings: () => import('@/features/app/admin/SettingsPage.vue'),
  },
} as Record<Role, Record<string, RouteRecordRaw['component']>>

const mockImplemented: Partial<Record<Role, Record<string, RouteRecordRaw['component']>>> = {
  patient: { dashboard: () => import('@/features/patients/pages/PatientDashboardPage.vue') },
  doctor: { dashboard: () => import('@/features/doctors/pages/DoctorDashboardPage.vue') },
}
const implemented = live ? app : mockImplemented

/** Detail routes listed in the specification. */
const detailRoutes: Partial<Record<Role, Array<{ path: string; phase: number; approvedDoctor?: boolean; component?: RouteRecordRaw['component'] }>>> = {
  patient: [
    { path: 'book/:doctorId', phase: 4, component: () => import('@/features/app/patient/BookPage.vue') },
    { path: 'appointments/:id', phase: 4, component: () => import('@/features/app/common/AppointmentDetailPage.vue') },
    { path: 'consultations/:id', phase: 6, component: () => import('@/features/app/common/ConsultationRoom.vue') },
  ],
  doctor: [
    { path: 'appointments/:id', phase: 5, approvedDoctor: true, component: () => import('@/features/app/common/AppointmentDetailPage.vue') },
    { path: 'consultations/:id', phase: 6, approvedDoctor: true, component: () => import('@/features/app/common/ConsultationRoom.vue') },
  ],
  pharmacist: [{ path: 'prescriptions/:id', phase: 7, component: () => import('@/features/app/pharmacy/DispenseDetailPage.vue') }],
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
      component: live && d.component ? d.component : ComingSoon,
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
