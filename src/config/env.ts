import { z } from 'zod'

const schema = z.object({
  VITE_API_MODE: z.enum(['http', 'mock']).default('http'),
  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_PREFIX: z.string().default('/api/v1'),
  VITE_APP_URL: z.string().default(''),
  VITE_REVERB_APP_KEY: z.string().default(''),
  VITE_REVERB_HOST: z.string().default('localhost'),
  VITE_REVERB_PORT: z.coerce.number().int().positive().default(8080),
  VITE_REVERB_SCHEME: z.enum(['http', 'https']).default('http'),
  VITE_BROADCAST_AUTH_ENDPOINT: z.string().default('/broadcasting/auth'),
})

// Empty strings in .env files should fall back to defaults rather than override them.
const raw = Object.fromEntries(
  Object.entries(import.meta.env).filter(([, v]) => v !== '' && v !== undefined),
)
const parsed = schema.parse(raw)

export const env = {
  apiMode: parsed.VITE_API_MODE,
  isMock: parsed.VITE_API_MODE === 'mock',
  apiBaseUrl: parsed.VITE_API_BASE_URL.replace(/\/$/, ''),
  apiPrefix: parsed.VITE_API_PREFIX,
  appUrl: parsed.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  reverb: {
    key: parsed.VITE_REVERB_APP_KEY,
    host: parsed.VITE_REVERB_HOST,
    port: parsed.VITE_REVERB_PORT,
    scheme: parsed.VITE_REVERB_SCHEME,
    authEndpoint: parsed.VITE_BROADCAST_AUTH_ENDPOINT,
  },
} as const
