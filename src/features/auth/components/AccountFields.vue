<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/ui/AppInput.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

/** Shared account-creation fields for patient and doctor registration. */
defineProps<{ errors: Record<string, string | undefined>; emailRequired?: boolean }>()
const values = defineModel<{
  name: string
  phone: string
  email: string
  password: string
  password_confirmation: string
  accept_terms: boolean
  accept_privacy: boolean
}>({ required: true })
const { t } = useI18n()
</script>

<template>
  <AppInput v-model="values.name" :label="t('auth.register.name')" :error="errors.name" autocomplete="name" required />
  <AppInput
    v-model="values.phone"
    type="tel"
    inputmode="tel"
    dir="ltr"
    placeholder="05XXXXXXXX"
    :label="t('auth.register.phone')"
    :hint="t('auth.register.phoneHint')"
    :error="errors.phone"
    autocomplete="tel"
    required
  />
  <AppInput
    v-model="values.email"
    type="email"
    dir="ltr"
    :label="emailRequired ? t('auth.register.email') : `${t('auth.register.email')} (${t('common.optional')})`"
    :error="errors.email"
    autocomplete="email"
    :required="emailRequired"
  />
  <AppInput v-model="values.password" type="password" :label="t('auth.register.password')" :hint="t('auth.register.passwordHint')" :error="errors.password" autocomplete="new-password" required />
  <AppInput v-model="values.password_confirmation" type="password" :label="t('auth.register.passwordConfirmation')" :error="errors.password_confirmation" autocomplete="new-password" required />
  <AppCheckbox v-model="values.accept_terms" :label="t('auth.register.acceptTerms')" :error="errors.accept_terms" required>
    <RouterLink to="/terms" target="_blank" class="text-primary underline">{{ t('auth.register.acceptTerms') }}</RouterLink>
  </AppCheckbox>
  <AppCheckbox v-model="values.accept_privacy" :label="t('auth.register.acceptPrivacy')" :error="errors.accept_privacy" required>
    <RouterLink to="/privacy" target="_blank" class="text-primary underline">{{ t('auth.register.acceptPrivacy') }}</RouterLink>
  </AppCheckbox>
</template>
