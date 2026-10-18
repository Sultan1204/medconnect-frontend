import { useI18n } from 'vue-i18n'
import type { ConsultationOffer, Money } from '@/types/domain'
import { formatDate, formatDateTime, formatMoney, formatTime, intlLocale } from '@/utils/format'

/** Locale-aware formatters bound to the active UI language. */
export function useFormatters() {
  const { locale } = useI18n()

  function languageName(code: string): string {
    try {
      return new Intl.DisplayNames([intlLocale(locale.value)], { type: 'language' }).of(code) ?? code
    } catch {
      return code
    }
  }

  return {
    money: (m: Money) => formatMoney(m, locale.value),
    date: (iso: string, opts?: Intl.DateTimeFormatOptions) => formatDate(iso, locale.value, opts),
    time: (iso: string) => formatTime(iso, locale.value),
    dateTime: (iso: string) => formatDateTime(iso, locale.value),
    languageName,
    list: (items: string[]) => new Intl.ListFormat(intlLocale(locale.value), { style: 'short', type: 'conjunction' }).format(items),
    /** Lowest price among offers — display only ("from X"). */
    lowestPrice: (offers: ConsultationOffer[]): Money | null =>
      offers.length ? offers.reduce((min, o) => (o.price.amount < min.amount ? o.price : min), offers[0]!.price) : null,
  }
}
