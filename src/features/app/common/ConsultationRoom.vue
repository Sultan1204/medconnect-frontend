<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { toApiError } from '@/services/api/errors'
import { api as rawApi, getData, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'
import ChatPanel from './ChatPanel.vue'
import RxEditor from './RxEditor.vue'
import PrescriptionCard from './PrescriptionCard.vue'

const api = { ...rawApi }

const route = useRoute()
const { l, fmt, status } = useL()
const { run, busy } = useAction()
const id = computed(() => String(route.params.id))

const { data: c, loading, error, reload } = useAsyncData<Row>(() => getData(`/consultations/${id.value}`), { watch: [id] })
let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => { poll = setInterval(() => void reload(), 8000) })
onBeforeUnmount(() => clearInterval(poll))

const isDoctor = computed(() => c.value?.your_role === 'doctor')
const tab = ref<'chat' | 'intake' | 'note' | 'record' | 'rx' | 'review'>('chat')
const open = computed(() => c.value?.status === 'active')
const done = computed(() => c.value?.status === 'completed')

// --- intake (patient) ---
const SCREEN = ['chest_pain', 'breathing_difficulty', 'stroke_signs', 'severe_bleeding', 'loss_of_consciousness', 'severe_allergic_reaction', 'self_harm']
const SCREEN_LABEL: Record<string, [string, string]> = {
  chest_pain: ['Severe chest pain or pressure', 'ألم أو ضغط شديد في الصدر'],
  breathing_difficulty: ['Severe difficulty breathing', 'صعوبة شديدة في التنفس'],
  stroke_signs: ['Sudden weakness, facial drooping or trouble speaking', 'ضعف مفاجئ أو التواء الوجه أو صعوبة الكلام'],
  severe_bleeding: ['Heavy bleeding that will not stop', 'نزيف شديد لا يتوقف'],
  loss_of_consciousness: ['Fainting or loss of consciousness', 'إغماء أو فقدان الوعي'],
  severe_allergic_reaction: ['Swelling of face or throat after an allergen', 'تورم الوجه أو الحلق بعد التعرض لمسبب حساسية'],
  self_harm: ['Thoughts of harming yourself or others', 'أفكار لإيذاء النفس أو الآخرين'],
}
const intake = ref({ reason: '', details: '', screening: Object.fromEntries(SCREEN.map((k) => [k, false])) as Record<string, boolean> })
watch(c, (v) => {
  if (v?.intake?.submitted_at && !intake.value.reason) {
    intake.value = { reason: v.intake.reason ?? '', details: v.intake.details ?? '', screening: { ...intake.value.screening, ...(v.intake.screening ?? {}) } }
  }
}, { immediate: true })
async function saveIntake() {
  if (!intake.value.reason.trim()) return
  const r = await run(() => api.put(`/consultations/${id.value}/intake`, { reason: intake.value.reason, details: intake.value.details || null, screening: intake.value.screening }), l('Intake saved', 'تم حفظ المعلومات'))
  if (r) await reload()
}

// --- doctor actions ---
async function act(path: string, msg: string, body?: unknown) {
  const r = await run(() => api.post(`/consultations/${id.value}/${path}`, body), msg)
  if (r) await reload()
}
const escalateOpen = ref(false)
const interruptOpen = ref(false)

// --- clinical note ---
const note = useAsyncData<Row | null>(async () => {
  try { return await getData(`/consultations/${id.value}/clinical-note`) } catch (e) { if (toApiError(e).kind === 'not_found') return null; throw e }
}, { immediate: false })
const noteForm = ref<Record<string, string>>({ subjective: '', objective: '', assessment: '', plan: '', follow_up: '', referral: '' })
const NOTE_FIELDS: Array<[string, string, string]> = [['subjective', 'Subjective', 'الشكوى'], ['objective', 'Objective', 'الفحص'], ['assessment', 'Assessment', 'التقييم'], ['plan', 'Plan', 'الخطة'], ['follow_up', 'Follow-up', 'المتابعة'], ['referral', 'Referral', 'الإحالة']]
watch(() => note.data.value, (n) => { if (n) noteForm.value = { ...noteForm.value, ...Object.fromEntries(Object.entries(n.content ?? {}).map(([k, v]) => [k, String(v ?? '')])) } })
async function saveNote() {
  const content = Object.fromEntries(Object.entries(noteForm.value).map(([k, v]) => [k, v || null]))
  await run(() => api.put(`/consultations/${id.value}/clinical-note`, content), l('Draft saved', 'تم حفظ المسودة'))
  await note.reload()
}
async function finalizeNote() { await saveNote(); await run(() => api.post(`/consultations/${id.value}/clinical-note/finalize`), l('Note finalised', 'تم اعتماد الملاحظة')); await note.reload() }
async function amendNote() { await run(() => api.post(`/consultations/${id.value}/clinical-note/amend`, Object.fromEntries(Object.entries(noteForm.value).map(([k, v]) => [k, v || null]))), l('Note amended', 'تم تعديل الملاحظة')); await note.reload() }

// --- patient record ---
const record = useAsyncData<Row | null>(() => getData(`/consultations/${id.value}/patient-record`), { immediate: false })

// --- prescriptions ---
const rxs = useAsyncData<Row[]>(() => getData(`/consultations/${id.value}/prescriptions`), { immediate: false })
const ackFor = ref<Row | null>(null)
const ackOpen = computed({ get: () => !!ackFor.value, set: (v) => { if (!v) ackFor.value = null } })
const cancelFor = ref<Row | null>(null)
const cancelOpen = computed({ get: () => !!cancelFor.value, set: (v) => { if (!v) cancelFor.value = null } })
async function submitRx(r: Row) { await run(() => api.post(`/prescriptions/${r.id}/submit`), l('Submitted', 'تم الإرسال')); await rxs.reload() }
async function decide(r: Row, decision: 'issue' | 'reject') { await run(() => api.post(`/dev/mock-prescriptions/${r.id}/decision`, { decision }), l('Decision simulated', 'تمت محاكاة القرار')); await rxs.reload() }

// --- video ---
const video = ref<Row | null>(null)
async function joinVideo() {
  const r = await run(async () => (await api.post(`/consultations/${id.value}/video-token`)).data)
  if (r) { video.value = r; if (r.session_id) void api.post(`/video-sessions/${r.session_id}/events`, { type: 'joined' }).catch(() => undefined) }
}
async function leaveVideo() { if (video.value?.session_id) void api.post(`/video-sessions/${video.value.session_id}/events`, { type: 'left' }).catch(() => undefined); video.value = null }

// --- review (patient) ---
const rating = ref(5)
const comment = ref('')
async function review() { const r = await run(() => api.post(`/consultations/${id.value}/review`, { rating: rating.value, comment: comment.value || null }), l('Thank you for your review', 'شكراً على تقييمك')); if (r) tab.value = 'chat' }

// --- complaint ---
const complaintOpen = ref(false)

watch(tab, (t) => {
  if (t === 'note' && !note.data.value) void note.reload()
  if (t === 'record') void record.reload()
  if (t === 'rx') void rxs.reload()
})

const tabs = computed(() => {
  const t: Array<[typeof tab.value, string]> = [['chat', l('Chat', 'المحادثة')], ['intake', l('Intake', 'المعلومات الأولية')]]
  if (isDoctor.value) t.push(['note', l('Clinical note', 'الملاحظة السريرية')], ['record', l('Patient record', 'سجل المريض')])
  t.push(['rx', l('Prescriptions', 'الوصفات')])
  if (!isDoctor.value && done.value) t.push(['review', l('Review', 'التقييم')])
  return t
})
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-4">
    <PageHead :title="l('Consultation', 'الاستشارة')">
      <AppButton v-if="!isDoctor && done" variant="outline" size="sm" @click="complaintOpen = true">{{ l('Report a problem', 'الإبلاغ عن مشكلة') }}</AppButton>
    </PageHead>
    <div v-if="loading && !c" class="flex justify-center py-10"><AppSpinner /></div>
    <AppErrorState v-else-if="error" :error="error" @retry="reload" />
    <template v-else-if="c">
      <AppCard class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <KeyValues
            class="flex-1"
            :items="[
              { label: isDoctor ? l('Patient', 'المريض') : l('Doctor', 'الطبيب'), value: isDoctor ? c.appointment?.patient?.full_name : c.appointment?.doctor?.name },
              { label: l('Scheduled', 'الموعد'), value: fmt.dateTime(c.appointment?.starts_at) },
              { label: l('Type', 'النوع'), value: status(c.consultation_type) },
              { label: l('Ends by', 'ينتهي بحد أقصى'), value: c.hard_ends_at ? fmt.time(c.hard_ends_at) : '—' },
            ]"
          />
          <StatusBadge :value="c.status" />
        </div>
        <AppAlert v-if="c.emergency_flagged" variant="danger" :title="l('Emergency symptoms reported', 'تم الإبلاغ عن أعراض طارئة')">
          {{ l('If this is an emergency, call 997 or 911 now.', 'إذا كانت حالة طارئة فاتصل بـ 997 أو 911 الآن.') }}
        </AppAlert>
        <div v-if="isDoctor" class="flex flex-wrap gap-2">
          <AppButton v-if="c.status === 'scheduled' || c.status === 'interrupted'" :loading="busy" @click="act('start', l('Consultation started', 'بدأت الاستشارة'))">{{ l('Start consultation', 'بدء الاستشارة') }}</AppButton>
          <AppButton v-if="open" variant="secondary" :loading="busy" @click="act('complete', l('Consultation completed', 'اكتملت الاستشارة'))">{{ l('Complete', 'إنهاء') }}</AppButton>
          <AppButton v-if="open" variant="outline" @click="interruptOpen = true">{{ l('Interrupt', 'مقاطعة') }}</AppButton>
          <AppButton v-if="open || done" variant="danger" @click="escalateOpen = true">{{ l('Escalate', 'تصعيد') }}</AppButton>
        </div>
        <p v-else-if="c.status === 'scheduled'" class="text-sm text-fg-muted">{{ l('Waiting for the doctor to start. Fill in the intake form while you wait.', 'بانتظار بدء الطبيب. املأ المعلومات الأولية أثناء الانتظار.') }}</p>
      </AppCard>

      <div class="flex flex-wrap gap-2" role="tablist">
        <AppButton v-for="[k, label] in tabs" :key="k" role="tab" :aria-selected="tab === k" size="sm" :variant="tab === k ? 'primary' : 'outline'" @click="tab = k">{{ label }}</AppButton>
      </div>

      <!-- chat / video -->
      <div v-show="tab === 'chat'" class="flex flex-col gap-4">
        <AppCard v-if="c.consultation_type === 'video'" class="flex flex-col gap-3">
          <h2 class="heading-3">{{ l('Video', 'الفيديو') }}</h2>
          <AppAlert variant="info">{{ l('Demo: the video provider is simulated (no camera or audio is transmitted). Joining records the session events.', 'تجريبي: مزود الفيديو محاكى (لا يتم نقل كاميرا أو صوت). الانضمام يسجل أحداث الجلسة.') }}</AppAlert>
          <div v-if="video" class="rounded-xl bg-surface-muted p-4 text-sm">
            <p class="font-medium">{{ l('Connected to simulated room', 'متصل بغرفة محاكاة') }}</p>
            <p class="text-fg-muted">{{ video.connection?.room }}</p>
            <AppButton class="mt-3" variant="outline" size="sm" @click="leaveVideo">{{ l('Leave', 'مغادرة') }}</AppButton>
          </div>
          <div v-else><AppButton :disabled="!open" @click="joinVideo">{{ l('Join video room', 'الانضمام لغرفة الفيديو') }}</AppButton></div>
        </AppCard>
        <ChatPanel :consultation-id="id" :can-send="open" />
      </div>

      <!-- intake -->
      <AppCard v-show="tab === 'intake'" class="flex flex-col gap-4">
        <template v-if="!isDoctor && !done">
          <AppInput v-model="intake.reason" :label="l('Reason for the visit', 'سبب الزيارة')" required />
          <AppTextarea v-model="intake.details" :label="l('Details', 'التفاصيل')" :rows="4" />
          <fieldset class="flex flex-col gap-1">
            <legend class="mb-1 font-medium">{{ l('Do you have any of these right now?', 'هل لديك أي مما يلي الآن؟') }}</legend>
            <AppCheckbox v-for="k in SCREEN" :key="k" v-model="intake.screening[k]" :label="l(SCREEN_LABEL[k]![0], SCREEN_LABEL[k]![1])" />
          </fieldset>
          <div><AppButton :loading="busy" @click="saveIntake">{{ l('Save intake', 'حفظ المعلومات') }}</AppButton></div>
        </template>
        <template v-else>
          <p v-if="!c.intake?.submitted_at" class="text-sm text-fg-muted">{{ l('The patient has not submitted intake information.', 'لم يرسل المريض المعلومات الأولية.') }}</p>
          <KeyValues v-else :items="[{ label: l('Reason', 'السبب'), value: c.intake.reason }, { label: l('Details', 'التفاصيل'), value: c.intake.details }, { label: l('Flagged symptoms', 'الأعراض المبلغ عنها'), value: Object.entries(c.intake.screening ?? {}).filter(([, v]) => v).map(([k]) => k).join(', ') || l('None', 'لا شيء') }]" />
        </template>
      </AppCard>

      <!-- clinical note (doctor) -->
      <AppCard v-if="isDoctor" v-show="tab === 'note'" class="flex flex-col gap-4">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Clinical note', 'الملاحظة السريرية') }}</h2><StatusBadge v-if="note.data.value" :value="note.data.value.status" /></div>
        <AppTextarea v-for="[k, en, ar] in NOTE_FIELDS" :key="k" v-model="noteForm[k]!" :label="l(en, ar)" :rows="3" />
        <div class="flex flex-wrap gap-2">
          <template v-if="note.data.value?.status === 'final'"><AppButton :loading="busy" @click="amendNote">{{ l('Save amendment', 'حفظ التعديل') }}</AppButton></template>
          <template v-else>
            <AppButton variant="outline" :loading="busy" @click="saveNote">{{ l('Save draft', 'حفظ مسودة') }}</AppButton>
            <AppButton :loading="busy" @click="finalizeNote">{{ l('Finalise', 'اعتماد') }}</AppButton>
          </template>
        </div>
      </AppCard>

      <!-- patient record (doctor) -->
      <AppCard v-if="isDoctor" v-show="tab === 'record'" class="flex flex-col gap-4">
        <div v-if="record.loading.value" class="py-4"><AppSpinner /></div>
        <AppAlert v-else-if="record.error.value" variant="warning">{{ record.error.value.message }}</AppAlert>
        <template v-else-if="record.data.value">
          <section v-for="[k, en, ar] in ([['allergies', 'Allergies', 'الحساسية'], ['medications', 'Medications', 'الأدوية'], ['history', 'History', 'التاريخ المرضي']] as const)" :key="k">
            <h3 class="font-semibold">{{ l(en, ar) }}</h3>
            <p v-if="!record.data.value[k]?.length" class="text-sm text-fg-muted">{{ l('None recorded', 'لا يوجد') }}</p>
            <ul v-else class="list-disc ps-5 text-sm">
              <li v-for="e in record.data.value[k]" :key="e.id">{{ e.allergen ?? e.name ?? e.title }} <span class="text-fg-muted">{{ e.reaction ?? e.dosage ?? e.details }}</span></li>
            </ul>
          </section>
        </template>
      </AppCard>

      <!-- prescriptions -->
      <div v-show="tab === 'rx'" class="flex flex-col gap-4">
        <div v-if="rxs.loading.value && !rxs.data.value" class="py-4"><AppSpinner /></div>
        <p v-else-if="!rxs.data.value?.length" class="text-sm text-fg-muted">{{ l('No prescriptions for this consultation.', 'لا توجد وصفات لهذه الاستشارة.') }}</p>
        <PrescriptionCard v-for="rx in rxs.data.value ?? []" :key="rx.id" :rx="rx">
          <template v-if="isDoctor">
            <AppButton v-if="rx.status === 'draft'" size="sm" @click="submitRx(rx)">{{ l('Validate and submit', 'تحقق وإرسال') }}</AppButton>
            <AppButton v-if="rx.safety_check?.findings?.length && !rx.safety_check.warnings_acknowledged_at" size="sm" variant="outline" @click="ackFor = rx">{{ l('Acknowledge warnings', 'الإقرار بالتحذيرات') }}</AppButton>
            <template v-if="rx.status === 'pending_external_approval'">
              <AppButton size="sm" variant="secondary" @click="decide(rx, 'issue')">{{ l('Simulate approval', 'محاكاة الموافقة') }}</AppButton>
              <AppButton size="sm" variant="outline" @click="decide(rx, 'reject')">{{ l('Simulate rejection', 'محاكاة الرفض') }}</AppButton>
            </template>
            <AppButton v-if="['draft', 'pending_external_approval', 'issued'].includes(rx.status)" size="sm" variant="ghost" @click="cancelFor = rx">{{ l('Cancel', 'إلغاء') }}</AppButton>
          </template>
        </PrescriptionCard>
        <RxEditor v-if="isDoctor && !done" :consultation-id="id" @created="rxs.reload()" />
      </div>

      <!-- review (patient) -->
      <AppCard v-if="!isDoctor && done" v-show="tab === 'review'" class="flex flex-col gap-4">
        <h2 class="heading-3">{{ l('How was your consultation?', 'كيف كانت استشارتك؟') }}</h2>
        <AppSelect v-model="rating" :label="l('Rating', 'التقييم')" :options="[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} / 5` }))" />
        <AppTextarea v-model="comment" :label="l('Comment (optional)', 'تعليق (اختياري)')" :rows="3" />
        <div><AppButton :loading="busy" @click="review">{{ l('Submit review', 'إرسال التقييم') }}</AppButton></div>
      </AppCard>
    </template>

    <FormModal v-model:open="escalateOpen" danger :title="l('Escalate', 'تصعيد')" :fields="[{ key: 'type', label: l('Type', 'النوع'), type: 'select', options: [{ value: 'emergency', label: l('Emergency', 'طوارئ') }, { value: 'urgent_in_person', label: l('Urgent in-person care', 'رعاية عاجلة حضورية') }, { value: 'in_person_referral', label: l('In-person referral', 'إحالة حضورية') }] }, { key: 'details', label: l('Details', 'التفاصيل'), type: 'textarea' }]" :submit="(v) => api.post(`/consultations/${id}/escalate`, { type: v.type, details: v.details })" @done="reload" />
    <FormModal v-model:open="interruptOpen" :title="l('Interrupt consultation', 'مقاطعة الاستشارة')" :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'select', options: [{ value: 'connection_failure', label: l('Connection failure', 'انقطاع الاتصال') }, { value: 'patient_left', label: l('Patient left', 'غادر المريض') }, { value: 'technical_issue', label: l('Technical issue', 'مشكلة تقنية') }, { value: 'other', label: l('Other', 'أخرى') }] }]" :submit="(v) => api.post(`/consultations/${id}/interrupt`, { reason: v.reason })" @done="reload" />
    <FormModal v-model:open="ackOpen" :title="l('Acknowledge safety warnings', 'الإقرار بتحذيرات السلامة')" :fields="[{ key: 'justification', label: l('Clinical justification', 'المبرر السريري'), type: 'textarea', required: true }]" :submit="(v) => api.post(`/prescriptions/${ackFor?.id}/acknowledge-warnings`, { justification: v.justification })" @done="rxs.reload()" />
    <FormModal v-model:open="cancelOpen" danger :title="l('Cancel prescription', 'إلغاء الوصفة')" :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea', required: true }]" :submit="(v) => api.post(`/prescriptions/${cancelFor?.id}/cancel`, { reason: v.reason })" @done="rxs.reload()" />
    <FormModal v-model:open="complaintOpen" :title="l('Report a problem', 'الإبلاغ عن مشكلة')" :fields="[{ key: 'category', label: l('Category', 'الفئة'), type: 'select', options: [{ value: 'service_quality', label: l('Service quality', 'جودة الخدمة') }, { value: 'conduct', label: l('Conduct', 'السلوك') }, { value: 'billing', label: l('Billing', 'الفواتير') }, { value: 'privacy', label: l('Privacy', 'الخصوصية') }, { value: 'technical', label: l('Technical', 'تقني') }, { value: 'other', label: l('Other', 'أخرى') }] }, { key: 'description', label: l('What happened?', 'ماذا حدث؟'), type: 'textarea', required: true }]" :submit="(v) => api.post('/complaints', { subject_type: 'consultation', subject_id: id, category: v.category, description: v.description })" />
  </div>
</template>
