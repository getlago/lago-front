import { SelectedConnection } from '~/components/connectionSelection/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { ConnectionBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'

// A wallet routed to manual through the legacy drawer carries that on `paymentMethod` alone: the
// backend holds no override row for it, so its routing reads back as `inherit`.
export const seedConnection = (
  connection: SelectedConnection,
  paymentMethod: SelectedPaymentMethod,
): SelectedConnection => {
  if (connection) return connection
  if (paymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
    return { behavior: ConnectionBehaviorEnum.Skip }
  }

  return connection
}
