import { createI18n } from 'vue-i18n'
import ar from '@/locales/ar.json'
import en from '@/locales/en.json'
import { setApiLocale } from '@/services/api/http'
import { storage } from '@/utils/storage'

export type AppLocale = 'ar' | 'en'
export const SUPPORTED_LOCALES: AppLocale[] = ['ar', 'en']
const STORAGE_KEY = 'mc.locale'

type MessageSchema = typeof ar

function initialLocale(): AppLocale {
  const stored = storage.get(STORAGE_KEY)
  return stored === 'en' || stored === 'ar' ? stored : 'ar'
}

export const i18n = createI18n<[MessageSchema], AppLocale, false>({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'ar',
  messages: { ar, en },
  // Missing keys must fail loudly in development; the unit tests also enforce key parity.
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
})

export function isRtl(locale: string): boolean {
  return locale === 'ar'
}

/** Applies a locale everywhere: i18n, <html lang/dir>, API Accept-Language, persisted preference. */
export function applyLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
  setApiLocale(locale)
  storage.set(STORAGE_KEY, locale)
}
