<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { api as rawApi, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import DataList, { type Col } from '../kit/DataList.vue'
import StatusBadge from '../kit/StatusBadge.vue'
import FormModal from '../kit/FormModal.vue'

const api = { ...rawApi }

const route = useRoute()
const { l, fmt, status } = useL()
const patientsOnly = computed(() => route.path.endsWith('/patients'))
const q = ref('')
const roleFilter = ref('')
const list = ref<InstanceType<typeof DataList>>()
const target = ref<Row | null>(null)
const mode = ref<'suspend' | 'reactivate'>('suspend')
const open = computed({ get: () => !!target.value, set: (v) => { if (!v) target.value = null } })
const params = computed(() => ({ q: q.value, role: patientsOnly.value ? 'patient' : roleFilter.value }))
const ROLES = ['', 'patient', 'doctor', 'pharmacy_staff', 'admin', 'super_admin']
const cols = computed<Col[]>(() => [
  { key: 'name', label: l('Name', 'الاسم') },
  { key: 'email', label: l('Email', 'البريد') },
  { key: 'phone', label: l('Phone', 'الهاتف') },
  { key: 'roles', label: l('Role', 'الدور'), value: (r) => (r.roles ?? []).map((x: string) => status(x)).join(', ') },
  { key: 'last_login_at', label: l('Last sign-in', 'آخر دخول'), value: (r) => (r.last_login_at ? fmt.dateTime(r.last_login_at) : '—') },
  { key: 'status', label: l('Status', 'الحالة') },
])
function act(row: Row, m: 'suspend' | 'reactivate') { mode.value = m; target.value = row }
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHead :title="patientsOnly ? l('Patients', 'المرضى') : l('Users', 'المستخدمون')" />
    <div class="flex flex-wrap items-end gap-3">
      <AppInput v-model="q" :label="l('Search name, phone or email', 'بحث بالاسم أو الهاتف أو البريد')" class="min-w-64" />
      <div v-if="!patientsOnly" class="flex flex-wrap gap-2"><AppButton v-for="r in ROLES" :key="r" size="sm" :variant="roleFilter === r ? 'primary' : 'outline'" @click="roleFilter = r">{{ r ? status(r) : l('All', 'الكل') }}</AppButton></div>
    </div>
    <DataList ref="list" endpoint="/admin/users" :columns="cols" :params="params" :empty="l('No users found', 'لا يوجد مستخدمون')">
      <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }">
        <AppButton v-if="row.status === 'active'" size="sm" variant="ghost" @click="act(row, 'suspend')">{{ l('Suspend', 'إيقاف') }}</AppButton>
        <AppButton v-else size="sm" variant="outline" @click="act(row, 'reactivate')">{{ l('Reactivate', 'إعادة تفعيل') }}</AppButton>
      </template>
    </DataList>
    <FormModal v-model:open="open" :danger="mode === 'suspend'" :title="mode === 'suspend' ? l('Suspend account', 'إيقاف الحساب') : l('Reactivate account', 'إعادة تفعيل الحساب')" :fields="mode === 'suspend' ? [{ key: 'reason', label: l('Reason', 'السبب'), type: 'textarea', required: true }] : []" :submit="(v) => api.post(`/admin/users/${target?.id}/${mode}`, mode === 'suspend' ? { reason: v.reason } : {})" @done="list?.reload()" />
  </div>
</template>
