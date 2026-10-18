import type { User } from '@/types/domain'
import { ensureCsrfCookie, http } from './http'

export interface LoginPayload {
  /** Saudi mobile in E.164 (+9665XXXXXXXX) or email. */
  identifier: string
  password: string
  remember?: boolean
}

export type LoginResult =
  | { status: 'authenticated'; user: User }
  | { status: 'mfa_required'; challenge_id: string; channel: 'sms' | 'totp' }
  | { status: 'phone_verification_required'; phone: string }

export interface RegisterPatientPayload {
  name: string
  phone: string
  email?: string
  password: string
  password_confirmation: string
  accept_terms: boolean
  accept_privacy: boolean
}

export interface RegisterDoctorAccountPayload extends Omit<RegisterPatientPayload, 'email'> {
  email: string
}

export type OtpPurpose = 'phone_verification' | 'login' | 'password_reset'

export const authApi = {
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
  async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<{ user?: User; reset_token?: string }> {
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
}
