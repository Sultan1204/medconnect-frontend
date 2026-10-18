<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarClock, Languages, MessageSquare, Video } from 'lucide-vue-next'
import type { DoctorSummary } from '@/types/domain'
import { useFormatters } from '@/composables/useFormatters'
import AppAvatar from '../ui/AppAvatar.vue'
import AppButton from '../ui/AppButton.vue'
import VerifiedBadge from './VerifiedBadge.vue'
import RatingStars from './RatingStars.vue'

const props = defineProps<{ doctor: DoctorSummary }>()
const { t } = useI18n()
const f = useFormatters()
const lowest = computed(() => f.lowestPrice(props.doctor.consultation_offers))
const headingId = computed(() => `doctor-${props.doctor.id}-name`)
</script>

<template>
  <article class="card flex h-full flex-col gap-4 p-5" :aria-labelledby="headingId" data-testid="doctor-card">
    <div class="flex items-start gap-4">
      <AppAvatar :name="doctor.name" :src="doctor.avatar_url" size="lg" />
      <div class="min-w-0 flex-1">
        <h3 :id="headingId" class="text-base font-bold leading-snug">
          <RouterLink :to="`/doctors/${doctor.id}`" class="hover:text-primary hover:underline">{{ doctor.name }}</RouterLink>
        </h3>
        <p class="mt-0.5 text-sm text-fg-muted">{{ doctor.title ?? doctor.specialty.name }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <VerifiedBadge v-if="doctor.is_verified" />
          <RatingStars v-if="doctor.rating" :rating="doctor.rating" />
        </div>
      </div>
    </div>

    <ul v-if="doctor.qualifications.length" class="flex flex-wrap gap-1.5" :aria-label="t('doctorProfile.qualifications')">
      <li v-for="q in doctor.qualifications" :key="q" class="rounded-md bg-surface-muted px-2 py-0.5 text-xs">{{ q }}</li>
    </ul>

    <dl class="flex flex-col gap-2 text-sm">
      <div class="flex items-center gap-2">
        <dt><Languages class="size-4 text-fg-muted" aria-hidden="true" /><span class="sr-only">{{ t('doctors.card.languages') }}</span></dt>
        <dd>{{ f.list(doctor.languages.map(f.languageName)) }}</dd>
      </div>
      <div class="flex items-center gap-2">
        <dt><CalendarClock class="size-4 text-fg-muted" aria-hidden="true" /><span class="sr-only">{{ t('doctorProfile.availability') }}</span></dt>
        <dd v-if="doctor.next_available_at">{{ t('doctors.card.nextAvailable', { date: f.dateTime(doctor.next_available_at) }) }}</dd>
        <dd v-else class="text-fg-muted">{{ t('doctors.card.noAvailability') }}</dd>
      </div>
    </dl>

    <div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <div class="flex items-center gap-2 text-fg-muted">
        <span v-for="o in doctor.consultation_offers" :key="o.type" :title="t(`consultationType.${o.type}`)">
          <MessageSquare v-if="o.type === 'chat'" class="size-4" aria-hidden="true" />
          <Video v-else class="size-4" aria-hidden="true" />
          <span class="sr-only">{{ t(`consultationType.${o.type}`) }}</span>
        </span>
        <span v-if="lowest" class="text-sm font-bold text-fg">{{ t('doctors.card.from', { price: f.money(lowest) }) }}</span>
      </div>
      <div class="flex gap-2">
        <AppButton :to="`/doctors/${doctor.id}`" variant="outline" size="sm">{{ t('doctors.card.viewProfile') }}</AppButton>
        <AppButton :to="`/doctors/${doctor.id}#booking`" size="sm">{{ t('doctors.card.book') }}</AppButton>
      </div>
    </div>
  </article>
</template>
