import { describe, expect, it } from 'vitest'
import ar from '@/locales/ar.json'
import en from '@/locales/en.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

function placeholders(s: string) {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

describe('locale files', () => {
  const arKeys = keys(ar)
  const enKeys = keys(en)

  it('have identical key sets', () => {
    expect(arKeys.filter((k) => !enKeys.includes(k))).toEqual([])
    expect(enKeys.filter((k) => !arKeys.includes(k))).toEqual([])
  })

  it('use the same interpolation placeholders', () => {
    const get = (o: unknown, k: string) => k.split('.').reduce<unknown>((a, p) => (a as Record<string, unknown>)[p], o) as string
    for (const k of arKeys) {
      expect(placeholders(get(ar, k)), k).toEqual(placeholders(get(en, k)))
    }
  })

  it('contain no empty strings', () => {
    const get = (o: unknown, k: string) => k.split('.').reduce<unknown>((a, p) => (a as Record<string, unknown>)[p], o) as string
    for (const k of arKeys) {
      expect(get(ar, k).trim(), `ar:${k}`).not.toBe('')
      expect(get(en, k).trim(), `en:${k}`).not.toBe('')
    }
  })
})
