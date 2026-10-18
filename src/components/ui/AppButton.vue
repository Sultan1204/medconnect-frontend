<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppSpinner from './AppSpinner.vue'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    to?: RouteLocationRaw
    href?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
  secondary: 'bg-secondary text-white hover:bg-secondary-hover shadow-sm dark:text-slate-950',
  outline: 'border border-border-strong bg-surface text-fg hover:bg-surface-muted',
  ghost: 'text-fg hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm dark:text-slate-950',
  link: 'text-primary underline-offset-4 hover:underline px-0! min-h-0!',
}

// md/lg/icon meet the 44px touch target (WCAG 2.5.8 needs 24px; 44px is our standard).
const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-12 px-6 text-base gap-2',
  icon: 'size-11 justify-center',
}

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors select-none',
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
])

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <RouterLink v-if="to && !isDisabled" :to="to" :class="classes"><slot /></RouterLink>
  <a v-else-if="href && !isDisabled" :href="href" :class="classes"><slot /></a>
  <button v-else :type="type" :class="classes" :disabled="isDisabled" :aria-busy="loading || undefined">
    <AppSpinner v-if="loading" class="size-4" />
    <slot />
  </button>
</template>
