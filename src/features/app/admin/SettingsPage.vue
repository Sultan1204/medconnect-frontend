<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l } = useL()
const list = ref<InstanceType<typeof DataList>>()
const sel = ref<Row | null>(null)
const open = computed({ get: () => !!sel.value, set: (v) => { if (!v) sel.value = null } })
const cols = computed<Col[]>(() => [
  { key: 'key', label: l('Key', 'المفتاح') },
  { key: 'value', label: l('Value', 'القيمة'), value: (r) => (typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value ?? '')) },
  { key: 'description', label: l('Description', 'الوصف') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Platform settings', 'إعدادات المنصة')" />
    <p class="text-sm text-fg-muted">{{ l('Changing a setting requires step-up verification.', 'تغيير الإعدادات يتطلب تحققاً إضافياً.') }}</p>
    <DataList ref="list" endpoint="/admin/settings" :columns="cols" :empty="l('No settings', 'لا توجد إعدادات')">
      <template #actions="{ row }"><AppButton size="sm" variant="outline" @click="sel = row">{{ l('Edit', 'تعديل') }}</AppButton></template>
    </DataList>
    <FormModal v-model:open="open" :title="sel?.key ?? ''" :fields="[{ key: 'value', label: l('Value', 'القيمة'), required: true }]" :initial="{ value: typeof sel?.value === 'object' ? JSON.stringify(sel?.value) : String(sel?.value ?? '') }" :submit="(v) => api.put(`/admin/settings/${sel?.key}`, { value: String(v.value) })" @done="list?.reload()" />
  </div>
</template>
