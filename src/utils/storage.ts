/**
 * Tiny wrapper around localStorage for NON-SENSITIVE UI preferences only
 * (locale, theme). Never store tokens, personal or medical data here.
 * Access can throw in private mode or when storage is blocked, so every call is guarded.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
}
