import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { toApiError } from './errors'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not trigger the global "session expired" handler on 401 (e.g. the initial /auth/me probe). */
    skipAuthHandler?: boolean
    /** Internal retry bookkeeping. */
    _csrfRetried?: boolean
    _networkRetried?: boolean
  }
}

/**
 * Central API client. Authentication uses Laravel Sanctum SPA (cookie) auth:
 * an HttpOnly session cookie plus the XSRF-TOKEN cookie echoed back as X-XSRF-TOKEN.
 * No auth token is ever stored in JS-accessible storage.
 */
export const http: AxiosInstance = axios.create({
  baseURL: `${env.apiBaseUrl}${env.apiPrefix}`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

let currentLocale = 'ar'
let onUnauthenticated: (() => void) | null = null

export function setApiLocale(locale: string) {
  currentLocale = locale
}

export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler
}

/** Fetches a fresh CSRF cookie from Sanctum. Required before the first state-changing request. */
export async function ensureCsrfCookie(): Promise<void> {
  await http.get('/sanctum/csrf-cookie', { baseURL: env.apiBaseUrl })
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set('Accept-Language', currentLocale)
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
      // CSRF token mismatch / expired: refresh the cookie once and replay.
      if (status === 419 && !config._csrfRetried) {
        config._csrfRetried = true
        await ensureCsrfCookie()
        return http.request(config)
      }
      // Transient network failure: retry idempotent requests only, once.
      const method = (config.method ?? 'get').toLowerCase()
      if (!error.response && error.code !== 'ERR_CANCELED' && SAFE_METHODS.has(method) && !config._networkRetried) {
        config._networkRetried = true
        await wait(600)
        return http.request(config)
      }
      if (status === 401 && !config.skipAuthHandler) onUnauthenticated?.()
    }
    return Promise.reject(toApiError(error))
  },
)
