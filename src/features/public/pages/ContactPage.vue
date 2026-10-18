<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { catalogApi } from '@/services/api/catalog'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { emailField, requiredString } from '@/utils/validation'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import PageHeader from '../components/PageHeader.vue'

const { t } = useI18n()
usePageMeta(() => t('pages.contact.title'), () => t('pages.contact.subtitle'))

const schema = z.object({
  name: requiredString().max(120, { error: 'validation.maxLength:120' }),
  email: emailField(),
  subject: requiredString().max(150, { error: 'validation.maxLength:150' }),
  message: requiredString().max(3000, { error: 'validation.maxLength:3000' }),
})
const form = useForm(schema, { name: '', email: '', subject: '', message: '' })
const sent = ref(false)
const submit = form.handleSubmit(async (data) => {
  await catalogApi.sendContactMessage(data)
  sent.value = true
  form.reset()
})
</script>

<template>
  <PageHeader :title="t('pages.contact.title')" :subtitle="t('pages.contact.subtitle')" />
  <div class="container-page max-w-2xl py-12">
    <form class="card flex flex-col gap-4 p-6" novalidate @submit.prevent="submit">
      <AppAlert v-if="sent" variant="success" live>{{ t('pages.contact.success') }}</AppAlert>
      <AppAlert v-else-if="form.formError.value && form.formError.value.kind !== 'validation'" variant="danger" live>{{ t(form.formError.value.messageKey) }}</AppAlert>
      <AppAlert variant="info">{{ t('pages.contact.noMedical') }}</AppAlert>
      <AppInput v-model="form.values.name" :label="t('pages.contact.name')" :error="form.errors.name" required autocomplete="name" />
      <AppInput v-model="form.values.email" type="email" dir="ltr" :label="t('pages.contact.email')" :error="form.errors.email" required autocomplete="email" />
      <AppInput v-model="form.values.subject" :label="t('pages.contact.subject')" :error="form.errors.subject" required />
      <AppTextarea v-model="form.values.message" :label="t('pages.contact.message')" :error="form.errors.message" required :rows="6" />
      <AppButton type="submit" :loading="form.submitting.value" class="self-start">{{ t('common.submit') }}</AppButton>
    </form>
  </div>
</template>
