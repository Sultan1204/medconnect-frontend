<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { Bell } from 'lucide-vue-next'
import { useAsyncData } from '@/composables/useAsyncData'
import { api, type Listed } from '../kit/api'
import { useL } from '../kit/labels'
import { useAction } from '../kit/useAction'
import PageHead from '../kit/PageHead.vue'

const { l, fmt } = useL()
const { run } = useAction()
const unreadOnly = ref(false)
const { data, loading, reload } = useAsyncData<Listed>((signal) => api.get('/notifications', { unread: unreadOnly.value ? 1 : undefined, per_page: 50 }, signal), { watch: [unreadOnly] })

async function read(id: string) {
  await run(() => api.post(`/notifications/${id}/read`))
  await reload()
}
async function readAll() {
  await run(() => api.post('/notifications/read-all'), l('All marked as read', 'تم تحديد الكل كمقروء'))
  await reload()
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Notifications', 'الإشعارات')">
      <AppButton variant="outline" size="sm" @click="unreadOnly = !unreadOnly">{{ unreadOnly ? l('Show all', 'عرض الكل') : l('Unread only', 'غير المقروءة فقط') }}</AppButton>
      <AppButton variant="outline" size="sm" @click="readAll">{{ l('Mark all as read', 'تحديد الكل كمقروء') }}</AppButton>
    </PageHead>
    <div v-if="loading && !data" class="flex justify-center py-10"><AppSpinner /></div>
    <AppEmptyState v-else-if="!data?.data.length" :icon="Bell" :title="l('No notifications', 'لا توجد إشعارات')" />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="n in data.data" :key="n.id">
        <AppCard class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-semibold">{{ n.title }}</h2>
              <AppBadge v-if="!n.read_at" variant="primary">{{ l('New', 'جديد') }}</AppBadge>
            </div>
            <p class="mt-1 text-sm">{{ n.body }}</p>
            <p class="mt-1 text-xs text-fg-muted">{{ fmt.dateTime(n.created_at) }}</p>
          </div>
          <AppButton v-if="!n.read_at" variant="ghost" size="sm" @click="read(n.id)">{{ l('Mark read', 'مقروء') }}</AppButton>
        </AppCard>
      </li>
    </ul>
  </div>
</template>
