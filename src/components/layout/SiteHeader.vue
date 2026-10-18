<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LayoutDashboard, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppLogo from './AppLogo.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'
import AppButton from '../ui/AppButton.vue'

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const menuOpen = ref(false)

const links = [
  { to: '/doctors', key: 'nav.doctors' },
  { to: '/specialties', key: 'nav.specialties' },
  { to: '/how-it-works', key: 'nav.howItWorks' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/contact', key: 'nav.contact' },
]

watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <RouterLink to="/" class="rounded-lg"><AppLogo /></RouterLink>

      <nav :aria-label="t('nav.main')" class="hidden lg:block">
        <ul class="flex items-center gap-1">
          <li v-for="link in links" :key="link.to">
            <RouterLink
              :to="link.to"
              class="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
              active-class="text-primary! bg-primary-soft/60"
            >
              {{ t(link.key) }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-1">
        <!-- Responsive visibility lives on wrappers: the components' own display classes would override `hidden`. -->
        <div class="hidden sm:block"><LanguageSwitcher /></div>
        <ThemeToggle />
        <div class="hidden items-center gap-1 sm:flex">
          <AppButton v-if="auth.isAuthenticated" :to="auth.homePath" size="sm">
            <LayoutDashboard class="size-4" aria-hidden="true" />
            {{ t('nav.dashboard') }}
          </AppButton>
          <template v-else>
            <AppButton to="/login" variant="ghost" size="sm">{{ t('nav.login') }}</AppButton>
            <AppButton to="/register" size="sm">{{ t('nav.register') }}</AppButton>
          </template>
        </div>
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" class="size-6" aria-hidden="true" />
          <Menu v-else class="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-show="menuOpen" id="mobile-menu" class="border-t border-border bg-surface lg:hidden">
      <nav :aria-label="t('nav.main')" class="container-page py-3">
        <ul class="flex flex-col">
          <li v-for="link in links" :key="link.to">
            <RouterLink :to="link.to" class="block rounded-lg px-3 py-3 font-medium hover:bg-surface-muted" active-class="text-primary">
              {{ t(link.key) }}
            </RouterLink>
          </li>
        </ul>
        <div class="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:hidden">
          <LanguageSwitcher class="justify-center" />
          <AppButton v-if="auth.isAuthenticated" :to="auth.homePath" block>{{ t('nav.dashboard') }}</AppButton>
          <template v-else>
            <AppButton to="/login" variant="outline" block>{{ t('nav.login') }}</AppButton>
            <AppButton to="/register" block>{{ t('nav.register') }}</AppButton>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>
