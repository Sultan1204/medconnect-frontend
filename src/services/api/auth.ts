import { env } from '@/config/env'
import { httpAuthApi } from './auth.http'
import { mockAuthApi } from './auth.mock'

export type { LoginPayload, LoginResult, OtpPurpose, RegisterDoctorAccountPayload, RegisterPatientPayload } from './auth.types'

/** The real API client, or the in-browser demo when the build sets VITE_API_MODE=mock. */
export const authApi = env.isMock ? mockAuthApi : httpAuthApi
