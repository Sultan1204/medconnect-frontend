<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AccountFields from '../components/AccountFields.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'
import { doctorRegistrationSchema, emptyAccount } from '../schemas'

/**
 * Step 1 of doctor onboarding: account creation. Professional details, licence information and
 * documents are collected afterwards in the doctor portal's verification wizard (Phase 5),
 * where the application can be saved, reviewed and submitted.
 */
const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
usePageMeta(() => t('auth.doctorRegister.seoTitle'))

const form = useForm(doctorRegistrationSchema, emptyAccount())
const hasFieldErrors = computed(() => Object.values(form.errors).some(Boolean))

const submit = form.handleSubmit(async (data) => {
  const { phone } = await authApi.registerDoctor(data)
  auth.pendingPhone = phone
  await router.push({ path: '/verify-phone', query: { redirect: '/doctor/verification' } })
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.doctorRegister.title') }}</h1>
  <p class="mt-1 text-fg-muted">{{ t('auth.doctorRegister.subtitle') }}</p>

  <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <AppAlert variant="info">{{ t('auth.doctorRegister.note') }}</AppAlert>
    <FormErrorAlert :error="form.formError.value" :has-field-errors="hasFieldErrors" />
    <AccountFields v-model="form.values" :errors="form.errors" email-required />
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.register.submit') }}</AppButton>
  </form>

  <p class="mt-6 text-center text-sm text-fg-muted">
    {{ t('auth.register.haveAccount') }}
    <RouterLink to="/login" class="font-semibold text-primary hover:underline">{{ t('nav.login') }}</RouterLink>
  </p>
</template>
