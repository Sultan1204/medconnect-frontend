<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { env } from '@/config/env'
const { t } = useI18n()
</script>

<template>
  <div v-if="env.isMock" class="bg-warning-soft px-4 py-2 text-center text-xs font-semibold text-warning" role="note" data-testid="demo-banner">
    {{ t('app.demoBanner') }}
  </div>
</template>
