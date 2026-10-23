<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { Pill } from 'lucide-vue-next'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import FormModal from '../kit/FormModal.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import PrescriptionCard from '../common/PrescriptionCard.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const { run } = useAction()
const me = useAsyncData<Row>(() => getData('/patients/me'))
const rx = useAsyncData<Row[]>(async () => {
  const m = me.data.value ?? (await getData<Row>('/patients/me'))
  return (await api.get(`/patients/${m.id}/prescriptions`, { per_page: 50 })).data
})
const requests = ref<Record<string, Row[]>>({})
async function loadRequests(r: Row) {
  requests.value[r.id] = await getData(`/prescriptions/${r.id}/dispense-requests`)
}

const branches = useAsyncData<Row[]>(async () => (await api.get('/pharmacies/branches', { per_page: 50 })).data)
const sendFor = ref<Row | null>(null)
const sendOpen = computed({ get: () => !!sendFor.value, set: (v) => { if (!v) sendFor.value = null } })
const sendFields = computed(() => [{ key: 'branch_id', label: l('Pharmacy branch', 'فرع الصيدلية'), type: 'select' as const, required: true, options: (branches.data.value ?? []).map((b) => ({ value: b.id, label: `${b.name} (${b.city})` })) }])
async function cancelRequest(d: Row, r: Row) { await run(() => api.post(`/dispense-requests/${d.id}/cancel`), l('Request cancelled', 'تم إلغاء الطلب')); await loadRequests(r) }
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Prescriptions', 'الوصفات الطبية')" :subtitle="l('Send an issued prescription to a pharmacy and follow its progress.', 'أرسل وصفة صادرة إلى صيدلية وتابع تقدمها.')" />
    <div v-if="rx.loading.value && !rx.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <AppEmptyState v-else-if="!rx.data.value?.length" :icon="Pill" :title="l('No prescriptions yet', 'لا توجد وصفات بعد')" />
    <template v-else>
      <PrescriptionCard v-for="r in rx.data.value" :key="r.id" :rx="r">
        <AppButton v-if="r.status === 'issued'" size="sm" @click="sendFor = r">{{ l('Send to pharmacy', 'إرسال إلى صيدلية') }}</AppButton>
        <AppButton size="sm" variant="outline" @click="loadRequests(r)">{{ l('Pharmacy requests', 'طلبات الصيدلية') }}</AppButton>
        <ul v-if="requests[r.id]" class="w-full divide-y divide-border rounded-xl border border-border text-sm">
          <li v-if="!requests[r.id]!.length" class="px-3 py-2 text-fg-muted">{{ l('Not sent to a pharmacy yet.', 'لم تُرسل إلى صيدلية بعد.') }}</li>
          <li v-for="d in requests[r.id]" :key="d.id" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span>{{ d.branch?.pharmacy?.name }} - {{ d.branch?.name }} <span class="text-fg-muted">· {{ fmt.dateTime(d.created_at) }}</span></span>
            <span class="flex items-center gap-2">
              <StatusBadge :value="d.status" />
              <AppBadge v-if="d.rejection_reason" variant="danger">{{ d.rejection_reason }}</AppBadge>
              <AppButton v-if="['requested', 'received'].includes(d.status)" size="sm" variant="ghost" @click="cancelRequest(d, r)">{{ l('Cancel', 'إلغاء') }}</AppButton>
            </span>
          </li>
        </ul>
      </PrescriptionCard>
    </template>
    <FormModal v-model:open="sendOpen" :title="l('Send to pharmacy', 'إرسال إلى صيدلية')" :description="l('Requires your pharmacy data-sharing consent (Profile → Consents).', 'يتطلب موافقتك على مشاركة البيانات مع الصيدلية (الملف الشخصي ← الموافقات).')" :fields="sendFields" :submit="(v) => api.post(`/prescriptions/${sendFor?.id}/dispense-requests`, { branch_id: v.branch_id })" @done="sendFor && loadRequests(sendFor)" />
  </div>
</template>
