<script setup lang="ts" generic="V extends string | number">
import { useId } from 'vue'
import FormField from '../forms/FormField.vue'

defineOptions({ inheritAttrs: false })
defineProps<{
  label: string
  options: Array<{ value: V | ''; label: string }>
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
}>()
const model = defineModel<V | ''>({ default: '' })
const id = useId()
</script>

<template>
  <FormField :id="id" :label="label" :hint="hint" :error="error" :required="required" :hide-label="hideLabel">
    <template #default="{ describedBy, invalid }">
      <select
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :required="required"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        class="block min-h-11 w-full rounded-xl border bg-surface px-3 text-base text-fg focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 sm:text-sm"
        :class="invalid ? 'border-danger' : 'border-border-strong/60'"
      >
        <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
      </select>
    </template>
  </FormField>
</template>
