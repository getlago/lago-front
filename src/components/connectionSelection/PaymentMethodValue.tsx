import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { useResolvedPaymentMethodDisplay } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import { ConnectionResolvedBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerConnectionPaymentMethods } from '~/hooks/customer/useCustomerConnectionPaymentMethods'
import { useCustomerPaymentConnections } from '~/hooks/customer/useCustomerPaymentConnections'

import { ConnectionRoutingDisplay } from './ConnectionRoutingValue'

export const PAYMENT_METHOD_VALUE_CHIP_TEST_ID = 'payment-method-value-chip'
export const PAYMENT_METHOD_VALUE_INHERITED_TEST_ID = 'payment-method-value-inherited'

type PaymentMethodValueProps = {
  selectedPaymentMethod?: SelectedPaymentMethod
  customerId?: string
  paymentRouting?: ConnectionRoutingDisplay
}

export const PaymentMethodValue = ({
  selectedPaymentMethod,
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

  const {
    data: connectionPaymentMethods,
    loading: loadingPaymentMethods,
    error: paymentMethodsError,
  } = useCustomerConnectionPaymentMethods({
    customerId,
    connectionId: resolvedConnection?.id,
  })

  const { isInherited, isManual, label } = useResolvedPaymentMethodDisplay(
    selectedPaymentMethod,
    connectionPaymentMethods,
  )

  // `useResolvedPaymentMethodDisplay` reports manual whenever nothing resolves, an inference the
  // legacy surfaces rely on. Here the routing decides that, so a connection that simply has no
  // method yet — or has not answered — must not read as a manual payment.
  const isManualRouting =
    isSkipped || selectedPaymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual
  const hasMethod = !loadingPaymentMethods && !paymentMethodsError && (isManualRouting || !isManual)

  // Nothing pays this object: no chip to carry a value, and nothing for it to inherit from.
  if (!hasMethod) {
    return (
      <Typography variant="body" color="grey700" component="span">
        {translate('text_1754570508183hxl33n573yi')}
      </Typography>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <Chip data-test={PAYMENT_METHOD_VALUE_CHIP_TEST_ID} label={label} />

      {isInherited && !isSkipped && (
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
