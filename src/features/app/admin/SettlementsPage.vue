<script setup lang="ts">
import { computed } from 'vue'
import { sar } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'

const { l } = useL()
const cols = computed<Col[]>(() => [
  { key: 'doctor', label: l('Doctor', 'الطبيب'), value: (r) => r.doctor?.name ?? r.doctor_name ?? r.doctor_id },
  { key: 'gross', label: l('Gross', 'الإجمالي'), value: (r) => sar(r.gross?.amount ?? r.gross, 'SAR') },
  { key: 'commission', label: l('Commission', 'العمولة'), value: (r) => sar(r.commission?.amount ?? r.commission, 'SAR') },
  { key: 'net', label: l('Net balance', 'الرصيد الصافي'), value: (r) => sar(r.net?.amount ?? r.net ?? r.balance?.amount ?? r.balance, 'SAR') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Settlements', 'التسويات')" />
    <p class="text-sm text-fg-muted">{{ l('Payouts are disabled in this test environment - balances are shown for review only.', 'الدفعات معطلة في بيئة الاختبار - تُعرض الأرصدة للمراجعة فقط.') }}</p>
    <DataList endpoint="/admin/settlements/balances" :columns="cols" :empty="l('No balances yet', 'لا توجد أرصدة بعد')" />
  </div>
</template>
