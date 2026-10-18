<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { watchDebounced } from '@vueuse/core'
import { SearchX, SlidersHorizontal } from 'lucide-vue-next'
import type { ConsultationType, DoctorSearchParams } from '@/types/domain'
import { catalogApi } from '@/services/api/catalog'
import { useAsyncData } from '@/composables/useAsyncData'
import { usePageMeta } from '@/composables/usePageMeta'
import { useFormatters } from '@/composables/useFormatters'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import DoctorCard from '@/components/doctors/DoctorCard.vue'
import DoctorCardSkeleton from '@/components/doctors/DoctorCardSkeleton.vue'

const props = defineProps<{ fixedSpecialty?: string }>()

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const f = useFormatters()
if (!props.fixedSpecialty) usePageMeta(() => t('doctors.seoTitle'), () => t('doctors.seoDescription'))

const LANGUAGES = ['ar', 'en', 'ur', 'hi', 'fr']

interface Filters {
  search: string
  specialty: string
  consultation_type: ConsultationType | ''
  language: string
  min_price: string
  max_price: string
  available: 'today' | 'week' | ''
  verified: boolean
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
function fromQuery(q: LocationQuery): Filters {
  return {
    search: str(q.search),
    specialty: props.fixedSpecialty ?? str(q.specialty),
    consultation_type: (['chat', 'video'].includes(str(q.consultation_type)) ? str(q.consultation_type) : '') as Filters['consultation_type'],
    language: str(q.language),
    min_price: str(q.min_price),
    max_price: str(q.max_price),
    available: (['today', 'week'].includes(str(q.available)) ? str(q.available) : '') as Filters['available'],
    verified: q.verified === '1',
  }
}

const filters = reactive<Filters>(fromQuery(route.query))
const page = computed(() => Math.max(1, Number(str(route.query.page)) || 1))
const filtersOpen = ref(false)

function toQuery(fl: Filters, p = 1): Record<string, string> {
  const q: Record<string, string> = {}
  if (fl.search.trim()) q.search = fl.search.trim()
  if (fl.specialty && !props.fixedSpecialty) q.specialty = fl.specialty
  if (fl.consultation_type) q.consultation_type = fl.consultation_type
  if (fl.language) q.language = fl.language
  if (fl.min_price) q.min_price = fl.min_price
  if (fl.max_price) q.max_price = fl.max_price
  if (fl.available) q.available = fl.available
  if (fl.verified) q.verified = '1'
  if (p > 1) q.page = String(p)
  return q
}

// Filters → URL (search text debounced). URL is the single source of truth for loading.
watchDebounced(
  () => ({ ...filters }),
  (fl) => void router.replace({ query: toQuery(fl) }),
  { debounce: 350, deep: true },
)
watch(
  () => route.query,
  (q) => Object.assign(filters, fromQuery(q)),
)

const params = computed<DoctorSearchParams>(() => {
  const fl = fromQuery(route.query)
  return {
    search: fl.search || undefined,
    specialty: fl.specialty || undefined,
    consultation_type: fl.consultation_type || undefined,
    language: fl.language || undefined,
    min_price: fl.min_price ? Number(fl.min_price) : undefined,
    max_price: fl.max_price ? Number(fl.max_price) : undefined,
    available: fl.available || undefined,
    verified: fl.verified || undefined,
    page: page.value,
    per_page: 9,
  }
})

const results = useAsyncData((signal) => catalogApi.searchDoctors(params.value, { signal }), { watch: [params, locale] })
const specialties = useAsyncData((signal) => catalogApi.specialties({ signal }), { watch: [locale] })

const specialtyOptions = computed(() => [{ value: '', label: t('doctors.filters.any') }, ...(specialties.data.value ?? []).map((s) => ({ value: s.slug, label: s.name }))])
const typeOptions = computed(() => [
  { value: '' as const, label: t('doctors.filters.any') },
  { value: 'chat' as const, label: t('consultationType.chat') },
  { value: 'video' as const, label: t('consultationType.video') },
])
const languageOptions = computed(() => [{ value: '', label: t('doctors.filters.any') }, ...LANGUAGES.map((l) => ({ value: l, label: f.languageName(l) }))])
const availabilityOptions = computed(() => [
  { value: '' as const, label: t('doctors.filters.any') },
  { value: 'today' as const, label: t('doctors.filters.today') },
  { value: 'week' as const, label: t('doctors.filters.week') },
])

function resetFilters() {
  Object.assign(filters, fromQuery({}))
}

function goToPage(p: number) {
  void router.push({ query: toQuery(filters, p) }).then(() => document.getElementById('results-heading')?.parentElement?.scrollIntoView({ block: 'start' }))
}
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <header v-if="!fixedSpecialty" class="mb-6">
      <h1 class="heading-2">{{ t('doctors.title') }}</h1>
      <p class="mt-1 text-fg-muted">{{ t('doctors.subtitle') }}</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-[18rem_1fr] [&>*]:min-w-0">
      <!-- Filters -->
      <aside>
        <AppButton variant="outline" block class="lg:hidden" :aria-expanded="filtersOpen" aria-controls="doctor-filters" @click="filtersOpen = !filtersOpen">
          <SlidersHorizontal class="size-4" aria-hidden="true" />
          {{ t('doctors.filters.show') }}
        </AppButton>
        <form id="doctor-filters" class="card mt-3 flex-col gap-4 p-5 lg:sticky lg:top-20 lg:mt-0 lg:flex lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto" :class="filtersOpen ? 'flex' : 'hidden'" role="search" :aria-label="t('doctors.filters.title')" @submit.prevent>
          <h2 class="heading-3">{{ t('doctors.filters.title') }}</h2>
          <AppInput v-model="filters.search" type="search" :label="t('doctors.searchLabel')" :placeholder="t('doctors.searchPlaceholder')" />
          <AppSelect v-if="!fixedSpecialty" v-model="filters.specialty" :label="t('doctors.filters.specialty')" :options="specialtyOptions" />
          <AppSelect v-model="filters.consultation_type" :label="t('doctors.filters.consultationType')" :options="typeOptions" />
          <AppSelect v-model="filters.language" :label="t('doctors.filters.language')" :options="languageOptions" />
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-1.5 text-sm font-medium">{{ t('doctors.filters.price') }}</legend>
            <div class="grid grid-cols-2 gap-2">
              <AppInput v-model="filters.min_price" type="number" inputmode="numeric" min="0" :label="t('doctors.filters.minPrice')" />
              <AppInput v-model="filters.max_price" type="number" inputmode="numeric" min="0" :label="t('doctors.filters.maxPrice')" />
            </div>
          </fieldset>
          <AppSelect v-model="filters.available" :label="t('doctors.filters.availability')" :options="availabilityOptions" />
          <AppCheckbox v-model="filters.verified" :label="t('doctors.filters.verifiedOnly')" />
          <AppButton variant="ghost" size="sm" @click="resetFilters">{{ t('doctors.filters.reset') }}</AppButton>
        </form>
      </aside>

      <!-- Results -->
      <section aria-labelledby="results-heading" :aria-busy="results.loading.value">
        <h2 id="results-heading" class="sr-only">{{ t('doctors.title') }}</h2>
        <p class="mb-4 text-sm text-fg-muted" role="status" aria-live="polite">
          <template v-if="results.data.value && !results.loading.value">{{ t('doctors.results', { count: results.data.value.meta.total }) }}</template>
          <template v-else-if="results.loading.value">{{ t('common.loading') }}</template>
        </p>

        <AppErrorState v-if="results.error.value" :error="results.error.value" @retry="results.reload" />
        <div v-else-if="results.loading.value && !results.data.value" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <DoctorCardSkeleton v-for="n in 6" :key="n" />
        </div>
        <AppEmptyState v-else-if="results.data.value && !results.data.value.data.length" :icon="SearchX" :title="t('doctors.empty.title')" :description="t('doctors.empty.desc')">
          <AppButton variant="outline" size="sm" @click="resetFilters">{{ t('doctors.filters.reset') }}</AppButton>
        </AppEmptyState>
        <template v-else-if="results.data.value">
          <div class="grid gap-5 transition-opacity md:grid-cols-2 xl:grid-cols-3" :class="{ 'opacity-60': results.loading.value }" data-testid="doctor-results">
            <DoctorCard v-for="d in results.data.value.data" :key="d.id" :doctor="d" />
          </div>
          <AppPagination class="mt-8" :meta="results.data.value.meta" @change="goToPage" />
        </template>
      </section>
    </div>
  </div>
</template>
