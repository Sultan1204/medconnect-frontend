<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { useAuthStore } from '@/stores/auth'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'

const { l } = useL()
const auth = useAuthStore()
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <PageHead :title="l('Staff', 'الموظفون')" />
    <AppCard class="flex flex-col gap-3">
      <p>{{ l('Signed in as', 'مسجل الدخول باسم') }} <strong>{{ auth.user?.name }}</strong></p>
      <AppAlert variant="info">{{ l('Pharmacy staff accounts are created by platform administrators (Admin → Pharmacies → Add staff).', 'ينشئ مشرفو المنصة حسابات موظفي الصيدلية (المشرف ← الصيدليات ← إضافة موظف).') }}</AppAlert>
    </AppCard>
  </div>
</template>
