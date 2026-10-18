<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { Compass } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
useHead({ title: () => t('errors.notFoundTitle'), meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<template>
  <div class="container-page flex flex-col items-center gap-4 py-24 text-center">
    <Compass class="size-16 text-fg-muted" aria-hidden="true" />
    <h1 class="heading-2">{{ t('errors.notFoundTitle') }}</h1>
    <p class="text-fg-muted">{{ t('errors.notFoundDesc') }}</p>
    <AppButton to="/">{{ t('errors.goHome') }}</AppButton>
  </div>
</template>
