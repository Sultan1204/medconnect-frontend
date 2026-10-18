<script setup lang="ts">
withDefaults(defineProps<{ as?: string; padded?: boolean }>(), { as: 'div', padded: true })
</script>

<template>
  <component :is="as" class="card" :class="{ 'p-5 sm:p-6': padded }">
    <slot />
  </component>
</template>
