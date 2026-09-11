import { Typography } from '~/components/designSystem/Typography'
import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

export const QUOTE_PAYMENT_TERM_LINE_TEST_ID = 'quote-payment-term-line'

/**
 * Quotes carry no term of their own — they display the term resolved from the customer,
 * then the billing entity, then the default. Resolution happens once in `EditQuote`, so
 * this only has to render what it is handed.
 */
export const QuotePaymentTermLine = ({
  paymentTerm,
}: {
  paymentTerm?: ResolvablePaymentTerm | null
}): JSX.Element => {
  const { translate } = useInternationalization()
  const { formatPaymentTerm } = usePaymentTerm()

  return (
    <div className="flex flex-col gap-1">
      <Typography variant="captionHl" color="grey700">
        {translate('text_1778660219891rv2r5gjmklq')}
      </Typography>
      <Typography variant="body" color="grey700" data-test={QUOTE_PAYMENT_TERM_LINE_TEST_ID}>
        {paymentTerm ? formatPaymentTerm(paymentTerm) : '-'}
      </Typography>
      <Typography variant="caption" color="grey600">
        {translate('text_17871360906936tl2in6avzh')}
      </Typography>
    </div>
  )
}
