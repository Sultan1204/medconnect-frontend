<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import AppButton from '@/components/ui/AppButton.vue'
import AccountFields from '../components/AccountFields.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'
import { emptyAccount, patientRegistrationSchema } from '../schemas'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
usePageMeta(() => t('auth.register.seoTitle'))

const form = useForm(patientRegistrationSchema, emptyAccount())
const hasFieldErrors = computed(() => Object.values(form.errors).some(Boolean))

const submit = form.handleSubmit(async (data) => {
  const { phone } = await authApi.registerPatient({ ...data, email: data.email || undefined })
  auth.pendingPhone = phone
  await router.push('/verify-phone')
})
</script>

<template>
  <h1 class="heading-2">{{ t('auth.register.title') }}</h1>
  <p class="mt-1 text-fg-muted">{{ t('auth.register.subtitle') }}</p>

  <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
    <FormErrorAlert :error="form.formError.value" :has-field-errors="hasFieldErrors" />
    <AccountFields v-model="form.values" :errors="form.errors" />
    <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.register.submit') }}</AppButton>
  </form>

  <p class="mt-6 text-center text-sm text-fg-muted">
    {{ t('auth.register.haveAccount') }}
    <RouterLink to="/login" class="font-semibold text-primary hover:underline">{{ t('nav.login') }}</RouterLink>
  </p>
  <p class="mt-2 text-center text-sm text-fg-muted">
    {{ t('auth.register.areYouDoctor') }}
    <RouterLink to="/register/doctor" class="font-semibold text-primary hover:underline">{{ t('auth.register.doctorLink') }}</RouterLink>
  </p>
</template>
