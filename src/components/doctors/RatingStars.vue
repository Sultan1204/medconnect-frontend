<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Star } from 'lucide-vue-next'
import type { Rating } from '@/types/domain'

defineProps<{ rating: Rating }>()
const { t } = useI18n()
</script>

<template>
  <span class="inline-flex items-center gap-1 text-sm">
    <Star class="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
    <span class="font-semibold" aria-hidden="true">{{ rating.average.toFixed(1) }}</span>
    <span class="text-fg-muted" aria-hidden="true">({{ rating.count }})</span>
    <span class="sr-only">{{ t('doctors.card.rating', { avg: rating.average.toFixed(1), count: rating.count }) }}</span>
  </span>
</template>
