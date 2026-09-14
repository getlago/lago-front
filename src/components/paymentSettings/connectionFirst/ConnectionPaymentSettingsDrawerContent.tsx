import { useStore } from '@tanstack/react-form'

import { ConnectionBehaviorFields } from '~/components/connectionSelection/ConnectionBehaviorFields'
import { CustomerPaymentConnectionComboBox } from '~/components/connectionSelection/CustomerPaymentConnectionComboBox'
import {
  ConnectionBehavior,
  deriveConnectionBehavior,
} from '~/components/connectionSelection/types'
import { Chip } from '~/components/designSystem/Chip'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import {
  VIEW_TYPE_PAYMENT_CAPTION_KEYS,
  ViewTypeEnum,
} from '~/core/constants/billingObjectViewTypes'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useConnectionPaymentMethodsList } from '~/hooks/customer/useConnectionPaymentMethodsList'
import { useCustomerPaymentConnections } from '~/hooks/customer/useCustomerPaymentConnections'
import { withForm } from '~/hooks/forms/useAppform'

import { ConnectionPaymentMethodFields } from './ConnectionPaymentMethodFields'
import { CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES } from './connectionPaymentSettingsSchema'

export const CONNECTION_PAYMENT_NO_DEFAULT_METHOD_CHIP_TEST_ID =
  'connection-payment-no-default-method-chip'

const CONNECTION_BEHAVIOR_RADIO_NAME = 'paymentConnectionBehavior'

const toResetPaymentMethod = (behavior: ConnectionBehavior): SelectedPaymentMethod => ({
  paymentMethodId: null,
  paymentMethodType:
    behavior === ConnectionBehavior.SKIP
      ? PaymentMethodTypeEnum.Manual
      : PaymentMethodTypeEnum.Provider,
})

interface ConnectionPaymentSettingsDrawerContentExtraProps {
  viewType: ViewTypeEnum
  customerId: string
}

const contentDefaultProps: ConnectionPaymentSettingsDrawerContentExtraProps = {
  viewType: ViewTypeEnum.WalletTopUp,
  customerId: '',
}

export const ConnectionPaymentSettingsDrawerContent = withForm({
  defaultValues: CONNECTION_PAYMENT_SETTINGS_DEFAULT_VALUES,
  props: contentDefaultProps,
  render: function ConnectionPaymentSettingsDrawerContentRender({ form, viewType, customerId }) {
    const { translate } = useInternationalization()

    const connection = useStore(form.store, (s) => s.values.connection)
    const paymentMethod = useStore(form.store, (s) => s.values.paymentMethod)
    const connectionError = useStore(
      form.store,
      (s) => s.fieldMeta.connection?.errors?.[0]?.message,
    )
    const paymentMethodError = useStore(
      form.store,
      (s) => s.fieldMeta.paymentMethod?.errors?.[0]?.message,
    )

    const behavior = deriveConnectionBehavior(connection)
    const { connections, defaultConnection } = useCustomerPaymentConnections({ customerId })

    const getResolvedConnection = () => {
      if (behavior === ConnectionBehavior.SKIP) return undefined
      if (behavior === ConnectionBehavior.SPECIFIC) {
        return connections.find((item) => item.code === connection?.code)
      }

      return defaultConnection
    }

    const resolvedConnection = getResolvedConnection()

    const { data: connectionPaymentMethods, loading: loadingPaymentMethods } =
      useConnectionPaymentMethodsList({
        customerId,
        connectionId: resolvedConnection?.id,
        withDeleted: false,
      })

    const hasDefaultPaymentMethod =
      loadingPaymentMethods || connectionPaymentMethods.some((method) => method.isDefault)

    const handleConnectionChange = (value: typeof connection): void => {
      form.setFieldValue('connection', value)
      form.setFieldValue('paymentMethod', toResetPaymentMethod(deriveConnectionBehavior(value)))
    }

    const renderBadge = (optionBehavior: ConnectionBehavior) => {
      if (optionBehavior !== ConnectionBehavior.INHERIT) return null
      if (!defaultConnection || hasDefaultPaymentMethod) return null

      return (
        <Chip
          label={translate('text_1789374590510zcsc35s62mc')}
          data-test={CONNECTION_PAYMENT_NO_DEFAULT_METHOD_CHIP_TEST_ID}
        />
      )
    }

    const renderMethodFields = () => (
      <ConnectionPaymentMethodFields
        // The method control seeds its branch into local state, so swapping one specific connection
        // for another — same card, same position — has to remount it or the two desync.
        key={connection?.code ?? connection?.behavior ?? 'inherit'}
        viewType={viewType}
        paymentMethodsList={connectionPaymentMethods}
        hasDefaultPaymentMethod={hasDefaultPaymentMethod}
        value={paymentMethod}
        onChange={(value) => form.setFieldValue('paymentMethod', value)}
        error={paymentMethodError ? translate(paymentMethodError) : undefined}
      />
    )

    const renderSelectedContent = ({
      behavior: optionBehavior,
      code,
      onCodeChange,
    }: {
      behavior: ConnectionBehavior
      code: string
      onCodeChange: (value: string) => void
    }) => {
      if (optionBehavior === ConnectionBehavior.SKIP) return null

      if (optionBehavior === ConnectionBehavior.INHERIT) {
        return resolvedConnection ? renderMethodFields() : null
      }

      return (
        <div className="flex flex-col gap-4">
          <CustomerPaymentConnectionComboBox
            customerId={customerId}
            value={code}
            onChange={onCodeChange}
            error={connectionError ? translate(connectionError) : undefined}
            PopperProps={{ displayInDialog: true }}
          />
          {!!resolvedConnection && renderMethodFields()}
        </div>
      )
    }

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_1784888105056o78z8t3kjrg')}
          description={translate(VIEW_TYPE_PAYMENT_CAPTION_KEYS[viewType])}
        />

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_17828013737948943pe3k8nc')}
            description={translate('text_1789374590509v2b36j2hx7h')}
          />
          <ConnectionBehaviorFields
            name={CONNECTION_BEHAVIOR_RADIO_NAME}
            value={connection}
            onChange={handleConnectionChange}
            labels={{
              [ConnectionBehavior.INHERIT]: {
                label: translate('text_17893745905099pokuoi3cgy'),
              },
              [ConnectionBehavior.SPECIFIC]: {
                label: translate('text_1789374590509lq5ubwjbszf'),
                sublabel: translate('text_1789374590509i8hkubiga0q'),
              },
              [ConnectionBehavior.SKIP]: {
                label: translate('text_1789374590509hp59xx8xxb2'),
                sublabel: translate('text_17893745905093cihf2jox45'),
              },
            }}
            renderBadge={renderBadge}
            renderSelectedContent={renderSelectedContent}
          />
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
