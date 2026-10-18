<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

/** Accessible modal dialog (focus trap, Escape to close, labelled by title). Built on Reka UI. */
withDefaults(defineProps<{ title: string; description?: string; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px]" />
      <DialogContent
        class="card fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85dvh] -translate-y-1/2 overflow-y-auto p-6 focus:outline-none"
        :class="widths[size]"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="heading-3">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-sm text-fg-muted">{{ description }}</DialogDescription>
          </div>
          <DialogClose class="-m-2 flex size-10 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted" :aria-label="t('common.close')">
            <X class="size-5" aria-hidden="true" />
          </DialogClose>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
