<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l } = useL()
const list = ref<InstanceType<typeof DataList>>()
const createOpen = ref(false)
const detail = ref<Row | null>(null)
const detailOpen = computed({ get: () => !!detail.value, set: (v) => { if (!v) detail.value = null } })
const verify = ref<{ row: Row; decision: 'approve' | 'reject' | 'suspend' } | null>(null)
const verifyOpen = computed({ get: () => !!verify.value, set: (v) => { if (!v) verify.value = null } })
const branchOpen = ref(false)
const staffOpen = ref(false)
const cols = computed<Col[]>(() => [
  { key: 'name', label: l('Pharmacy', 'الصيدلية'), value: (r) => r.name_en ?? r.name },
  { key: 'license_number', label: l('Licence', 'الترخيص'), value: (r) => r.license_number ?? r.license?.number },
  { key: 'branches', label: l('Branches', 'الفروع'), value: (r) => r.branches_count ?? r.branches?.length },
  { key: 'status', label: l('Status', 'الحالة') },
])
async function show(r: Row) { detail.value = await getData(`/admin/pharmacies/${r.id}`) }
const f = (k: string, en: string, ar: string, extra: Record<string, unknown> = {}) => ({ key: k, label: l(en, ar), ...extra })
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Pharmacies', 'الصيدليات')"><AppButton size="sm" @click="createOpen = true">{{ l('Register pharmacy', 'تسجيل صيدلية') }}</AppButton></PageHead>
    <DataList ref="list" endpoint="/admin/pharmacies" :columns="cols" :empty="l('No pharmacies registered', 'لا توجد صيدليات')">
      <template #cell-status="{ row }"><StatusBadge :value="row.verification_status ?? row.status" /></template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="outline" @click="show(row)">{{ l('Open', 'فتح') }}</AppButton>
        <AppButton v-if="(row.verification_status ?? row.status) === 'pending'" size="sm" @click="verify = { row, decision: 'approve' }">{{ l('Approve', 'اعتماد') }}</AppButton>
        <AppButton v-if="(row.verification_status ?? row.status) === 'approved'" size="sm" variant="ghost" @click="verify = { row, decision: 'suspend' }">{{ l('Suspend', 'إيقاف') }}</AppButton>
      </template>
    </DataList>

    <AppModal v-model:open="detailOpen" size="lg" :title="detail?.name_en ?? ''">
      <div v-if="detail" class="flex flex-col gap-4 text-sm">
        <p><StatusBadge :value="detail.verification_status ?? detail.status" /> · {{ detail.license_number ?? detail.license?.number }}</p>
        <section><div class="mb-2 flex items-center justify-between"><h3 class="font-semibold">{{ l('Branches', 'الفروع') }}</h3><AppButton size="sm" variant="outline" @click="branchOpen = true">{{ l('Add branch', 'إضافة فرع') }}</AppButton></div>
          <ul class="divide-y divide-border"><li v-for="b in detail.branches ?? []" :key="b.id" class="py-1">{{ b.name_en ?? b.name }} - {{ b.city }}</li></ul></section>
        <section><div class="mb-2 flex items-center justify-between"><h3 class="font-semibold">{{ l('Staff', 'الموظفون') }}</h3><AppButton size="sm" variant="outline" @click="staffOpen = true">{{ l('Add staff', 'إضافة موظف') }}</AppButton></div>
          <ul class="divide-y divide-border"><li v-for="s in detail.staff ?? []" :key="s.id" class="py-1">{{ s.name ?? s.user?.name }} <span class="text-fg-muted">· {{ s.role }}</span></li></ul></section>
      </div>
    </AppModal>

    <FormModal v-model:open="createOpen" size="lg" :title="l('Register pharmacy', 'تسجيل صيدلية')" :initial="{ licensing_authority: 'SFDA' }" :fields="[f('name_en', 'Name (English)', 'الاسم (إنجليزي)', { required: true }), f('name_ar', 'Name (Arabic)', 'الاسم (عربي)', { required: true }), f('license_number', 'Licence number', 'رقم الترخيص', { required: true }), f('licensing_authority', 'Licensing authority', 'جهة الترخيص', { required: true }), f('license_expires_on', 'Licence expires on', 'انتهاء الترخيص', { type: 'date', required: true }), f('contact_phone', 'Phone', 'الهاتف'), f('contact_email', 'Email', 'البريد', { type: 'email' })]" :submit="(v) => api.post('/admin/pharmacies', prune(v))" @done="list?.reload()" />
    <FormModal v-model:open="branchOpen" :title="l('Add branch', 'إضافة فرع')" :fields="[f('name_en', 'Name (English)', 'الاسم (إنجليزي)', { required: true }), f('name_ar', 'Name (Arabic)', 'الاسم (عربي)', { required: true }), f('city', 'City', 'المدينة', { required: true }), f('district', 'District', 'الحي'), f('address_line', 'Address', 'العنوان', { required: true }), f('phone', 'Phone', 'الهاتف')]" :submit="(v) => api.post(`/admin/pharmacies/${detail?.id}/branches`, prune(v))" @done="detail && show(detail)" />
    <FormModal v-model:open="staffOpen" :title="l('Add staff member', 'إضافة موظف')" :fields="[f('name', 'Name', 'الاسم', { required: true }), f('phone', 'Phone (+966...)', 'الهاتف (+966...)', { required: true, type: 'tel' }), f('email', 'Email', 'البريد', { type: 'email' }), f('role', 'Role', 'الدور', { type: 'select', options: [{ value: 'manager', label: 'manager' }, { value: 'pharmacist', label: 'pharmacist' }, { value: 'assistant', label: 'assistant' }] })]" :submit="(v) => api.post(`/admin/pharmacies/${detail?.id}/staff`, prune(v))" @done="detail && show(detail)" />
    <FormModal v-model:open="verifyOpen" :title="l('Pharmacy decision', 'قرار الصيدلية')" :fields="[f('reason', 'Reason / note', 'السبب / ملاحظة', { type: 'textarea' })]" :submit="(v) => api.post(`/admin/pharmacies/${verify?.row.id}/verify`, prune({ decision: verify?.decision, reason: v.reason }))" @done="list?.reload()" />
  </div>
</template>
