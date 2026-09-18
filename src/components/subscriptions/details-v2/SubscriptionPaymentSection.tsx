import { gql } from '@apollo/client'
import { useRef } from 'react'

import {
  findConnectionRouting,
  toSelectedConnection,
} from '~/components/connectionSelection/fromConnectionRouting'
import { useConnectionPaymentSettingsDrawer } from '~/components/paymentSettings/connectionFirst/useConnectionPaymentSettingsDrawer'
import {
  PaymentSettingsDrawer,
  PaymentSettingsDrawerRef,
} from '~/components/paymentSettings/PaymentSettingsDrawer'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { SubscriptionPaymentMethodDetails } from '~/components/subscriptions/SubscriptionPaymentMethodDetails'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  FeatureFlagEnum,
  PaymentMethodTypeEnum,
  SubscriptionPaymentSectionFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionSettings } from '~/hooks/customer/useUpdateSubscriptionSettings'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment SubscriptionPaymentSection on Subscription {
    id
    connections {
      category
      behavior
      code
    }
    paymentMethodType
    paymentMethod {
      id
    }
    customer {
      id
      externalId
    }
  }
`

type SubscriptionPaymentSectionProps = {
  subscription: SubscriptionPaymentSectionFragment
}

export const SubscriptionPaymentSection = ({ subscription }: SubscriptionPaymentSectionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { hasFeatureFlag } = useOrganizationInfos()
  const hasMultiConnection = hasFeatureFlag(FeatureFlagEnum.MultiConnection)
  const drawerRef = useRef<PaymentSettingsDrawerRef>(null)
  const { savePayment } = useUpdateSubscriptionSettings(subscription.id)

  const { openDrawer: openConnectionPaymentDrawer } = useConnectionPaymentSettingsDrawer({
    viewType: ViewTypeEnum.Subscription,
    customerId: subscription.customer?.id ?? '',
    onSave: savePayment,
  })

  const selectedPaymentMethod = {
    paymentMethodType: subscription.paymentMethodType,
    paymentMethodId: subscription.paymentMethod?.id,
  }

  const openPaymentDrawer = (): void => {
    if (hasMultiConnection) {
      const paymentRouting = findConnectionRouting(
        subscription.connections,
        ConnectionCategoryEnum.Payment,
      )
      let connection = toSelectedConnection(paymentRouting)

      if (!paymentRouting && subscription.paymentMethodType === PaymentMethodTypeEnum.Manual) {
        connection = { behavior: ConnectionBehaviorEnum.Skip }
      }

      openConnectionPaymentDrawer({
        connection,
        paymentMethod: {
          ...selectedPaymentMethod,
          paymentMethodId: subscription.paymentMethod?.id ?? null,
        },
      })
      return
    }

    drawerRef.current?.openDrawer({ paymentMethod: selectedPaymentMethod })
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1782825858647rr5zp42t63m')}
        description={translate('text_1782825858647ro8ahgg7uys')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          startIcon: 'pen',
          onClick: openPaymentDrawer,
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
      />

      <SubscriptionPaymentMethodDetails
        selectedPaymentMethod={selectedPaymentMethod}
        externalCustomerId={subscription.customer?.externalId}
      />

      {!hasMultiConnection && (
        <PaymentSettingsDrawer
          ref={drawerRef}
          viewType={ViewTypeEnum.Subscription}
          externalCustomerId={subscription.customer?.externalId ?? ''}
          onSave={savePayment}
        />
      )}
    </section>
  )
}
