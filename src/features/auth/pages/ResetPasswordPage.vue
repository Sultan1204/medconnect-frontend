<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { authApi } from '@/services/api/auth'
import { useToastStore } from '@/stores/toast'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { passwordField } from '@/utils/validation'
import { normalizeDigits } from '@/utils/format'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

/**
 * Two entry points:
 *  - email link: /reset-password?token=…&identifier=email → set a new password directly;
 *  - SMS: /reset-password?identifier=+9665… → enter the SMS code, exchanged for a reset token.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToastStore()
usePageMeta(() => t('auth.reset.seoTitle'))

const identifier = computed(() => (typeof route.query.identifier === 'string' ? route.query.identifier : ''))
const linkToken = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const needsCode = computed(() => !linkToken.value)

const schema = z
  .object({
    code: z.string().transform((v) => normalizeDigits(v).trim()),
    password: passwordField(),
    password_confirmation: z.string().min(1, { error: 'validation.required' }),
  })
  .refine((d) => !needsCode.value || /^\d{6}$/.test(d.code), { error: 'validation.otp', path: ['code'] })
  .refine((d) => d.password === d.password_confirmation, { error: 'validation.passwordMismatch', path: ['password_confirmation'] })

const form = useForm(schema, { code: '', password: '', password_confirmation: '' })

const submit = form.handleSubmit(async (data) => {
  let token = linkToken.value
  if (needsCode.value) {
    const res = await authApi.verifyOtp(identifier.value, data.code, 'password_reset')
    token = res.reset_token ?? ''
  }
  await authApi.resetPassword({ token, identifier: identifier.value, password: data.password, password_confirmation: data.password_confirmation })
  toast.success(t('auth.reset.success'))
  await router.replace('/login')
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.reset.title') }}</h1>
  <AppAlert v-if="!identifier" variant="danger" class="mt-6">
    {{ t('auth.reset.invalidLink') }}
    <RouterLink to="/forgot-password" class="font-semibold underline">{{ t('auth.login.forgot') }}</RouterLink>
  </AppAlert>
  <form v-else class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormErrorAlert :error="form.formError.value" />
    <AppInput
      v-if="needsCode"
      v-model="form.values.code"
      :label="t('auth.otp.code')"
      :error="form.errors.code"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      dir="ltr"
      required
    />
    <AppInput v-model="form.values.password" type="password" :label="t('auth.reset.password')" :hint="t('auth.register.passwordHint')" :error="form.errors.password" autocomplete="new-password" required />
    <AppInput v-model="form.values.password_confirmation" type="password" :label="t('auth.register.passwordConfirmation')" :error="form.errors.password_confirmation" autocomplete="new-password" required />
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.reset.submit') }}</AppButton>
  </form>
</template>
