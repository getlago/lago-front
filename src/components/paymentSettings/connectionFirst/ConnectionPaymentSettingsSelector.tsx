import {
  ConnectionBehavior,
  deriveConnectionBehavior,
  SelectedConnection,
} from '~/components/connectionSelection/types'
import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { ConnectionBehaviorEnum, PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { ConnectionPaymentSettingsValues } from './connectionPaymentSettingsSchema'
import { useConnectionPaymentSettingsDrawer } from './useConnectionPaymentSettingsDrawer'

export const CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID = 'connection-payment-settings-selector'

export const CONNECTION_SUMMARY_KEY_BY_BEHAVIOR: Record<ConnectionBehavior, string> = {
  [ConnectionBehavior.INHERIT]: 'text_1789374590510l3b1mod7l77',
  [ConnectionBehavior.SPECIFIC]: 'text_17893745905100lz4yq92hs3',
  [ConnectionBehavior.SKIP]: 'text_1789374590510hii2b0bdqhl',
}

interface ConnectionPaymentSettingsSelectorProps {
  viewType: ViewTypeEnum
  customerId: string
  externalCustomerId: string
  connection: SelectedConnection
  paymentMethod: SelectedPaymentMethod
  onChange: (values: ConnectionPaymentSettingsValues) => void
  'data-test'?: string
}

// Nothing reads connections back yet, so a wallet routed to manual payments through the legacy
// drawer carries that choice on `paymentMethod` alone.
const seedConnection = (
  connection: SelectedConnection,
  paymentMethod: SelectedPaymentMethod,
): SelectedConnection => {
  if (connection) return connection
  if (paymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
    return { behavior: ConnectionBehaviorEnum.Skip }
  }

  return connection
}

export const ConnectionPaymentSettingsSelector = ({
  viewType,
  customerId,
  externalCustomerId,
  connection,
  paymentMethod,
  onChange,
  'data-test': dataTest = CONNECTION_PAYMENT_SETTINGS_SELECTOR_TEST_ID,
}: ConnectionPaymentSettingsSelectorProps) => {
  const { translate } = useInternationalization()
  const { openDrawer } = useConnectionPaymentSettingsDrawer({
    viewType,
    customerId,
    externalCustomerId,
    onSave: onChange,
  })

  const seededConnection = seedConnection(connection, paymentMethod)

  return (
    <Selector
      icon="coin-dollar"
      title={translate('text_17828013737948943pe3k8nc')}
      subtitle={translate(
        CONNECTION_SUMMARY_KEY_BY_BEHAVIOR[deriveConnectionBehavior(seededConnection)],
      )}
      endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
      onClick={() => openDrawer({ connection: seededConnection, paymentMethod })}
      data-test={dataTest}
    />
  )
}
