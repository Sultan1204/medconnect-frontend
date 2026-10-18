<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CloudOff, ShieldAlert, SearchX, AlertOctagon } from 'lucide-vue-next'
import type { ApiError } from '@/services/api/errors'
import AppButton from './AppButton.vue'

const props = defineProps<{ error: ApiError; title?: string }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()

const icon = computed(() => {
  switch (props.error.kind) {
    case 'network':
      return CloudOff
    case 'forbidden':
    case 'unauthenticated':
      return ShieldAlert
    case 'not_found':
      return SearchX
    default:
      return AlertOctagon
  }
})
const retryable = computed(() => ['network', 'server', 'rate_limited', 'unknown'].includes(props.error.kind))
</script>

<template>
  <div role="alert" class="flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-danger/30 bg-danger-soft/40 px-6 py-10 text-center">
    <component :is="icon" class="size-10 text-danger" aria-hidden="true" />
    <h3 class="heading-3">{{ title ?? t('errors.loadFailed') }}</h3>
    <p class="max-w-md text-sm text-fg-muted">{{ t(error.messageKey) }}</p>
    <AppButton v-if="retryable" variant="outline" size="sm" @click="$emit('retry')">{{ t('common.retry') }}</AppButton>
  </div>
</template>
