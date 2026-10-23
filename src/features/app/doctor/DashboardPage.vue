<script setup lang="ts">
import { BadgeCheck, CalendarDays, Wallet, Bell } from 'lucide-vue-next'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { api, getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const { l, fmt } = useL()
const auth = useAuthStore()
const me = useAsyncData<Row>(() => getData('/doctors/me'))
const upcoming = useAsyncData<Row[]>(async () => (await api.get('/appointments', { when: 'upcoming', per_page: 8 })).data)
const earnings = useAsyncData<Row>(() => getData('/doctors/me/earnings'))
const unread = useAsyncData<number>(async () => (await api.get('/notifications/unread-count')).data.unread)
const approved = () => me.data.value?.verification?.status === 'approved'
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHead :title="l(`Welcome, ${auth.user?.name ?? ''}`, `مرحباً، ${auth.user?.name ?? ''}`)" />
    <AppCard class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3"><BadgeCheck class="size-8 text-primary" aria-hidden="true" /><div><h2 class="font-semibold">{{ l('Verification status', 'حالة التوثيق') }}</h2><StatusBadge :value="me.data.value?.verification?.status" /></div></div>
      <AppButton v-if="!approved()" to="/doctor/verification" variant="outline">{{ l('Complete verification', 'إكمال التوثيق') }}</AppButton>
    </AppCard>
    <AppAlert v-if="me.data.value && !approved()" variant="warning">{{ l('Your profile must be approved by an administrator before patients can book you.', 'يجب أن يعتمد المشرف ملفك قبل أن يتمكن المرضى من الحجز عندك.') }}</AppAlert>

    <div class="grid gap-4 sm:grid-cols-3">
      <AppCard class="flex items-center gap-3"><CalendarDays class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ upcoming.data.value?.length ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Upcoming appointments', 'مواعيد قادمة') }}</p></div></AppCard>
      <AppCard class="flex items-center gap-3"><Wallet class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ sar(earnings.data.value?.available, earnings.data.value?.currency) }}</p><p class="text-sm text-fg-muted">{{ l('Available balance', 'الرصيد المتاح') }}</p></div></AppCard>
      <AppCard class="flex items-center gap-3"><Bell class="size-8 text-primary" aria-hidden="true" /><div><p class="text-2xl font-semibold">{{ unread.data.value ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Unread notifications', 'إشعارات غير مقروءة') }}</p></div></AppCard>
    </div>

    <section aria-labelledby="ap-h">
      <h2 id="ap-h" class="heading-3 mb-3">{{ l('Upcoming appointments', 'المواعيد القادمة') }}</h2>
      <AppEmptyState v-if="!upcoming.data.value?.length" :icon="CalendarDays" :title="l('No upcoming appointments', 'لا توجد مواعيد قادمة')">
        <AppButton to="/doctor/availability" size="sm">{{ l('Set availability', 'ضبط الأوقات المتاحة') }}</AppButton>
      </AppEmptyState>
      <ul v-else class="flex flex-col gap-3">
        <li v-for="a in upcoming.data.value" :key="a.id">
          <AppCard class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="font-semibold">{{ a.patient?.full_name }}</p><p class="text-sm text-fg-muted">{{ fmt.dateTime(a.starts_at) }}</p></div>
            <div class="flex items-center gap-2"><StatusBadge :value="a.status" /><AppButton :to="`/doctor/appointments/${a.id}`" size="sm" variant="outline">{{ l('Open', 'فتح') }}</AppButton></div>
          </AppCard>
        </li>
      </ul>
    </section>
  </div>
</template>
