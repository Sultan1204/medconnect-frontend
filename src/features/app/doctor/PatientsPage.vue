<script setup lang="ts">
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'
import AppCard from '@/components/ui/AppCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'

const { l, fmt } = useL()
const appts = useAsyncData<Row[]>(async () => (await api.get('/appointments', { when: 'all', per_page: 100 })).data)
const patients = computed(() => {
  const map = new Map<string, { p: Row; count: number; last: string }>()
  for (const a of appts.data.value ?? []) {
    const cur = map.get(a.patient.id)
    if (!cur) map.set(a.patient.id, { p: a.patient, count: 1, last: a.starts_at })
    else { cur.count++; if (a.starts_at > cur.last) cur.last = a.starts_at }
  }
  return [...map.values()]
})
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('My patients', 'مرضاي')" :subtitle="l('Patients you have appointments with. Clinical records are opened from inside a consultation.', 'المرضى الذين لديك مواعيد معهم. تُفتح السجلات السريرية من داخل الاستشارة.')" />
    <div v-if="appts.loading.value && !appts.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <AppEmptyState v-else-if="!patients.length" :icon="Users" :title="l('No patients yet', 'لا يوجد مرضى بعد')" />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="x in patients" :key="x.p.id">
        <AppCard class="flex items-center justify-between gap-3">
          <div><p class="font-semibold">{{ x.p.full_name }}</p><p class="text-sm text-fg-muted">{{ x.p.age }} {{ l('years', 'سنة') }} · {{ x.p.gender }}</p></div>
          <p class="text-sm text-fg-muted">{{ x.count }} {{ l('appointments', 'مواعيد') }} · {{ l('last', 'آخر') }} {{ fmt.date(x.last) }}</p>
        </AppCard>
      </li>
    </ul>
  </div>
</template>
