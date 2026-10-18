import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  variant: ToastVariant
  /** Already-translated text. Never put medical details in toasts. */
  message: string
  timeout: number
}

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(variant: ToastVariant, message: string, timeout = 5000) {
    const id = nextId++
    toasts.value.push({ id, variant, message, timeout })
    if (timeout > 0) setTimeout(() => dismiss(id), timeout)
    return id
  }

  return {
    toasts,
    dismiss,
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m, 8000),
    info: (m: string) => push('info', m),
    warning: (m: string) => push('warning', m, 8000),
  }
})
