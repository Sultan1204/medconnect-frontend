import type { User } from '@/types/domain'
import { env } from '@/config/env'
import { http } from './http'
import type { AuthApi, LoginPayload, LoginResult, MfaConfirmResult, MfaSetupInfo, OtpPurpose, RegisterDoctorAccountPayload, RegisterPatientPayload, VerifyOtpResult } from './auth.types'

/** Demo mode only: the in-browser mock API (src/mocks) mimics a cookie/CSRF contract. */
async function ensureCsrfCookie(): Promise<void> {
  await http.get('/sanctum/csrf-cookie', { baseURL: env.apiBaseUrl })
}

export const mockAuthApi: AuthApi = {
  async me(): Promise<User | null> {
    try {
      const { data } = await http.get<{ data: User }>('/auth/me', { skipAuthHandler: true })
      return data.data
    } catch (e) {
      if ((e as { kind?: string }).kind === 'unauthenticated') return null
      throw e
    }
  },

  async login(payload: LoginPayload): Promise<LoginResult> {
    await ensureCsrfCookie()
    const { data } = await http.post<LoginResult>('/auth/login', payload, { skipAuthHandler: true })
    return data
  },

  async verifyMfa(challenge_id: string, code: string): Promise<User> {
    const { data } = await http.post<{ data: User }>('/auth/mfa/verify', { challenge_id, code }, { skipAuthHandler: true })
    return data.data
  },

  async registerPatient(payload: RegisterPatientPayload): Promise<{ phone: string }> {
    await ensureCsrfCookie()
    const { data } = await http.post<{ phone: string }>('/auth/register/patient', payload)
    return data
  },

  async registerDoctor(payload: RegisterDoctorAccountPayload): Promise<{ phone: string }> {
    await ensureCsrfCookie()
    const { data } = await http.post<{ phone: string }>('/auth/register/doctor', payload)
    return data
  },

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<{ resend_available_in: number }> {
    await ensureCsrfCookie()
    const { data } = await http.post<{ resend_available_in: number }>('/auth/otp/send', { phone, purpose })
    return data
  },

  /** Verifies a phone OTP. For phone_verification the backend signs the user in and returns them. */
  async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<VerifyOtpResult> {
    const { data } = await http.post<{ data?: User; reset_token?: string }>('/auth/otp/verify', { phone, code, purpose })
    return { user: data.data, reset_token: data.reset_token }
  },

  async forgotPassword(identifier: string): Promise<void> {
    await ensureCsrfCookie()
    await http.post('/auth/forgot-password', { identifier })
  },

  async resetPassword(payload: { token: string; identifier: string; password: string; password_confirmation: string }): Promise<void> {
    await ensureCsrfCookie()
    await http.post('/auth/reset-password', payload)
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout', null, { skipAuthHandler: true })
  },

  async mfaSetup(): Promise<MfaSetupInfo> {
    throw new Error('Authenticator enrolment is not available in demo mode')
  },

  async mfaConfirm(_code: string): Promise<MfaConfirmResult> {
    throw new Error('Authenticator enrolment is not available in demo mode')
  },
}
