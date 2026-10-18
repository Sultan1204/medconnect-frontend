<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }>(), { size: 'md' })
const failed = ref(false)
const initials = computed(() =>
  props.name
    .replace(/^(د\.|Dr\.?)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join(''),
)
const sizes = { sm: 'size-9 text-sm', md: 'size-12 text-base', lg: 'size-16 text-xl', xl: 'size-24 text-3xl' }
</script>

<template>
  <img v-if="src && !failed" :src="src" alt="" class="shrink-0 rounded-full object-cover" :class="sizes[size]" @error="failed = true" />
  <span v-else class="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-soft-fg" :class="sizes[size]" aria-hidden="true">
    {{ initials }}
  </span>
</template>
