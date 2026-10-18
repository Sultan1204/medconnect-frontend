import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { applyLocale, i18n, isRtl, type AppLocale } from '@/app/providers/i18n'
import { storage } from '@/utils/storage'

export type Theme = 'light' | 'dark'
const THEME_KEY = 'mc.theme'

export const usePreferencesStore = defineStore('preferences', () => {
  const locale = ref<AppLocale>(i18n.global.locale.value as AppLocale)
  const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  const rtl = computed(() => isRtl(locale.value))

  function setLocale(next: AppLocale) {
    locale.value = next
    applyLocale(next)
  }

  function toggleLocale() {
    setLocale(locale.value === 'ar' ? 'en' : 'ar')
  }

  function setTheme(next: Theme) {
    theme.value = next
    document.documentElement.classList.toggle('dark', next === 'dark')
    storage.set(THEME_KEY, next)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { locale, theme, rtl, setLocale, toggleLocale, setTheme, toggleTheme }
})
