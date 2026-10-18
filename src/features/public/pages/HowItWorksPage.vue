<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarCheck, FileText, Search, Video } from 'lucide-vue-next'
import { usePageMeta } from '@/composables/usePageMeta'
import AppButton from '@/components/ui/AppButton.vue'
import PageHeader from '../components/PageHeader.vue'

const { t } = useI18n()
usePageMeta(() => t('pages.howItWorks.title'), () => t('pages.howItWorks.intro'))
const steps = [
  { key: 's1', icon: Search },
  { key: 's2', icon: CalendarCheck },
  { key: 's3', icon: Video },
  { key: 's4', icon: FileText },
]
</script>

<template>
  <PageHeader :title="t('pages.howItWorks.title')" :subtitle="t('pages.howItWorks.intro')" />
  <div class="container-page py-12">
    <ol class="mx-auto flex max-w-3xl flex-col gap-6">
      <li v-for="(s, i) in steps" :key="s.key" class="card flex gap-5 p-6">
        <span class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <component :is="s.icon" class="size-7" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-semibold text-primary">{{ i + 1 }}</p>
          <h2 class="heading-3">{{ t(`home.steps.${s.key}.title`) }}</h2>
          <p class="mt-1 text-fg-muted">{{ t(`home.steps.${s.key}.desc`) }}</p>
        </div>
      </li>
    </ol>
    <div class="mt-10 text-center">
      <AppButton to="/doctors" size="lg">{{ t('home.hero.searchDoctor') }}</AppButton>
    </div>
  </div>
</template>
