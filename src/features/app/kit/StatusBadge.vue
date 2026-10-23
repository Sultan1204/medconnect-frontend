<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue'
import { statusVariant, useL } from './labels'

defineProps<{ value: string | null | undefined }>()
const { status } = useL()
</script>

<template>
  <AppBadge :variant="statusVariant(value)">{{ status(value) }}</AppBadge>
</template>
