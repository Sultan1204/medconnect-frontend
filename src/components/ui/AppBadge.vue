<script setup lang="ts">
type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
withDefaults(defineProps<{ variant?: Variant }>(), { variant: 'neutral' })

const variants: Record<Variant, string> = {
  neutral: 'bg-surface-muted text-fg',
  primary: 'bg-primary-soft text-primary-soft-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-secondary',
}
</script>

<template>
  <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="variants[variant]">
    <slot />
  </span>
</template>
