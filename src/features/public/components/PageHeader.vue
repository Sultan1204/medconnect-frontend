<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header class="border-b border-border bg-gradient-to-b from-primary-soft/50 to-bg">
    <div class="container-page py-10 lg:py-14">
      <h1 class="heading-1">{{ title }}</h1>
      <p v-if="subtitle" class="mt-3 max-w-2xl text-lg text-fg-muted">{{ subtitle }}</p>
    </div>
  </header>
</template>
