<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'

/** Consultations are reached through their appointments (one consultation per paid appointment). */
const route = useRoute()
const router = useRouter()
const { l, fmt, status } = useL()
const { run } = useAction()
const isDoctor = computed(() => route.path.startsWith('/doctor'))
const base = computed(() => (isDoctor.value ? '/doctor' : '/patient'))
const title = computed(() => (route.path.endsWith('messages') ? l('Messages', 'الرسائل') : route.path.endsWith('clinical-notes') ? l('Clinical notes', 'الملاحظات السريرية') : route.path.endsWith('prescriptions') ? l('Prescriptions by consultation', 'الوصفات حسب الاستشارة') : l('Consultations', 'الاستشارات')))

const cols = computed<Col[]>(() => [
  { key: 'when', label: l('When', 'الموعد'), value: (r) => fmt.dateTime(r.starts_at) },
  { key: 'who', label: isDoctor.value ? l('Patient', 'المريض') : l('Doctor', 'الطبيب'), value: (r) => (isDoctor.value ? r.patient?.full_name : r.doctor?.name) },
  { key: 'type', label: l('Type', 'النوع'), value: (r) => status(r.consultation_type) },
  { key: 'price', label: l('Price', 'السعر'), value: (r) => sar(r.price?.amount, r.price?.currency) },
  { key: 'status', label: l('Status', 'الحالة') },
])

async function open(r: Row) {
  const c = await run(() => getData(`/appointments/${r.id}/consultation`))
  if (c) void router.push(`${base.value}/consultations/${c.id}`)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="title" :subtitle="l('Appointments that have a consultation room (paid and confirmed).', 'المواعيد التي لها غرفة استشارة (مدفوعة ومؤكدة).')" />
    <DataList endpoint="/appointments" :columns="cols" :params="{ when: 'all', 'status[]': ['confirmed', 'in_progress', 'completed'] }" :empty="l('No consultations yet', 'لا توجد استشارات بعد')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"><AppButton size="sm" @click="open(row)">{{ l('Open room', 'فتح الغرفة') }}</AppButton></template>
    </DataList>
  </div>
</template>
