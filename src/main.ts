import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-sans-arabic/700.css'
import '@fontsource-variable/inter'
import './assets/main.css'
import App from './App.vue'
import { router } from './app/router'
import { applyLocale, i18n, type AppLocale } from './app/providers/i18n'
import { http } from './services/api/http'

async function bootstrap() {
  // Mock transport is only bundled into builds where VITE_API_MODE=mock (statically eliminated otherwise).
  if (import.meta.env.VITE_API_MODE === 'mock') {
    const { installMockApi } = await import('./mocks')
    installMockApi(http)
  }

  applyLocale(i18n.global.locale.value as AppLocale)

  const app = createApp(App)
  app.use(createPinia())
  app.use(createHead())
  app.use(i18n)
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
