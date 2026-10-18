import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'
import type { Role } from '@/types/domain'
import type { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'public' | 'auth' | 'portal' | 'blank'
    requiresAuth?: boolean
    /** User must hold at least one of these roles. */
    roles?: Role[]
    /** Redirect authenticated users away (login, register…). */
    guestOnly?: boolean
    /** Doctor features that require backend-confirmed approval (live consultations). */
    requiresApprovedDoctor?: boolean
    /** Portal whose navigation the PortalLayout renders. */
    portal?: Role
    titleKey?: string
    phase?: number
  }
}

type AuthStore = ReturnType<typeof useAuthStore>

/** Only allow same-app relative redirects to avoid open-redirect abuse via ?redirect=. */
export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

/**
 * Client-side route guard. This is a UX convenience — it hides screens a user cannot use.
 * Every protected API endpoint must still enforce authentication and authorisation server-side.
 */
export function createAuthGuard(getAuth: () => AuthStore): NavigationGuardWithThis<undefined> {
  return async (to: RouteLocationNormalized) => {
    const auth = getAuth()
    await auth.ensureLoaded()

    if (to.meta.guestOnly && auth.isAuthenticated) {
      return safeRedirect(to.query.redirect) ?? auth.homePath
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.meta.roles?.length && !auth.hasAnyRole(to.meta.roles)) {
      return auth.homePath === to.path ? '/' : auth.homePath
    }

    if (to.meta.requiresApprovedDoctor && auth.user?.doctor_status !== 'approved') {
      return '/doctor/verification'
    }

    return true
  }
}
