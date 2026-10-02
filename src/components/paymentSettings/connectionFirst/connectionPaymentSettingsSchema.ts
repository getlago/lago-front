import { z } from 'zod'

import {
  ConnectionBehavior,
  deriveConnectionBehavior,
  SelectedConnection,
} from '~/components/connectionSelection/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { PaymentMethodTypeEnum } from '~/generated/graphql'

export interface ConnectionPaymentSettingsValues {
  connection: SelectedConnection
  paymentMethod: SelectedPaymentMethod
}

export const CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES: ConnectionPaymentSettingsValues = {
  connection: undefined,
  paymentMethod: undefined,
}

export const connectionPaymentSettingsValidationSchema = z.object({
  connection: z
    .custom<SelectedConnection>()
    .refine(
      (value) => !(deriveConnectionBehavior(value) === ConnectionBehavior.SPECIFIC && !value?.code),
      { message: 'text_624ea7c29103fd010732ab7d' },
    ),
  paymentMethod: z
    .custom<SelectedPaymentMethod>()
    .refine(
      (value) =>
        !(
          value?.paymentMethodType === PaymentMethodTypeEnum.Provider &&
          value?.paymentMethodId === undefined
        ),
      { message: 'text_624ea7c29103fd010732ab7d' },
    ),
})
