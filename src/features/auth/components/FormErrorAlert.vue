<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ApiError } from '@/services/api/errors'
import AppAlert from '@/components/ui/AppAlert.vue'

/** Form-level error: summary for validation errors, generic message otherwise. */
defineProps<{ error: ApiError | null; hasFieldErrors?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <AppAlert v-if="error" variant="danger" live>
    {{ error.kind === 'validation' ? t('validation.summary') : t(error.messageKey) }}
  </AppAlert>
  <AppAlert v-else-if="hasFieldErrors" variant="danger" live>{{ t('validation.summary') }}</AppAlert>
</template>
