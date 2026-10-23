import type { User } from '@/types/domain'

export interface LoginPayload {
  /** Saudi mobile in E.164 (+9665XXXXXXXX) or email. */
  identifier: string
  password: string
  remember?: boolean
}

export type LoginResult =
  | { status: 'authenticated'; user: User }
  | { status: 'mfa_required'; challenge_id: string; channel: 'sms' | 'totp' }
  /** Privileged accounts must enrol an authenticator app before they can sign in. */
  | { status: 'mfa_enrollment_required' }
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

export interface VerifyOtpResult {
  user?: User
  reset_token?: string
  /** The account must enrol an authenticator app before it gets a session. */
  mfaEnrollmentRequired?: boolean
}

export interface MfaSetupInfo {
  secret: string
  otpauthUrl: string
}

export interface MfaConfirmResult {
  recoveryCodes: string[]
  /** Present when confirming enrolment also signed the user in. */
  user?: User
}

export interface AuthApi {
  me(): Promise<User | null>
  login(payload: LoginPayload): Promise<LoginResult>
  verifyMfa(challenge_id: string, code: string): Promise<User>
  registerPatient(payload: RegisterPatientPayload): Promise<{ phone: string }>
  registerDoctor(payload: RegisterDoctorAccountPayload): Promise<{ phone: string }>
  sendOtp(phone: string, purpose: OtpPurpose): Promise<{ resend_available_in: number }>
  verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<VerifyOtpResult>
  forgotPassword(identifier: string): Promise<void>
  resetPassword(payload: { token: string; identifier: string; password: string; password_confirmation: string }): Promise<void>
  logout(): Promise<void>
  mfaSetup(): Promise<MfaSetupInfo>
  mfaConfirm(code: string): Promise<MfaConfirmResult>
}
