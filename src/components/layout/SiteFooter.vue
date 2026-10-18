<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhoneCall } from 'lucide-vue-next'
import AppLogo from './AppLogo.vue'

const { t } = useI18n()
const year = new Date().getFullYear()

const groups = [
  {
    title: 'footer.platform',
    links: [
      { to: '/doctors', key: 'nav.doctors' },
      { to: '/specialties', key: 'nav.specialties' },
      { to: '/how-it-works', key: 'nav.howItWorks' },
      { to: '/about', key: 'nav.about' },
    ],
  },
  {
    title: 'footer.support',
    links: [
      { to: '/faq', key: 'nav.faq' },
      { to: '/contact', key: 'nav.contact' },
      { to: '/patient-safety', key: 'nav.patientSafety' },
    ],
  },
  {
    title: 'footer.legal',
    links: [
      { to: '/privacy', key: 'nav.privacy' },
      { to: '/terms', key: 'nav.terms' },
    ],
  },
]
</script>

<template>
  <footer class="mt-auto border-t border-border bg-surface">
    <div class="container-page grid gap-10 py-12 md:grid-cols-4">
      <div class="flex flex-col gap-3">
        <AppLogo />
        <p class="text-sm text-fg-muted">{{ t('footer.about') }}</p>
      </div>
      <nav v-for="group in groups" :key="group.title" :aria-label="t(group.title)">
        <h2 class="mb-3 text-sm font-semibold">{{ t(group.title) }}</h2>
        <ul class="flex flex-col gap-2">
          <li v-for="link in group.links" :key="link.to">
            <RouterLink :to="link.to" class="text-sm text-fg-muted hover:text-primary hover:underline">{{ t(link.key) }}</RouterLink>
          </li>
        </ul>
      </nav>
    </div>
    <div class="border-t border-border">
      <div class="container-page flex flex-col gap-2 py-5 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{{ t('footer.rights', { year }) }}</p>
        <p class="flex items-center gap-1.5 font-semibold text-danger">
          <PhoneCall class="size-4" aria-hidden="true" />
          {{ t('footer.emergency') }}
        </p>
      </div>
    </div>
  </footer>
</template>
