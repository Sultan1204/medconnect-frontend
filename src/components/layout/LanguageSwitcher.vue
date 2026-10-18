<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages } from 'lucide-vue-next'
import { usePreferencesStore } from '@/stores/preferences'

const prefs = usePreferencesStore()
const { t } = useI18n()
</script>

<template>
  <!-- Label is announced in the *target* language, and lang marks it for correct pronunciation. -->
  <button
    type="button"
    class="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-fg hover:bg-surface-muted"
    :lang="prefs.locale === 'ar' ? 'en' : 'ar'"
    :aria-label="t('locale.switchTo')"
    data-testid="language-switcher"
    @click="prefs.toggleLocale()"
  >
    <Languages class="size-5" aria-hidden="true" />
    <span>{{ prefs.locale === 'ar' ? 'English' : 'العربية' }}</span>
  </button>
</template>
