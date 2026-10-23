<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api, getData, prune, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'
import FormModal from '../kit/FormModal.vue'
import StatusBadge from '../kit/StatusBadge.vue'

const { l } = useL()
const me = useAsyncData<Row>(() => getData('/doctors/me'))
const specialties = useAsyncData<Row[]>(() => getData('/specialties'))
const open = ref(false)
const RANKS = ['consultant', 'senior_specialist', 'specialist', 'general_practitioner', 'resident']
const initial = computed(() => {
  const d = me.data.value
  if (!d) return {}
  return { display_name_en: d.display_name_en, display_name_ar: d.display_name_ar, title: d.title, gender: d.gender, bio_en: d.bio_en, bio_ar: d.bio_ar, years_of_experience: d.years_of_experience, professional_rank: d.professional_rank, license_number: d.license?.number, license_expires_on: d.license?.expires_on, video_fee: (d.fees?.video ?? 0) / 100, chat_fee: (d.fees?.chat ?? 0) / 100, accepting_patients: d.accepting_patients, specialty: d.specialties?.find((s: Row) => s.is_primary)?.id ?? d.specialties?.[0]?.id }
})
const fields = computed(() => [
  { key: 'display_name_en', label: l('Display name (English)', 'الاسم المعروض (إنجليزي)'), required: true },
  { key: 'display_name_ar', label: l('Display name (Arabic)', 'الاسم المعروض (عربي)') },
  { key: 'title', label: l('Title (e.g. Dr.)', 'اللقب (مثال د.)') },
  { key: 'gender', label: l('Gender', 'الجنس'), type: 'select' as const, options: [{ value: 'male', label: l('Male', 'ذكر') }, { value: 'female', label: l('Female', 'أنثى') }] },
  { key: 'specialty', label: l('Primary specialty', 'التخصص الرئيسي'), type: 'select' as const, options: (specialties.data.value ?? []).map((s) => ({ value: s.id, label: s.name })) },
  { key: 'professional_rank', label: l('Rank', 'الدرجة المهنية'), type: 'select' as const, options: RANKS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })) },
  { key: 'years_of_experience', label: l('Years of experience', 'سنوات الخبرة'), type: 'number' as const },
  { key: 'bio_en', label: l('Bio (English)', 'نبذة (إنجليزي)'), type: 'textarea' as const },
  { key: 'bio_ar', label: l('Bio (Arabic)', 'نبذة (عربي)'), type: 'textarea' as const },
  { key: 'license_number', label: l('License number', 'رقم الترخيص') },
  { key: 'license_expires_on', label: l('License expires on', 'تاريخ انتهاء الترخيص'), type: 'date' as const },
  { key: 'video_fee', label: l('Video fee (SAR)', 'سعر الفيديو (ر.س)'), type: 'number' as const },
  { key: 'chat_fee', label: l('Chat fee (SAR)', 'سعر المحادثة (ر.س)'), type: 'number' as const },
  { key: 'accepting_patients', label: l('Accepting new patients', 'أستقبل مرضى جدد'), type: 'checkbox' as const },
])
function save(v: Record<string, any>) {
  return api.patch('/doctors/me', prune({
    display_name_en: v.display_name_en, display_name_ar: v.display_name_ar, title: v.title, gender: v.gender, bio_en: v.bio_en, bio_ar: v.bio_ar,
    years_of_experience: v.years_of_experience, professional_rank: v.professional_rank, license_number: v.license_number, licensing_authority: 'SCFHS', license_expires_on: v.license_expires_on,
    video_fee_amount: v.video_fee === null ? undefined : Math.round(Number(v.video_fee) * 100), chat_fee_amount: v.chat_fee === null ? undefined : Math.round(Number(v.chat_fee) * 100),
    accepting_patients: v.accepting_patients, specialties: v.specialty ? [{ id: v.specialty, is_primary: true }] : undefined,
  }))
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Profile', 'الملف الشخصي')"><AppButton size="sm" @click="open = true">{{ l('Edit profile', 'تعديل الملف') }}</AppButton></PageHead>
    <div v-if="me.loading.value && !me.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <AppCard v-else-if="me.data.value" class="flex flex-col gap-4">
      <div class="flex items-center justify-between"><h2 class="heading-3">{{ me.data.value.display_name_en }}</h2><StatusBadge :value="me.data.value.verification?.status" /></div>
      <KeyValues :items="[
        { label: l('Specialties', 'التخصصات'), value: me.data.value.specialties?.map((s: Row) => s.name).join(', ') },
        { label: l('Experience', 'الخبرة'), value: me.data.value.years_of_experience ? `${me.data.value.years_of_experience} ${l('years', 'سنة')}` : null },
        { label: l('License', 'الترخيص'), value: `${me.data.value.license?.number ?? '—'} (${me.data.value.license?.authority ?? ''})` },
        { label: l('License expires', 'انتهاء الترخيص'), value: me.data.value.license?.expires_on },
        { label: l('Video fee', 'سعر الفيديو'), value: sar(me.data.value.fees?.video, me.data.value.fees?.currency) },
        { label: l('Chat fee', 'سعر المحادثة'), value: sar(me.data.value.fees?.chat, me.data.value.fees?.currency) },
        { label: l('Accepting patients', 'يستقبل مرضى'), value: me.data.value.accepting_patients ? l('Yes', 'نعم') : l('No', 'لا') },
        { label: l('Rating', 'التقييم'), value: me.data.value.rating?.average ? `${me.data.value.rating.average} (${me.data.value.rating.count})` : l('No reviews yet', 'لا توجد تقييمات') },
      ]" />
      <p class="text-sm">{{ me.data.value.bio_en }}</p>
    </AppCard>
    <FormModal v-model:open="open" size="lg" :title="l('Edit profile', 'تعديل الملف')" :initial="initial" :fields="fields" :submit="save" @done="me.reload()" />
  </div>
</template>
