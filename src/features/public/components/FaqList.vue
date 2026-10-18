<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'

const { t } = useI18n()
const items = ['q1', 'q2', 'q3', 'q4', 'q5'] as const
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Native <details> gives keyboard and screen-reader support without extra ARIA. -->
    <details v-for="q in items" :key="q" class="card group p-0">
      <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
        {{ t(`faq.${q}.q`) }}
        <ChevronDown class="size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p class="px-5 pb-5 text-fg-muted">{{ t(`faq.${q}.a`) }}</p>
    </details>
  </div>
</template>
