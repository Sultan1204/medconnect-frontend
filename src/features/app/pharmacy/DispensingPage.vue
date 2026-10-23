<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const { l, fmt } = useL()
const filter = ref<string>('')
const FILTERS = ['', 'requested', 'received', 'under_review', 'ready', 'dispensed', 'rejected']
const params = computed(() => (filter.value ? { 'status[]': [filter.value] } : {}))
const cols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Received', 'وصل في'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'patient', label: l('Patient', 'المريض'), value: (r) => `${r.patient?.full_name ?? ''} (${r.patient?.age ?? ''})` },
  { key: 'items', label: l('Medications', 'الأدوية'), value: (r) => (r.prescription?.items ?? []).map((i: Record<string, any>) => i.medication_name).join(', ') },
  { key: 'branch', label: l('Branch', 'الفرع'), value: (r) => r.branch?.name },
  { key: 'status', label: l('Status', 'الحالة') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Dispensing requests', 'طلبات الصرف')">
      <AppButton v-for="f in FILTERS" :key="f" size="sm" :variant="filter === f ? 'primary' : 'outline'" @click="filter = f">{{ f ? l(f.replace('_', ' '), f) : l('All', 'الكل') }}</AppButton>
    </PageHead>
    <DataList endpoint="/pharmacy/dispense-requests" :columns="cols" :params="params" :empty="l('No requests', 'لا توجد طلبات')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"><AppButton :to="`/pharmacy/prescriptions/${row.id}`" size="sm">{{ l('Review', 'مراجعة') }}</AppButton></template>
    </DataList>
  </div>
</template>
