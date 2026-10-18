<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

/** Confirmation for consequential actions. Use `danger` for destructive or high-risk actions. */
defineProps<{ title: string; description: string; confirmLabel?: string; danger?: boolean; loading?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
const { t } = useI18n()
</script>

<template>
  <AppModal v-model:open="open" :title="title" :description="description" size="sm">
    <slot />
    <template #footer>
      <AppButton variant="outline" :disabled="loading" @click="open = false">{{ t('common.cancel') }}</AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel ?? t('common.confirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>
