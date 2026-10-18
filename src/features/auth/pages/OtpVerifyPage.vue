<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useIntervalFn } from '@vueuse/core'
import { z } from 'zod'
import { authApi } from '@/services/api/auth'
import { toApiError } from '@/services/api/errors'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { otpField } from '@/utils/validation'
import { formatSaudiMobile } from '@/utils/phone'
import { safeRedirect } from '@/app/router/guards'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
usePageMeta(() => t('auth.otp.seoTitle'))

// Phone lives in memory only (set by registration/login); a reload means starting again.
const phone = computed(() => auth.pendingPhone)
const form = useForm(z.object({ code: otpField() }), { code: '' })

const cooldown = ref(0)
const { pause, resume } = useIntervalFn(() => {
  cooldown.value = Math.max(0, cooldown.value - 1)
  if (cooldown.value === 0) pause()
}, 1000, { immediate: false })

const sending = ref(false)
async function send(initial = false) {
  if (!phone.value || sending.value) return
  sending.value = true
  try {
    const { resend_available_in } = await authApi.sendOtp(phone.value, 'phone_verification')
    cooldown.value = resend_available_in
    resume()
    if (!initial) toast.info(t('auth.otp.resent'))
  } catch (e) {
    toast.error(t(toApiError(e).messageKey))
  } finally {
    sending.value = false
  }
}

onMounted(() => void send(true))

const submit = form.handleSubmit(async ({ code }) => {
  const { user } = await authApi.verifyOtp(phone.value!, code, 'phone_verification')
  auth.pendingPhone = null
  if (user) auth.setUser(user)
  await router.replace(safeRedirect(route.query.redirect) ?? auth.homePath)
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.otp.title') }}</h1>

  <AppAlert v-if="!phone" variant="warning" class="mt-6">
    {{ t('auth.otp.missingPhone') }}
    <RouterLink to="/login" class="font-semibold underline">{{ t('nav.login') }}</RouterLink>
  </AppAlert>

  <template v-else>
    <p class="mt-1 text-fg-muted">
      <i18n-t keypath="auth.otp.sentTo" tag="span">
        <template #phone><span class="ltr-inline font-semibold text-fg">{{ formatSaudiMobile(phone) }}</span></template>
      </i18n-t>
    </p>
    <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
      <FormErrorAlert :error="form.formError.value" />
      <AppInput
        v-model="form.values.code"
        :label="t('auth.otp.code')"
        :error="form.errors.code"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        dir="ltr"
        class="text-center text-2xl tracking-[0.5em]"
        required
      />
      <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.otp.verify') }}</AppButton>
      <p v-if="cooldown > 0" class="text-center text-sm text-fg-muted" aria-live="off">{{ t('auth.otp.resendIn', { s: cooldown }) }}</p>
      <AppButton v-else variant="link" :loading="sending" class="self-center" @click="send()">{{ t('auth.otp.resend') }}</AppButton>
    </form>
  </template>
</template>
