<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Construction } from 'lucide-vue-next'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

/** Placeholder for portal routes whose features land in a later development phase. */
const route = useRoute()
const { t } = useI18n()
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <h1 class="heading-2">{{ route.meta.titleKey ? t(route.meta.titleKey) : t('portal.comingSoon.title') }}</h1>
    <AppEmptyState :icon="Construction" :title="t('portal.comingSoon.title')" :description="t('portal.comingSoon.desc')">
      <AppBadge v-if="route.meta.phase" variant="info">{{ t('portal.comingSoon.phase', { n: route.meta.phase }) }}</AppBadge>
    </AppEmptyState>
  </div>
</template>
