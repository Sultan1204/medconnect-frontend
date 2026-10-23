<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useAuthStore } from '@/stores/auth'
import { getData, sar, type Row } from '../kit/api'
import { useL } from '../kit/labels'
import PageHead from '../kit/PageHead.vue'

const { l, status } = useL()
const auth = useAuthStore()
const overview = useAsyncData<Row>(() => getData('/admin/reports/overview'))
const fin = useAsyncData<Row>(() => getData('/admin/reports/financial'))
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHead :title="l(`Welcome, ${auth.user?.name ?? ''}`, `مرحباً، ${auth.user?.name ?? ''}`)" :subtitle="overview.data.value ? `${overview.data.value.range.from} → ${overview.data.value.range.to}` : ''" />
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard><p class="text-3xl font-semibold">{{ overview.data.value?.new_users ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('New users', 'مستخدمون جدد') }}</p></AppCard>
      <AppCard><p class="text-3xl font-semibold">{{ overview.data.value?.consultations_completed ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Consultations completed', 'استشارات مكتملة') }}</p></AppCard>
      <AppCard><p class="text-3xl font-semibold">{{ overview.data.value?.open_complaints ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Open complaints', 'شكاوى مفتوحة') }}</p></AppCard>
      <AppCard><p class="text-3xl font-semibold">{{ overview.data.value?.reviews_pending_moderation ?? '–' }}</p><p class="text-sm text-fg-muted">{{ l('Reviews to moderate', 'تقييمات للمراجعة') }}</p></AppCard>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <AppCard class="flex flex-col gap-2">
        <h2 class="heading-3">{{ l('Users by role', 'المستخدمون حسب الدور') }}</h2>
        <ul class="text-sm"><li v-for="(n, r) in overview.data.value?.users_by_role ?? {}" :key="r" class="flex justify-between border-b border-border py-1"><span>{{ status(String(r)) }}</span><span>{{ n }}</span></li></ul>
      </AppCard>
      <AppCard class="flex flex-col gap-2">
        <h2 class="heading-3">{{ l('Appointments by status', 'المواعيد حسب الحالة') }}</h2>
        <ul class="text-sm"><li v-for="(n, r) in overview.data.value?.appointments_by_status ?? {}" :key="r" class="flex justify-between border-b border-border py-1"><span>{{ status(String(r)) }}</span><span>{{ n }}</span></li></ul>
      </AppCard>
      <AppCard class="flex flex-col gap-2 lg:col-span-2">
        <h2 class="heading-3">{{ l('Money (SAR, last 30 days)', 'الأموال (ر.س، آخر 30 يوماً)') }}</h2>
        <dl class="grid gap-3 text-sm sm:grid-cols-4">
          <div><dt class="text-fg-muted">{{ l('Captured', 'المحصل') }}</dt><dd class="text-lg font-semibold">{{ sar(fin.data.value?.captured) }}</dd></div>
          <div><dt class="text-fg-muted">{{ l('Refunded', 'المسترد') }}</dt><dd class="text-lg font-semibold">{{ sar(fin.data.value?.refunded) }}</dd></div>
          <div><dt class="text-fg-muted">{{ l('Net', 'الصافي') }}</dt><dd class="text-lg font-semibold">{{ sar(fin.data.value?.net) }}</dd></div>
          <div><dt class="text-fg-muted">{{ l('Platform commission', 'عمولة المنصة') }}</dt><dd class="text-lg font-semibold">{{ sar(fin.data.value?.platform_commission) }}</dd></div>
        </dl>
      </AppCard>
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton to="/admin/doctors/pending" variant="outline">{{ l('Doctors awaiting approval', 'أطباء بانتظار الاعتماد') }}</AppButton>
      <AppButton to="/admin/complaints" variant="outline">{{ l('Complaints', 'الشكاوى') }}</AppButton>
      <AppButton to="/admin/reviews" variant="outline">{{ l('Review moderation', 'مراجعة التقييمات') }}</AppButton>
    </div>
  </div>
</template>
