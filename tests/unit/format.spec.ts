import { describe, expect, it } from 'vitest'
import { formatMoney, formatTime, normalizeDigits, riyadhDateKey } from '@/utils/format'
import { formatSaudiMobile, normalizeSaudiMobile } from '@/utils/phone'

describe('normalizeSaudiMobile', () => {
  it.each([
    ['0501234567', '+966501234567'],
    ['501234567', '+966501234567'],
    ['966501234567', '+966501234567'],
    ['+966 50 123 4567', '+966501234567'],
    ['00966501234567', '+966501234567'],
    ['٠٥٠١٢٣٤٥٦٧', '+966501234567'],
    ['050-123-4567', '+966501234567'],
  ])('normalises %s', (input, expected) => {
    expect(normalizeSaudiMobile(input)).toBe(expected)
  })

  it.each(['0401234567', '05012345', '+971501234567', 'abc', ''])('rejects %s', (input) => {
    expect(normalizeSaudiMobile(input)).toBeNull()
  })

  it('formats for display', () => {
    expect(formatSaudiMobile('+966501234567')).toBe('+966 50 123 4567')
  })
})

describe('normalizeDigits', () => {
  it('converts Arabic-Indic and Persian digits', () => {
    expect(normalizeDigits('١٢٣ ۴۵۶')).toBe('123 456')
  })
})

describe('formatMoney', () => {
  it('formats halalas as SAR in English', () => {
    expect(formatMoney({ amount: 15000, currency: 'SAR' }, 'en')).toMatch(/SAR\s?150/)
  })
  it('keeps fractional halalas', () => {
    expect(formatMoney({ amount: 15050, currency: 'SAR' }, 'en')).toMatch(/150\.50/)
  })
  it('formats in Arabic with Latin digits', () => {
    const out = formatMoney({ amount: 15000, currency: 'SAR' }, 'ar')
    expect(out).toContain('150')
  })
})

describe('Riyadh timezone', () => {
  it('presents times in Asia/Riyadh regardless of host timezone', () => {
    // 21:30 UTC is 00:30 next day in Riyadh (UTC+3).
    const iso = '2026-03-01T21:30:00Z'
    expect(riyadhDateKey(new Date(iso))).toBe('2026-03-02')
    expect(formatTime(iso, 'en')).toMatch(/12:30/)
  })
})
