import type { DoctorVerificationStatus, Role, User } from '@/types/domain'
import { ApiError, toApiError } from './errors'
import { http } from './http'
import { session } from './session'
import type {
  AuthApi,
  LoginPayload,
  LoginResult,
  MfaConfirmResult,
  MfaSetupInfo,
  OtpPurpose,
  RegisterDoctorAccountPayload,
  RegisterPatientPayload,
  VerifyOtpResult,
} from './auth.types'

/* ------------------------------------------------------------------ backend shapes */

interface ApiUser {
  id: string
  name: string
  phone: string | null
  phone_verified: boolean
  email: string | null
  preferred_locale: string
  roles: string[]
  mfa: { enabled: boolean; required: boolean }
  created_at: string
}

interface ApiSession {
  status: 'authenticated'
  access_token: string
  expires_at: string
  user: ApiUser
}

interface ApiPartial {
  status: 'mfa_required' | 'mfa_enrollment_required'
  mfa_token: string
}

type ApiAuthResult = ApiSession | ApiPartial

/* ------------------------------------------------------------------ mappers */

const ROLE_MAP: Record<string, Role> = {
  patient: 'patient',
  doctor: 'doctor',
  pharmacy_staff: 'pharmacist',
  admin: 'admin',
  super_admin: 'admin',
}

const DOCTOR_STATUS: Record<string, DoctorVerificationStatus> = {
  pending: 'draft',
  under_review: 'under_review',
  approved: 'approved',
  rejected: 'rejected',
  suspended: 'suspended',
  expired: 'suspended',
}

function toUser(u: ApiUser): User {
  const roles = [...new Set(u.roles.map((r) => ROLE_MAP[r]).filter((r): r is Role => r !== undefined))]
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? '',
    roles,
    locale: u.preferred_locale === 'en' ? 'en' : 'ar',
    phone_verified_at: u.phone_verified ? u.created_at : null,
    mfa_enabled: u.mfa.enabled,
  }
}

/** Doctors carry a verification state that gates their portal; read it from their profile. */
async function withDoctorStatus(user: User): Promise<User> {
  if (!user.roles.includes('doctor')) return user
  try {
    const { data } = await http.get<{ data: { verification: { status: string } } }>('/doctors/me', { skipAuthHandler: true })
    return { ...user, doctor_status: DOCTOR_STATUS[data.data.verification.status] ?? 'draft' }
  } catch {
    return { ...user, doctor_status: 'draft' }
  }
}

const DEVICE = { platform: 'web', device_name: 'Web browser' } as const

/** Stores the session or the partial MFA token and reports what happened. */
async function settle(result: ApiAuthResult): Promise<{ user: User } | { partial: 'mfa_required' | 'mfa_enrollment_required' }> {
  if (result.status === 'authenticated') {
    session.set(result.access_token, result.expires_at)
    return { user: await withDoctorStatus(toUser(result.user)) }
  }
  session.setPartial(result.mfa_token)
  return { partial: result.status }
}

function currentLocale(): 'ar' | 'en' {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar'
}

/* ------------------------------------------------------------------ API */

export const httpAuthApi: AuthApi = {
  async me() {
    if (!session.token) return null
    try {
      const { data } = await http.get<{ data: ApiUser }>('/me', { skipAuthHandler: true })
      return await withDoctorStatus(toUser(data.data))
    } catch (e) {
      const err = toApiError(e)
      if (err.kind === 'unauthenticated') {
        session.clear()
        return null
      }
      throw err
    }
  },

  async login(payload: LoginPayload): Promise<LoginResult> {
    try {
      const { data } = await http.post<{ data: ApiAuthResult }>('/auth/login', { identifier: payload.identifier, password: payload.password, ...DEVICE }, { skipAuthHandler: true })
      const settled = await settle(data.data)
      if ('user' in settled) return { status: 'authenticated', user: settled.user }
      return settled.partial === 'mfa_required' ? { status: 'mfa_required', challenge_id: '', channel: 'totp' } : { status: 'mfa_enrollment_required' }
    } catch (e) {
      const err = toApiError(e)
      if (err.code === 'phone_not_verified' && /^\+?\d{9,15}$/.test(payload.identifier.replace(/\s/g, ''))) {
        return { status: 'phone_verification_required', phone: payload.identifier }
      }
      throw err
    }
  },

  async verifyMfa(_challengeId: string, code: string): Promise<User> {
    const token = session.partialToken
    if (!token) throw new ApiError('unauthenticated', 'The sign-in step expired', 401)
    const { data } = await http.post<{ data: ApiAuthResult }>('/auth/mfa/challenge', { code, ...DEVICE }, { bearer: token, skipAuthHandler: true })
    const settled = await settle(data.data)
    if (!('user' in settled)) throw new ApiError('unknown', 'Unexpected response')
    return settled.user
  },

  async registerPatient(payload: RegisterPatientPayload) {
    await http.post('/auth/register', {
      account_type: 'patient',
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      preferred_locale: currentLocale(),
    })
    return { phone: payload.phone }
  },

  async registerDoctor(payload: RegisterDoctorAccountPayload) {
    await http.post('/auth/register', {
      account_type: 'doctor',
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      preferred_locale: currentLocale(),
    })
    return { phone: payload.phone }
  },

  async sendOtp(phone: string, purpose: OtpPurpose) {
    if (purpose === 'password_reset') await http.post('/auth/password/forgot', { identifier: phone })
    else await http.post('/auth/otp/resend', { phone })
    return { resend_available_in: 60 }
  },

  async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<VerifyOtpResult> {
    // The API checks a password-reset code together with the new password in one call,
    // so here the code is just carried forward to resetPassword().
    if (purpose === 'password_reset') return { reset_token: code }

    const { data } = await http.post<{ data: ApiAuthResult }>('/auth/verify-otp', { phone, code, ...DEVICE }, { skipAuthHandler: true })
    const settled = await settle(data.data)
    return 'user' in settled ? { user: settled.user } : { mfaEnrollmentRequired: true }
  },

  async forgotPassword(identifier: string) {
    await http.post('/auth/password/forgot', { identifier })
  },

  async resetPassword(payload) {
    await http.post('/auth/password/reset', {
      identifier: payload.identifier,
      code: payload.token,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    })
  },

  async logout() {
    try {
      if (session.token) await http.post('/auth/logout', null, { skipAuthHandler: true })
    } finally {
      session.clear()
    }
  },

  async mfaSetup(): Promise<MfaSetupInfo> {
    const bearer = session.partialToken ?? undefined
    const { data } = await http.post<{ data: { secret: string; otpauth_url: string } }>('/auth/mfa/setup', null, { bearer, skipAuthHandler: true })
    return { secret: data.data.secret, otpauthUrl: data.data.otpauth_url }
  },

  async mfaConfirm(code: string): Promise<MfaConfirmResult> {
    const bearer = session.partialToken ?? undefined
    const { data } = await http.post<{ data: { recovery_codes: string[]; session?: ApiSession } }>('/auth/mfa/confirm', { code }, { bearer, skipAuthHandler: true })
    let user: User | undefined
    if (data.data.session) {
      const settled = await settle(data.data.session)
      if ('user' in settled) user = settled.user
    }
    return { recoveryCodes: data.data.recovery_codes, user }
  },
}
