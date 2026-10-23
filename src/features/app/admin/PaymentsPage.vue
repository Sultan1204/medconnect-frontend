<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const list = ref<InstanceType<typeof DataList>>()
const refunding = ref<Row | null>(null)
const open = computed({ get: () => !!refunding.value, set: (v) => { if (!v) refunding.value = null } })
const cols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Date', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'reference', label: l('Reference', 'المرجع'), value: (r) => r.reference ?? String(r.id).slice(0, 8) },
  { key: 'amount', label: l('Amount', 'المبلغ'), value: (r) => sar(r.amount?.amount ?? r.amount, r.amount?.currency ?? r.currency) },
  { key: 'provider', label: l('Provider', 'المزود') },
  { key: 'status', label: l('Status', 'الحالة') },
])
const fields = computed(() => [
  { key: 'amount', label: l('Amount to refund (halalas, minor units)', 'مبلغ الاسترداد (هللة)'), type: 'number' as const, required: true },
  { key: 'reason', label: l('Reason', 'السبب'), type: 'select' as const, required: true, options: [{ value: 'admin', label: 'admin' }, { value: 'dispute', label: 'dispute' }, { value: 'service_issue', label: 'service_issue' }] },
  { key: 'note', label: l('Note', 'ملاحظة'), type: 'textarea' as const, required: true },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Payments', 'المدفوعات')" />
    <p class="text-sm text-fg-muted">{{ l('Mock payment provider - no real money moves. Refunds require step-up verification.', 'مزود دفع تجريبي - لا تنتقل أموال حقيقية. الاسترداد يتطلب تحققاً إضافياً.') }}</p>
    <DataList ref="list" endpoint="/admin/payments" :columns="cols" :empty="l('No payments', 'لا توجد مدفوعات')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"><AppButton v-if="['succeeded', 'captured', 'paid', 'partially_refunded'].includes(row.status)" size="sm" variant="outline" @click="refunding = row">{{ l('Refund', 'استرداد') }}</AppButton></template>
    </DataList>
    <FormModal v-model:open="open" :title="l('Refund payment', 'استرداد دفعة')" danger :fields="fields" :initial="{ reason: 'admin', amount: refunding?.amount?.amount ?? refunding?.amount }" :submit="(v) => api.post(`/admin/payments/${refunding?.id}/refunds`, { amount: Number(v.amount), reason: v.reason, note: v.note })" @done="list?.reload()" />
  </div>
</template>
