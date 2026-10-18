<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { PaginationMeta } from '@/types/domain'

defineProps<{ meta: PaginationMeta }>()
const emit = defineEmits<{ change: [page: number] }>()
const { t } = useI18n()
</script>

<template>
  <nav v-if="meta.last_page > 1" :aria-label="t('common.pagination')" class="flex items-center justify-center gap-3">
    <button
      type="button"
      class="flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
      :disabled="meta.current_page <= 1"
      @click="emit('change', meta.current_page - 1)"
    >
      <!-- Chevron mirrors in RTL so "previous" always points backwards in reading order. -->
      <ChevronLeft class="size-4 rtl:-scale-x-100" aria-hidden="true" />
      {{ t('common.previous') }}
    </button>
    <span class="text-sm text-fg-muted" aria-live="polite">{{ t('common.page', { current: meta.current_page, total: meta.last_page }) }}</span>
    <button
      type="button"
      class="flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
      :disabled="meta.current_page >= meta.last_page"
      @click="emit('change', meta.current_page + 1)"
    >
      {{ t('common.next') }}
      <ChevronRight class="size-4 rtl:-scale-x-100" aria-hidden="true" />
    </button>
  </nav>
</template>
