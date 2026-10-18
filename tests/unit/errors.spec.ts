import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, toApiError } from '@/services/api/errors'

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

function httpError(status: number, data: unknown, headers: Record<string, string> = {}) {
  return new AxiosError('fail', 'ERR_BAD_REQUEST', config, {}, { status, statusText: '', data, headers, config })
}

describe('toApiError', () => {
  it('maps Laravel 422 field errors', () => {
    const err = toApiError(httpError(422, { message: 'Invalid', errors: { phone: ['Taken'] } }))
    expect(err.kind).toBe('validation')
    expect(err.fieldErrors).toEqual({ phone: ['Taken'] })
    expect(err.message).toBe('Invalid')
  })

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [419, 'csrf'],
    [429, 'rate_limited'],
    [500, 'server'],
    [503, 'server'],
  ])('maps %i to %s', (status, kind) => {
    expect(toApiError(httpError(status, {})).kind).toBe(kind)
  })

  it('reads Retry-After on 429', () => {
    expect(toApiError(httpError(429, {}, { 'retry-after': '30' })).retryAfterSeconds).toBe(30)
  })

  it('treats a missing response as a network error', () => {
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK', config)).kind).toBe('network')
  })

  it('recognises cancellation', () => {
    expect(toApiError(new AxiosError('canceled', 'ERR_CANCELED', config)).kind).toBe('cancelled')
  })

  it('passes ApiError through and exposes an i18n key', () => {
    const e = new ApiError('forbidden', 'x', 403)
    expect(toApiError(e)).toBe(e)
    expect(e.messageKey).toBe('errors.forbidden')
  })
})
