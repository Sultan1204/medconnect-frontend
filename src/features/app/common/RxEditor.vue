<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { api, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'

const props = defineProps<{ consultationId: string }>()
const emit = defineEmits<{ created: [] }>()
const { l } = useL()
const { run, busy } = useAction()

const ROUTES = ['oral', 'topical', 'inhalation', 'ophthalmic', 'otic', 'nasal', 'rectal', 'vaginal', 'subcutaneous', 'intramuscular', 'transdermal', 'sublingual']
const blank = () => ({ medication_name: '', strength: '', dosage_form: '', dose: '', route: 'oral', frequency: '', duration_days: '', quantity: '', quantity_unit: 'tablet', instructions: '' })
const items = ref<Row[]>([blank()])
const indication = ref('')
const error = ref('')

function slug(s: string) { return s.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ITEM' }

async function create() {
  error.value = ''
  for (const it of items.value) {
    if (!it.medication_name || !it.dose || !it.frequency || !it.duration_days || !it.quantity) { error.value = l('Fill medication, dose, frequency, days and quantity for every item.', 'أكمل الدواء والجرعة والتكرار والأيام والكمية لكل عنصر.'); return }
  }
  const body = {
    consultation_id: props.consultationId,
    clinical_indication: indication.value || undefined,
    items: items.value.map((it) => ({ ...prune(it), catalog_system: 'MOCK', catalog_code: slug(it.medication_name), duration_days: Number(it.duration_days), quantity: Number(it.quantity) })),
  }
  const res = await run(() => api.post('/prescriptions/drafts', body), l('Draft created', 'تم إنشاء المسودة'))
  if (res) { items.value = [blank()]; indication.value = ''; emit('created') }
}
</script>

<template>
  <AppCard class="flex flex-col gap-4">
    <h3 class="heading-3">{{ l('New prescription (draft)', 'وصفة جديدة (مسودة)') }}</h3>
    <AppAlert variant="info">{{ l('Demo only: prescriptions are simulated and not legally valid.', 'للتجربة فقط: الوصفات محاكاة وغير صالحة قانونياً.') }}</AppAlert>
    <AppAlert v-if="error" variant="danger" live>{{ error }}</AppAlert>
    <AppInput v-model="indication" :label="l('Clinical indication', 'الدواعي السريرية')" />
    <div v-for="(it, i) in items" :key="i" class="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
      <AppInput v-model="it.medication_name" :label="l('Medication', 'الدواء')" required />
      <AppInput v-model="it.strength" :label="l('Strength (e.g. 500 mg)', 'التركيز (مثال 500 ملغ)')" />
      <AppInput v-model="it.dosage_form" :label="l('Form (e.g. tablet)', 'الشكل (مثال أقراص)')" />
      <AppInput v-model="it.dose" :label="l('Dose', 'الجرعة')" required />
      <AppSelect v-model="it.route" :label="l('Route', 'طريقة الاستخدام')" :options="ROUTES.map((r) => ({ value: r, label: r }))" />
      <AppInput v-model="it.frequency" :label="l('Frequency (e.g. every 8 hours)', 'التكرار (مثال كل 8 ساعات)')" required />
      <AppInput v-model="it.duration_days" type="number" :label="l('Duration (days)', 'المدة (أيام)')" required />
      <AppInput v-model="it.quantity" type="number" :label="l('Quantity', 'الكمية')" required />
      <AppInput v-model="it.quantity_unit" :label="l('Unit', 'الوحدة')" />
      <AppInput v-model="it.instructions" :label="l('Instructions', 'التعليمات')" />
      <div v-if="items.length > 1" class="sm:col-span-2"><AppButton variant="ghost" size="sm" @click="items.splice(i, 1)">{{ l('Remove item', 'حذف العنصر') }}</AppButton></div>
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="outline" @click="items.push(blank())">{{ l('Add another medication', 'إضافة دواء آخر') }}</AppButton>
      <AppButton :loading="busy" @click="create">{{ l('Create draft', 'إنشاء مسودة') }}</AppButton>
    </div>
  </AppCard>
</template>
