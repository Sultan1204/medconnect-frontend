<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-vue-next'

type Variant = 'info' | 'success' | 'warning' | 'danger'
const props = withDefaults(defineProps<{ variant?: Variant; title?: string; live?: boolean }>(), { variant: 'info' })

const styles: Record<Variant, string> = {
  info: 'bg-info-soft border-secondary/30',
  success: 'bg-success-soft border-success/30',
  warning: 'bg-warning-soft border-warning/30',
  danger: 'bg-danger-soft border-danger/30',
}
const iconColor: Record<Variant, string> = {
  info: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}
const icon = computed(() => ({ info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle })[props.variant])
const role = computed(() => (props.live ? (props.variant === 'danger' ? 'alert' : 'status') : undefined))
</script>

<template>
  <div class="flex gap-3 rounded-xl border p-4 text-sm" :class="styles[variant]" :role="role">
    <component :is="icon" class="mt-0.5 size-5 shrink-0" :class="iconColor[variant]" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-semibold">{{ title }}</p>
      <div :class="{ 'mt-1': title }"><slot /></div>
    </div>
  </div>
</template>
