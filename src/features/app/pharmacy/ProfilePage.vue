<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { api, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'
import KeyValues from '../kit/KeyValues.vue'

const { l } = useL()
const auth = useAuthStore()
const branches = useAsyncData<Row[]>(async () => (await api.get('/pharmacy/branches')).data)
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Pharmacy profile', 'ملف الصيدلية')" />
    <AppCard class="flex flex-col gap-3">
      <KeyValues :items="[{ label: l('Pharmacy', 'الصيدلية'), value: branches.data.value?.[0]?.pharmacy?.name }, { label: l('Your name', 'اسمك'), value: auth.user?.name }, { label: l('Phone', 'الهاتف'), value: auth.user?.phone }, { label: l('Branches', 'الفروع'), value: branches.data.value?.length }]" />
      <p class="text-sm text-fg-muted">{{ l('Pharmacy licence and registration details are managed by the platform administrators.', 'يدير مشرفو المنصة ترخيص الصيدلية وبيانات التسجيل.') }}</p>
    </AppCard>
  </div>
</template>
