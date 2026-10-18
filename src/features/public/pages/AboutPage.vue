<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import PageHeader from '../components/PageHeader.vue'

const { t } = useI18n()
usePageMeta(() => t('pages.about.title'), () => t('pages.about.body'))
</script>

<template>
  <PageHeader :title="t('pages.about.title')" />
  <div class="container-page py-12">
    <p class="max-w-3xl text-lg leading-8">{{ t('pages.about.body') }}</p>
  </div>
</template>
