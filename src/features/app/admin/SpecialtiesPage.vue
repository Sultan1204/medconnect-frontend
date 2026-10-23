<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const { l } = useL()
const list = ref<InstanceType<typeof DataList>>()
const editing = ref<Row | 'new' | null>(null)
const open = computed({ get: () => !!editing.value, set: (v) => { if (!v) editing.value = null } })
const cols = computed<Col[]>(() => [
  { key: 'name_en', label: l('Name (English)', 'الاسم (إنجليزي)') },
  { key: 'name_ar', label: l('Name (Arabic)', 'الاسم (عربي)') },
  { key: 'slug', label: 'Slug' },
  { key: 'is_active', label: l('Status', 'الحالة') },
])
const fields = computed(() => [
  { key: 'slug', label: 'Slug', required: true }, { key: 'name_en', label: l('Name (English)', 'الاسم (إنجليزي)'), required: true }, { key: 'name_ar', label: l('Name (Arabic)', 'الاسم (عربي)'), required: true },
  { key: 'description_en', label: l('Description (English)', 'الوصف (إنجليزي)'), type: 'textarea' as const }, { key: 'description_ar', label: l('Description (Arabic)', 'الوصف (عربي)'), type: 'textarea' as const },
  { key: 'is_active', label: l('Active', 'نشط'), type: 'checkbox' as const },
])
function save(v: Record<string, any>) {
  const body = prune({ ...v, is_active: !!v.is_active })
  return editing.value === 'new' ? api.post('/admin/specialties', { ...body, is_active: !!v.is_active }) : api.patch(`/admin/specialties/${(editing.value as Row).id}`, { ...body, is_active: !!v.is_active })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Specialties', 'التخصصات')"><AppButton size="sm" @click="editing = 'new'">{{ l('Add specialty', 'إضافة تخصص') }}</AppButton></PageHead>
    <DataList ref="list" endpoint="/admin/specialties" :columns="cols">
      <template #cell-is_active="{ row }"><StatusBadge :value="row.is_active ? 'active' : 'suspended'" /></template>
      <template #actions="{ row }"><AppButton size="sm" variant="outline" @click="editing = row">{{ l('Edit', 'تعديل') }}</AppButton></template>
    </DataList>
    <FormModal v-model:open="open" :title="editing === 'new' ? l('Add specialty', 'إضافة تخصص') : l('Edit specialty', 'تعديل التخصص')" :initial="editing === 'new' ? { is_active: true } : (editing as Row) ?? {}" :fields="fields" :submit="save" @done="list?.reload()" />
  </div>
</template>
