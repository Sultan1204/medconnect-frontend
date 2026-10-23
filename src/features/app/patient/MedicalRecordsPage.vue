<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import FormModal, { type Field } from '../kit/FormModal.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const api = { ...rawApi }

const { l } = useL()
const { run } = useAction()
const me = useAsyncData<Row>(() => getData('/patients/me'))
const rec = useAsyncData<Row>(() => getData('/patients/me/medical-records'))

type Kind = 'allergies' | 'medications' | 'history'
const adding = ref<Kind | null>(null)
const addOpen = computed({ get: () => !!adding.value, set: (v) => { if (!v) adding.value = null } })
const SEV = ['unknown', 'mild', 'moderate', 'severe'].map((v) => ({ value: v, label: v }))
const TYPES = ['condition', 'chronic_condition', 'surgery', 'family_history', 'social_history', 'other'].map((v) => ({ value: v, label: v.replace(/_/g, ' ') }))
const fields = computed<Field[]>(() =>
  adding.value === 'allergies'
    ? [{ key: 'allergen', label: l('Allergen', 'مسبب الحساسية'), required: true }, { key: 'reaction', label: l('Reaction', 'التفاعل') }, { key: 'severity', label: l('Severity', 'الشدة'), type: 'select', options: SEV }]
    : adding.value === 'medications'
      ? [{ key: 'name', label: l('Medication', 'الدواء'), required: true }, { key: 'dosage', label: l('Dosage', 'الجرعة') }, { key: 'frequency', label: l('Frequency', 'التكرار') }, { key: 'started_on', label: l('Started on', 'بدأ في'), type: 'date' }]
      : [{ key: 'type', label: l('Type', 'النوع'), type: 'select', options: TYPES }, { key: 'title', label: l('Title', 'العنوان'), required: true }, { key: 'details', label: l('Details', 'التفاصيل'), type: 'textarea' }, { key: 'onset_date', label: l('Onset date', 'تاريخ البدء'), type: 'date' }],
)
async function retract(kind: Kind, e: Row) {
  await run(() => api.patch(`/patients/${me.data.value!.id}/medical-records/${kind}/${e.id}`, { status: 'entered_in_error' }), l('Entry removed', 'تمت إزالة الإدخال'))
  await rec.reload()
}
const SECTIONS: Array<[Kind, string, string]> = [['allergies', 'Allergies', 'الحساسية'], ['medications', 'Medications', 'الأدوية'], ['history', 'Medical history', 'التاريخ المرضي']]
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Medical records', 'السجل الطبي')" :subtitle="l('Information you add is shared with your treating doctors during a consultation.', 'المعلومات التي تضيفها تُشارك مع طبيبك المعالج أثناء الاستشارة.')" />
    <div v-if="rec.loading.value && !rec.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <template v-else-if="rec.data.value">
      <AppCard v-for="[k, en, ar] in SECTIONS" :key="k" class="flex flex-col gap-3">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l(en, ar) }}</h2><AppButton size="sm" variant="outline" @click="adding = k">{{ l('Add', 'إضافة') }}</AppButton></div>
        <p v-if="!rec.data.value[k]?.length" class="text-sm text-fg-muted">{{ l('Nothing recorded.', 'لا يوجد شيء مسجل.') }}</p>
        <ul v-else class="divide-y divide-border text-sm">
          <li v-for="e in rec.data.value[k]" :key="e.id" class="flex items-start justify-between gap-3 py-2">
            <div>
              <p class="font-medium">{{ e.allergen ?? e.name ?? e.title }}</p>
              <p class="text-fg-muted">{{ [e.reaction, e.severity, e.dosage, e.frequency, e.type, e.details].filter(Boolean).join(' · ') }}</p>
              <StatusBadge :value="e.status" />
            </div>
            <AppButton v-if="e.source === 'patient_reported' && e.status !== 'entered_in_error'" size="sm" variant="ghost" @click="retract(k, e)">{{ l('Remove', 'إزالة') }}</AppButton>
          </li>
        </ul>
      </AppCard>
    </template>
    <FormModal v-model:open="addOpen" :title="l('Add entry', 'إضافة إدخال')" :fields="fields" :submit="(v) => api.post(`/patients/${me.data.value!.id}/medical-records/${adding}`, prune(v))" @done="rec.reload()" />
  </div>
</template>
