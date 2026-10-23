<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="heading-2">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-sm text-fg-muted">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap gap-2"><slot /></div>
  </div>
</template>
