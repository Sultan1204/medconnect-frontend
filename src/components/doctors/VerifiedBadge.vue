<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BadgeCheck } from 'lucide-vue-next'
import AppBadge from '../ui/AppBadge.vue'

/** Render only when the backend reports `is_verified: true`. */
const { t } = useI18n()
</script>

<template>
  <AppBadge variant="primary" :title="t('doctors.card.verifiedHint')" data-testid="verified-badge">
    <BadgeCheck class="size-3.5" aria-hidden="true" />
    {{ t('doctors.card.verified') }}
    <span class="sr-only">— {{ t('doctors.card.verifiedHint') }}</span>
  </AppBadge>
</template>
