import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'

/** Arabic renderings of backend status codes shown in tables and badges. Unknown codes fall back to humanised English. */
const AR: Record<string, string> = {
  awaiting_payment: 'بانتظار الدفع', confirmed: 'مؤكد', pending: 'قيد الانتظار', pending_confirmation: 'بانتظار التأكيد',
  in_progress: 'جارٍ', completed: 'مكتمل', cancelled: 'ملغي', declined: 'مرفوض', no_show: 'لم يحضر', expired: 'منتهي',
  scheduled: 'مجدول', active: 'نشط', interrupted: 'متقطع', draft: 'مسودة', issued: 'صادرة', rejected: 'مرفوض',
  pending_external_approval: 'بانتظار الموافقة', requested: 'مطلوب', received: 'مستلم', under_review: 'قيد المراجعة',
  ready: 'جاهز', dispensed: 'تم الصرف', captured: 'مدفوع', failed: 'فشل', refunded: 'مسترد', partially_refunded: 'مسترد جزئياً',
  approved: 'معتمد', suspended: 'موقوف', submitted: 'مقدّم', more_info_required: 'مطلوب معلومات', verified: 'موثّق',
  open: 'مفتوح', closed: 'مغلق', resolved: 'تم الحل', published: 'منشور', hidden: 'مخفي', video: 'فيديو', chat: 'محادثة',
  patient: 'مريض', doctor: 'طبيب', admin: 'مشرف', super_admin: 'مشرف عام', pharmacy_staff: 'صيدلية',
  low: 'منخفض', normal: 'عادي', high: 'مرتفع', urgent: 'عاجل', true: 'نعم', false: 'لا',
}

export function humanize(code: string): string {
  const s = String(code).replace(/[_-]+/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Bilingual helper: `l('Save', 'حفظ')` picks by the active UI language. */
export function useL() {
  const { locale } = useI18n()
  const fmt = useFormatters()
  const isAr = computed(() => locale.value === 'ar')
  const l = (en: string, ar: string) => (isAr.value ? ar : en)
  const status = (code: string | null | undefined) => (code == null ? '—' : isAr.value ? (AR[String(code)] ?? humanize(String(code))) : humanize(String(code)))
  return { l, isAr, status, fmt, locale }
}

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export function statusVariant(code: string | null | undefined): BadgeVariant {
  const c = String(code ?? '')
  if (['confirmed', 'completed', 'captured', 'approved', 'issued', 'dispensed', 'active', 'verified', 'published', 'ready', 'resolved', 'succeeded'].includes(c)) return 'success'
  if (['awaiting_payment', 'pending', 'pending_confirmation', 'pending_external_approval', 'requested', 'submitted', 'under_review', 'more_info_required', 'draft', 'scheduled', 'open', 'received'].includes(c)) return 'warning'
  if (['cancelled', 'declined', 'no_show', 'failed', 'rejected', 'suspended', 'expired', 'urgent', 'hidden'].includes(c)) return 'danger'
  if (['in_progress', 'interrupted'].includes(c)) return 'info'
  return 'neutral'
}
