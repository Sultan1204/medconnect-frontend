<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import { useL } from '../kit/labels'
import StatusBadge from '../kit/StatusBadge.vue'
import type { Row } from '../kit/api'

defineProps<{ rx: Row }>()
const { l, fmt } = useL()
</script>

<template>
  <AppCard class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 class="font-semibold">{{ l('Prescription', 'وصفة طبية') }} <span v-if="rx.external_reference" class="text-xs font-normal text-fg-muted">{{ rx.external_reference }}</span></h3>
        <p v-if="rx.clinical_indication" class="text-sm text-fg-muted">{{ rx.clinical_indication }}</p>
      </div>
      <StatusBadge :value="rx.status" />
    </div>
    <AppAlert v-if="rx.legal_validity !== 'valid'" variant="warning">{{ rx.legal_notice }}</AppAlert>
    <ul class="divide-y divide-border rounded-xl border border-border text-sm">
      <li v-for="it in rx.items" :key="it.id" class="px-3 py-2">
        <div class="font-medium">{{ it.medication_name }} <span class="text-fg-muted">{{ it.strength }} {{ it.dosage_form }}</span></div>
        <div class="text-fg-muted">{{ it.dose }} · {{ it.route }} · {{ it.frequency }} · {{ it.duration_days }} {{ l('days', 'يوم') }} · {{ it.quantity }} {{ it.quantity_unit }}</div>
        <div v-if="it.instructions" class="text-fg-muted">{{ it.instructions }}</div>
      </li>
    </ul>
    <AppAlert v-if="rx.safety_check?.findings?.length" variant="danger" :title="l('Safety warnings', 'تحذيرات السلامة')">
      <ul class="list-disc ps-5"><li v-for="(f, i) in rx.safety_check.findings" :key="i">{{ f.message ?? f.summary ?? JSON.stringify(f) }}</li></ul>
    </AppAlert>
    <p v-if="rx.issued_at" class="text-xs text-fg-muted">{{ l('Issued', 'صدرت') }} {{ fmt.dateTime(rx.issued_at) }}<template v-if="rx.expires_at"> · {{ l('expires', 'تنتهي') }} {{ fmt.dateTime(rx.expires_at) }}</template></p>
    <div v-if="$slots.default" class="flex flex-wrap gap-2"><slot /></div>
  </AppCard>
</template>
