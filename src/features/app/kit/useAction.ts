import { ref } from 'vue'
import { toApiError } from '@/services/api/errors'
import { useToastStore } from '@/stores/toast'

/** Runs a mutation with a busy flag and success/error toasts. Resolves to the result or null on failure. */
export function useAction() {
  const busy = ref(false)
  const toast = useToastStore()

  async function run<T>(fn: () => Promise<T>, success?: string): Promise<T | null> {
    if (busy.value) return null
    busy.value = true
    try {
      const result = await fn()
      if (success) toast.success(success)
      return result
    } catch (e) {
      toast.error(toApiError(e).message)
      return null
    } finally {
      busy.value = false
    }
  }

  return { busy, run }
}
