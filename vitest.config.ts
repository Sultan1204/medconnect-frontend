import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.spec.ts'],
      setupFiles: ['tests/unit/setup.ts'],
      env: { VITE_API_MODE: 'http', VITE_API_BASE_URL: '' },
    },
  }),
)
