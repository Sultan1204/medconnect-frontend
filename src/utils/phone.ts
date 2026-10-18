import { normalizeDigits } from './format'

/**
 * Normalises Saudi mobile input to E.164 (+9665XXXXXXXX).
 * Accepts 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX,
 * with spaces/dashes and Arabic-Indic digits. Returns null when not a valid Saudi mobile.
 */
export function normalizeSaudiMobile(input: string): string | null {
  let digits = normalizeDigits(input).replace(/[\s\-()]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('966')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return /^5\d{8}$/.test(digits) ? `+966${digits}` : null
}

export function isSaudiMobile(input: string): boolean {
  return normalizeSaudiMobile(input) !== null
}

/** Display format: +966 5X XXX XXXX. Wrapped in LRM-safe output by callers using dir="ltr". */
export function formatSaudiMobile(e164: string): string {
  const n = normalizeSaudiMobile(e164)
  if (!n) return e164
  const local = n.slice(4)
  return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}
