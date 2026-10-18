import type { Money } from '@/types/domain'

export const APP_TIMEZONE = 'Asia/Riyadh'

/** Intl locale tags. Arabic uses the Saudi locale with Latin digits for clarity in medical/financial data. */
export function intlLocale(locale: string): string {
  return locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA'
}

/** Formats a backend-provided amount (in halalas). Presentation only. */
export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: money.amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(money.amount / 100)
}

export function formatDate(iso: string, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: APP_TIMEZONE, ...opts }).format(new Date(iso))
}

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: APP_TIMEZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: string): string {
  return formatDate(iso, locale, { dateStyle: 'medium', timeStyle: 'short' })
}

/** YYYY-MM-DD of an instant as seen in Riyadh. */
export function riyadhDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Converts Arabic-Indic and Eastern Arabic-Indic digits to ASCII digits. */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}
