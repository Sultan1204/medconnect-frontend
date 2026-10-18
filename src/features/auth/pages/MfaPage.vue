<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { otpField } from '@/utils/validation'
import { safeRedirect } from '@/app/router/guards'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
usePageMeta(() => t('auth.mfa.seoTitle'))

// The challenge only exists in memory after a password step; otherwise restart login.
onMounted(() => {
  if (!auth.mfaChallenge) void router.replace('/login')
})

const form = useForm(z.object({ code: otpField() }), { code: '' })
const submit = form.handleSubmit(async ({ code }) => {
  await auth.verifyMfa(code)
  await router.replace(safeRedirect(route.query.redirect) ?? auth.homePath)
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.mfa.title') }}</h1>
  <p class="mt-1 text-fg-muted">{{ auth.mfaChallenge?.channel === 'totp' ? t('auth.mfa.subtitleTotp') : t('auth.mfa.subtitleSms') }}</p>
  <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormErrorAlert :error="form.formError.value" />
    <AppInput
      v-model="form.values.code"
      :label="t('auth.mfa.code')"
      :error="form.errors.code"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      dir="ltr"
      class="text-center text-2xl tracking-[0.5em]"
      required
    />
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.mfa.submit') }}</AppButton>
  </form>
</template>
