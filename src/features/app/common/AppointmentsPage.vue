<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { api as rawApi, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

/** Appointments for the signed-in patient or doctor (the API scopes the list by role). */
const route = useRoute()
const { l, fmt, status } = useL()
const { run } = useAction()
const isDoctor = computed(() => route.path.startsWith('/doctor'))
const base = computed(() => (isDoctor.value ? '/doctor' : '/patient'))
const when = ref<'upcoming' | 'past' | 'all'>('upcoming')
const list = ref<InstanceType<typeof DataList>>()

const cols = computed<Col[]>(() => [
  { key: 'when', label: l('When', 'الموعد'), value: (r) => fmt.dateTime(r.starts_at) },
  { key: 'who', label: isDoctor.value ? l('Patient', 'المريض') : l('Doctor', 'الطبيب'), value: (r) => (isDoctor.value ? r.patient?.full_name : r.doctor?.name) },
  { key: 'type', label: l('Type', 'النوع'), value: (r) => status(r.consultation_type) },
  { key: 'price', label: l('Price', 'السعر'), value: (r) => sar(r.price?.amount, r.price?.currency) },
  { key: 'status', label: l('Status', 'الحالة') },
])

const decline = ref<Row | null>(null)
const declineOpen = computed({ get: () => !!decline.value, set: (v) => { if (!v) decline.value = null } })
async function accept(r: Row) { await run(() => api.post(`/appointments/${r.id}/accept`), l('Appointment accepted', 'تم قبول الموعد')); await list.value?.reload() }
async function noShow(r: Row) { await run(() => api.post(`/appointments/${r.id}/no-show`), l('Marked as no-show', 'تم تسجيل عدم الحضور')); await list.value?.reload() }
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="l('Appointments', 'المواعيد')">
      <AppButton v-for="w in (['upcoming', 'past', 'all'] as const)" :key="w" size="sm" :variant="when === w ? 'primary' : 'outline'" @click="when = w">
        {{ w === 'upcoming' ? l('Upcoming', 'القادمة') : w === 'past' ? l('Past', 'السابقة') : l('All', 'الكل') }}
      </AppButton>
      <AppButton v-if="!isDoctor" to="/doctors" size="sm" variant="secondary">{{ l('Book a doctor', 'احجز طبيباً') }}</AppButton>
    </PageHead>
    <DataList ref="list" endpoint="/appointments" :columns="cols" :params="{ when }" :empty="l('No appointments', 'لا توجد مواعيد')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }">
        <AppButton :to="`${base}/appointments/${row.id}`" size="sm" variant="outline">{{ l('Open', 'فتح') }}</AppButton>
        <template v-if="isDoctor">
          <AppButton v-if="row.status === 'pending'" size="sm" @click="accept(row)">{{ l('Accept', 'قبول') }}</AppButton>
          <AppButton v-if="row.status === 'pending'" size="sm" variant="danger" @click="decline = row">{{ l('Decline', 'رفض') }}</AppButton>
          <AppButton v-if="row.status === 'confirmed'" size="sm" variant="ghost" @click="noShow(row)">{{ l('No-show', 'لم يحضر') }}</AppButton>
        </template>
      </template>
    </DataList>
    <FormModal
      v-model:open="declineOpen"
      danger
      :title="l('Decline appointment', 'رفض الموعد')"
      :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea' }]"
      :submit="(v) => api.post(`/appointments/${decline?.id}/decline`, v.reason ? { reason: v.reason } : {})"
      @done="list?.reload()"
    />
  </div>
</template>
