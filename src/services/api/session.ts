/**
 * Bearer-token session for the real API.
 *
 * The access token lives in sessionStorage (cleared when the tab closes) and in memory.
 * It is never put in localStorage or a cookie. A short-lived "partial" token issued after
 * the password step (MFA challenge / MFA enrolment) is kept in memory only.
 */
const KEY = 'mc.session'

interface Stored {
  token: string
  expiresAt: string
}

let memory: Stored | null | undefined
let partial: string | null = null

function read(): Stored | null {
  if (memory !== undefined) return memory
  try {
    const raw = sessionStorage.getItem(KEY)
    memory = raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    memory = null
  }
  return memory
}

export const session = {
  /** The full access token, or null when absent or expired. */
  get token(): string | null {
    const s = read()
    if (!s) return null
    if (Date.parse(s.expiresAt) <= Date.now()) {
      session.clear()
      return null
    }
    return s.token
  },

  set(token: string, expiresAt: string) {
    memory = { token, expiresAt }
    partial = null
    try {
      sessionStorage.setItem(KEY, JSON.stringify(memory))
    } catch {
      /* private mode: the in-memory copy still works for this page load */
    }
  },

  clear() {
    memory = null
    partial = null
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },

  /** Token for the MFA challenge / enrolment step (memory only). */
  get partialToken(): string | null {
    return partial
  },

  setPartial(token: string | null) {
    partial = token
  },
}
