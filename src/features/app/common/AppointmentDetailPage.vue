<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'
import PayDialog from './PayDialog.vue'

const api = { ...rawApi }

const route = useRoute()
const router = useRouter()
const { l, fmt, status } = useL()
const { run } = useAction()
const isDoctor = computed(() => route.path.startsWith('/doctor'))
const base = computed(() => (isDoctor.value ? '/doctor' : '/patient'))
const id = computed(() => String(route.params.id))

const { data: appt, loading, error, reload } = useAsyncData<Row>(() => getData(`/appointments/${id.value}`), { watch: [id] })
const payOpen = ref(false)
const cancelOpen = ref(false)
const declineOpen = ref(false)

watch(appt, (a) => { if (a && route.query.pay === '1' && a.status === 'awaiting_payment' && !isDoctor.value) payOpen.value = true }, { once: true })

async function openConsultation() {
  const c = await run(() => getData(`/appointments/${id.value}/consultation`))
  if (c) void router.push(`${base.value}/consultations/${c.id}`)
}
async function simple(path: string, msg: string) {
  await run(() => api.post(`/appointments/${id.value}/${path}`), msg)
  await reload()
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Appointment', 'الموعد')">
      <AppButton :to="`${base}/appointments`" variant="ghost" size="sm">{{ l('Back to list', 'العودة للقائمة') }}</AppButton>
    </PageHead>
    <div v-if="loading && !appt" class="flex justify-center py-10"><AppSpinner /></div>
    <AppErrorState v-else-if="error" :error="error" @retry="reload" />
    <template v-else-if="appt">
      <AppCard class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="heading-3">{{ isDoctor ? appt.patient?.full_name : appt.doctor?.name }}</h2>
          <StatusBadge :value="appt.status" />
        </div>
        <KeyValues
          :items="[
            { label: l('When', 'الموعد'), value: fmt.dateTime(appt.starts_at) },
            { label: l('Type', 'النوع'), value: status(appt.consultation_type) },
            { label: l('Price', 'السعر'), value: sar(appt.price?.amount, appt.price?.currency) },
            { label: l('Patient', 'المريض'), value: appt.patient?.full_name },
            { label: l('Free cancellation', 'إلغاء مجاني'), value: l(`up to ${appt.cancellation_policy?.free_cancellation_hours}h before`, `حتى ${appt.cancellation_policy?.free_cancellation_hours} ساعة قبل الموعد`) },
          ]"
        />
        <AppAlert v-if="appt.status === 'awaiting_payment'" variant="warning">
          {{ l('Pay to confirm this booking. The slot is held until', 'ادفع لتأكيد الحجز. الموعد محجوز حتى') }} {{ fmt.dateTime(appt.payment_due_at) }}.
        </AppAlert>
        <div class="flex flex-wrap gap-2">
          <AppButton v-if="!isDoctor && appt.status === 'awaiting_payment'" @click="payOpen = true">{{ l('Pay now', 'ادفع الآن') }}</AppButton>
          <AppButton v-if="['confirmed', 'in_progress', 'completed'].includes(appt.status)" variant="secondary" @click="openConsultation">{{ l('Open consultation', 'فتح الاستشارة') }}</AppButton>
          <AppButton v-if="isDoctor && appt.status === 'pending'" @click="simple('accept', l('Accepted', 'تم القبول'))">{{ l('Accept', 'قبول') }}</AppButton>
          <AppButton v-if="isDoctor && appt.status === 'pending'" variant="danger" @click="declineOpen = true">{{ l('Decline', 'رفض') }}</AppButton>
          <AppButton v-if="isDoctor && appt.status === 'confirmed'" variant="ghost" @click="simple('no-show', l('Marked as no-show', 'تم تسجيل عدم الحضور'))">{{ l('Mark no-show', 'لم يحضر') }}</AppButton>
          <AppButton v-if="appt.can_cancel" variant="outline" @click="cancelOpen = true">{{ l('Cancel appointment', 'إلغاء الموعد') }}</AppButton>
        </div>
      </AppCard>
    </template>

    <PayDialog v-model:open="payOpen" :appointment-id="id" @done="reload" />
    <FormModal v-model:open="cancelOpen" danger :title="l('Cancel appointment', 'إلغاء الموعد')" :fields="[{ key: 'reason', label: l('Reason (optional)', 'السبب (اختياري)'), type: 'textarea' }]" :submit="(v) => api.post(`/appointments/${id}/cancel`, v.reason ? { reason: v.reason } : {})" @done="reload" />
    <FormModal v-model:open="declineOpen" danger :title="l('Decline appointment', 'رفض الموعد')" :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea' }]" :submit="(v) => api.post(`/appointments/${id}/decline`, v.reason ? { reason: v.reason } : {})" @done="reload" />
  </div>
</template>
