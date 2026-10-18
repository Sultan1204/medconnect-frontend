<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import PageHeader from '../components/PageHeader.vue'
import FaqList from '../components/FaqList.vue'

const { t } = useI18n()
usePageMeta(() => t('pages.faq.title'))
</script>

<template>
  <PageHeader :title="t('pages.faq.title')" />
  <div class="container-page max-w-3xl py-12">
    <FaqList />
  </div>
</template>
