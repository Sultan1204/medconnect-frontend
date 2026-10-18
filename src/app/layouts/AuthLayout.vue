<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLogo from '@/components/layout/AppLogo.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-gradient-to-b from-primary-soft/40 to-bg">
    <header class="container-page flex h-16 items-center justify-between">
      <RouterLink to="/" class="rounded-lg"><AppLogo /></RouterLink>
      <div class="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
    <main id="main-content" tabindex="-1" class="flex flex-1 items-start justify-center px-4 py-8 focus:outline-none sm:items-center">
      <div class="card w-full max-w-md p-6 sm:p-8">
        <slot />
      </div>
    </main>
    <p class="pb-6 text-center text-xs font-semibold text-danger">{{ t('footer.emergency') }}</p>
  </div>
</template>
