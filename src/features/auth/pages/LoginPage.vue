<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { identifierField } from '@/utils/validation'
import { safeRedirect } from '@/app/router/guards'
import AppInput from '@/components/ui/AppInput.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
usePageMeta(() => t('auth.login.seoTitle'))

const schema = z.object({
  identifier: identifierField(),
  password: z.string().min(1, { error: 'validation.required' }),
  remember: z.boolean(),
})
const form = useForm(schema, { identifier: '', password: '', remember: false })
const hasFieldErrors = computed(() => Object.values(form.errors).some(Boolean))
const redirect = computed(() => safeRedirect(route.query.redirect))

const submit = form.handleSubmit(async (data) => {
  const result = await auth.login(data)
  if (result.status === 'authenticated') {
    await router.replace(redirect.value ?? auth.homePath)
  } else if (result.status === 'mfa_enrollment_required') {
    await router.push({ path: '/mfa/setup', query: redirect.value ? { redirect: redirect.value } : {} })
  } else if (result.status === 'mfa_required') {
    await router.push({ path: '/mfa', query: redirect.value ? { redirect: redirect.value } : {} })
  } else {
    await router.push({ path: '/verify-phone', query: redirect.value ? { redirect: redirect.value } : {} })
  }
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.login.title') }}</h1>
  <p class="mt-1 text-fg-muted">{{ t('auth.login.subtitle') }}</p>

  <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormErrorAlert :error="form.formError.value" :has-field-errors="hasFieldErrors" />
    <AppInput
      v-model="form.values.identifier"
      :label="t('auth.login.identifier')"
      :hint="t('auth.login.identifierHint')"
      :error="form.errors.identifier"
      dir="ltr"
      autocomplete="username"
      required
    />
    <AppInput v-model="form.values.password" type="password" :label="t('auth.login.password')" :error="form.errors.password" autocomplete="current-password" required />
    <div class="flex flex-wrap items-center justify-between gap-2">
      <AppCheckbox v-model="form.values.remember" :label="t('auth.login.remember')" />
      <RouterLink to="/forgot-password" class="text-sm font-medium text-primary hover:underline">{{ t('auth.login.forgot') }}</RouterLink>
    </div>
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.login.submit') }}</AppButton>
  </form>

  <p class="mt-6 text-center text-sm text-fg-muted">
    {{ t('auth.login.noAccount') }}
    <RouterLink to="/register" class="font-semibold text-primary hover:underline">{{ t('auth.login.register') }}</RouterLink>
  </p>
</template>
