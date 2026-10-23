import { isAxiosError, isCancel } from 'axios'

export type ApiErrorKind =
  | 'validation' // 422
  | 'unauthenticated' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'csrf' // 419
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'network' // no response
  | 'cancelled'
  | 'unknown'

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status: number | null = null,
    /** Field errors from a Laravel 422 response, keyed by field name. */
    public readonly fieldErrors: Record<string, string[]> = {},
    public readonly retryAfterSeconds: number | null = null,
    /** Stable machine-readable code from the API error envelope (e.g. `invalid_credentials`). */
    public readonly code: string | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** i18n key for a user-facing generic message for this error kind. */
  get messageKey(): string {
    return `errors.${this.kind}`
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 419) return 'csrf'
  if (status === 422) return 'validation'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'unknown'
}

/** Normalises anything thrown by the HTTP layer into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return new ApiError('cancelled', 'Request cancelled')
  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') return new ApiError('cancelled', 'Request cancelled')
    if (!error.response) return new ApiError('network', error.message || 'Network error')
    const { status, data, headers } = error.response
    // API envelope: { error: { code, message, details?: { fields } } }. Plain Laravel
    // { message, errors } bodies are still understood as a fallback.
    const body = (data ?? {}) as {
      error?: { code?: unknown; message?: unknown; details?: { fields?: unknown } }
      message?: unknown
      errors?: unknown
    }
    const env = body.error
    const message = typeof env?.message === 'string' ? env.message : typeof body.message === 'string' ? body.message : `HTTP ${status}`
    const rawFields = env?.details?.fields ?? body.errors
    const fieldErrors =
      status === 422 && rawFields && typeof rawFields === 'object' ? (rawFields as Record<string, string[]>) : {}
    const retryAfter = Number(headers?.['retry-after'])
    const code = typeof env?.code === 'string' ? env.code : null
    return new ApiError(kindForStatus(status), message, status, fieldErrors, Number.isFinite(retryAfter) ? retryAfter : null, code)
  }
  return new ApiError('unknown', error instanceof Error ? error.message : 'Unknown error')
}
