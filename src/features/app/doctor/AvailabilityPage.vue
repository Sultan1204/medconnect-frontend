<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const { run, busy } = useAction()
const rules = useAsyncData<Row[]>(() => getData('/doctors/me/availability-rules'))
const slots = useAsyncData<Row[]>(() => getData('/doctors/me/availability-slots'))
const settings = useAsyncData<Row>(() => getData('/doctors/me/schedule-settings'))

const DAYS = [l('Sunday', 'الأحد'), l('Monday', 'الإثنين'), l('Tuesday', 'الثلاثاء'), l('Wednesday', 'الأربعاء'), l('Thursday', 'الخميس'), l('Friday', 'الجمعة'), l('Saturday', 'السبت')]
const TYPES = [{ value: 'video,chat', label: l('Video and chat', 'فيديو ومحادثة') }, { value: 'video', label: l('Video only', 'فيديو فقط') }, { value: 'chat', label: l('Chat only', 'محادثة فقط') }]
const SLOT_MIN = [10, 15, 20, 30, 45, 60].map((v) => ({ value: v, label: `${v} min` }))

const ruleOpen = ref(false)
const slotOpen = ref(false)
const setOpen = ref(false)

const grouped = computed(() => DAYS.map((name, d) => ({ name, d, rules: (rules.data.value ?? []).filter((r) => r.day_of_week === d) })))

function toBody(list: Row[]) {
  return list.map((r) => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, slot_minutes: r.slot_minutes, consultation_types: r.consultation_types, breaks: r.breaks ?? [], valid_from: r.valid_from ?? null, valid_until: r.valid_until ?? null }))
}
async function saveRules(list: Row[], msg: string) { await run(() => api.put('/doctors/me/availability-rules', { rules: toBody(list) }), msg); await rules.reload() }
async function removeRule(r: Row) { await saveRules((rules.data.value ?? []).filter((x) => x.id !== r.id), l('Rule removed', 'تم حذف القاعدة')) }
async function addRule(v: Record<string, any>) {
  const next = [...(rules.data.value ?? []), { day_of_week: Number(v.day_of_week), start_time: v.start_time, end_time: v.end_time, slot_minutes: Number(v.slot_minutes), consultation_types: String(v.types).split(',') }]
  await api.put('/doctors/me/availability-rules', { rules: toBody(next) })
  await rules.reload()
}
async function removeSlot(s: Row) { await run(() => api.del(`/doctors/me/availability-slots/${s.id}`)); await slots.reload() }

/** For demos: opens a half-hour window starting in two minutes and removes the booking-notice requirement. */
async function quickTestSlot() {
  const start = new Date(Date.now() + 2 * 60_000); start.setSeconds(0, 0)
  const end = new Date(start.getTime() + 30 * 60_000)
  await run(async () => {
    await api.patch('/doctors/me/schedule-settings', { min_notice_minutes: 0 })
    await api.post('/doctors/me/availability-slots', { type: 'available', starts_at: start.toISOString().replace('.000', ''), ends_at: end.toISOString().replace('.000', ''), slot_minutes: 30, consultation_types: ['video', 'chat'] })
  }, l('Test slot created - book it as a patient within a minute or two.', 'تم إنشاء موعد تجريبي - احجزه كمريض خلال دقيقة أو دقيقتين.'))
  await Promise.all([slots.reload(), settings.reload()])
}
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">
    <PageHead :title="l('Availability', 'الأوقات المتاحة')" :subtitle="l('Patients can book inside these hours. Times are Saudi time (Riyadh).', 'يمكن للمرضى الحجز ضمن هذه الأوقات. التوقيت بتوقيت السعودية (الرياض).')">
      <AppButton size="sm" variant="secondary" :loading="busy" @click="quickTestSlot">{{ l('Create a test slot (starts in 2 min)', 'إنشاء موعد تجريبي (يبدأ بعد دقيقتين)') }}</AppButton>
    </PageHead>
    <AppAlert variant="info">{{ l('To test a live consultation: create a test slot, book it as the demo patient, pay, then open the consultation from Appointments.', 'لتجربة استشارة مباشرة: أنشئ موعداً تجريبياً، احجزه كمريض تجريبي، ادفع، ثم افتح الاستشارة من المواعيد.') }}</AppAlert>

    <AppCard class="flex flex-col gap-4">
      <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Weekly hours', 'الساعات الأسبوعية') }}</h2><AppButton size="sm" variant="outline" @click="ruleOpen = true">{{ l('Add hours', 'إضافة ساعات') }}</AppButton></div>
      <div v-if="rules.loading.value && !rules.data.value" class="py-4"><AppSpinner /></div>
      <ul v-else class="divide-y divide-border text-sm">
        <li v-for="g in grouped" :key="g.d" class="flex flex-wrap items-start gap-3 py-2">
          <span class="w-24 font-medium">{{ g.name }}</span>
          <span v-if="!g.rules.length" class="text-fg-muted">{{ l('Closed', 'مغلق') }}</span>
          <span v-for="r in g.rules" :key="r.id" class="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1">
            {{ r.start_time }}-{{ r.end_time }} · {{ r.slot_minutes }}m · {{ (r.consultation_types ?? []).join('/') }}
            <button type="button" class="text-danger" :aria-label="l('Remove', 'حذف')" @click="removeRule(r)">×</button>
          </span>
        </li>
      </ul>
    </AppCard>

    <AppCard class="flex flex-col gap-3">
      <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Extra availability and time off', 'أوقات إضافية وإجازات') }}</h2><AppButton size="sm" variant="outline" @click="slotOpen = true">{{ l('Add', 'إضافة') }}</AppButton></div>
      <p v-if="!slots.data.value?.length" class="text-sm text-fg-muted">{{ l('Nothing scheduled.', 'لا شيء مجدول.') }}</p>
      <ul v-else class="divide-y divide-border text-sm">
        <li v-for="s in slots.data.value" :key="s.id" class="flex items-center justify-between py-2">
          <span>{{ s.type === 'blocked' ? l('Time off', 'إجازة') : l('Extra hours', 'ساعات إضافية') }} · {{ fmt.dateTime(s.starts_at) }} → {{ fmt.dateTime(s.ends_at) }}<span v-if="s.note" class="text-fg-muted"> · {{ s.note }}</span></span>
          <AppButton size="sm" variant="ghost" @click="removeSlot(s)">{{ l('Remove', 'حذف') }}</AppButton>
        </li>
      </ul>
    </AppCard>

    <AppCard v-if="settings.data.value" class="flex flex-col gap-3">
      <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Booking rules', 'قواعد الحجز') }}</h2><AppButton size="sm" variant="outline" @click="setOpen = true">{{ l('Edit', 'تعديل') }}</AppButton></div>
      <dl class="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt class="text-fg-muted">{{ l('Minimum notice (minutes)', 'الحد الأدنى للإشعار (دقائق)') }}</dt><dd>{{ settings.data.value.min_notice_minutes }}</dd></div>
        <div><dt class="text-fg-muted">{{ l('Book up to (days ahead)', 'الحجز حتى (أيام قادمة)') }}</dt><dd>{{ settings.data.value.max_days_ahead }}</dd></div>
        <div><dt class="text-fg-muted">{{ l('Buffer between visits (min)', 'فاصل بين الزيارات (دقائق)') }}</dt><dd>{{ settings.data.value.buffer_minutes }}</dd></div>
        <div><dt class="text-fg-muted">{{ l('Auto-confirm paid bookings', 'تأكيد الحجوزات المدفوعة تلقائياً') }}</dt><dd>{{ settings.data.value.auto_confirm ? l('Yes', 'نعم') : l('No', 'لا') }}</dd></div>
        <div><dt class="text-fg-muted">{{ l('Free cancellation (hours)', 'إلغاء مجاني (ساعات)') }}</dt><dd>{{ settings.data.value.free_cancellation_hours }}</dd></div>
      </dl>
    </AppCard>

    <FormModal v-model:open="ruleOpen" :title="l('Add weekly hours', 'إضافة ساعات أسبوعية')" :fields="[{ key: 'day_of_week', label: l('Day', 'اليوم'), type: 'select', options: DAYS.map((n, i) => ({ value: i, label: n })) }, { key: 'start_time', label: l('From', 'من'), type: 'time', required: true }, { key: 'end_time', label: l('To', 'إلى'), type: 'time', required: true }, { key: 'slot_minutes', label: l('Visit length', 'مدة الزيارة'), type: 'select', options: SLOT_MIN }, { key: 'types', label: l('Consultation types', 'أنواع الاستشارة'), type: 'select', options: TYPES }]" :initial="{ start_time: '09:00', end_time: '13:00', slot_minutes: 30 }" :submit="addRule" />
    <FormModal v-model:open="slotOpen" :title="l('Add extra hours or time off', 'إضافة ساعات إضافية أو إجازة')" :fields="[{ key: 'type', label: l('Type', 'النوع'), type: 'select', options: [{ value: 'available', label: l('Extra availability', 'توفر إضافي') }, { value: 'blocked', label: l('Time off', 'إجازة') }] }, { key: 'starts_at', label: l('Starts', 'يبدأ'), type: 'datetime-local', required: true }, { key: 'ends_at', label: l('Ends', 'ينتهي'), type: 'datetime-local', required: true }, { key: 'note', label: l('Note', 'ملاحظة') }]" :submit="(v) => api.post('/doctors/me/availability-slots', prune({ type: v.type, starts_at: new Date(v.starts_at).toISOString(), ends_at: new Date(v.ends_at).toISOString(), slot_minutes: v.type === 'available' ? 30 : undefined, note: v.note }))" @done="slots.reload()" />
    <FormModal v-model:open="setOpen" :title="l('Booking rules', 'قواعد الحجز')" :initial="settings.data.value ?? {}" :fields="[{ key: 'min_notice_minutes', label: l('Minimum notice (minutes)', 'الحد الأدنى للإشعار (دقائق)'), type: 'number' }, { key: 'max_days_ahead', label: l('Book up to (days ahead)', 'الحجز حتى (أيام قادمة)'), type: 'number' }, { key: 'buffer_minutes', label: l('Buffer (minutes)', 'الفاصل (دقائق)'), type: 'number' }, { key: 'free_cancellation_hours', label: l('Free cancellation (hours)', 'إلغاء مجاني (ساعات)'), type: 'number' }, { key: 'auto_confirm', label: l('Auto-confirm paid bookings', 'تأكيد الحجوزات المدفوعة تلقائياً'), type: 'checkbox' }]" :submit="(v) => api.patch('/doctors/me/schedule-settings', prune(v))" @done="settings.reload()" />
  </div>
</template>
