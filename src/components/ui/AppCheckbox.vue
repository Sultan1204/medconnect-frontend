<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ label: string; error?: string; required?: boolean }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
const { t, te } = useI18n()
const errorText = computed(() => (props.error && te(props.error) ? t(props.error) : props.error))
</script>

<template>
  <div>
    <!-- Wrapping label: the whole row is the hit target (≥44px tall). -->
    <label :for="id" class="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-sm leading-6">
      <input
        :id="id"
        v-model="model"
        type="checkbox"
        :required="required"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-border-strong accent-(--mc-primary)"
      />
      <span>
        <slot>{{ label }}</slot>
        <span v-if="required" class="text-danger" aria-hidden="true"> *</span>
      </span>
    </label>
    <p v-if="error" :id="`${id}-error`" class="ms-8 text-sm font-medium text-danger">{{ errorText }}</p>
  </div>
</template>
