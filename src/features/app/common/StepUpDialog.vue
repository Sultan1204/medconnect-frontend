<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { stepUpPrompt } from '../kit/api'
import { useL } from '../kit/labels'

const { l } = useL()
const code = ref('')
const open = computed({ get: () => !!stepUpPrompt.value, set: (v) => { if (!v) stepUpPrompt.value?.resolve(null) } })
watch(stepUpPrompt, () => { code.value = '' })
function confirm() { if (/^\d{6}$/.test(code.value)) stepUpPrompt.value?.resolve(code.value) }
</script>

<template>
  <AppModal v-model:open="open" size="sm" :title="l('Confirm with your authenticator', 'أكّد برمز المصادقة')" :description="l('This sensitive action needs a fresh 6-digit code.', 'هذا الإجراء الحساس يتطلب رمزاً جديداً من 6 أرقام.')">
    <form class="flex flex-col gap-4" @submit.prevent="confirm">
      <AppInput v-model="code" :label="l('Authenticator code', 'رمز المصادقة')" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
      <div class="flex justify-end gap-2">
        <AppButton variant="ghost" type="button" @click="open = false">{{ l('Cancel', 'إلغاء') }}</AppButton>
        <AppButton type="submit" :disabled="!/^\d{6}$/.test(code)">{{ l('Confirm', 'تأكيد') }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>
