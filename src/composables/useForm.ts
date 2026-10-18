import { reactive, ref, shallowRef } from 'vue'
import type { z, ZodType } from 'zod'
import { ApiError, toApiError } from '@/services/api/errors'

/**
 * Minimal form state with Zod validation and Laravel 422 error mapping.
 * `values` holds the schema *input* (what the user types); submit handlers receive the
 * parsed *output* (e.g. phone normalised to E.164).
 * Client-side messages are i18n keys (translated by FormField); server messages arrive
 * already localised via Accept-Language and are shown as-is.
 */
export function useForm<S extends ZodType<unknown, Record<string, unknown>>>(schema: S, initial: z.input<S>) {
  const values = reactive({ ...initial }) as z.input<S>
  const errors = reactive<Record<string, string | undefined>>({})
  const submitting = ref(false)
  const formError = shallowRef<ApiError | null>(null)

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key]
    formError.value = null
  }

  function validate(): z.output<S> | null {
    clearErrors()
    const result = schema.safeParse(values)
    if (result.success) return result.data as z.output<S>
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      if (key && !errors[key]) errors[key] = issue.message
    }
    return null
  }

  function applyServerErrors(err: ApiError) {
    for (const [field, messages] of Object.entries(err.fieldErrors)) {
      errors[field] = messages[0]
    }
  }

  /** Wraps a submit handler: validates, toggles `submitting`, maps API errors. Resolves true on success. */
  function handleSubmit(fn: (data: z.output<S>) => Promise<void>) {
    return async (): Promise<boolean> => {
      if (submitting.value) return false
      const data = validate()
      if (!data) return false
      submitting.value = true
      try {
        await fn(data)
        return true
      } catch (e) {
        const err = toApiError(e)
        if (err.kind === 'validation') applyServerErrors(err)
        formError.value = err
        return false
      } finally {
        submitting.value = false
      }
    }
  }

  function reset() {
    Object.assign(values, initial)
    clearErrors()
  }

  return { values, errors, submitting, formError, validate, handleSubmit, reset, clearErrors }
}
