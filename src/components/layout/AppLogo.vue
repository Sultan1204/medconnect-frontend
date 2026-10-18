<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg viewBox="0 0 32 32" class="size-9 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0F766E" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z" fill="#fff" />
    </svg>
    <span class="flex flex-col leading-tight">
      <span class="text-lg font-bold text-fg">{{ t('app.name') }}</span>
      <span class="font-latin text-[0.65rem] font-semibold tracking-[0.18em] text-primary uppercase">MedConnect Saudi</span>
    </span>
  </span>
</template>
