<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { getData, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'

const { l, status } = useL()
const auth = useAuthStore()
const summary = useAsyncData<Row>(() => getData('/pharmacy/reports/summary'))
const branches = useAsyncData<Row[]>(async () => (await (await import('../kit/api')).api.get('/pharmacy/branches')).data)
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHead :title="l(`Welcome, ${auth.user?.name ?? ''}`, `مرحباً، ${auth.user?.name ?? ''}`)"><AppButton to="/pharmacy/dispensing" size="sm">{{ l('Open dispensing queue', 'فتح قائمة الصرف') }}</AppButton></PageHead>
    <div class="grid gap-4 sm:grid-cols-3">
      <AppCard v-for="(n, s) in summary.data.value?.by_status ?? {}" :key="s"><p class="text-3xl font-semibold">{{ n }}</p><p class="text-sm text-fg-muted">{{ status(String(s)) }} ({{ l('30 days', '30 يوماً') }})</p></AppCard>
      <AppCard v-if="!Object.keys(summary.data.value?.by_status ?? {}).length"><p class="text-sm text-fg-muted">{{ l('No requests in the last 30 days.', 'لا توجد طلبات خلال 30 يوماً.') }}</p></AppCard>
    </div>
    <AppCard>
      <h2 class="heading-3 mb-2">{{ l('Average time to ready', 'متوسط الوقت حتى الجاهزية') }}</h2>
      <p>{{ summary.data.value?.average_minutes_to_ready ?? '—' }} {{ l('minutes', 'دقيقة') }}</p>
    </AppCard>
    <AppCard>
      <h2 class="heading-3 mb-2">{{ l('Your branches', 'فروعك') }}</h2>
      <ul class="text-sm"><li v-for="b in branches.data.value ?? []" :key="b.id">{{ b.name }} - {{ b.city }}</li></ul>
    </AppCard>
  </div>
</template>
