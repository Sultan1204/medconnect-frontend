import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Role, User } from '@/types/domain'
import { authApi, type LoginPayload, type LoginResult } from '@/services/api/auth'
import { disconnectEcho } from '@/services/realtime/echo'

/** Role priority used to pick the default portal when a user holds several roles. */
const ROLE_PRIORITY: Role[] = ['admin', 'doctor', 'pharmacist', 'patient']

export const PORTAL_HOME: Record<Role, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  pharmacist: '/pharmacy/dashboard',
  admin: '/admin/dashboard',
}

/**
 * Holds the authenticated user as reported by the backend (GET /auth/me).
 * Roles here drive UX only (navigation, guards); every authorisation decision is enforced by the API.
 * The session itself lives in an HttpOnly cookie — nothing sensitive is persisted client-side.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loaded = ref(false)
  let loading: Promise<void> | null = null

  /** Pending MFA challenge between the password step and the code step (memory only). */
  const mfaChallenge = ref<{ challenge_id: string; channel: 'sms' | 'totp' } | null>(null)
  /** Phone awaiting OTP verification after registration/login (memory only). */
  const pendingPhone = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const roles = computed<Role[]>(() => user.value?.roles ?? [])
  const primaryRole = computed<Role | null>(() => ROLE_PRIORITY.find((r) => roles.value.includes(r)) ?? null)
  const homePath = computed(() => (primaryRole.value ? PORTAL_HOME[primaryRole.value] : '/'))

  function hasRole(role: Role) {
    return roles.value.includes(role)
  }

  function hasAnyRole(list: Role[]) {
    return list.some((r) => roles.value.includes(r))
  }

  /** Loads the current session once; concurrent callers share the same request. */
  function ensureLoaded(): Promise<void> {
    if (loaded.value) return Promise.resolve()
    loading ??= authApi
      .me()
      .then((u) => {
        user.value = u
      })
      .catch(() => {
        user.value = null
      })
      .finally(() => {
        loaded.value = true
        loading = null
      })
    return loading
  }

  function setUser(u: User | null) {
    user.value = u
    loaded.value = true
  }

  async function login(payload: LoginPayload): Promise<LoginResult> {
    const result = await authApi.login(payload)
    if (result.status === 'authenticated') setUser(result.user)
    else if (result.status === 'mfa_required') mfaChallenge.value = { challenge_id: result.challenge_id, channel: result.channel }
    else pendingPhone.value = result.phone
    return result
  }

  async function verifyMfa(code: string) {
    if (!mfaChallenge.value) throw new Error('No MFA challenge')
    const u = await authApi.verifyMfa(mfaChallenge.value.challenge_id, code)
    mfaChallenge.value = null
    setUser(u)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }

  /** Drops all client-side session state (also used when the API reports 401). */
  function clearSession() {
    disconnectEcho()
    user.value = null
    mfaChallenge.value = null
    pendingPhone.value = null
    loaded.value = true
  }

  return {
    user,
    loaded,
    mfaChallenge,
    pendingPhone,
    isAuthenticated,
    roles,
    primaryRole,
    homePath,
    hasRole,
    hasAnyRole,
    ensureLoaded,
    setUser,
    login,
    verifyMfa,
    logout,
    clearSession,
  }
})
