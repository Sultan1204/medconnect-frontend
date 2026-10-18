<script setup lang="ts">
import { useId } from 'vue'
import FormField from '../forms/FormField.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ label: string; hint?: string; error?: string; required?: boolean; rows?: number }>()
const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <FormField :id="id" :label="label" :hint="hint" :error="error" :required="required">
    <template #default="{ describedBy, invalid }">
      <textarea
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :rows="rows ?? 4"
        :required="required"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        class="block w-full rounded-xl border bg-surface px-3.5 py-2.5 text-base text-fg placeholder:text-fg-muted/70 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 sm:text-sm"
        :class="invalid ? 'border-danger' : 'border-border-strong/60'"
      />
    </template>
  </FormField>
</template>
