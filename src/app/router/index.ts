import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createAuthGuard } from './guards'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // Query-only changes (filters, pagination state) keep the user where they are.
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(createAuthGuard(() => useAuthStore()))

// Accessibility: after client-side navigation move focus to the main region so screen
// reader and keyboard users start at the new page content rather than the old focus point.
router.afterEach((to, from) => {
  if (from.matched.length === 0 || to.path === from.path) return
  requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }))
})
