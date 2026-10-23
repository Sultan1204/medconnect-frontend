<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Briefcase, ChevronLeft, GraduationCap, Languages, MessageSquare, Video } from 'lucide-vue-next'
import type { AvailabilitySlot, ConsultationType } from '@/types/domain'
import { catalogApi } from '@/services/api/catalog'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageMeta } from '@/composables/usePageMeta'
import { useFormatters } from '@/composables/useFormatters'
import { riyadhDateKey } from '@/utils/format'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import VerifiedBadge from '@/components/doctors/VerifiedBadge.vue'
import RatingStars from '@/components/doctors/RatingStars.vue'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const router = useRouter()
const f = useFormatters()

const doctor = useAsyncData((signal) => catalogApi.doctor(props.id, { signal }), { watch: [() => props.id, locale] })
const reviews = useAsyncData((signal) => catalogApi.reviews(props.id, 1, { signal }), { watch: [() => props.id, locale] })

usePageMeta(
  () => doctor.data.value?.name ?? t('nav.doctors'),
  () => (doctor.data.value ? `${doctor.data.value.title ?? ''} — ${doctor.data.value.specialty.name}` : undefined),
)

// Availability window: today + 6 days, in Riyadh time.
const DAYS = 7
const days = computed(() => Array.from({ length: DAYS }, (_, i) => new Date(Date.now() + i * 86_400_000)))
const availability = useAsyncData(
  (signal) => {
    const from = new Date()
    const to = new Date(from.getTime() + DAYS * 86_400_000)
    return catalogApi.availability(props.id, from.toISOString(), to.toISOString(), { signal })
  },
  { watch: [() => props.id] },
)

const selectedType = ref<ConsultationType | null>(null)
const selectedDay = ref(riyadhDateKey(new Date()))
const selectedSlot = ref<string | null>(null)

watch(
  () => doctor.data.value,
  (d) => {
    if (d && (!selectedType.value || !d.consultation_offers.some((o) => o.type === selectedType.value))) {
      selectedType.value = d.consultation_offers[0]?.type ?? null
    }
  },
)

const slotsByDay = computed(() => {
  const map = new Map<string, AvailabilitySlot[]>()
  for (const s of availability.data.value ?? []) {
    if (selectedType.value && !s.consultation_types.includes(selectedType.value)) continue
    const key = riyadhDateKey(new Date(s.starts_at))
    map.set(key, [...(map.get(key) ?? []), s])
  }
  return map
})
const daySlots = computed(() => slotsByDay.value.get(selectedDay.value) ?? [])
const selectedOffer = computed(() => doctor.data.value?.consultation_offers.find((o) => o.type === selectedType.value) ?? null)

watch([selectedType, selectedDay], () => (selectedSlot.value = null))

function continueBooking() {
  if (!selectedSlot.value || !selectedType.value) return
  // The booking flow (Phase 4) re-validates the slot and price with the backend before confirming.
  void router.push({ path: `/patient/book/${props.id}`, query: { type: selectedType.value, slot: selectedSlot.value } })
}
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <nav :aria-label="t('nav.breadcrumb')" class="mb-6 text-sm">
      <RouterLink to="/doctors" class="inline-flex items-center gap-1 text-fg-muted hover:text-primary">
        <ChevronLeft class="size-4 rtl:rotate-180" aria-hidden="true" />
        {{ t('nav.doctors') }}
      </RouterLink>
    </nav>

    <AppErrorState v-if="doctor.error.value" :error="doctor.error.value" :title="doctor.error.value.kind === 'not_found' ? t('doctorProfile.notFound') : undefined" @retry="doctor.reload" />

    <div v-else-if="!doctor.data.value" class="grid gap-6 lg:grid-cols-[1fr_24rem]" aria-busy="true">
      <AppSkeleton class="h-64" />
      <AppSkeleton class="h-96" />
    </div>

    <!-- min-w-0 lets the horizontally scrolling day picker scroll instead of widening the column. -->
    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_24rem] [&>*]:min-w-0">
      <div class="flex flex-col gap-6">
        <!-- Header -->
        <AppCard>
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AppAvatar :name="doctor.data.value.name" :src="doctor.data.value.avatar_url" size="xl" />
            <div class="flex-1">
              <h1 class="heading-2">{{ doctor.data.value.name }}</h1>
              <p class="mt-1 text-fg-muted">
                {{ doctor.data.value.title }} ·
                <RouterLink :to="`/specialties/${doctor.data.value.specialty.slug}`" class="text-primary underline underline-offset-2">{{ doctor.data.value.specialty.name }}</RouterLink>
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <VerifiedBadge v-if="doctor.data.value.is_verified" />
                <RatingStars v-if="doctor.data.value.rating" :rating="doctor.data.value.rating" />
                <span v-if="doctor.data.value.experience_years" class="text-sm text-fg-muted">{{ t('doctorProfile.experienceYears', { n: doctor.data.value.experience_years }) }}</span>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard v-if="doctor.data.value.bio" as="section" aria-labelledby="about-h">
          <h2 id="about-h" class="heading-3 mb-3">{{ t('doctorProfile.about') }}</h2>
          <!-- Rendered as text (never v-html) to prevent XSS from profile content. -->
          <p class="whitespace-pre-line text-fg-muted">{{ doctor.data.value.bio }}</p>
        </AppCard>

        <div class="grid gap-6 md:grid-cols-2">
          <AppCard as="section" aria-labelledby="qual-h">
            <h2 id="qual-h" class="heading-3 mb-3 flex items-center gap-2"><GraduationCap class="size-5 text-primary" aria-hidden="true" />{{ t('doctorProfile.qualifications') }}</h2>
            <ul class="list-disc space-y-1 ps-5 text-sm">
              <li v-for="q in doctor.data.value.qualifications" :key="q">{{ q }}</li>
            </ul>
          </AppCard>
          <AppCard as="section" aria-labelledby="lang-h">
            <h2 id="lang-h" class="heading-3 mb-3 flex items-center gap-2"><Languages class="size-5 text-primary" aria-hidden="true" />{{ t('doctorProfile.languages') }}</h2>
            <p class="text-sm">{{ f.list(doctor.data.value.languages.map(f.languageName)) }}</p>
          </AppCard>
        </div>

        <AppCard v-if="doctor.data.value.experience.length" as="section" aria-labelledby="exp-h">
          <h2 id="exp-h" class="heading-3 mb-3 flex items-center gap-2"><Briefcase class="size-5 text-primary" aria-hidden="true" />{{ t('doctorProfile.experience') }}</h2>
          <ul class="flex flex-col gap-3">
            <li v-for="(e, i) in doctor.data.value.experience" :key="i" class="text-sm">
              <p class="font-semibold">{{ e.title }}</p>
              <p class="text-fg-muted">{{ e.organization }} · <span class="ltr-inline">{{ e.from_year }} – {{ e.to_year ?? t('doctorProfile.present') }}</span></p>
            </li>
          </ul>
        </AppCard>

        <AppCard as="section" aria-labelledby="reviews-h">
          <h2 id="reviews-h" class="heading-3 mb-4">{{ t('doctorProfile.reviews') }}</h2>
          <AppErrorState v-if="reviews.error.value" :error="reviews.error.value" @retry="reviews.reload" />
          <AppSkeleton v-else-if="!reviews.data.value" class="h-24" />
          <p v-else-if="!reviews.data.value.data.length" class="text-sm text-fg-muted">{{ t('doctorProfile.noReviews') }}</p>
          <ul v-else class="flex flex-col divide-y divide-border">
            <li v-for="r in reviews.data.value.data" :key="r.id" class="py-3">
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold">{{ r.author_display_name || t('doctorProfile.anonymousPatient') }}</span>
                <span class="text-fg-muted">{{ f.date(r.created_at) }}</span>
              </div>
              <RatingStars class="mt-1" :rating="{ average: r.rating, count: 1 }" />
              <p v-if="r.comment" class="mt-1 text-sm text-fg-muted">{{ r.comment }}</p>
            </li>
          </ul>
        </AppCard>
      </div>

      <!-- Booking panel -->
      <AppCard id="booking" as="section" aria-labelledby="booking-h" class="lg:sticky lg:top-20">
        <h2 id="booking-h" class="heading-3 mb-4">{{ t('doctorProfile.consultationTypes') }}</h2>

        <fieldset class="mb-5">
          <legend class="sr-only">{{ t('doctorProfile.selectType') }}</legend>
          <div class="flex flex-col gap-2">
            <label
              v-for="o in doctor.data.value.consultation_offers"
              :key="o.type"
              class="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
            >
              <input v-model="selectedType" type="radio" name="consultation-type" :value="o.type" class="sr-only" />
              <MessageSquare v-if="o.type === 'chat'" class="size-5 text-secondary" aria-hidden="true" />
              <Video v-else class="size-5 text-brand" aria-hidden="true" />
              <span class="flex-1">
                <span class="block font-semibold">{{ t(`consultationType.${o.type}`) }}</span>
                <span class="text-xs text-fg-muted">{{ t('common.minutes', { n: o.duration_minutes }) }}</span>
              </span>
              <span class="font-bold">{{ f.money(o.price) }}</span>
            </label>
          </div>
        </fieldset>

        <h3 class="mb-2 text-sm font-semibold">{{ t('doctorProfile.availability') }}</h3>
        <p class="mb-3 text-xs text-fg-muted">{{ t('doctorProfile.timezoneNote') }}</p>

        <AppErrorState v-if="availability.error.value" :error="availability.error.value" @retry="availability.reload" />
        <template v-else>
          <fieldset class="mb-4">
            <legend class="sr-only">{{ t('doctorProfile.selectDate') }}</legend>
            <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <label
                v-for="d in days"
                :key="riyadhDateKey(d)"
                class="relative flex min-w-16 shrink-0 cursor-pointer flex-col items-center rounded-xl border px-2 py-2 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
                :class="{ 'opacity-50': availability.data.value && !slotsByDay.get(riyadhDateKey(d))?.length }"
              >
                <input v-model="selectedDay" type="radio" name="booking-day" :value="riyadhDateKey(d)" class="sr-only" />
                <span>{{ f.date(d.toISOString(), { weekday: 'short' }) }}</span>
                <span class="text-base font-bold">{{ f.date(d.toISOString(), { day: 'numeric' }) }}</span>
              </label>
            </div>
          </fieldset>

          <div v-if="availability.loading.value && !availability.data.value" class="grid grid-cols-3 gap-2">
            <AppSkeleton v-for="n in 6" :key="n" class="h-11" />
          </div>
          <p v-else-if="!daySlots.length" class="rounded-xl bg-surface-muted p-4 text-center text-sm text-fg-muted">{{ t('doctorProfile.noSlots') }}</p>
          <fieldset v-else>
            <legend class="sr-only">{{ t('doctorProfile.selectTime') }}</legend>
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="s in daySlots"
                :key="s.starts_at"
                class="relative flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus"
              >
                <input v-model="selectedSlot" type="radio" name="booking-slot" :value="s.starts_at" class="sr-only" />
                {{ f.time(s.starts_at) }}
              </label>
            </div>
          </fieldset>
        </template>

        <div class="mt-5 border-t border-border pt-4">
          <p v-if="selectedOffer && selectedSlot" class="mb-3 text-sm">
            {{ t(`consultationType.${selectedOffer.type}`) }} · {{ f.dateTime(selectedSlot) }} · <strong>{{ f.money(selectedOffer.price) }}</strong>
          </p>
          <AppButton block size="lg" :disabled="!selectedSlot" @click="continueBooking">
            {{ selectedSlot ? t('doctorProfile.book') : t('doctorProfile.selectSlotFirst') }}
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
