<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CheckCircle2, PhoneCall } from 'lucide-vue-next'
import { usePageMeta } from '@/composables/usePageMeta'
import AppAlert from '@/components/ui/AppAlert.vue'
import PageHeader from '../components/PageHeader.vue'

const { t } = useI18n()
usePageMeta(() => t('pages.patientSafety.title'), () => t('home.safety.body'))
const points = ['p1', 'p2', 'p3', 'p4']
</script>

<template>
  <PageHeader :title="t('pages.patientSafety.title')" />
  <div class="container-page flex max-w-3xl flex-col gap-6 py-12">
    <AppAlert variant="danger" :title="t('home.safety.emergency')">
      <p class="flex items-center gap-2"><PhoneCall class="size-4" aria-hidden="true" />{{ t('home.safety.body') }}</p>
    </AppAlert>
    <ul class="flex flex-col gap-4">
      <li v-for="p in points" :key="p" class="flex gap-3">
        <CheckCircle2 class="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <span>{{ t(`pages.patientSafety.${p}`) }}</span>
      </li>
    </ul>
  </div>
</template>
