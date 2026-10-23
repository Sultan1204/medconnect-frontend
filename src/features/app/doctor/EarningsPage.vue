<script setup lang="ts">
import { computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const { l, fmt, status } = useL()
const earn = useAsyncData<Row>(() => getData('/doctors/me/earnings'))
const payoutCols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Date', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'amount', label: l('Amount', 'المبلغ'), value: (r) => sar(r.amount, r.currency) },
  { key: 'status', label: l('Status', 'الحالة') },
])
const reviewCols = computed<Col[]>(() => [
  { key: 'rating', label: l('Rating', 'التقييم'), value: (r) => `${r.rating} / 5` },
  { key: 'comment', label: l('Comment', 'التعليق') },
  { key: 'created_at', label: l('Date', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHead :title="l('Earnings', 'الأرباح')" :subtitle="l('Payouts are simulated in this demo - no money is transferred.', 'التحويلات محاكاة في هذه النسخة التجريبية - لا يتم تحويل أي مبلغ.')" />
    <div v-if="earn.loading.value && !earn.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <div v-else-if="earn.data.value" class="grid gap-4 sm:grid-cols-2">
      <AppCard><p class="text-sm text-fg-muted">{{ l('Balance', 'الرصيد') }}</p><p class="text-3xl font-semibold">{{ sar(earn.data.value.balance, earn.data.value.currency) }}</p></AppCard>
      <AppCard><p class="text-sm text-fg-muted">{{ l('Available for payout', 'متاح للتحويل') }}</p><p class="text-3xl font-semibold">{{ sar(earn.data.value.available, earn.data.value.currency) }}</p></AppCard>
    </div>
    <section>
      <h2 class="heading-3 mb-3">{{ l('Ledger', 'سجل الحركات') }}</h2>
      <ul v-if="earn.data.value?.entries?.length" class="divide-y divide-border rounded-xl border border-border text-sm">
        <li v-for="e in earn.data.value.entries" :key="e.id" class="flex items-center justify-between px-3 py-2"><span>{{ status(e.type) }} <span class="text-fg-muted">· {{ fmt.dateTime(e.created_at) }}</span></span><span class="font-medium">{{ sar(e.amount, earn.data.value.currency) }}</span></li>
      </ul>
      <p v-else class="text-sm text-fg-muted">{{ l('No earnings yet. Completed consultations appear here.', 'لا توجد أرباح بعد. تظهر الاستشارات المكتملة هنا.') }}</p>
    </section>
    <section><h2 class="heading-3 mb-3">{{ l('Payouts', 'التحويلات') }}</h2>
      <DataList endpoint="/doctors/me/payouts" :columns="payoutCols" :empty="l('No payouts', 'لا توجد تحويلات')"><template #cell-status="{ row }"><StatusBadge :value="row.status" /></template></DataList>
    </section>
    <section><h2 class="heading-3 mb-3">{{ l('Reviews about you', 'التقييمات عنك') }}</h2>
      <DataList endpoint="/doctors/me/reviews" :columns="reviewCols" :empty="l('No reviews yet', 'لا توجد تقييمات بعد')" />
    </section>
  </div>
</template>
