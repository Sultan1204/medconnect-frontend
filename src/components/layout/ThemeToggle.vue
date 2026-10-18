<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Moon, Sun } from 'lucide-vue-next'
import { usePreferencesStore } from '@/stores/preferences'

const prefs = usePreferencesStore()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 items-center justify-center rounded-xl text-fg hover:bg-surface-muted"
    :aria-label="prefs.theme === 'dark' ? t('theme.light') : t('theme.dark')"
    @click="prefs.toggleTheme()"
  >
    <Sun v-if="prefs.theme === 'dark'" class="size-5" aria-hidden="true" />
    <Moon v-else class="size-5" aria-hidden="true" />
  </button>
</template>
