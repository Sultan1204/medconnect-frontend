<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const store = useToastStore()
const { t } = useI18n()
const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle }
const colors = { success: 'text-success', error: 'text-danger', info: 'text-secondary', warning: 'text-warning' }
</script>

<template>
  <!-- Two live regions so errors interrupt (assertive) while other toasts wait politely. -->
  <div class="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-center gap-2 sm:bottom-6 sm:end-6 sm:start-auto sm:items-end">
    <div class="flex w-full flex-col items-center gap-2 sm:items-end" role="status" aria-live="polite">
      <template v-for="toast in store.toasts" :key="toast.id">
        <div v-if="toast.variant !== 'error'" class="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4">
          <component :is="icons[toast.variant]" class="mt-0.5 size-5 shrink-0" :class="colors[toast.variant]" aria-hidden="true" />
          <p class="flex-1 text-sm">{{ toast.message }}</p>
          <button type="button" class="-m-1 rounded p-1 text-fg-muted hover:text-fg" :aria-label="t('common.dismiss')" @click="store.dismiss(toast.id)">
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </div>
    <div class="flex w-full flex-col items-center gap-2 sm:items-end" role="alert" aria-live="assertive">
      <template v-for="toast in store.toasts" :key="toast.id">
        <div v-if="toast.variant === 'error'" class="card pointer-events-auto flex w-full max-w-sm items-start gap-3 border-danger/40 p-4">
          <component :is="icons.error" class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <p class="flex-1 text-sm">{{ toast.message }}</p>
          <button type="button" class="-m-1 rounded p-1 text-fg-muted hover:text-fg" :aria-label="t('common.dismiss')" @click="store.dismiss(toast.id)">
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
