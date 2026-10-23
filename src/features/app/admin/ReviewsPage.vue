<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const tab = ref<'reviews' | 'reports'>('reviews')
const list = ref<InstanceType<typeof DataList>>()
const mod = ref<{ row: Row; decision: string } | null>(null)
const res = ref<{ row: Row; action: string } | null>(null)
const modOpen = computed({ get: () => !!mod.value, set: (v) => { if (!v) mod.value = null } })
const resOpen = computed({ get: () => !!res.value, set: (v) => { if (!v) res.value = null } })
const rCols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Date', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'rating', label: l('Rating', 'التقييم'), value: (r) => `${r.rating} / 5` },
  { key: 'comment', label: l('Comment', 'التعليق') },
  { key: 'status', label: l('Status', 'الحالة') },
])
const pCols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Date', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'reason', label: l('Reason', 'السبب') },
  { key: 'review', label: l('Review', 'التقييم'), value: (r) => r.review?.comment ?? '—' },
  { key: 'status', label: l('Status', 'الحالة') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Reviews moderation', 'مراجعة التقييمات')">
      <AppButton size="sm" :variant="tab === 'reviews' ? 'primary' : 'outline'" @click="tab = 'reviews'">{{ l('Reviews', 'التقييمات') }}</AppButton>
      <AppButton size="sm" :variant="tab === 'reports' ? 'primary' : 'outline'" @click="tab = 'reports'">{{ l('Reports', 'البلاغات') }}</AppButton>
    </PageHead>
    <DataList v-if="tab === 'reviews'" ref="list" key="r" endpoint="/admin/reviews" :columns="rCols" :empty="l('No reviews', 'لا توجد تقييمات')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }">
        <AppButton v-if="row.status !== 'published'" size="sm" @click="mod = { row, decision: 'publish' }">{{ l('Publish', 'نشر') }}</AppButton>
        <AppButton v-if="row.status === 'published'" size="sm" variant="outline" @click="mod = { row, decision: 'hide' }">{{ l('Hide', 'إخفاء') }}</AppButton>
        <AppButton v-if="row.status !== 'rejected'" size="sm" variant="ghost" @click="mod = { row, decision: 'reject' }">{{ l('Reject', 'رفض') }}</AppButton>
      </template>
    </DataList>
    <DataList v-else ref="list" key="p" endpoint="/admin/review-reports" :columns="pCols" :empty="l('No reports', 'لا توجد بلاغات')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }">
        <AppButton v-if="row.status === 'open' || row.status === 'pending'" size="sm" variant="outline" @click="res = { row, action: 'dismiss' }">{{ l('Dismiss', 'تجاهل') }}</AppButton>
        <AppButton v-if="row.status === 'open' || row.status === 'pending'" size="sm" variant="danger" @click="res = { row, action: 'hide_review' }">{{ l('Hide review', 'إخفاء التقييم') }}</AppButton>
      </template>
    </DataList>
    <FormModal v-model:open="modOpen" :title="l('Moderate review', 'مراجعة التقييم')" :fields="[{ key: 'note', label: l('Note', 'ملاحظة'), type: 'textarea' }]" :submit="(v) => api.post(`/admin/reviews/${mod?.row.id}/moderate`, prune({ decision: mod?.decision, note: v.note }))" @done="list?.reload()" />
    <FormModal v-model:open="resOpen" :title="l('Resolve report', 'حل البلاغ')" :fields="[{ key: 'note', label: l('Note', 'ملاحظة'), type: 'textarea', required: true }]" :submit="(v) => api.post(`/admin/review-reports/${res?.row.id}/resolve`, { action: res?.action, note: v.note })" @done="list?.reload()" />
  </div>
</template>
