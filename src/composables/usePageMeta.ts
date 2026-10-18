import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { env } from '@/config/env'

/** Sets title, description, canonical and Open Graph / Twitter metadata for a page. */
export function usePageMeta(title: MaybeRefOrGetter<string>, description?: MaybeRefOrGetter<string | undefined>) {
  const route = useRoute()
  const { locale } = useI18n()
  const url = computed(() => `${env.appUrl}${route.path}`)
  const desc = () => toValue(description) ?? ''

  useHead({
    title: () => toValue(title),
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: () => toValue(title) },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: () => (locale.value === 'ar' ? 'ar_SA' : 'en_US') },
      { property: 'og:site_name', content: 'MedConnect Saudi' },
      { name: 'twitter:card', content: 'summary' },
    ],
    link: [{ rel: 'canonical', href: url }],
  })
}
