<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { catalogApi } from '@/services/api/catalog'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageMeta } from '@/composables/usePageMeta'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import SpecialtyIcon from '@/components/doctors/SpecialtyIcon.vue'
import PageHeader from '../components/PageHeader.vue'

const { t, locale } = useI18n()
usePageMeta(() => t('specialties.seoTitle'), () => t('specialties.subtitle'))
const specialties = useAsyncData((signal) => catalogApi.specialties({ signal }), { watch: [locale] })
</script>

<template>
  <PageHeader :title="t('specialties.title')" :subtitle="t('specialties.subtitle')" />
  <div class="container-page py-10">
    <AppErrorState v-if="specialties.error.value" :error="specialties.error.value" @retry="specialties.reload" />
    <div v-else-if="!specialties.data.value" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AppSkeleton v-for="n in 6" :key="n" class="h-36" />
    </div>
    <AppEmptyState v-else-if="!specialties.data.value.length" :title="t('specialties.empty')" />
    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="s in specialties.data.value" :key="s.id">
        <RouterLink :to="`/specialties/${s.slug}`" class="card flex h-full flex-col gap-3 p-5 transition hover:border-primary hover:shadow-md">
          <span class="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><SpecialtyIcon :icon="s.icon" class="size-6" /></span>
          <h2 class="heading-3">{{ s.name }}</h2>
          <p v-if="s.description" class="text-sm text-fg-muted">{{ s.description }}</p>
          <p class="mt-auto text-sm font-medium text-primary">{{ t('specialties.doctorsCount', { count: s.doctors_count }) }}</p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
