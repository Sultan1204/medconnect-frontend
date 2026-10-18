import { z } from 'zod'
import { normalizeDigits } from './format'
import { normalizeSaudiMobile } from './phone'

/** Reusable Zod building blocks. Messages are i18n keys resolved by FormField. */

export const requiredString = () => z.string().trim().min(1, { error: 'validation.required' })

export const emailField = () => z.string().trim().min(1, { error: 'validation.required' }).pipe(z.email({ error: 'validation.email' }))

export const optionalEmailField = () =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, { error: 'validation.email' })

/** Accepts any Saudi mobile notation and outputs E.164. */
export const saudiMobileField = () =>
  z
    .string()
    .min(1, { error: 'validation.required' })
    .transform((v, ctx) => {
      const n = normalizeSaudiMobile(v)
      if (!n) {
        ctx.addIssue({ code: 'custom', message: 'validation.phone' })
        return z.NEVER
      }
      return n
    })

/** Mobile (normalised to E.164) or email. */
export const identifierField = () =>
  z
    .string()
    .trim()
    .min(1, { error: 'validation.required' })
    .transform((v, ctx) => {
      if (v.includes('@')) {
        if (z.email().safeParse(v).success) return v
      } else {
        const n = normalizeSaudiMobile(v)
        if (n) return n
      }
      ctx.addIssue({ code: 'custom', message: 'validation.identifier' })
      return z.NEVER
    })

export const passwordField = () =>
  z
    .string()
    .min(1, { error: 'validation.required' })
    .refine((v) => v.length >= 8 && /[A-Za-z؀-ۿ]/.test(v) && /\d/.test(normalizeDigits(v)), {
      error: 'validation.passwordWeak',
    })

export const otpField = () =>
  z
    .string()
    .transform((v) => normalizeDigits(v).replace(/\s/g, ''))
    .refine((v) => /^\d{6}$/.test(v), { error: 'validation.otp' })

export const acceptField = () => z.boolean().refine((v) => v, { error: 'validation.mustAccept' })
