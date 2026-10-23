<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { http } from '@/services/api/http'
import { api, getData, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const { l, fmt } = useL()
const { run, busy } = useAction()
const me = useAsyncData<Row>(() => getData('/doctors/me'))
const creds = useAsyncData<Row[]>(() => getData('/doctors/me/credentials'))
const history = useAsyncData<Row[]>(() => getData('/doctors/me/verification'))
const open = ref(false)
const file = ref<File | null>(null)
const TYPES = ['professional_license', 'qualification', 'certification', 'identity_document', 'other']

async function upload(v: Record<string, any>) {
  if (!file.value) throw new Error(l('Choose a file', 'اختر ملفاً'))
  const fd = new FormData()
  fd.append('type', v.type); fd.append('title', v.title); fd.append('file', file.value)
  if (v.issuer) fd.append('issuer', v.issuer)
  await http.post('/doctors/me/credentials', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
async function remove(c: Row) { await run(() => api.del(`/doctors/me/credentials/${c.id}`)); await creds.reload() }
async function download(c: Row) {
  const d = await run(() => getData(`/doctors/me/credentials/${c.id}/download`))
  if (d?.url) window.open(d.url, '_blank', 'noopener')
}
async function submit() {
  const r = await run(() => api.post('/doctors/me/verification'), l('Submitted for review', 'تم الإرسال للمراجعة'))
  if (r) await Promise.all([me.reload(), history.reload()])
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Verification', 'التوثيق')" :subtitle="l('Complete your profile, upload your credentials and submit for review.', 'أكمل ملفك وارفع وثائقك ثم أرسل للمراجعة.')" />
    <div v-if="me.loading.value && !me.data.value" class="flex justify-center py-10"><AppSpinner /></div>
    <template v-else-if="me.data.value">
      <AppCard class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="font-semibold">{{ l('Status', 'الحالة') }}</h2><StatusBadge :value="me.data.value.verification?.status" /></div>
        <div class="flex gap-2">
          <AppButton to="/doctor/profile" variant="outline" size="sm">{{ l('Edit profile', 'تعديل الملف') }}</AppButton>
          <AppButton v-if="['draft', 'more_info_required', 'rejected'].includes(me.data.value.verification?.status)" size="sm" :loading="busy" @click="submit">{{ l('Submit for review', 'إرسال للمراجعة') }}</AppButton>
        </div>
      </AppCard>
      <AppAlert v-if="me.data.value.verification?.status === 'approved'" variant="success">{{ l('You are approved and visible to patients.', 'تم اعتمادك وأنت ظاهر للمرضى.') }}</AppAlert>

      <AppCard class="flex flex-col gap-3">
        <div class="flex items-center justify-between"><h2 class="heading-3">{{ l('Credential documents', 'وثائق الاعتماد') }}</h2><AppButton size="sm" variant="outline" @click="open = true">{{ l('Upload', 'رفع') }}</AppButton></div>
        <p v-if="!creds.data.value?.length" class="text-sm text-fg-muted">{{ l('No documents uploaded.', 'لم يتم رفع وثائق.') }}</p>
        <ul v-else class="divide-y divide-border text-sm">
          <li v-for="c in creds.data.value" :key="c.id" class="flex items-center justify-between gap-3 py-2">
            <span>{{ c.title }} <span class="text-fg-muted">· {{ c.type }}</span></span>
            <span class="flex gap-2"><AppButton size="sm" variant="ghost" @click="download(c)">{{ l('View', 'عرض') }}</AppButton><AppButton size="sm" variant="ghost" @click="remove(c)">{{ l('Remove', 'حذف') }}</AppButton></span>
          </li>
        </ul>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <h2 class="heading-3">{{ l('Review history', 'سجل المراجعة') }}</h2>
        <p v-if="!history.data.value?.length" class="text-sm text-fg-muted">{{ l('No history yet.', 'لا يوجد سجل بعد.') }}</p>
        <ul v-else class="divide-y divide-border text-sm"><li v-for="(h, i) in history.data.value" :key="i" class="py-2"><StatusBadge :value="h.to_status ?? h.status" /> <span class="text-fg-muted">{{ fmt.dateTime(h.created_at) }}</span><span v-if="h.reason ?? h.note"> - {{ h.reason ?? h.note }}</span></li></ul>
      </AppCard>
    </template>

    <FormModal v-model:open="open" :title="l('Upload document', 'رفع وثيقة')" :fields="[{ key: 'type', label: l('Type', 'النوع'), type: 'select', options: TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })) }, { key: 'title', label: l('Title', 'العنوان'), required: true }, { key: 'issuer', label: l('Issuer', 'الجهة المصدرة') }]" :submit="upload" @done="creds.reload()">
      <template #extra><input type="file" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null" /></template>
    </FormModal>
  </div>
</template>
