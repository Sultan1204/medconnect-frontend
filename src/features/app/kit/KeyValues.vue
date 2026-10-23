<script setup lang="ts">
defineProps<{ items: Array<{ label: string; value: string | number | null | undefined }> }>()
</script>

<template>
  <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
    <div v-for="i in items" :key="i.label">
      <dt class="text-xs font-medium uppercase tracking-wide text-fg-muted">{{ i.label }}</dt>
      <dd class="mt-0.5 break-words text-sm">{{ i.value ?? '—' }}</dd>
    </div>
  </dl>
</template>
