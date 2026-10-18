<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Pill, Search, Video } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const query = ref('')

function search() {
  void router.push({ path: '/doctors', query: query.value.trim() ? { search: query.value.trim() } : {} })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="heading-2">{{ t('portal.dashboard.welcome', { name: auth.user?.name ?? '' }) }}</h1>

    <AppCard>
      <form role="search" class="flex flex-col gap-2 sm:flex-row" @submit.prevent="search">
        <label for="dash-search" class="sr-only">{{ t('portal.dashboard.quickSearch') }}</label>
        <div class="relative flex-1">
          <Search class="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-fg-muted" aria-hidden="true" />
          <input
            id="dash-search"
            v-model="query"
            type="search"
            :placeholder="t('home.hero.searchPlaceholder')"
            class="min-h-11 w-full rounded-xl border border-border-strong/60 bg-surface ps-11 pe-3 focus:border-primary focus:outline-none"
          />
        </div>
        <AppButton type="submit">{{ t('portal.dashboard.quickSearch') }}</AppButton>
      </form>
    </AppCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="upcoming-h">
        <h2 id="upcoming-h" class="heading-3 mb-3">{{ t('portal.nav.appointments') }}</h2>
        <AppEmptyState :icon="CalendarDays" :title="t('portal.dashboard.noData')" />
      </section>
      <section aria-labelledby="consult-h">
        <h2 id="consult-h" class="heading-3 mb-3">{{ t('portal.nav.consultations') }}</h2>
        <AppEmptyState :icon="Video" :title="t('portal.dashboard.noData')" />
      </section>
      <section aria-labelledby="rx-h">
        <h2 id="rx-h" class="heading-3 mb-3">{{ t('portal.nav.prescriptions') }}</h2>
        <AppEmptyState :icon="Pill" :title="t('portal.dashboard.noData')" />
      </section>
    </div>
  </div>
</template>
