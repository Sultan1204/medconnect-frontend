<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { authApi } from '@/services/api/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { identifierField } from '@/utils/validation'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

const { t } = useI18n()
const router = useRouter()
usePageMeta(() => t('auth.forgot.seoTitle'))

const form = useForm(z.object({ identifier: identifierField() }), { identifier: '' })
const sent = ref(false)

// The backend responds identically whether or not the account exists (no account enumeration).
const submit = form.handleSubmit(async ({ identifier }) => {
  await authApi.forgotPassword(identifier)
  if (identifier.startsWith('+966')) {
    await router.push({ path: '/reset-password', query: { identifier } })
  } else {
    sent.value = true
  }
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.forgot.title') }}</h1>
  <p class="mt-1 text-fg-muted">{{ t('auth.forgot.subtitle') }}</p>
  <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AppAlert v-if="sent" variant="success" live>{{ t('auth.forgot.sent') }}</AppAlert>
    <FormErrorAlert :error="form.formError.value" />
    <AppInput v-model="form.values.identifier" :label="t('auth.login.identifier')" :error="form.errors.identifier" dir="ltr" autocomplete="username" required />
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.forgot.submit') }}</AppButton>
  </form>
  <p class="mt-6 text-center text-sm text-fg-muted">{{ t('auth.forgot.recovery') }}
    <RouterLink to="/contact" class="font-semibold text-primary hover:underline">{{ t('nav.contact') }}</RouterLink>
  </p>
  <p class="mt-2 text-center text-sm"><RouterLink to="/login" class="font-semibold text-primary hover:underline">{{ t('nav.login') }}</RouterLink></p>
</template>
