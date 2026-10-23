import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { toApiError } from './errors'
import { session } from './session'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not trigger the global "session expired" handler on 401 (e.g. the initial /me probe, sign-in). */
    skipAuthHandler?: boolean
    /** Send this token instead of the stored session token (MFA challenge / enrolment steps). */
    bearer?: string
    /** Internal retry bookkeeping. */
    _networkRetried?: boolean
  }
}

/**
 * Central API client. The API uses bearer tokens (see ./session.ts), so no cookies and
 * no CSRF handshake are involved and cross-origin deployment only needs CORS.
 */
export const http: AxiosInstance = axios.create({
  baseURL: `${env.apiBaseUrl}${env.apiPrefix}`,
  withCredentials: false,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

let currentLocale = 'ar'
let onUnauthenticated: (() => void) | null = null

export function setApiLocale(locale: string) {
  currentLocale = locale
}

export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('Accept-Language', currentLocale)
  const token = config.bearer ?? session.token
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

const SAFE_METHODS = new Set(['get', 'head', 'options'])
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as InternalAxiosRequestConfig | undefined
    const status: number | undefined = error?.response?.status

    if (config) {
      // Transient network failure: retry idempotent requests only, once.
      const method = (config.method ?? 'get').toLowerCase()
      if (!error.response && error.code !== 'ERR_CANCELED' && SAFE_METHODS.has(method) && !config._networkRetried) {
        config._networkRetried = true
        await wait(600)
        return http.request(config)
      }
      if (status === 401 && !config.skipAuthHandler) {
        session.clear()
        onUnauthenticated?.()
      }
    }
    return Promise.reject(toApiError(error))
  },
)
