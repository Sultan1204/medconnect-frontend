/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { http } from '@/services/api/http'
import { toApiError } from '@/services/api/errors'

/** Loosely-typed API row. The backend OpenAPI document is the contract; screens read only what they display. */
export type Row = Record<string, any>

export interface Listed<T = Row> {
  data: T[]
  meta?: { current_page?: number; last_page?: number; total?: number; has_more?: boolean; next_cursor?: string | null; [k: string]: any }
  links?: { next?: string | null; [k: string]: any }
}

function clean(params?: Record<string, any>) {
  if (!params) return undefined
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
}

/** Pending step-up (fresh authenticator code) prompt, rendered once by StepUpDialog in the portal layout. */
export const stepUpPrompt = ref<{ resolve: (code: string | null) => void } | null>(null)

function askStepUp(): Promise<string | null> {
  return new Promise((resolve) => {
    stepUpPrompt.value = { resolve: (code) => { stepUpPrompt.value = null; resolve(code) } }
  })
}

/** Retries a mutation once with `X-MFA-Code` when the API asks for step-up authentication. */
async function withStepUp<T>(call: (headers?: Record<string, string>) => Promise<T>, base?: Record<string, string>): Promise<T> {
  try {
    return await call(base)
  } catch (e) {
    if (toApiError(e).code === 'step_up_required') {
      const code = await askStepUp()
      if (code) return await call({ ...base, 'X-MFA-Code': code })
    }
    throw e
  }
}

/** Thin wrappers around the shared axios client. All return the response body. */
export const api = {
  async get<T = any>(path: string, params?: Record<string, any>, signal?: AbortSignal): Promise<T> {
    return (await http.get(path, { params: clean(params), signal })).data
  },
  async post<T = any>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return withStepUp(async (h) => (await http.post(path, body ?? {}, { headers: h })).data, headers)
  },
  async put<T = any>(path: string, body?: unknown): Promise<T> {
    return withStepUp(async (h) => (await http.put(path, body ?? {}, { headers: h })).data)
  },
  async patch<T = any>(path: string, body?: unknown): Promise<T> {
    return withStepUp(async (h) => (await http.patch(path, body ?? {}, { headers: h })).data)
  },
  async del<T = any>(path: string): Promise<T> {
    return withStepUp(async (h) => (await http.delete(path, { headers: h })).data)
  },
}

/** Unwraps `{ data: ... }`. */
export async function getData<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  return (await api.get(path, params)).data as T
}

export function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

/** Money in minor units (halalas) → "80 SAR". Presentation only. */
export function sar(amount: number | null | undefined, currency = 'SAR'): string {
  if (amount === null || amount === undefined) return '—'
  const v = amount / 100
  return `${Number.isInteger(v) ? v : v.toFixed(2)} ${currency}`
}

/** Drops empty values so optional fields are omitted instead of sent as null. */
export function prune<T extends Record<string, any>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== null && v !== undefined)) as Partial<T>
}
