import { describe, expect, it } from 'vitest'
import { identifierField, otpField, passwordField } from '@/utils/validation'
import { doctorRegistrationSchema, patientRegistrationSchema } from '@/features/auth/schemas'

describe('field validators', () => {
  it('identifier accepts Saudi mobile and normalises it', () => {
    expect(identifierField().parse('0501234567')).toBe('+966501234567')
  })
  it('identifier accepts email', () => {
    expect(identifierField().parse('a@b.co')).toBe('a@b.co')
  })
  it('identifier rejects junk with the i18n key', () => {
    const r = identifierField().safeParse('12345')
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('validation.identifier')
  })
  it('password requires 8+ chars with a letter and a digit', () => {
    expect(passwordField().safeParse('abcdefgh').success).toBe(false)
    expect(passwordField().safeParse('12345678').success).toBe(false)
    expect(passwordField().safeParse('abc12345').success).toBe(true)
  })
  it('otp accepts Arabic-Indic digits', () => {
    expect(otpField().parse('١٢٣٤٥٦')).toBe('123456')
    expect(otpField().safeParse('12345').success).toBe(false)
  })
})

describe('registration schemas', () => {
  const valid = {
    name: 'Test',
    phone: '0501234567',
    email: '',
    password: 'abc12345',
    password_confirmation: 'abc12345',
    accept_terms: true,
    accept_privacy: true,
  }

  it('accepts a minimal patient registration (email optional)', () => {
    const out = patientRegistrationSchema.parse(valid)
    expect(out.phone).toBe('+966501234567')
  })

  it('requires consents', () => {
    const r = patientRegistrationSchema.safeParse({ ...valid, accept_privacy: false })
    expect(r.error?.issues.map((i) => i.path.join('.'))).toContain('accept_privacy')
  })

  it('flags mismatched passwords on the confirmation field', () => {
    const r = patientRegistrationSchema.safeParse({ ...valid, password_confirmation: 'other123' })
    expect(r.error?.issues[0]).toMatchObject({ path: ['password_confirmation'], message: 'validation.passwordMismatch' })
  })

  it('requires email for doctors', () => {
    const r = doctorRegistrationSchema.safeParse(valid)
    expect(r.error?.issues.map((i) => i.path.join('.'))).toContain('email')
  })
})
