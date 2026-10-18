<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; description?: string; icon?: Component }>(), { icon: () => Inbox })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-dashed border-border px-6 py-12 text-center">
    <div class="flex size-14 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
      <component :is="icon" class="size-7" aria-hidden="true" />
    </div>
    <h3 class="heading-3">{{ title }}</h3>
    <p v-if="description" class="max-w-md text-sm text-fg-muted">{{ description }}</p>
    <slot />
  </div>
</template>
