<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { api as rawApi, getData, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'
import FormModal, { type Field } from '../kit/FormModal.vue'

const api = { ...rawApi }

const { l, fmt } = useL()
const auth = useAuthStore()
const router = useRouter()
const { run, busy } = useAction()

const prefs = useAsyncData<Row[]>(() => getData('/notification-preferences'))
const devices = useAsyncData<Row[]>(() => getData('/auth/devices'))
const categories = computed(() => [...new Set((prefs.data.value ?? []).map((p) => p.category as string))])
const channels = ['sms', 'email', 'push']
const isOn = (c: string, ch: string) => prefs.data.value?.find((p) => p.category === c && p.channel === ch)
async function toggle(c: string, ch: string) {
  const p = isOn(c, ch)
  if (!p || p.mandatory) return
  await run(() => api.put('/notification-preferences', { preferences: [{ category: c, channel: ch, enabled: !p.enabled }] }))
  await prefs.reload()
}

const pwOpen = ref(false)
const pwFields: Field[] = [
  { key: 'current_password', label: l('Current password', 'كلمة المرور الحالية'), type: 'password', required: true },
  { key: 'password', label: l('New password', 'كلمة المرور الجديدة'), type: 'password', required: true },
  { key: 'password_confirmation', label: l('Confirm new password', 'تأكيد كلمة المرور'), type: 'password', required: true },
]

const profOpen = ref(false)
const profFields: Field[] = [
  { key: 'name', label: l('Name', 'الاسم'), required: true },
  { key: 'email', label: l('Email', 'البريد الإلكتروني'), type: 'email' },
  { key: 'preferred_locale', label: l('Preferred language', 'اللغة المفضلة'), type: 'select', options: [{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }] },
]

const deactOpen = ref(false)
const deactFields: Field[] = [
  { key: 'password', label: l('Password', 'كلمة المرور'), type: 'password', required: true },
  { key: 'code', label: l('Authenticator code (if enabled)', 'رمز المصادقة (إن كان مفعلاً)') },
]

async function signOutDevice(id: string) {
  await run(() => api.del(`/auth/devices/${id}`))
  await devices.reload()
}
async function signOutAll() {
  await run(() => api.post('/auth/logout-all'))
  await auth.logout().catch(() => undefined)
  void router.push('/login')
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <PageHead :title="l('Settings', 'الإعدادات')" />

    <AppCard class="flex flex-col gap-3">
      <h2 class="heading-3">{{ l('Account', 'الحساب') }}</h2>
      <dl class="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt class="text-fg-muted">{{ l('Name', 'الاسم') }}</dt><dd>{{ auth.user?.name }}</dd></div>
        <div><dt class="text-fg-muted">{{ l('Email', 'البريد') }}</dt><dd>{{ auth.user?.email ?? '—' }}</dd></div>
      </dl>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="outline" size="sm" @click="profOpen = true">{{ l('Edit details', 'تعديل البيانات') }}</AppButton>
        <AppButton variant="outline" size="sm" @click="pwOpen = true">{{ l('Change password', 'تغيير كلمة المرور') }}</AppButton>
      </div>
    </AppCard>

    <AppCard class="flex flex-col gap-3">
      <h2 class="heading-3">{{ l('Notification preferences', 'تفضيلات الإشعارات') }}</h2>
      <div v-if="prefs.loading.value && !prefs.data.value" class="py-4"><AppSpinner /></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="text-fg-muted"><th class="py-2 text-start font-medium">{{ l('Category', 'الفئة') }}</th><th v-for="ch in channels" :key="ch" class="py-2 text-center font-medium">{{ ch.toUpperCase() }}</th></tr></thead>
          <tbody>
            <tr v-for="c in categories" :key="c" class="border-t border-border">
              <td class="py-2 capitalize">{{ c }}</td>
              <td v-for="ch in channels" :key="ch" class="py-2 text-center">
                <input type="checkbox" class="size-5" :checked="!!isOn(c, ch)?.enabled" :disabled="!isOn(c, ch) || isOn(c, ch)?.mandatory" :aria-label="`${c} ${ch}`" @change="toggle(c, ch)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppCard class="flex flex-col gap-3">
      <h2 class="heading-3">{{ l('Signed-in devices', 'الأجهزة المسجلة') }}</h2>
      <ul class="divide-y divide-border text-sm">
        <li v-for="d in devices.data.value ?? []" :key="d.id" class="flex items-center justify-between gap-3 py-2">
          <div>
            <span>{{ d.name }}</span>
            <AppBadge v-if="d.is_current" variant="success" class="ms-2">{{ l('This device', 'هذا الجهاز') }}</AppBadge>
            <div class="text-xs text-fg-muted">{{ d.ip_address }} · {{ fmt.dateTime(d.last_used_at) }}</div>
          </div>
          <AppButton v-if="!d.is_current" variant="ghost" size="sm" @click="signOutDevice(d.id)">{{ l('Sign out', 'تسجيل الخروج') }}</AppButton>
        </li>
      </ul>
      <div><AppButton variant="outline" size="sm" :loading="busy" @click="signOutAll">{{ l('Sign out everywhere', 'تسجيل الخروج من كل الأجهزة') }}</AppButton></div>
    </AppCard>

    <AppCard v-if="auth.primaryRole === 'patient'" class="flex flex-col gap-3">
      <h2 class="heading-3 text-danger">{{ l('Deactivate account', 'تعطيل الحساب') }}</h2>
      <AppAlert variant="warning">{{ l('Your account will be deactivated and you will be signed out.', 'سيتم تعطيل حسابك وتسجيل خروجك.') }}</AppAlert>
      <div><AppButton variant="danger" size="sm" @click="deactOpen = true">{{ l('Deactivate', 'تعطيل') }}</AppButton></div>
    </AppCard>

    <FormModal v-model:open="pwOpen" :title="l('Change password', 'تغيير كلمة المرور')" :fields="pwFields" :submit="(v) => api.post('/auth/password/change', v)" @done="auth.logout().then(() => router.push('/login'))" />
    <FormModal v-model:open="profOpen" :title="l('Edit details', 'تعديل البيانات')" :fields="profFields" :initial="{ name: auth.user?.name, email: auth.user?.email, preferred_locale: 'ar' }" :submit="(v) => api.patch('/me', v)" />
    <FormModal v-model:open="deactOpen" danger :title="l('Deactivate account', 'تعطيل الحساب')" :fields="deactFields" :submit="(v) => api.post('/me/deactivate', v)" @done="auth.logout().then(() => router.push('/'))" />
  </div>
</template>
