<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Label + control + hint + error wrapper. Exposes ids through the default slot so
 * the control can wire aria-describedby / aria-invalid correctly.
 */
const props = defineProps<{
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
}>()

const { t, te } = useI18n()

// Client messages are i18n keys, optionally with a numeric argument ("validation.maxLength:150").
// Anything else is a server message that is already localised.
const errorText = computed(() => {
  if (!props.error) return ''
  const [key = '', arg] = props.error.split(':')
  if (!key.startsWith('validation.') || !te(key)) return props.error
  return t(key, { min: arg, max: arg })
})
const hintId = computed(() => (props.hint ? `${props.id}-hint` : undefined))
const errorId = computed(() => (props.error ? `${props.id}-error` : undefined))
const describedBy = computed(() => [errorId.value, hintId.value].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium" :class="{ 'sr-only': hideLabel }">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>
    <slot :id="id" :described-by="describedBy" :invalid="!!error" />
    <p v-if="hint && !error" :id="hintId" class="text-xs text-fg-muted">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="text-sm font-medium text-danger">{{ errorText }}</p>
  </div>
</template>
