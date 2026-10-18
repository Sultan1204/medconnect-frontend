<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import FormField from '../forms/FormField.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    hint?: string
    error?: string
    required?: boolean
    hideLabel?: boolean
    /** Force direction for inherently LTR content (phone, email, codes). */
    dir?: 'ltr' | 'rtl' | 'auto'
  }>(),
  { type: 'text' },
)

const model = defineModel<string | number | null>({ default: '' })
const { t } = useI18n()
const id = useId()
const reveal = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && reveal.value ? 'text' : props.type))
</script>

<template>
  <FormField :id="id" :label="label" :hint="hint" :error="error" :required="required" :hide-label="hideLabel">
    <template #default="{ describedBy, invalid }">
      <div class="relative">
        <input
          :id="id"
          v-model="model"
          v-bind="$attrs"
          :type="inputType"
          :dir="dir"
          :required="required"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          class="block min-h-11 w-full rounded-xl border bg-surface px-3.5 text-base text-fg placeholder:text-fg-muted/70 transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 disabled:opacity-60 sm:text-sm"
          :class="[invalid ? 'border-danger' : 'border-border-strong/60', isPassword && 'pe-12', dir === 'ltr' && 'text-start']"
        />
        <button
          v-if="isPassword"
          type="button"
          class="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-fg-muted hover:text-fg"
          :aria-label="reveal ? t('common.hidePassword') : t('common.showPassword')"
          :aria-pressed="reveal"
          @click="reveal = !reveal"
        >
          <EyeOff v-if="reveal" class="size-5" aria-hidden="true" />
          <Eye v-else class="size-5" aria-hidden="true" />
        </button>
      </div>
    </template>
  </FormField>
</template>
