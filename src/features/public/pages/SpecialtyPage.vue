<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { catalogApi } from '@/services/api/catalog'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageMeta } from '@/composables/usePageMeta'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import DoctorSearchPage from '@/features/doctors/pages/DoctorSearchPage.vue'
import PageHeader from '../components/PageHeader.vue'

const props = defineProps<{ slug: string }>()
const { t, locale } = useI18n()
const specialty = useAsyncData((signal) => catalogApi.specialty(props.slug, { signal }), { watch: [() => props.slug, locale] })
usePageMeta(
  () => specialty.data.value?.name ?? t('specialties.title'),
  () => specialty.data.value?.description ?? undefined,
)
</script>

<template>
  <div v-if="specialty.error.value" class="container-page py-10">
    <AppErrorState :error="specialty.error.value" :title="specialty.error.value.kind === 'not_found' ? t('specialties.notFound') : undefined" @retry="specialty.reload" />
  </div>
  <div v-else-if="!specialty.data.value" class="container-page py-10"><AppSkeleton class="h-32" /></div>
  <template v-else>
    <PageHeader :title="specialty.data.value.name" :subtitle="specialty.data.value.description ?? undefined" />
    <DoctorSearchPage :fixed-specialty="slug" />
  </template>
</template>
