import { useStore } from '@tanstack/react-form'

import { paymentAvatarMapping } from '~/components/avatarMappings'
import { ConnectionBehaviorFields } from '~/components/connectionSelection/ConnectionBehaviorFields'
import { CustomerPaymentConnectionComboBox } from '~/components/connectionSelection/CustomerPaymentConnectionComboBox'
import {
  ConnectionBehavior,
  deriveConnectionBehavior,
} from '~/components/connectionSelection/types'
import { Avatar } from '~/components/designSystem/Avatar'
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

export const CONNECTION_NO_DEFAULT_CHIP_TEST_ID = 'connection-payment-no-default-connection-chip'
export const CONNECTION_DEFAULT_CHIP_TEST_ID = 'connection-payment-default-connection-chip'

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

    const { data: connectionPaymentMethods } = useConnectionPaymentMethodsList({
      customerId,
      connectionId: resolvedConnection?.id,
      withDeleted: false,
    })

    const defaultPaymentMethod = connectionPaymentMethods.find((method) => method.isDefault)

    const handleConnectionChange = (value: typeof connection): void => {
      form.setFieldValue('connection', value)
      form.setFieldValue('paymentMethod', toResetPaymentMethod(deriveConnectionBehavior(value)))
    }

    const renderBadge = (optionBehavior: ConnectionBehavior) => {
      if (optionBehavior !== ConnectionBehavior.INHERIT) return null

      if (!defaultConnection) {
        return (
          <Chip
            color="grey600"
            label={translate('text_1789382180711vi1jj3immjw')}
            data-test={CONNECTION_NO_DEFAULT_CHIP_TEST_ID}
          />
        )
      }

      return (
        <Chip
          label={
            <span className="flex items-center gap-2">
              {!!defaultConnection.provider && (
                <Avatar size="small" variant="connector-full">
                  {paymentAvatarMapping[defaultConnection.provider]}
                </Avatar>
              )}
              {defaultConnection.code}
            </span>
          }
          data-test={CONNECTION_DEFAULT_CHIP_TEST_ID}
        />
      )
    }

    const renderMethodFields = () => (
      <ConnectionPaymentMethodFields
        key={connection?.code ?? connection?.behavior ?? 'inherit'}
        viewType={viewType}
        paymentMethodsList={connectionPaymentMethods}
        defaultPaymentMethod={defaultPaymentMethod}
        value={paymentMethod}
        onChange={(value) => form.setFieldValue('paymentMethod', value)}
        error={paymentMethodError ? translate(paymentMethodError) : undefined}
      />
    )

    const renderChoiceContent = ({
      behavior: optionBehavior,
      code,
      onCodeChange,
    }: {
      behavior: ConnectionBehavior
      code: string
      onCodeChange: (value: string) => void
    }) => {
      if (optionBehavior !== ConnectionBehavior.SPECIFIC) return null

      return (
        <CustomerPaymentConnectionComboBox
          customerId={customerId}
          value={code}
          onChange={onCodeChange}
          error={connectionError ? translate(connectionError) : undefined}
          PopperProps={{ displayInDialog: true }}
        />
      )
    }

    const renderSelectedContent = (optionBehavior: ConnectionBehavior) => {
      if (optionBehavior === ConnectionBehavior.SKIP) return null
      if (!resolvedConnection) return null

      return renderMethodFields()
    }

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_1789381469546g27fewh3r8c')}
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
            renderChoiceContent={renderChoiceContent}
            renderSelectedContent={renderSelectedContent}
          />
        </CenteredPage.PageSection>
      </CenteredPage.SectionWrapper>
    )
  },
})
