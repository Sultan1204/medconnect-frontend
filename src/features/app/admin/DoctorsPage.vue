<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { api as rawApi, getData, prune, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'
import KeyValues from '../kit/KeyValues.vue'

const api = { ...rawApi }

const route = useRoute()
const { l, fmt } = useL()
const { run } = useAction()
const pending = computed(() => route.path.endsWith('/pending'))
const statusFilter = ref('')
const list = ref<InstanceType<typeof DataList>>()
const STATUSES = ['', 'submitted', 'under_review', 'more_info_required', 'approved', 'rejected', 'suspended']
const params = computed(() => (pending.value ? {} : { status: statusFilter.value }))
const cols = computed<Col[]>(() => [
  { key: 'name', label: l('Doctor', 'الطبيب'), value: (r) => r.display_name_en },
  { key: 'specialties', label: l('Specialties', 'التخصصات'), value: (r) => (r.specialties ?? []).map((s: Row) => s.name).join(', ') },
  { key: 'license', label: l('Licence', 'الترخيص'), value: (r) => `${r.license?.number ?? '—'} (${r.license?.authority ?? ''})` },
  { key: 'expires', label: l('Licence expires', 'انتهاء الترخيص'), value: (r) => r.license?.expires_on },
  { key: 'status', label: l('Status', 'الحالة') },
])

const detail = ref<Row | null>(null)
const detailOpen = computed({ get: () => !!detail.value, set: (v) => { if (!v) detail.value = null } })
async function show(r: Row) { detail.value = await getData(`/admin/doctors/${r.id}`) }
async function download(c: Row) {
  const d = await run(() => getData(`/admin/doctors/${detail.value!.id}/credentials/${c.id}/download`))
  if (d?.url) window.open(d.url, '_blank', 'noopener')
}

const decide = ref<{ row: Row; decision: 'approve' | 'reject' } | null>(null)
const decideOpen = computed({ get: () => !!decide.value, set: (v) => { if (!v) decide.value = null } })
const suspendRow = ref<Row | null>(null)
const suspendOpen = computed({ get: () => !!suspendRow.value, set: (v) => { if (!v) suspendRow.value = null } })
async function reinstate(r: Row) { await run(() => api.post(`/admin/doctors/${r.id}/reinstate`), l('Doctor reinstated', 'تمت إعادة الطبيب')); await list.value?.reload() }
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="pending ? l('Doctors awaiting approval', 'أطباء بانتظار الاعتماد') : l('Doctors', 'الأطباء')" />
    <div v-if="!pending" class="flex flex-wrap gap-2"><AppButton v-for="s in STATUSES" :key="s" size="sm" :variant="statusFilter === s ? 'primary' : 'outline'" @click="statusFilter = s">{{ s ? s.replace('_', ' ') : l('All', 'الكل') }}</AppButton></div>
    <DataList ref="list" :endpoint="pending ? '/admin/doctors/pending' : '/admin/doctors'" :columns="cols" :params="params" :empty="l('No doctors', 'لا يوجد أطباء')">
      <template #cell-status="{ row }"><StatusBadge :value="row.verification?.status" /></template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="outline" @click="show(row)">{{ l('Review', 'مراجعة') }}</AppButton>
        <template v-if="['submitted', 'under_review', 'more_info_required'].includes(row.verification?.status)">
          <AppButton size="sm" @click="decide = { row, decision: 'approve' }">{{ l('Approve', 'اعتماد') }}</AppButton>
          <AppButton size="sm" variant="danger" @click="decide = { row, decision: 'reject' }">{{ l('Reject', 'رفض') }}</AppButton>
        </template>
        <AppButton v-if="row.verification?.status === 'approved'" size="sm" variant="ghost" @click="suspendRow = row">{{ l('Suspend', 'إيقاف') }}</AppButton>
        <AppButton v-if="row.verification?.status === 'suspended'" size="sm" variant="outline" @click="reinstate(row)">{{ l('Reinstate', 'إعادة') }}</AppButton>
      </template>
    </DataList>

    <AppModal v-model:open="detailOpen" size="lg" :title="detail?.display_name_en ?? ''">
      <div v-if="detail" class="flex flex-col gap-4">
        <KeyValues :items="[{ label: l('Licence', 'الترخيص'), value: detail.license?.number }, { label: l('Authority', 'الجهة'), value: detail.license?.authority }, { label: l('Expires', 'ينتهي'), value: detail.license?.expires_on }, { label: l('Experience', 'الخبرة'), value: detail.years_of_experience }, { label: l('Specialties', 'التخصصات'), value: detail.specialties?.map((s: Row) => s.name).join(', ') }, { label: l('Submitted', 'قُدّم'), value: detail.verification?.changed_at ? fmt.dateTime(detail.verification.changed_at) : null }]" />
        <p class="text-sm">{{ detail.bio_en }}</p>
        <div>
          <h3 class="mb-2 font-semibold">{{ l('Credential documents', 'وثائق الاعتماد') }}</h3>
          <p v-if="!detail.credentials?.length" class="text-sm text-fg-muted">{{ l('No documents uploaded.', 'لم يتم رفع وثائق.') }}</p>
          <ul v-else class="divide-y divide-border text-sm"><li v-for="c in detail.credentials" :key="c.id" class="flex items-center justify-between py-2"><span>{{ c.title }} <span class="text-fg-muted">· {{ c.type }} · {{ c.status }}</span></span><AppButton size="sm" variant="ghost" @click="download(c)">{{ l('View', 'عرض') }}</AppButton></li></ul>
        </div>
      </div>
    </AppModal>
    <FormModal v-model:open="decideOpen" :danger="decide?.decision === 'reject'" :title="decide?.decision === 'approve' ? l('Approve doctor', 'اعتماد الطبيب') : l('Reject doctor', 'رفض الطبيب')" :fields="[{ key: 'reason', label: l('Reason / note', 'السبب / ملاحظة'), type: 'textarea', required: decide?.decision === 'reject' }]" :submit="(v) => api.post(`/admin/doctors/${decide?.row.id}/verify`, prune({ decision: decide?.decision, reason: v.reason }))" @done="list?.reload()" />
    <FormModal v-model:open="suspendOpen" danger :title="l('Suspend doctor', 'إيقاف الطبيب')" :fields="[{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea', required: true }]" :submit="(v) => api.post(`/admin/doctors/${suspendRow?.id}/suspend`, { reason: v.reason })" @done="list?.reload()" />
  </div>
</template>
