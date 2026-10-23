<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { api, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'

const props = defineProps<{ consultationId: string; canSend: boolean }>()
const { l, fmt } = useL()
const { run, busy } = useAction()
const messages = ref<Row[]>([])
const text = ref('')
const box = ref<HTMLElement>()
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  try {
    const body = await api.get(`/consultations/${props.consultationId}/messages`, { per_page: 100 })
    const fresh: Row[] = body.data
    const grew = fresh.length !== messages.value.length
    messages.value = fresh
    const last = fresh[fresh.length - 1]
    if (last && !last.is_mine && !last.read_at) void api.post(`/consultations/${props.consultationId}/messages/ack`, { status: 'read', up_to: last.id }).catch(() => undefined)
    if (grew) { await nextTick(); if (box.value) box.value.scrollTop = box.value.scrollHeight }
  } catch { /* transient; next poll retries */ }
}

async function send() {
  const body = text.value.trim()
  if (!body) return
  const sent = await run(() => api.post(`/consultations/${props.consultationId}/messages`, { body, client_message_id: crypto.randomUUID() }))
  if (sent) { text.value = ''; await load() }
}

onMounted(() => { void load(); timer = setInterval(load, 4000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <AppCard :padded="false" class="flex h-[28rem] flex-col">
    <div ref="box" class="flex flex-1 flex-col gap-2 overflow-y-auto p-4" role="log" :aria-label="l('Messages', 'الرسائل')" aria-live="polite">
      <p v-if="!messages.length" class="m-auto text-sm text-fg-muted">{{ l('No messages yet.', 'لا توجد رسائل بعد.') }}</p>
      <div v-for="m in messages" :key="m.id" class="max-w-[85%] rounded-2xl px-3 py-2 text-sm" :class="m.is_mine ? 'self-end bg-primary text-primary-fg' : 'self-start bg-surface-muted'">
        <p class="whitespace-pre-wrap break-words">{{ m.body }}</p>
        <p class="mt-1 text-[11px] opacity-70">{{ fmt.time(m.created_at) }}<template v-if="m.is_mine"> · {{ m.read_at ? l('read', 'مقروءة') : m.delivered_at ? l('delivered', 'وصلت') : l('sent', 'أُرسلت') }}</template></p>
      </div>
    </div>
    <form class="flex gap-2 border-t border-border p-3" @submit.prevent="send">
      <label class="sr-only" for="chat-input">{{ l('Message', 'رسالة') }}</label>
      <input id="chat-input" v-model="text" class="min-h-11 flex-1 rounded-xl border border-border-strong/60 bg-surface px-3 focus:border-primary focus:outline-none" :disabled="!canSend" :placeholder="canSend ? l('Type a message', 'اكتب رسالة') : l('Chat opens when the consultation starts', 'تفتح المحادثة عند بدء الاستشارة')" />
      <AppButton type="submit" :loading="busy" :disabled="!canSend || !text.trim()">{{ l('Send', 'إرسال') }}</AppButton>
    </form>
  </AppCard>
</template>
