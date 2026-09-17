import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

/**
 * Formats a totalCount into a metadata string (e.g. "42 results").
 * Returns `undefined` if count is absent.
 *
 * `capped` is for the lists whose total the API caps (the invoices list): the count is then a
 * lower bound, so it reads as a pre-formatted floor ("10,000+ results") instead of an exact total.
 * Its key is single-form on purpose (a floor above the cap is never "1"), which is why no plural
 * argument is passed — keep it single-form, a piped variant would resolve to its first segment.
 */
export const formatCountToMetadata = (
  count: number | undefined | null,
  translate: TranslateFunc,
  capped = false,
): string | undefined => {
  if (count === undefined || count === null) return undefined

  if (capped) {
    return translate('text_1786997491915trapg3o2kee', {
      count: intlFormatNumber(count, { style: 'decimal', maximumFractionDigits: 0 }),
    })
  }

  return translate('text_17740184000000_total_results', { count }, count)
}
