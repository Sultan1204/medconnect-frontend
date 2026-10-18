<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import PublicLayout from '@/app/layouts/PublicLayout.vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import PortalLayout from '@/app/layouts/PortalLayout.vue'
import AppToaster from '@/components/ui/AppToaster.vue'
import DemoBanner from '@/components/layout/DemoBanner.vue'
import { setUnauthenticatedHandler } from '@/services/api/http'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { usePreferencesStore } from '@/stores/preferences'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()
const prefs = usePreferencesStore()

const layouts = { public: PublicLayout, auth: AuthLayout, portal: PortalLayout }
const layout = computed(() => {
  const key = route.meta.layout
  return key && key !== 'blank' ? layouts[key] : null
})

useHead({
  titleTemplate: (title?: string) => (title ? `${title} | ${t('app.name')}` : `${t('app.name')} | MedConnect Saudi`),
  htmlAttrs: { lang: () => prefs.locale, dir: () => (prefs.rtl ? 'rtl' : 'ltr') },
  title: () => (route.meta.titleKey ? t(route.meta.titleKey) : undefined),
})

// Session expired mid-use: clear client state and send the user to log in, preserving where they were.
setUnauthenticatedHandler(() => {
  if (!auth.isAuthenticated) return
  auth.clearSession()
  toast.warning(t('errors.sessionExpired'))
  if (route.meta.requiresAuth) void router.replace({ path: '/login', query: { redirect: route.fullPath } })
})
</script>

<template>
  <a href="#main-content" class="sr-only-focusable fixed start-4 top-4 z-[70] rounded-lg bg-primary px-4 py-2 font-semibold text-primary-fg">
    {{ t('app.skipToContent') }}
  </a>
  <DemoBanner />
  <component :is="layout" v-if="layout">
    <RouterView />
  </component>
  <RouterView v-else />
  <AppToaster />
</template>
