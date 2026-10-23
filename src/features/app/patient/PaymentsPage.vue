<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import PayDialog from '../common/PayDialog.vue'

const { l, fmt, status } = useL()
const payFor = ref<Row | null>(null)
const payOpen = computed({ get: () => !!payFor.value, set: (v) => { if (!v) payFor.value = null } })
const list = ref<InstanceType<typeof DataList>>()
const cols = computed<Col[]>(() => [
  { key: 'when', label: l('Appointment', 'الموعد'), value: (r) => fmt.dateTime(r.starts_at) },
  { key: 'doctor', label: l('Doctor', 'الطبيب'), value: (r) => r.doctor?.name },
  { key: 'type', label: l('Type', 'النوع'), value: (r) => status(r.consultation_type) },
  { key: 'price', label: l('Amount', 'المبلغ'), value: (r) => (r.price?.is_free ? l('Free', 'مجاني') : sar(r.price?.amount, r.price?.currency)) },
  { key: 'status', label: l('Status', 'الحالة') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Payments', 'المدفوعات')" :subtitle="l('Each booking is paid when you reserve it. Unpaid bookings expire automatically.', 'يُدفع كل حجز عند الحجز. الحجوزات غير المدفوعة تنتهي تلقائياً.')" />
    <DataList ref="list" endpoint="/appointments" :columns="cols" :params="{ when: 'all' }" :empty="l('No payments yet', 'لا توجد مدفوعات بعد')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }">
        <AppButton v-if="row.status === 'awaiting_payment'" size="sm" @click="payFor = row">{{ l('Pay now', 'ادفع الآن') }}</AppButton>
        <AppButton :to="`/patient/appointments/${row.id}`" size="sm" variant="outline">{{ l('Open', 'فتح') }}</AppButton>
      </template>
    </DataList>
    <PayDialog v-if="payFor" v-model:open="payOpen" :appointment-id="payFor.id" @done="list?.reload()" />
  </div>
</template>
