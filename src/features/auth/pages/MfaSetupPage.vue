<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import { authApi } from '@/services/api/auth'
import { toApiError } from '@/services/api/errors'
import type { MfaSetupInfo } from '@/services/api/auth.types'
import type { User } from '@/types/domain'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'
import { usePageMeta } from '@/composables/usePageMeta'
import { otpField } from '@/utils/validation'
import { safeRedirect } from '@/app/router/guards'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import FormErrorAlert from '../components/FormErrorAlert.vue'

/**
 * Doctors, pharmacists and administrators must link an authenticator app before they get a session.
 * Step 1: add the key to the app. Step 2: confirm with a code. Step 3: keep the recovery codes.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
usePageMeta(() => t('auth.mfaSetup.seoTitle'))

const setup = ref<MfaSetupInfo | null>(null)
const loadError = ref('')
const recoveryCodes = ref<string[] | null>(null)
const signedInUser = ref<User | null>(null)

onMounted(async () => {
  if (!auth.mfaEnrollmentPending) {
    void router.replace('/login')
    return
  }
  try {
    setup.value = await authApi.mfaSetup()
  } catch (e) {
    loadError.value = t(toApiError(e).messageKey)
  }
})

/** Groups the key in fours so it is easy to type by hand. */
const grouped = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim()

const form = useForm(z.object({ code: otpField() }), { code: '' })
const submit = form.handleSubmit(async ({ code }) => {
  const result = await authApi.mfaConfirm(code)
  recoveryCodes.value = result.recoveryCodes
  signedInUser.value = result.user ?? null
})

async function finish() {
  auth.mfaEnrollmentPending = false
  if (signedInUser.value) {
    auth.setUser(signedInUser.value)
    await router.replace(safeRedirect(route.query.redirect) ?? auth.homePath)
  } else {
    await router.replace('/login')
  }
}
</script>

<template>
  <h1 class="heading-2">{{ t('auth.mfaSetup.title') }}</h1>

  <template v-if="recoveryCodes">
    <p class="mt-1 text-fg-muted">{{ t('auth.mfaSetup.recoveryIntro') }}</p>
    <ul class="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-4 font-mono text-sm" dir="ltr" data-testid="recovery-codes">
      <li v-for="c in recoveryCodes" :key="c">{{ c }}</li>
    </ul>
    <AppButton class="mt-6" size="lg" block @click="finish">{{ t('auth.mfaSetup.continue') }}</AppButton>
  </template>

  <template v-else>
    <p class="mt-1 text-fg-muted">{{ t('auth.mfaSetup.intro') }}</p>
    <AppAlert v-if="loadError" variant="danger" class="mt-6">{{ loadError }}</AppAlert>
    <template v-else-if="setup">
      <div class="mt-6 rounded-lg bg-surface-muted p-4">
        <p class="text-sm text-fg-muted">{{ t('auth.mfaSetup.keyLabel') }}</p>
        <p class="mt-1 select-all break-all font-mono text-lg font-semibold tracking-wider" dir="ltr" data-testid="mfa-secret">{{ grouped(setup.secret) }}</p>
        <a :href="setup.otpauthUrl" class="mt-2 inline-block text-sm font-semibold text-primary underline">{{ t('auth.mfaSetup.openApp') }}</a>
      </div>
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
        <AppButton type="submit" size="lg" block :loading="form.submitting.value">{{ t('auth.mfaSetup.confirm') }}</AppButton>
      </form>
    </template>
  </template>
</template>
