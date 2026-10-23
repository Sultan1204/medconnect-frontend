<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDays, Pill, Search, Bell } from 'lucide-vue-next'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { api, sar } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const { l, fmt } = useL()
const auth = useAuthStore()
const router = useRouter()
const q = ref('')
const upcoming = useAsyncData(async () => (await api.get('/appointments', { when: 'upcoming', per_page: 5 })).data as Array<Record<string, any>>)
const unread = useAsyncData(async () => (await api.get('/notifications/unread-count')).data.unread as number)
const rxCount = useAsyncData(async () => {
  const me = (await api.get('/patients/me')).data
  return ((await api.get(`/patients/${me.id}/prescriptions`)).data as unknown[]).length
})
function search() { void router.push({ path: '/doctors', query: q.value.trim() ? { search: q.value.trim() } : {} }) }
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHead :title="l(`Welcome, ${auth.user?.name ?? ''}`, `مرحباً، ${auth.user?.name ?? ''}`)" />
    <AppCard>
      <form role="search" class="flex flex-col gap-2 sm:flex-row" @submit.prevent="search">
        <label for="dash-search" class="sr-only">{{ l('Find a doctor', 'ابحث عن طبيب') }}</label>
        <div class="relative flex-1">
          <Search class="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-fg-muted" aria-hidden="true" />
          <input id="dash-search" v-model="q" type="search" :placeholder="l('Doctor name or specialty', 'اسم الطبيب أو التخصص')" class="min-h-11 w-full rounded-xl border border-border-strong/60 bg-surface ps-11 pe-3 focus:border-primary focus:outline-none" />
        </div>
        <AppButton type="submit">{{ l('Find a doctor', 'ابحث عن طبيب') }}</AppButton>
      </form>
    </AppCard>

    <div class="grid gap-4 sm:grid-cols-3">
      <AppCard class="flex items-center gap-3"><CalendarDays class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ upcoming.data.value?.length ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Upcoming appointments', 'مواعيد قادمة') }}</p></div></AppCard>
      <AppCard class="flex items-center gap-3"><Bell class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ unread.data.value ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Unread notifications', 'إشعارات غير مقروءة') }}</p></div></AppCard>
      <AppCard class="flex items-center gap-3"><Pill class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ rxCount.data.value ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Prescriptions', 'الوصفات') }}</p></div></AppCard>
    </div>

    <section aria-labelledby="up-h">
      <h2 id="up-h" class="heading-3 mb-3">{{ l('Next appointments', 'المواعيد القادمة') }}</h2>
      <AppEmptyState v-if="!upcoming.data.value?.length" :icon="CalendarDays" :title="l('No upcoming appointments', 'لا توجد مواعيد قادمة')">
        <AppButton to="/doctors" size="sm">{{ l('Book a doctor', 'احجز طبيباً') }}</AppButton>
      </AppEmptyState>
      <ul v-else class="flex flex-col gap-3">
        <li v-for="a in upcoming.data.value" :key="a.id">
          <AppCard class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="font-semibold">{{ a.doctor?.name }}</p><p class="text-sm text-fg-muted">{{ fmt.dateTime(a.starts_at) }} · {{ sar(a.price?.amount, a.price?.currency) }}</p></div>
            <div class="flex items-center gap-2"><StatusBadge :value="a.status" /><AppButton :to="`/patient/appointments/${a.id}`" size="sm" variant="outline">{{ l('Open', 'فتح') }}</AppButton></div>
          </AppCard>
        </li>
      </ul>
    </section>
  </div>
</template>
