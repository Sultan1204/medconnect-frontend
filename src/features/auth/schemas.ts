import { z } from 'zod'
import { acceptField, emailField, optionalEmailField, passwordField, requiredString, saudiMobileField } from '@/utils/validation'

const base = {
  name: requiredString().max(120, { error: 'validation.maxLength:120' }),
  phone: saudiMobileField(),
  password: passwordField(),
  password_confirmation: z.string().min(1, { error: 'validation.required' }),
  accept_terms: acceptField(),
  accept_privacy: acceptField(),
}

const passwordsMatch = (d: { password: string; password_confirmation: string }) => d.password === d.password_confirmation
const mismatch = { error: 'validation.passwordMismatch', path: ['password_confirmation'] }

export const patientRegistrationSchema = z.object({ ...base, email: optionalEmailField() }).refine(passwordsMatch, mismatch)

export const doctorRegistrationSchema = z.object({ ...base, email: emailField() }).refine(passwordsMatch, mismatch)

export const emptyAccount = () => ({
  name: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
  accept_terms: false,
  accept_privacy: false,
})
