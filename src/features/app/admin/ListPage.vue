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

/** Read-mostly admin lists. The route path decides which list is shown. */
const route = useRoute()
const { l, fmt, status } = useL()
const { run } = useAction()
const kind = computed(() => route.path.split('/').pop() ?? '')
const list = ref<InstanceType<typeof DataList>>()
const action = ref<{ row: Row; type: string } | null>(null)
const open = computed({ get: () => !!action.value, set: (v) => { if (!v) action.value = null } })

const apptCols = computed<Col[]>(() => [
  { key: 'when', label: l('When', 'الموعد'), value: (r) => fmt.dateTime(r.starts_at) },
  { key: 'patient', label: l('Patient', 'المريض'), value: (r) => r.patient?.full_name },
  { key: 'doctor', label: l('Doctor', 'الطبيب'), value: (r) => r.doctor?.name },
  { key: 'type', label: l('Type', 'النوع'), value: (r) => status(r.consultation_type) },
  { key: 'price', label: l('Price', 'السعر'), value: (r) => sar(r.price?.amount, r.price?.currency) },
  { key: 'status', label: l('Status', 'الحالة') },
])

const CONFIG = computed<Record<string, { title: string; endpoint: string; cols: Col[]; params?: Record<string, unknown>; empty: string }>>(() => ({
  appointments: { title: l('Appointments', 'المواعيد'), endpoint: '/admin/appointments', cols: apptCols.value, params: { when: 'all' }, empty: l('No appointments', 'لا توجد مواعيد') },
  consultations: { title: l('Consultations (live and completed)', 'الاستشارات (الجارية والمكتملة)'), endpoint: '/admin/appointments', cols: apptCols.value, params: { when: 'all', 'status[]': ['in_progress', 'completed'] }, empty: l('No consultations', 'لا توجد استشارات') },
  'audit-logs': { title: l('Audit log', 'سجل التدقيق'), endpoint: '/admin/audit-logs', empty: l('No entries', 'لا توجد سجلات'), cols: [
    { key: 'created_at', label: l('Time', 'الوقت'), value: (r) => fmt.dateTime(r.created_at) }, { key: 'actor_role', label: l('Role', 'الدور') }, { key: 'action', label: l('Action', 'الإجراء') }, { key: 'subject_type', label: l('Subject', 'الموضوع') }, { key: 'outcome', label: l('Outcome', 'النتيجة') },
  ] },
  contact: { title: l('Contact messages', 'رسائل التواصل'), endpoint: '/admin/contact-messages', empty: l('No messages', 'لا توجد رسائل'), cols: [
    { key: 'created_at', label: l('Received', 'وصلت'), value: (r) => fmt.dateTime(r.created_at) }, { key: 'name', label: l('Name', 'الاسم') }, { key: 'email', label: l('Email', 'البريد') }, { key: 'subject', label: l('Subject', 'الموضوع') }, { key: 'message', label: l('Message', 'الرسالة') }, { key: 'handled_at', label: l('Handled', 'تمت المعالجة'), value: (r) => (r.handled_at ? fmt.dateTime(r.handled_at) : '—') },
  ] },
  'data-requests': { title: l('Data requests', 'طلبات البيانات'), endpoint: '/admin/data-requests', empty: l('No open requests', 'لا توجد طلبات مفتوحة'), cols: [
    { key: 'created_at', label: l('Received', 'وصلت'), value: (r) => fmt.dateTime(r.created_at) }, { key: 'type', label: l('Type', 'النوع') }, { key: 'details', label: l('Details', 'التفاصيل') }, { key: 'status', label: l('Status', 'الحالة') },
  ] },
  'guardian-links': { title: l('Guardian links', 'روابط الوصاية'), endpoint: '/admin/guardian-links', empty: l('No guardian links to review', 'لا توجد روابط وصاية للمراجعة'), cols: [
    { key: 'created_at', label: l('Submitted', 'قُدّم'), value: (r) => fmt.dateTime(r.created_at) }, { key: 'relationship', label: l('Relationship', 'الصلة') }, { key: 'status', label: l('Status', 'الحالة') },
  ] },
}))
const cfg = computed(() => CONFIG.value[kind.value] ?? CONFIG.value.appointments!)

async function handleContact(r: Row) { await run(() => api.post(`/admin/contact-messages/${r.id}/handle`), l('Marked as handled', 'تمت المعالجة')); await list.value?.reload() }
const decisionFields = computed(() => [{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea' as const }])
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="cfg.title" />
    <DataList ref="list" :key="kind" :endpoint="cfg.endpoint" :columns="cfg.cols" :params="cfg.params" :empty="cfg.empty">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template v-if="kind === 'contact'" #actions="{ row }"><AppButton v-if="!row.handled_at" size="sm" @click="handleContact(row)">{{ l('Mark handled', 'تمت المعالجة') }}</AppButton></template>
      <template v-else-if="kind === 'guardian-links'" #actions="{ row }">
        <AppButton v-if="row.status === 'pending'" size="sm" @click="action = { row, type: 'approve' }">{{ l('Approve', 'اعتماد') }}</AppButton>
        <AppButton v-if="row.status === 'pending'" size="sm" variant="danger" @click="action = { row, type: 'reject' }">{{ l('Reject', 'رفض') }}</AppButton>
        <AppButton v-if="row.status === 'approved'" size="sm" variant="ghost" @click="action = { row, type: 'revoke' }">{{ l('Revoke', 'إلغاء') }}</AppButton>
      </template>
      <template v-else-if="kind === 'data-requests'" #actions="{ row }">
        <AppButton size="sm" variant="outline" @click="action = { row, type: 'in_progress' }">{{ l('Start', 'بدء') }}</AppButton>
        <AppButton size="sm" @click="action = { row, type: 'completed' }">{{ l('Complete', 'إكمال') }}</AppButton>
      </template>
    </DataList>
    <FormModal v-model:open="open" :title="l('Confirm decision', 'تأكيد القرار')" :fields="kind === 'data-requests' ? [{ key: 'resolution', label: l('Resolution note', 'ملاحظة القرار'), type: 'textarea' }] : decisionFields" :submit="(v) => kind === 'data-requests' ? api.post(`/admin/data-requests/${action?.row.id}/handle`, { status: action?.type, resolution: v.resolution ?? undefined }) : api.post(`/admin/guardian-links/${action?.row.id}/decision`, { decision: action?.type, reason: v.reason ?? undefined })" @done="list?.reload()" />
  </div>
</template>
