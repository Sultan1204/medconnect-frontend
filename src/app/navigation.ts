import type { Component } from 'vue'
import {
  Bell,
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileClock,
  FileText,
  Flag,
  FolderHeart,
  LayoutDashboard,
  MessageSquare,
  Pill,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  Store,
  User,
  UserCog,
  Users,
  Video,
  Wallet,
  Tags,
  PackageCheck,
} from 'lucide-vue-next'
import type { Role } from '@/types/domain'

export interface NavItem {
  /** Path segment under the portal base. */
  path: string
  labelKey: string
  icon: Component
  /** Development phase that delivers the page (used by the placeholder page). */
  phase: number
  /** Shown in the mobile bottom bar (max 4 per portal). */
  bottom?: boolean
}

export interface PortalConfig {
  role: Role
  base: string
  titleKey: string
  items: NavItem[]
}

export const PORTALS: Record<Role, PortalConfig> = {
  patient: {
    role: 'patient',
    base: '/patient',
    titleKey: 'portal.roles.patient',
    items: [
      { path: 'dashboard', labelKey: 'portal.nav.dashboard', icon: LayoutDashboard, phase: 4, bottom: true },
      { path: 'appointments', labelKey: 'portal.nav.appointments', icon: CalendarDays, phase: 4, bottom: true },
      { path: 'consultations', labelKey: 'portal.nav.consultations', icon: Video, phase: 4 },
      { path: 'messages', labelKey: 'portal.nav.messages', icon: MessageSquare, phase: 6, bottom: true },
      { path: 'medical-records', labelKey: 'portal.nav.medicalRecords', icon: FolderHeart, phase: 7 },
      { path: 'prescriptions', labelKey: 'portal.nav.prescriptions', icon: Pill, phase: 7 },
      { path: 'pharmacies', labelKey: 'portal.nav.pharmacies', icon: Store, phase: 7 },
      { path: 'payments', labelKey: 'portal.nav.payments', icon: CreditCard, phase: 4 },
      { path: 'notifications', labelKey: 'portal.nav.notifications', icon: Bell, phase: 6 },
      { path: 'profile', labelKey: 'portal.nav.profile', icon: User, phase: 4, bottom: true },
      { path: 'settings', labelKey: 'portal.nav.settings', icon: Settings, phase: 4 },
    ],
  },
  doctor: {
    role: 'doctor',
    base: '/doctor',
    titleKey: 'portal.roles.doctor',
    items: [
      { path: 'dashboard', labelKey: 'portal.nav.dashboard', icon: LayoutDashboard, phase: 5, bottom: true },
      { path: 'verification', labelKey: 'portal.nav.verification', icon: BadgeCheck, phase: 5 },
      { path: 'availability', labelKey: 'portal.nav.availability', icon: CalendarClock, phase: 5 },
      { path: 'appointments', labelKey: 'portal.nav.appointments', icon: CalendarDays, phase: 5, bottom: true },
      { path: 'consultations', labelKey: 'portal.nav.consultations', icon: Stethoscope, phase: 5, bottom: true },
      { path: 'patients', labelKey: 'portal.nav.patients', icon: Users, phase: 5 },
      { path: 'clinical-notes', labelKey: 'portal.nav.clinicalNotes', icon: FileText, phase: 7 },
      { path: 'prescriptions', labelKey: 'portal.nav.prescriptions', icon: Pill, phase: 7 },
      { path: 'earnings', labelKey: 'portal.nav.earnings', icon: Wallet, phase: 5 },
      { path: 'notifications', labelKey: 'portal.nav.notifications', icon: Bell, phase: 6 },
      { path: 'profile', labelKey: 'portal.nav.profile', icon: User, phase: 5, bottom: true },
      { path: 'settings', labelKey: 'portal.nav.settings', icon: Settings, phase: 5 },
    ],
  },
  pharmacist: {
    role: 'pharmacist',
    base: '/pharmacy',
    titleKey: 'portal.roles.pharmacist',
    items: [
      { path: 'dashboard', labelKey: 'portal.nav.dashboard', icon: LayoutDashboard, phase: 7, bottom: true },
      { path: 'prescriptions', labelKey: 'portal.nav.prescriptions', icon: ClipboardList, phase: 7, bottom: true },
      { path: 'dispensing', labelKey: 'portal.nav.dispensing', icon: PackageCheck, phase: 7, bottom: true },
      { path: 'branches', labelKey: 'portal.nav.branches', icon: Building2, phase: 7 },
      { path: 'staff', labelKey: 'portal.nav.staff', icon: Users, phase: 7 },
      { path: 'notifications', labelKey: 'portal.nav.notifications', icon: Bell, phase: 7 },
      { path: 'profile', labelKey: 'portal.nav.profile', icon: Store, phase: 7, bottom: true },
      { path: 'settings', labelKey: 'portal.nav.settings', icon: Settings, phase: 7 },
    ],
  },
  admin: {
    role: 'admin',
    base: '/admin',
    titleKey: 'portal.roles.admin',
    items: [
      { path: 'dashboard', labelKey: 'portal.nav.dashboard', icon: LayoutDashboard, phase: 8, bottom: true },
      { path: 'users', labelKey: 'portal.nav.users', icon: UserCog, phase: 8 },
      { path: 'patients', labelKey: 'portal.nav.patients', icon: Users, phase: 8 },
      { path: 'doctors', labelKey: 'portal.nav.doctors', icon: Stethoscope, phase: 8 },
      { path: 'doctors/pending', labelKey: 'portal.nav.pendingDoctors', icon: ShieldCheck, phase: 8, bottom: true },
      { path: 'pharmacies', labelKey: 'portal.nav.pharmaciesAdmin', icon: Store, phase: 8 },
      { path: 'specialties', labelKey: 'portal.nav.specialties', icon: Tags, phase: 8 },
      { path: 'appointments', labelKey: 'portal.nav.appointments', icon: CalendarDays, phase: 8 },
      { path: 'consultations', labelKey: 'portal.nav.consultations', icon: Video, phase: 8 },
      { path: 'payments', labelKey: 'portal.nav.payments', icon: CreditCard, phase: 8, bottom: true },
      { path: 'refunds', labelKey: 'portal.nav.refunds', icon: RotateCcw, phase: 8 },
      { path: 'settlements', labelKey: 'portal.nav.settlements', icon: Receipt, phase: 8 },
      { path: 'reviews', labelKey: 'portal.nav.reviews', icon: Star, phase: 8 },
      { path: 'complaints', labelKey: 'portal.nav.complaints', icon: Flag, phase: 8, bottom: true },
      { path: 'notifications', labelKey: 'portal.nav.notifications', icon: Bell, phase: 8 },
      { path: 'audit-logs', labelKey: 'portal.nav.auditLogs', icon: FileClock, phase: 8 },
      { path: 'settings', labelKey: 'portal.nav.settings', icon: Settings, phase: 8 },
    ],
  },
}
