import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { z } from 'zod'
import { useForm } from '@/composables/useForm'
import { ApiError } from '@/services/api/errors'
import { saudiMobileField } from '@/utils/validation'

function setup() {
  return effectScope().run(() => useForm(z.object({ phone: saudiMobileField() }), { phone: '' }))!
}

describe('useForm', () => {
  it('blocks submit and sets i18n error keys on invalid input', async () => {
    const form = setup()
    let called = false
    const ok = await form.handleSubmit(async () => {
      called = true
    })()
    expect(ok).toBe(false)
    expect(called).toBe(false)
    expect(form.errors.phone).toBe('validation.required')
  })

  it('passes parsed output to the handler', async () => {
    const form = setup()
    form.values.phone = '0501234567'
    let received = ''
    await form.handleSubmit(async (d) => {
      received = d.phone
    })()
    expect(received).toBe('+966501234567')
  })

  it('maps server 422 errors onto fields', async () => {
    const form = setup()
    form.values.phone = '0501234567'
    const ok = await form.handleSubmit(async () => {
      throw new ApiError('validation', 'Invalid', 422, { phone: ['Already registered'] })
    })()
    expect(ok).toBe(false)
    expect(form.errors.phone).toBe('Already registered')
    expect(form.formError.value?.kind).toBe('validation')
    expect(form.submitting.value).toBe(false)
  })
})
