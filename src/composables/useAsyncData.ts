import { onScopeDispose, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue'
import { ApiError, toApiError } from '@/services/api/errors'

interface Options {
  /** Re-run when any of these change; the in-flight request is aborted. */
  watch?: WatchSource[]
  immediate?: boolean
}

/**
 * Loads data with cancellation: each run aborts the previous request, and the
 * request is aborted when the owning component unmounts.
 */
export function useAsyncData<T>(loader: (signal: AbortSignal) => Promise<T>, options: Options = {}) {
  const data = shallowRef<T | null>(null) as Ref<T | null>
  const error = shallowRef<ApiError | null>(null)
  const loading = ref(false)
  let controller: AbortController | null = null

  async function run() {
    controller?.abort()
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = null
    try {
      const result = await loader(current.signal)
      if (controller === current) data.value = result
    } catch (e) {
      const err = toApiError(e)
      if (err.kind !== 'cancelled' && controller === current) error.value = err
    } finally {
      if (controller === current) loading.value = false
    }
  }

  if (options.watch?.length) watch(options.watch, run)
  if (options.immediate !== false) void run()
  onScopeDispose(() => controller?.abort())

  return { data, error, loading, reload: run }
}
