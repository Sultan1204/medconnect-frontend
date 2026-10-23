<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const route = useRoute()
const { l, fmt } = useL()
const { run, busy } = useAction()
const id = computed(() => String(route.params.id))
const { data: d, loading, error, reload } = useAsyncData<Row>(() => getData(`/pharmacy/dispense-requests/${id.value}`), { watch: [id] })
const verification = ref<Row | null>(null)
const rejectOpen = ref(false)

const NEXT: Record<string, Array<[string, string, string]>> = {
  requested: [['received', 'Mark received', 'تأكيد الاستلام']],
  received: [['under_review', 'Start review', 'بدء المراجعة']],
  under_review: [['ready', 'Mark ready for pickup', 'جاهز للاستلام']],
  ready: [['dispensed', 'Mark dispensed', 'تم الصرف']],
}
async function verify() { verification.value = await run(() => getData(`/pharmacy/dispense-requests/${id.value}/verify`)) }
async function setStatus(status: string) { await run(() => api.post(`/pharmacy/dispense-requests/${id.value}/status`, { status }), l('Status updated', 'تم تحديث الحالة')); await reload() }
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Dispensing request', 'طلب صرف')"><AppButton to="/pharmacy/prescriptions" variant="ghost" size="sm">{{ l('Back to list', 'العودة للقائمة') }}</AppButton></PageHead>
    <div v-if="loading && !d" class="flex justify-center py-10"><AppSpinner /></div>
    <AppErrorState v-else-if="error" :error="error" @retry="reload" />
    <template v-else-if="d">
      <AppCard class="flex flex-col gap-4">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ d.patient?.full_name }}</h2><StatusBadge :value="d.status" /></div>
        <KeyValues :items="[{ label: l('Age / gender', 'العمر / الجنس'), value: `${d.patient?.age} / ${d.patient?.gender}` }, { label: l('Prescriber', 'الطبيب'), value: `${d.prescription?.prescriber?.name} (${d.prescription?.prescriber?.license_number})` }, { label: l('Reference', 'المرجع'), value: d.prescription?.external_reference }, { label: l('Expires', 'تنتهي'), value: d.prescription?.expires_at ? fmt.dateTime(d.prescription.expires_at) : null }]" />
        <AppAlert v-if="d.prescription?.legal_validity !== 'valid'" variant="warning">{{ l('SIMULATED prescription - not legally valid. Demo data only.', 'وصفة محاكاة - غير صالحة قانونياً. بيانات تجريبية فقط.') }}</AppAlert>
        <ul class="divide-y divide-border rounded-xl border border-border text-sm">
          <li v-for="(it, i) in d.prescription?.items" :key="i" class="px-3 py-2">
            <div class="font-medium">{{ it.medication_name }} <span class="text-fg-muted">{{ it.strength }} {{ it.dosage_form }}</span></div>
            <div class="text-fg-muted">{{ it.dose }} · {{ it.route }} · {{ it.frequency }} · {{ it.duration_days }} {{ l('days', 'يوم') }} · {{ it.quantity }} {{ it.quantity_unit }}</div>
            <div v-if="it.instructions" class="text-fg-muted">{{ it.instructions }}</div>
          </li>
        </ul>
        <AppAlert v-if="verification" :variant="verification.valid_for_dispensing ? 'success' : 'danger'">
          {{ verification.valid_for_dispensing ? l('Verified with the e-prescribing service: valid for dispensing.', 'تم التحقق من خدمة الوصفات: صالحة للصرف.') : l('Not valid for dispensing.', 'غير صالحة للصرف.') }}
        </AppAlert>
        <p v-if="d.rejection_reason" class="text-sm text-danger">{{ d.rejection_reason }} {{ d.pharmacy_note }}</p>
        <div class="flex flex-wrap gap-2">
          <AppButton variant="outline" :loading="busy" @click="verify">{{ l('Verify prescription', 'التحقق من الوصفة') }}</AppButton>
          <AppButton v-for="[s, en, ar] in NEXT[d.status] ?? []" :key="s" :loading="busy" @click="setStatus(s)">{{ l(en, ar) }}</AppButton>
          <AppButton v-if="['requested', 'received', 'under_review'].includes(d.status)" variant="danger" @click="rejectOpen = true">{{ l('Reject', 'رفض') }}</AppButton>
        </div>
      </AppCard>
    </template>
    <FormModal v-model:open="rejectOpen" danger :title="l('Reject request', 'رفض الطلب')" :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'select', options: [{ value: 'out_of_stock', label: l('Out of stock', 'غير متوفر') }, { value: 'prescription_invalid', label: l('Prescription invalid', 'وصفة غير صالحة') }, { value: 'requires_clarification', label: l('Needs clarification', 'تحتاج توضيح') }, { value: 'patient_not_present', label: l('Patient not present', 'المريض غير موجود') }, { value: 'other', label: l('Other', 'أخرى') }] }, { key: 'note', label: l('Note', 'ملاحظة'), type: 'textarea' }]" :submit="(v) => api.post(`/pharmacy/dispense-requests/${id}/status`, prune({ status: 'rejected', reason: v.reason, note: v.note }))" @done="reload" />
  </div>
</template>
