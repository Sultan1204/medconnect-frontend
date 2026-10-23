<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref, watch } from 'vue'
import { Inbox } from 'lucide-vue-next'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { api, type Listed, type Row } from './api'
import { useL } from './labels'

export interface Col {
  key: string
  label: string
  /** Plain-text renderer. Use the `cell-<key>` slot for rich content. */
  value?: (row: Row) => string | number | null | undefined
  class?: string
}

const props = defineProps<{
  endpoint: string
  columns: Col[]
  params?: Record<string, any>
  empty?: string
  /** Responses are `{ data: [...] }` without paging metadata (single page). */
  rowKey?: string
}>()
const emit = defineEmits<{ loaded: [rows: Row[]] }>()

const { l } = useL()
const page = ref(1)
const cursor = ref<string | null>(null)
const extra = ref<Row[]>([])

const { data, loading, error, reload } = useAsyncData<Listed>(
  (signal) => api.get(props.endpoint, { ...props.params, page: page.value, cursor: cursor.value }, signal),
  { watch: [page, () => props.endpoint, () => JSON.stringify(props.params)] },
)

watch(() => JSON.stringify(props.params) + props.endpoint, () => { page.value = 1; cursor.value = null; extra.value = [] })
watch(data, (d) => { if (d) emit('loaded', d.data) })

const rows = computed<Row[]>(() => [...extra.value, ...(data.value?.data ?? [])])
const lastPage = computed(() => data.value?.meta?.last_page ?? 1)
const nextCursor = computed(() => (data.value?.meta as any)?.next_cursor ?? null)

function loadMore() {
  extra.value = rows.value
  cursor.value = nextCursor.value
}

function cell(row: Row, c: Col) {
  if (c.value) return c.value(row)
  return row[c.key]
}

defineExpose({ reload, rows })
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="loading && !data" class="flex justify-center py-10"><AppSpinner /></div>
    <AppErrorState v-else-if="error" :error="error" @retry="reload" />
    <AppEmptyState v-else-if="!rows.length" :icon="Inbox" :title="empty ?? l('Nothing here yet', 'لا يوجد شيء بعد')" />
    <template v-else>
      <div class="overflow-x-auto rounded-(--radius-card) border border-border">
        <table class="w-full min-w-[32rem] text-start text-sm">
          <thead class="bg-surface-muted text-fg-muted">
            <tr>
              <th v-for="c in columns" :key="c.key" scope="col" class="px-3 py-2.5 text-start font-medium">{{ c.label }}</th>
              <th v-if="$slots.actions" scope="col" class="px-3 py-2.5"><span class="sr-only">{{ l('Actions', 'إجراءات') }}</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="(row, i) in rows" :key="row[rowKey ?? 'id'] ?? i" class="align-top">
              <td v-for="c in columns" :key="c.key" class="px-3 py-2.5" :class="c.class">
                <slot :name="`cell-${c.key}`" :row="row">{{ cell(row, c) ?? '—' }}</slot>
              </td>
              <td v-if="$slots.actions" class="px-3 py-2.5">
                <div class="flex flex-wrap justify-end gap-2"><slot name="actions" :row="row" :reload="reload" /></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-3">
        <AppButton variant="outline" size="sm" :disabled="page <= 1" @click="page--">{{ l('Previous', 'السابق') }}</AppButton>
        <span class="text-sm text-fg-muted">{{ page }} / {{ lastPage }}</span>
        <AppButton variant="outline" size="sm" :disabled="page >= lastPage" @click="page++">{{ l('Next', 'التالي') }}</AppButton>
      </div>
      <div v-else-if="nextCursor" class="flex justify-center">
        <AppButton variant="outline" size="sm" :loading="loading" @click="loadMore">{{ l('Load more', 'تحميل المزيد') }}</AppButton>
      </div>
    </template>
  </div>
</template>
