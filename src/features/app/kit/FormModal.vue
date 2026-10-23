<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { toApiError } from '@/services/api/errors'
import { useL } from './labels'

export interface Field {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'number' | 'datetime-local' | 'date' | 'time' | 'checkbox' | 'email' | 'tel' | 'password'
  options?: Array<{ value: string | number; label: string }>
  required?: boolean
  hint?: string
}

const props = defineProps<{
  title: string
  description?: string
  fields: Field[]
  initial?: Record<string, any>
  submitLabel?: string
  danger?: boolean
  submit: (values: Record<string, any>) => Promise<unknown>
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [result: unknown] }>()

const { l } = useL()
const values = reactive<Record<string, any>>({})
const errors = reactive<Record<string, string | undefined>>({})
const formError = ref<string | null>(null)
const busy = ref(false)

watch(open, (o) => {
  if (!o) return
  for (const k of Object.keys(values)) delete values[k]
  for (const f of props.fields) values[f.key] = props.initial?.[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'select' ? (f.options?.[0]?.value ?? '') : '')
  for (const k of Object.keys(errors)) delete errors[k]
  formError.value = null
})

async function onSubmit() {
  if (busy.value) return
  for (const k of Object.keys(errors)) delete errors[k]
  formError.value = null
  const out: Record<string, any> = {}
  for (const f of props.fields) {
    const v = values[f.key]
    if (f.required && (v === '' || v === null || v === undefined || v === false) && f.type !== 'checkbox') {
      errors[f.key] = l('Required', 'مطلوب')
    }
    out[f.key] = f.type === 'number' ? (v === '' ? null : Number(v)) : v === '' ? null : v
  }
  if (Object.keys(errors).length) return
  busy.value = true
  try {
    const result = await props.submit(out)
    open.value = false
    emit('done', result)
  } catch (e) {
    const err = toApiError(e)
    for (const [k, msgs] of Object.entries(err.fieldErrors)) errors[k] = msgs[0]
    formError.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppModal v-model:open="open" :title="title" :description="description">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <AppAlert v-if="formError" variant="danger" live>{{ formError }}</AppAlert>
      <template v-for="f in fields" :key="f.key">
        <AppSelect v-if="f.type === 'select'" v-model="values[f.key]" :label="f.label" :options="(f.options ?? []).map((o) => ({ value: o.value as any, label: o.label }))" :error="errors[f.key]" :required="f.required" :hint="f.hint" />
        <AppTextarea v-else-if="f.type === 'textarea'" v-model="values[f.key]" :label="f.label" :error="errors[f.key]" :required="f.required" :hint="f.hint" :rows="4" />
        <AppCheckbox v-else-if="f.type === 'checkbox'" v-model="values[f.key]" :label="f.label" :error="errors[f.key]" />
        <AppInput v-else v-model="values[f.key]" :type="f.type ?? 'text'" :label="f.label" :error="errors[f.key]" :required="f.required" :hint="f.hint" />
      </template>
      <slot name="extra" />
      <div class="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AppButton variant="ghost" type="button" @click="open = false">{{ l('Cancel', 'إلغاء') }}</AppButton>
        <AppButton :variant="danger ? 'danger' : 'primary'" type="submit" :loading="busy">{{ submitLabel ?? l('Save', 'حفظ') }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>
