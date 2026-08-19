import { Typography } from '~/components/designSystem/Typography'
import { type TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

export const QUOTE_PAYMENT_TERM_LINE_TEST_ID = 'quote-payment-term-line'

export const formatNetPaymentTerm = (
  netPaymentTerm: number | null | undefined,
  translate: TranslateFunc,
): string => {
  if (typeof netPaymentTerm !== 'number') return '-'
  if (netPaymentTerm === 0) return translate('text_64c7a89b6c67eb6c98898125')

  return translate('text_64c7a89b6c67eb6c9889815f', { days: netPaymentTerm }, netPaymentTerm)
}

/**
 * Payment term shown next to the dates the deal term derives from.
 *
 * Read-only and never persisted on the quote on purpose: `Customer#applicable_net_payment_term`
 * already falls back to the billing entity, and `Invoices::CreateGeneratingService` derives the
 * invoice's term the same way — a quote-level field would let the document promise a term the
 * invoice won't honour.
 */
export const QuotePaymentTermLine = ({
  netPaymentTerm,
}: {
  netPaymentTerm?: number | null
}): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-1">
      <Typography variant="captionHl" color="grey700">
        {translate('text_1778660219891rv2r5gjmklq')}
      </Typography>
      <Typography variant="body" color="grey700" data-test={QUOTE_PAYMENT_TERM_LINE_TEST_ID}>
        {formatNetPaymentTerm(netPaymentTerm, translate)}
      </Typography>
      <Typography variant="caption" color="grey600">
        {translate('text_17871360906936tl2in6avzh')}
      </Typography>
    </div>
  )
}
