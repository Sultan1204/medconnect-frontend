<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { toApiError } from '@/services/api/errors'
import { api, getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'

const route = useRoute()
const router = useRouter()
const { l, fmt, status } = useL()
const { run, busy } = useAction()
const doctorId = computed(() => String(route.params.doctorId))
const type = computed(() => String(route.query.type ?? ''))
const slotStart = computed(() => String(route.query.slot ?? ''))

const doctor = useAsyncData<Row>(() => getData(`/doctors/${doctorId.value}`))
const me = useAsyncData<Row>(() => getData('/patients/me'))
const dependents = useAsyncData<Row[]>(() => getData('/patients/me/dependents'))
const consents = ref<Row | null>(null)
const accepted = ref<Record<string, boolean>>({})
const patientId = ref('')
const slotOk = ref<boolean | null>(null)
const slot = ref<Row | null>(null)
const error = ref<string | null>(null)

const LABELS: Record<string, [string, string]> = {
  terms_of_service: ['I accept the Terms of Service', 'أوافق على شروط الاستخدام'],
  privacy_policy: ['I accept the Privacy Policy', 'أوافق على سياسة الخصوصية'],
  telemedicine: ['I consent to receive care by telemedicine', 'أوافق على تلقي الرعاية عن بعد'],
}

async function loadConsents() {
  if (!me.data.value) return
  consents.value = await getData(`/patients/${me.data.value.id}/consents`)
  accepted.value = {}
}

async function check() {
  try {
    const slots = await getData<Row[]>(`/doctors/${doctorId.value}/availability`)
    slot.value = slots.find((s) => s.starts_at === slotStart.value) ?? null
    slotOk.value = !!slot.value
  } catch (e) {
    error.value = toApiError(e).message
  }
}

onMounted(check)
watch(() => me.data.value, async (m) => { if (m) { patientId.value = m.id; await loadConsents() } }, { immediate: true })

const missing = computed<string[]>(() => consents.value?.missing_for_booking ?? [])
const fee = computed(() => slot.value?.fees?.find((f: Row) => f.type === type.value))
const allAccepted = computed(() => missing.value.every((k) => accepted.value[k]))
const people = computed(() => [{ value: me.data.value?.id ?? '', label: l('Myself', 'نفسي') }, ...(dependents.data.value ?? []).map((d) => ({ value: d.id, label: d.full_name }))])

async function confirm() {
  const res = await run(async () => {
    for (const k of missing.value) {
      await api.post(`/patients/${me.data.value!.id}/consents`, { type: k, version: consents.value!.current_versions[k], granted: true })
    }
    return api.post('/appointments', { doctor_id: doctorId.value, consultation_type: type.value, starts_at: slotStart.value, patient_id: patientId.value || undefined })
  })
  if (res) void router.push({ path: `/patient/appointments/${res.data.id}`, query: { pay: '1' } })
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <PageHead :title="l('Confirm your booking', 'تأكيد الحجز')" />
    <div v-if="doctor.loading.value || me.loading.value || slotOk === null" class="flex justify-center py-10"><AppSpinner /></div>
    <AppErrorState v-else-if="doctor.error.value" :error="doctor.error.value" @retry="doctor.reload" />
    <AppAlert v-else-if="error" variant="danger">{{ error }}</AppAlert>
    <template v-else-if="doctor.data.value">
      <AppAlert v-if="!slotOk" variant="warning">
        {{ l('This time slot is no longer available.', 'هذا الموعد لم يعد متاحاً.') }}
        <AppButton :to="`/doctors/${doctorId}#booking`" size="sm" class="ms-2">{{ l('Choose another time', 'اختر وقتاً آخر') }}</AppButton>
      </AppAlert>
      <AppCard v-else class="flex flex-col gap-4">
        <KeyValues
          :items="[
            { label: l('Doctor', 'الطبيب'), value: doctor.data.value.name },
            { label: l('When', 'الموعد'), value: fmt.dateTime(slotStart) },
            { label: l('Type', 'النوع'), value: status(type) },
            { label: l('Price', 'السعر'), value: sar(fee?.amount, fee?.currency) },
          ]"
        />
        <AppSelect v-if="people.length > 1" v-model="patientId" :label="l('Who is the appointment for?', 'لمن هذا الموعد؟')" :options="people" />
        <div v-if="missing.length" class="flex flex-col gap-2">
          <h2 class="font-semibold">{{ l('Required consents', 'الموافقات المطلوبة') }}</h2>
          <AppCheckbox v-for="k in missing" :key="k" v-model="accepted[k]" :label="l(LABELS[k]?.[0] ?? k, LABELS[k]?.[1] ?? k)" />
        </div>
        <AppAlert variant="info">{{ l('MedConnect is not for emergencies. In an emergency call 997 or 911.', 'ميدكونكت ليس للطوارئ. في حالات الطوارئ اتصل بـ 997 أو 911.') }}</AppAlert>
        <AppButton block size="lg" :loading="busy" :disabled="!allAccepted" @click="confirm">{{ l('Confirm and continue to payment', 'تأكيد والمتابعة إلى الدفع') }}</AppButton>
      </AppCard>
    </template>
  </div>
</template>
