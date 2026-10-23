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
const list = ref<InstanceType<typeof DataList>>()
const sel = ref<Row | null>(null)
const open = computed({ get: () => !!sel.value, set: (v) => { if (!v) sel.value = null } })
const cols = computed<Col[]>(() => [
  { key: 'created_at', label: l('Filed', 'التاريخ'), value: (r) => fmt.dateTime(r.created_at) },
  { key: 'category', label: l('Category', 'التصنيف') },
  { key: 'description', label: l('Description', 'الوصف') },
  { key: 'priority', label: l('Priority', 'الأولوية') },
  { key: 'status', label: l('Status', 'الحالة') },
])
const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }))
const fields = computed(() => [
  { key: 'status', label: l('Status', 'الحالة'), type: 'select' as const, options: opts(['open', 'under_review', 'resolved', 'rejected']) },
  { key: 'priority', label: l('Priority', 'الأولوية'), type: 'select' as const, options: opts(['low', 'normal', 'high', 'urgent']) },
  { key: 'note', label: l('Internal note', 'ملاحظة داخلية'), type: 'textarea' as const },
  { key: 'resolution', label: l('Resolution (shown to the patient)', 'القرار (يظهر للمريض)'), type: 'textarea' as const },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Complaints', 'الشكاوى')" />
    <DataList ref="list" endpoint="/admin/complaints" :columns="cols" :empty="l('No complaints', 'لا توجد شكاوى')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"><AppButton size="sm" variant="outline" @click="sel = row">{{ l('Handle', 'معالجة') }}</AppButton></template>
    </DataList>
    <FormModal v-model:open="open" :title="l('Handle complaint', 'معالجة الشكوى')" :fields="fields" :initial="{ status: sel?.status, priority: sel?.priority }" :submit="(v) => api.patch(`/admin/complaints/${sel?.id}`, prune(v))" @done="list?.reload()" />
  </div>
</template>
