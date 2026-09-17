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
