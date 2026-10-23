<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

/** Patient: find pharmacies. Pharmacy staff: manage own branches. */
const route = useRoute()
const { l } = useL()
const staff = computed(() => route.path.startsWith('/pharmacy'))
const city = ref('')
const cols = computed<Col[]>(() => [
  { key: 'name', label: l('Branch', 'الفرع'), value: (r) => `${r.pharmacy?.name ?? ''} - ${r.name}` },
  { key: 'city', label: l('City', 'المدينة'), value: (r) => [r.city, r.district].filter(Boolean).join(' / ') },
  { key: 'address_line', label: l('Address', 'العنوان') },
  { key: 'phone', label: l('Phone', 'الهاتف') },
  ...(staff.value ? [{ key: 'is_active', label: l('Status', 'الحالة') }] : []),
])
const edit = ref<Row | null>(null)
const editOpen = computed({ get: () => !!edit.value, set: (v) => { if (!v) edit.value = null } })
const list = ref<InstanceType<typeof DataList>>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="staff ? l('Branches', 'الفروع') : l('Pharmacies', 'الصيدليات')" />
    <AppInput v-if="!staff" v-model="city" :label="l('Filter by city', 'تصفية حسب المدينة')" class="max-w-xs" />
    <DataList ref="list" :endpoint="staff ? '/pharmacy/branches' : '/pharmacies/branches'" :columns="cols" :params="{ city }" :empty="l('No pharmacies found', 'لا توجد صيدليات')">
      <template #cell-is_active="{ row }"><StatusBadge :value="row.is_active ? 'active' : 'suspended'" /></template>
      <template v-if="staff" #actions="{ row }"><AppButton size="sm" variant="outline" @click="edit = row">{{ l('Edit', 'تعديل') }}</AppButton></template>
    </DataList>
    <FormModal
      v-model:open="editOpen"
      :title="l('Edit branch', 'تعديل الفرع')"
      :initial="edit ?? {}"
      :fields="[{ key: 'phone', label: l('Phone', 'الهاتف') }, { key: 'is_active', label: l('Active', 'نشط'), type: 'checkbox' }, { key: 'accepts_eprescriptions', label: l('Accepts e-prescriptions', 'يقبل الوصفات الإلكترونية'), type: 'checkbox' }]"
      :submit="(v) => api.patch(`/pharmacy/branches/${edit?.id}`, { phone: v.phone ?? undefined, is_active: v.is_active, accepts_eprescriptions: v.accepts_eprescriptions })"
      @done="list?.reload()"
    />
  </div>
</template>
