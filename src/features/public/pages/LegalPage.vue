<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import AppAlert from '@/components/ui/AppAlert.vue'
import PageHeader from '../components/PageHeader.vue'

/** Legal text must come from the legal team; the page shows a clear placeholder until then. */
const props = defineProps<{ kind: 'privacy' | 'terms' }>()
const { t } = useI18n()
usePageMeta(() => t(`pages.${props.kind}.title`))
</script>

<template>
  <PageHeader :title="t(`pages.${kind}.title`)" />
  <div class="container-page max-w-3xl py-12">
    <AppAlert variant="warning">{{ t('pages.legalPending') }}</AppAlert>
  </div>
</template>
