<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BadgeCheck, CalendarDays, Stethoscope } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const { t } = useI18n()
const auth = useAuthStore()
const status = computed(() => auth.user?.doctor_status ?? 'draft')
const approved = computed(() => status.value === 'approved')
const badgeVariant = computed(() =>
  ({ approved: 'success', rejected: 'danger', suspended: 'danger', more_info_required: 'warning', under_review: 'info', submitted: 'info', draft: 'neutral' } as const)[status.value],
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="heading-2">{{ t('portal.dashboard.welcome', { name: auth.user?.name ?? '' }) }}</h1>

    <AppCard class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <BadgeCheck class="size-8 text-primary" aria-hidden="true" />
        <div>
          <h2 class="font-semibold">{{ t('portal.dashboard.verificationStatus') }}</h2>
          <AppBadge :variant="badgeVariant" class="mt-1">{{ t(`portal.doctorStatus.${status}`) }}</AppBadge>
        </div>
      </div>
      <AppButton v-if="!approved" to="/doctor/verification" variant="outline">{{ t('portal.nav.verification') }}</AppButton>
    </AppCard>

    <AppAlert v-if="!approved" variant="warning">{{ t('portal.doctorNotApproved') }}</AppAlert>

    <div class="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="today-h">
        <h2 id="today-h" class="heading-3 mb-3">{{ t('portal.nav.appointments') }}</h2>
        <AppEmptyState :icon="CalendarDays" :title="t('portal.dashboard.noData')" />
      </section>
      <section aria-labelledby="consult-h">
        <h2 id="consult-h" class="heading-3 mb-3">{{ t('portal.nav.consultations') }}</h2>
        <AppEmptyState :icon="Stethoscope" :title="t('portal.dashboard.noData')" />
      </section>
    </div>
  </div>
</template>
