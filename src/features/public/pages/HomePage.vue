<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Globe2, HeartHandshake, MessageSquare, PhoneCall, Receipt, Search, ShieldCheck, Video, BadgeCheck } from 'lucide-vue-next'
import { catalogApi } from '@/services/api/catalog'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageMeta } from '@/composables/usePageMeta'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import DoctorCard from '@/components/doctors/DoctorCard.vue'
import DoctorCardSkeleton from '@/components/doctors/DoctorCardSkeleton.vue'
import SpecialtyIcon from '@/components/doctors/SpecialtyIcon.vue'
import FaqList from '../components/FaqList.vue'

const { t, locale } = useI18n()
const router = useRouter()
usePageMeta(() => t('home.seoTitle'), () => t('home.seoDescription'))

const query = ref('')
function search() {
  void router.push({ path: '/doctors', query: query.value.trim() ? { search: query.value.trim() } : {} })
}

const specialties = useAsyncData((signal) => catalogApi.specialties({ signal }), { watch: [locale] })
const featured = useAsyncData((signal) => catalogApi.featuredDoctors({ signal }), { watch: [locale] })

const steps = ['s1', 's2', 's3', 's4'] as const
const benefits = [
  { key: 'b1', icon: ShieldCheck },
  { key: 'b2', icon: BadgeCheck },
  { key: 'b3', icon: Globe2 },
  { key: 'b4', icon: Receipt },
] as const
</script>

<template>
  <!-- Hero -->
  <section class="relative overflow-hidden bg-gradient-to-b from-primary-soft/60 via-bg to-bg" aria-labelledby="hero-title">
    <div class="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-24">
      <div class="flex flex-col gap-6">
        <h1 id="hero-title" class="heading-1 text-balance">{{ t('home.hero.title') }}</h1>
        <p class="max-w-xl text-lg text-fg-muted">{{ t('home.hero.subtitle') }}</p>

        <form role="search" class="card flex flex-col gap-2 p-2 sm:flex-row" @submit.prevent="search">
          <label for="hero-search" class="sr-only">{{ t('home.hero.searchLabel') }}</label>
          <div class="relative flex-1">
            <Search class="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-fg-muted" aria-hidden="true" />
            <input
              id="hero-search"
              v-model="query"
              type="search"
              :placeholder="t('home.hero.searchPlaceholder')"
              class="min-h-12 w-full rounded-xl bg-transparent ps-11 pe-3 text-base focus:outline-none"
            />
          </div>
          <AppButton type="submit" size="lg" variant="secondary">{{ t('common.search') }}</AppButton>
        </form>

        <div class="flex flex-wrap gap-3">
          <AppButton to="/doctors" size="lg">
            {{ t('home.hero.searchDoctor') }}
            <ArrowLeft class="size-5 ltr:rotate-180" aria-hidden="true" />
          </AppButton>
          <AppButton to="/how-it-works" variant="outline" size="lg">{{ t('home.hero.howItWorks') }}</AppButton>
        </div>
      </div>

      <div class="relative hidden lg:block" aria-hidden="true">
        <div class="card mx-auto flex max-w-md flex-col gap-4 p-6">
          <div class="flex items-center gap-3">
            <div class="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary"><Video class="size-6" /></div>
            <div class="flex-1">
              <div class="h-3 w-32 rounded bg-surface-muted" />
              <div class="mt-2 h-2.5 w-20 rounded bg-surface-muted" />
            </div>
          </div>
          <div class="aspect-video rounded-xl bg-gradient-to-br from-primary/80 to-secondary/80" />
          <div class="flex gap-2">
            <div class="h-9 flex-1 rounded-lg bg-surface-muted" />
            <div class="h-9 w-24 rounded-lg bg-primary" />
          </div>
        </div>
        <div class="card absolute -bottom-6 start-0 flex items-center gap-3 p-4">
          <MessageSquare class="size-6 text-secondary" />
          <div class="h-2.5 w-28 rounded bg-surface-muted" />
        </div>
      </div>
    </div>
  </section>

  <!-- Specialties -->
  <section class="container-page py-14" aria-labelledby="specialties-title">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id="specialties-title" class="heading-2">{{ t('home.specialties.title') }}</h2>
        <p class="mt-2 text-fg-muted">{{ t('home.specialties.subtitle') }}</p>
      </div>
      <AppButton to="/specialties" variant="link">{{ t('common.viewAll') }}</AppButton>
    </div>
    <AppErrorState v-if="specialties.error.value" :error="specialties.error.value" @retry="specialties.reload" />
    <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <template v-if="specialties.loading.value && !specialties.data.value">
        <li v-for="n in 8" :key="n"><AppSkeleton class="h-24" /></li>
      </template>
      <li v-for="s in specialties.data.value ?? []" v-else :key="s.id">
        <RouterLink :to="`/specialties/${s.slug}`" class="card flex h-full items-center gap-3 p-4 transition hover:border-primary hover:shadow-md">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><SpecialtyIcon :icon="s.icon" class="size-6" /></span>
          <span class="font-semibold">{{ s.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>

  <!-- How it works -->
  <section class="bg-surface py-14" aria-labelledby="steps-title">
    <div class="container-page">
      <h2 id="steps-title" class="heading-2 mb-8 text-center">{{ t('home.steps.title') }}</h2>
      <ol class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in steps" :key="s" class="flex flex-col items-center gap-3 text-center">
          <span class="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg" aria-hidden="true">{{ i + 1 }}</span>
          <h3 class="heading-3">{{ t(`home.steps.${s}.title`) }}</h3>
          <p class="text-sm text-fg-muted">{{ t(`home.steps.${s}.desc`) }}</p>
        </li>
      </ol>
    </div>
  </section>

  <!-- Featured doctors -->
  <section class="container-page py-14" aria-labelledby="featured-title">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id="featured-title" class="heading-2">{{ t('home.featured.title') }}</h2>
        <p class="mt-2 text-fg-muted">{{ t('home.featured.subtitle') }}</p>
      </div>
      <AppButton to="/doctors" variant="link">{{ t('common.viewAll') }}</AppButton>
    </div>
    <AppErrorState v-if="featured.error.value" :error="featured.error.value" @retry="featured.reload" />
    <div v-else-if="featured.loading.value && !featured.data.value" class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DoctorCardSkeleton v-for="n in 4" :key="n" />
    </div>
    <AppEmptyState v-else-if="!featured.data.value?.length" :title="t('home.featured.empty')" />
    <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DoctorCard v-for="d in featured.data.value" :key="d.id" :doctor="d" />
    </div>
  </section>

  <!-- Consultation types + benefits -->
  <section class="bg-surface py-14" aria-labelledby="types-title">
    <div class="container-page grid gap-12 lg:grid-cols-2">
      <div>
        <h2 id="types-title" class="heading-2 mb-6">{{ t('home.types.title') }}</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="card flex flex-col gap-3 p-5">
            <MessageSquare class="size-8 text-secondary" aria-hidden="true" />
            <h3 class="heading-3">{{ t('consultationType.chat') }}</h3>
            <p class="text-sm text-fg-muted">{{ t('home.types.chat') }}</p>
          </div>
          <div class="card flex flex-col gap-3 p-5">
            <Video class="size-8 text-brand" aria-hidden="true" />
            <h3 class="heading-3">{{ t('consultationType.video') }}</h3>
            <p class="text-sm text-fg-muted">{{ t('home.types.video') }}</p>
          </div>
        </div>
      </div>
      <div>
        <h2 class="heading-2 mb-6">{{ t('home.benefits.title') }}</h2>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="b in benefits" :key="b.key" class="flex gap-3">
            <component :is="b.icon" class="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h3 class="font-semibold">{{ t(`home.benefits.${b.key}.title`) }}</h3>
              <p class="mt-1 text-sm text-fg-muted">{{ t(`home.benefits.${b.key}.desc`) }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="container-page py-14" aria-labelledby="faq-title">
    <h2 id="faq-title" class="heading-2 mb-6">{{ t('home.faq.title') }}</h2>
    <FaqList />
  </section>

  <!-- Patient safety -->
  <section class="container-page pb-16" aria-labelledby="safety-title">
    <div class="flex flex-col gap-4 rounded-(--radius-card) border border-danger/30 bg-danger-soft/50 p-6 sm:flex-row sm:items-center sm:p-8">
      <HeartHandshake class="size-12 shrink-0 text-danger" aria-hidden="true" />
      <div class="flex-1">
        <h2 id="safety-title" class="heading-3">{{ t('home.safety.title') }}</h2>
        <p class="mt-2 text-sm">{{ t('home.safety.body') }}</p>
      </div>
      <p class="flex items-center gap-2 font-bold text-danger">
        <PhoneCall class="size-5" aria-hidden="true" />
        {{ t('home.safety.emergency') }}
      </p>
    </div>
  </section>
</template>
