<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const { run } = useAction()
const me = useAsyncData<Row>(() => getData('/patients/me'))
const deps = useAsyncData<Row[]>(() => getData('/patients/me/dependents'))
const consents = useAsyncData<Row>(async () => getData(`/patients/${(me.data.value ?? (await getData<Row>('/patients/me'))).id}/consents`))
const requests = useAsyncData<Row[]>(async () => (await api.get(`/patients/${(me.data.value ?? (await getData<Row>('/patients/me'))).id}/data-requests`)).data)

const editOpen = ref(false)
const depOpen = ref(false)
const reqOpen = ref(false)
const GENDERS = [{ value: '', label: '—' }, { value: 'male', label: l('Male', 'ذكر') }, { value: 'female', label: l('Female', 'أنثى') }]
const personFields = () => [
  { key: 'full_name', label: l('Full name', 'الاسم الكامل'), required: true },
  { key: 'date_of_birth', label: l('Date of birth', 'تاريخ الميلاد'), type: 'date' as const, required: true },
  { key: 'gender', label: l('Gender', 'الجنس'), type: 'select' as const, options: GENDERS },
]
const CONSENTS = ['terms_of_service', 'privacy_policy', 'telemedicine', 'pharmacy_data_sharing']
const CLABEL: Record<string, [string, string]> = { terms_of_service: ['Terms of Service', 'شروط الاستخدام'], privacy_policy: ['Privacy Policy', 'سياسة الخصوصية'], telemedicine: ['Telemedicine consent', 'الموافقة على الاستشارة عن بعد'], pharmacy_data_sharing: ['Share prescriptions with pharmacies', 'مشاركة الوصفات مع الصيدليات'] }
const granted = (k: string) => consents.data.value?.consents?.find((c: Row) => c.type === k)?.granted === true
async function toggle(k: string) {
  await run(() => api.post(`/patients/${me.data.value!.id}/consents`, { type: k, version: consents.data.value!.current_versions[k], granted: !granted(k) }))
  await consents.reload()
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <PageHead :title="l('Profile', 'الملف الشخصي')" />
    <div v-if="me.loading.value && !me.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <template v-else-if="me.data.value">
      <AppCard class="flex flex-col gap-4">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Personal details', 'البيانات الشخصية') }}</h2><AppButton size="sm" variant="outline" @click="editOpen = true">{{ l('Edit', 'تعديل') }}</AppButton></div>
        <KeyValues :items="[{ label: l('Name', 'الاسم'), value: me.data.value.full_name }, { label: l('Date of birth', 'تاريخ الميلاد'), value: me.data.value.date_of_birth }, { label: l('Gender', 'الجنس'), value: me.data.value.gender }, { label: l('Emergency contact', 'جهة اتصال الطوارئ'), value: me.data.value.emergency_contact?.name }]" />
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Dependants', 'التابعون') }}</h2><AppButton size="sm" variant="outline" @click="depOpen = true">{{ l('Add dependant', 'إضافة تابع') }}</AppButton></div>
        <p v-if="!deps.data.value?.length" class="text-sm text-fg-muted">{{ l('No dependants. Add a child to book for them.', 'لا يوجد تابعون. أضف طفلاً للحجز له.') }}</p>
        <ul v-else class="divide-y divide-border text-sm"><li v-for="d in deps.data.value" :key="d.id" class="py-2">{{ d.full_name }} <span class="text-fg-muted">· {{ d.age }} {{ l('years', 'سنة') }}</span></li></ul>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <h2 class="heading-3">{{ l('Consents', 'الموافقات') }}</h2>
        <ul class="divide-y divide-border text-sm">
          <li v-for="k in CONSENTS" :key="k" class="flex items-center justify-between gap-3 py-2">
            <span>{{ l(CLABEL[k]![0], CLABEL[k]![1]) }} <AppBadge :variant="granted(k) ? 'success' : 'neutral'">{{ granted(k) ? l('Granted', 'ممنوحة') : l('Not granted', 'غير ممنوحة') }}</AppBadge></span>
            <AppButton size="sm" variant="outline" @click="toggle(k)">{{ granted(k) ? l('Withdraw', 'سحب') : l('Grant', 'منح') }}</AppButton>
          </li>
        </ul>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('My data requests', 'طلبات بياناتي') }}</h2><AppButton size="sm" variant="outline" @click="reqOpen = true">{{ l('New request', 'طلب جديد') }}</AppButton></div>
        <p v-if="!requests.data.value?.length" class="text-sm text-fg-muted">{{ l('No requests.', 'لا توجد طلبات.') }}</p>
        <ul v-else class="divide-y divide-border text-sm"><li v-for="r in requests.data.value" :key="r.id" class="py-2">{{ r.type }} <span class="text-fg-muted">· {{ r.status }} · {{ fmt.dateTime(r.created_at) }}</span></li></ul>
      </AppCard>
    </template>

    <FormModal v-model:open="editOpen" :title="l('Edit details', 'تعديل البيانات')" :initial="{ ...me.data.value, emergency_name: me.data.value?.emergency_contact?.name, emergency_phone: me.data.value?.emergency_contact?.phone }" :fields="[...personFields(), { key: 'emergency_name', label: l('Emergency contact name', 'اسم جهة اتصال الطوارئ') }, { key: 'emergency_phone', label: l('Emergency contact phone', 'هاتف جهة اتصال الطوارئ') }]" :submit="(v) => api.patch(`/patients/${me.data.value!.id}`, prune({ full_name: v.full_name, date_of_birth: v.date_of_birth, gender: v.gender, emergency_contact: { name: v.emergency_name, phone: v.emergency_phone } }))" @done="me.reload()" />
    <FormModal v-model:open="depOpen" :title="l('Add dependant', 'إضافة تابع')" :fields="[...personFields(), { key: 'relationship', label: l('Relationship', 'صلة القرابة'), type: 'select', options: [{ value: 'parent', label: l('Parent', 'أحد الوالدين') }, { value: 'legal_guardian', label: l('Legal guardian', 'وصي قانوني') }, { value: 'other', label: l('Other', 'أخرى') }] }]" :submit="(v) => api.post('/patients/me/dependents', prune(v))" @done="deps.reload()" />
    <FormModal v-model:open="reqOpen" :title="l('Data request', 'طلب بيانات')" :fields="[{ key: 'type', label: l('Type', 'النوع'), type: 'select', options: [{ value: 'access', label: l('Access my data', 'الاطلاع على بياناتي') }, { value: 'correction', label: l('Correct my data', 'تصحيح بياناتي') }, { value: 'deletion', label: l('Delete my data', 'حذف بياناتي') }, { value: 'restriction', label: l('Restrict processing', 'تقييد المعالجة') }] }, { key: 'details', label: l('Details', 'التفاصيل'), type: 'textarea' }]" :submit="(v) => api.post(`/patients/${me.data.value!.id}/data-requests`, prune(v))" @done="requests.reload()" />
  </div>
</template>
