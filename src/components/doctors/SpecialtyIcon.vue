<script setup lang="ts">
import { computed } from 'vue'
import { Apple, Baby, Brain, Ear, HeartPulse, Home, ScanFace, Stethoscope } from 'lucide-vue-next'

const props = defineProps<{ icon: string | null }>()
const map = { apple: Apple, baby: Baby, brain: Brain, ear: Ear, 'heart-pulse': HeartPulse, home: Home, 'scan-face': ScanFace, stethoscope: Stethoscope }
const component = computed(() => map[(props.icon ?? '') as keyof typeof map] ?? Stethoscope)
</script>

<template>
  <component :is="component" aria-hidden="true" />
</template>
