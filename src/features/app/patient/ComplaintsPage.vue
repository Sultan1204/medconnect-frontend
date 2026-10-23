<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { getData } from '../kit/api'

const api = { ...rawApi }

const { l, fmt, status } = useL()
const open = ref(false)
const list = ref<InstanceType<typeof DataList>>()
const detail = ref<Row | null>(null)
const detailOpen = computed({ get: () => !!detail.value, set: (v) => { if (!v) detail.value = null } })
const cols = computed<Col[]>(() => [
  { key: 'reference', label: l('Reference', 'المرجع') },
  { key: 'category', label: l('Category', 'الفئة'), value: (r) => status(r.category) },
  { key: 'created_at', label: l('Submitted', 'تاريخ التقديم'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'status', label: l('Status', 'الحالة') },
])
const CATS = ['service_quality', 'conduct', 'billing', 'privacy', 'technical', 'other']
const fields = computed(() => [
  { key: 'category', label: l('Category', 'الفئة'), type: 'select' as const, options: CATS.map((c) => ({ value: c, label: status(c) })) },
  { key: 'description', label: l('What happened?', 'ماذا حدث؟'), type: 'textarea' as const, required: true },
])
async function show(r: Row) { detail.value = await getData(`/complaints/${r.id}`) }
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Complaints and feedback', 'الشكاوى والملاحظات')"><AppButton size="sm" @click="open = true">{{ l('New complaint', 'شكوى جديدة') }}</AppButton></PageHead>
    <DataList ref="list" endpoint="/complaints" :columns="cols" :empty="l('No complaints submitted', 'لا توجد شكاوى')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"><AppButton size="sm" variant="outline" @click="show(row)">{{ l('Details', 'التفاصيل') }}</AppButton></template>
    </DataList>
    <FormModal v-model:open="open" :title="l('New complaint', 'شكوى جديدة')" :fields="fields" :submit="(v) => api.post('/complaints', { subject_type: 'platform', category: v.category, description: v.description })" @done="list?.reload()" />
    <AppModal v-model:open="detailOpen" :title="detail?.reference ?? ''" size="lg">
      <div v-if="detail" class="flex flex-col gap-3 text-sm">
        <p>{{ detail.description }}</p>
        <p v-if="detail.resolution"><strong>{{ l('Resolution', 'القرار') }}:</strong> {{ detail.resolution }}</p>
        <ul class="divide-y divide-border rounded-xl border border-border">
          <li v-for="(e, i) in detail.events" :key="i" class="px-3 py-2">{{ status(e.type) }} <span class="text-fg-muted">· {{ fmt.dateTime(e.created_at) }}</span><span v-if="e.note"> - {{ e.note }}</span></li>
        </ul>
      </div>
    </AppModal>
  </div>
</template>
