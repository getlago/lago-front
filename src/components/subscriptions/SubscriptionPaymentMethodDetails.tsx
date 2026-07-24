import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { SelectedPaymentMethod } from '../paymentMethodSelection/types'
import { useResolvedPaymentMethodDisplay } from '../paymentMethodSelection/useResolvedPaymentMethodDisplay'

export const MANUAL_PAYMENT_METHOD_TEST_ID = 'manual-payment-method'
export const INHERITED_BADGE_TEST_ID = 'inherited-badge'

interface SubscriptionPaymentMethodDetailsProps {
  selectedPaymentMethod?: SelectedPaymentMethod
  externalCustomerId?: string
  className?: string
}

// Read-only display of the subscription's resolved payment method (specific
// provider method, manual, or inherited customer default). Returns null when
// there's nothing to show.
export const SubscriptionPaymentMethodDetails = ({
  selectedPaymentMethod,
  externalCustomerId,
  className,
}: SubscriptionPaymentMethodDetailsProps): JSX.Element | null => {
  const { translate } = useInternationalization()

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
    withDeleted: false,
  })

  const { isManual, isInherited, label, inheritedSuffix } = useResolvedPaymentMethodDisplay(
    selectedPaymentMethod,
    paymentMethodsList,
  )

  if (!label) {
    return null
  }

  return (
    <DetailsPage.InfoGridItem
      className={className}
      label={translate('text_17440371192353kif37ol194')}
      value={
        <span>
          {isManual ? <span data-test={MANUAL_PAYMENT_METHOD_TEST_ID}>{label}</span> : label}
          {isInherited && <span data-test={INHERITED_BADGE_TEST_ID}>{inheritedSuffix}</span>}
        </span>
      }
    />
  )
}
