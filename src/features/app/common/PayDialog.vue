<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { api, idempotencyKey, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'

const props = defineProps<{ appointmentId: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [status: string] }>()

const { l } = useL()
const { run, busy } = useAction()
const payment = ref<Row | null>(null)
const result = ref<string | null>(null)
const starting = ref(false)
const key = idempotencyKey('checkout')

watch(open, async (o) => {
  if (!o) return
  payment.value = null
  result.value = null
  starting.value = true
  const body = await run(() => api.post('/payments/checkout', { appointment_id: props.appointmentId }, { 'Idempotency-Key': key }))
  starting.value = false
  if (body) payment.value = body.data.payment
  else open.value = false
})

async function settle(outcome: 'succeeded' | 'failed') {
  if (!payment.value) return
  const res = await run(() => api.post(`/dev/mock-payments/${payment.value!.id}`, { outcome }))
  if (res) {
    result.value = res.data.payment_status
    emit('done', res.data.payment_status)
    if (outcome === 'succeeded') open.value = false
  }
}
</script>

<template>
  <AppModal v-model:open="open" :title="l('Payment', 'الدفع')" :description="l('Demo checkout - no real money is charged.', 'دفع تجريبي - لن يتم خصم أي مبلغ حقيقي.')">
    <div v-if="starting" class="flex justify-center py-6"><AppSpinner /></div>
    <div v-else-if="payment" class="flex flex-col gap-4">
      <p class="text-2xl font-semibold">{{ sar(payment.amount, payment.currency) }}</p>
      <AppAlert variant="info">{{ l('This is a simulated payment provider for testing. Choose the outcome of the payment.', 'هذا مزود دفع تجريبي للاختبار. اختر نتيجة عملية الدفع.') }}</AppAlert>
      <AppAlert v-if="result === 'failed'" variant="danger">{{ l('The payment failed. You can try again from the appointment page.', 'فشلت عملية الدفع. يمكنك المحاولة مرة أخرى من صفحة الموعد.') }}</AppAlert>
      <div class="flex flex-wrap gap-2">
        <AppButton :loading="busy" @click="settle('succeeded')">{{ l('Pay successfully', 'دفع ناجح') }}</AppButton>
        <AppButton variant="outline" :loading="busy" @click="settle('failed')">{{ l('Simulate failure', 'محاكاة فشل') }}</AppButton>
      </div>
    </div>
  </AppModal>
</template>
