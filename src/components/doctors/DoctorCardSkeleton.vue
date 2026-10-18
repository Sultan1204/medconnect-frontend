<script setup lang="ts">
import AppSkeleton from '../ui/AppSkeleton.vue'
</script>

<template>
  <div class="card flex flex-col gap-4 p-5" aria-hidden="true">
    <div class="flex gap-4">
      <AppSkeleton class="size-16 rounded-full!" />
      <div class="flex flex-1 flex-col gap-2">
        <AppSkeleton class="h-4 w-3/4" />
        <AppSkeleton class="h-3 w-1/2" />
        <AppSkeleton class="h-5 w-20" />
      </div>
    </div>
    <AppSkeleton class="h-3 w-full" />
    <AppSkeleton class="h-3 w-2/3" />
    <AppSkeleton class="mt-2 h-9 w-full" />
  </div>
</template>
