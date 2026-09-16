import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { useResolvedPaymentMethodDisplay } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import { ConnectionResolvedBehaviorEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerPaymentConnections } from '~/hooks/customer/useCustomerPaymentConnections'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { ConnectionRoutingDisplay } from './ConnectionRoutingValue'

export const PAYMENT_METHOD_VALUE_CHIP_TEST_ID = 'payment-method-value-chip'
export const PAYMENT_METHOD_VALUE_INHERITED_TEST_ID = 'payment-method-value-inherited'

type PaymentMethodValueProps = {
  selectedPaymentMethod?: SelectedPaymentMethod
  externalCustomerId?: string
  customerId?: string
  paymentRouting?: ConnectionRoutingDisplay
}

export const PaymentMethodValue = ({
  selectedPaymentMethod,
  externalCustomerId,
  customerId,
  paymentRouting,
}: PaymentMethodValueProps): JSX.Element => {
  const { translate } = useInternationalization()

  const { connections, defaultConnection } = useCustomerPaymentConnections({ customerId })

  const isSkipped = paymentRouting?.behavior === ConnectionResolvedBehaviorEnum.Skip

  const getResolvedConnection = () => {
    if (isSkipped) return undefined
    if (paymentRouting?.behavior === ConnectionResolvedBehaviorEnum.Specific) {
      return connections.find((item) => item.code === paymentRouting.code)
    }

    return defaultConnection
  }

  const resolvedConnection = getResolvedConnection()

  const { data: customerPaymentMethods } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
    withDeleted: false,
    skip: !resolvedConnection,
  })

  // A method belongs to one connection, so the customer-wide list is scoped the same way the
  // edit drawer scopes it (ConnectionPaymentSettingsDrawerContent): without this the default
  // card of another connection would be shown as the one paying this object.
  const connectionPaymentMethods = resolvedConnection
    ? customerPaymentMethods.filter(
        (method) => method.paymentProviderCustomerId === resolvedConnection.id,
      )
    : []

  const { isInherited, label } = useResolvedPaymentMethodDisplay(
    selectedPaymentMethod,
    connectionPaymentMethods,
  )

  const showInheritedLabel = isInherited && !isSkipped

  return (
    <span className="flex items-center gap-2">
      <Chip data-test={PAYMENT_METHOD_VALUE_CHIP_TEST_ID} label={label} />

      {showInheritedLabel && (
        <Typography
          data-test={PAYMENT_METHOD_VALUE_INHERITED_TEST_ID}
          variant="body"
          color="grey600"
          component="span"
        >
          {`(${translate('text_1789558944658bay5bstkcut')})`}
        </Typography>
      )}
    </span>
  )
}
