<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { LogOut, Menu, X } from 'lucide-vue-next'
import { PORTALS } from '@/app/navigation'
import type { Role } from '@/types/domain'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import AppLogo from '@/components/layout/AppLogo.vue'
import StepUpDialog from '@/features/app/common/StepUpDialog.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()

const portal = computed(() => PORTALS[(route.meta.portal as Role | undefined) ?? 'patient'])
const items = computed(() => portal.value.items.map((i) => ({ ...i, to: `${portal.value.base}/${i.path}` })))
const bottomItems = computed(() => items.value.filter((i) => i.bottom))

const drawerOpen = ref(false)
const logoutOpen = ref(false)
const loggingOut = ref(false)

watch(() => route.fullPath, () => (drawerOpen.value = false))

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function confirmLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    toast.success(t('auth.logout.done'))
    await router.replace('/login')
  } finally {
    loggingOut.value = false
    logoutOpen.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
    <!-- Desktop sidebar -->
    <aside class="sticky top-0 hidden h-dvh flex-col border-e border-border bg-surface lg:flex">
      <div class="flex h-16 items-center px-5">
        <RouterLink to="/" class="rounded-lg"><AppLogo /></RouterLink>
      </div>
      <p class="px-5 pb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">{{ t(portal.titleKey) }}</p>
      <nav :aria-label="t('nav.portal')" class="flex-1 overflow-y-auto px-3 pb-4">
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in items" :key="item.to">
            <RouterLink
              :to="item.to"
              class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
              :class="{ 'bg-primary-soft text-primary-soft-fg! hover:bg-primary-soft': isActive(item.to) }"
              :aria-current="isActive(item.to) ? 'page' : undefined"
            >
              <component :is="item.icon" class="size-5 shrink-0" aria-hidden="true" />
              {{ t(item.labelKey) }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="border-t border-border p-3">
        <div class="flex items-center gap-3 rounded-xl px-2 py-2">
          <AppAvatar :name="auth.user?.name ?? ''" size="sm" />
          <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ auth.user?.name }}</p>
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-danger"
            :aria-label="t('nav.logout')"
            @click="logoutOpen = true"
          >
            <LogOut class="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-h-dvh min-w-0 flex-col">
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted lg:hidden"
            :aria-label="t('nav.openMenu')"
            :aria-expanded="drawerOpen"
            @click="drawerOpen = true"
          >
            <Menu class="size-6" aria-hidden="true" />
          </button>
          <p class="font-semibold">{{ t(portal.titleKey) }}</p>
        </div>
        <div class="flex items-center gap-1">
          <slot name="header-actions" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" tabindex="-1" class="flex-1 px-4 py-6 pb-28 focus:outline-none sm:px-6 lg:px-8 lg:pb-8">
        <slot />
        <StepUpDialog />
      </main>
    </div>

    <!-- Mobile bottom navigation for primary functions -->
    <nav :aria-label="t('nav.portal')" class="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul class="grid" :style="{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }">
        <li v-for="item in bottomItems" :key="item.to">
          <RouterLink
            :to="item.to"
            class="flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-fg-muted"
            :class="{ 'text-primary!': isActive(item.to) }"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <component :is="item.icon" class="size-6" aria-hidden="true" />
            {{ t(item.labelKey) }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Mobile drawer -->
    <DialogRoot v-model:open="drawerOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" />
        <DialogContent class="fixed inset-y-0 start-0 z-50 flex w-[85vw] max-w-xs flex-col bg-surface shadow-xl focus:outline-none lg:hidden">
          <div class="flex h-16 items-center justify-between px-4">
            <AppLogo />
            <button type="button" class="flex size-11 items-center justify-center rounded-xl hover:bg-surface-muted" :aria-label="t('nav.closeMenu')" @click="drawerOpen = false">
              <X class="size-6" aria-hidden="true" />
            </button>
          </div>
          <DialogTitle class="px-5 pb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">{{ t(portal.titleKey) }}</DialogTitle>
          <nav :aria-label="t('nav.portal')" class="flex-1 overflow-y-auto px-3">
            <ul class="flex flex-col gap-0.5">
              <li v-for="item in items" :key="item.to">
                <RouterLink
                  :to="item.to"
                  class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-surface-muted"
                  :class="{ 'bg-primary-soft text-primary-soft-fg': isActive(item.to) }"
                  :aria-current="isActive(item.to) ? 'page' : undefined"
                >
                  <component :is="item.icon" class="size-5" aria-hidden="true" />
                  {{ t(item.labelKey) }}
                </RouterLink>
              </li>
            </ul>
          </nav>
          <div class="border-t border-border p-3">
            <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger hover:bg-danger-soft" @click="logoutOpen = true">
              <LogOut class="size-5 rtl:-scale-x-100" aria-hidden="true" />
              {{ t('nav.logout') }}
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <AppConfirmDialog
      v-model:open="logoutOpen"
      :title="t('auth.logout.title')"
      :description="t('auth.logout.body')"
      :confirm-label="t('auth.logout.confirm')"
      :loading="loggingOut"
      @confirm="confirmLogout"
    />
  </div>
</template>
