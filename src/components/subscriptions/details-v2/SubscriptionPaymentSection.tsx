import { gql } from '@apollo/client'
import { useRef } from 'react'

import {
  findConnectionRouting,
  toSelectedConnection,
} from '~/components/connectionSelection/fromConnectionRouting'
import { PaymentMethodValue } from '~/components/connectionSelection/PaymentMethodValue'
import { useConnectionRoutingGridItems } from '~/components/connectionSelection/useConnectionRoutingGridItems'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { DetailsPage } from '~/components/layouts/DetailsPage'
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

export const SubscriptionPaymentSection = ({
  subscription,
}: SubscriptionPaymentSectionProps): JSX.Element => {
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

  const paymentRouting = findConnectionRouting(
    subscription.connections,
    ConnectionCategoryEnum.Payment,
  )
  const paymentItems = useConnectionRoutingGridItems({
    categories: [ConnectionCategory.Payment],
    connections: subscription.connections,
    customerId: subscription.customer?.id,
  })

  const selectedPaymentMethod = {
    paymentMethodType: subscription.paymentMethodType,
    paymentMethodId: subscription.paymentMethod?.id,
  }

  const openPaymentDrawer = (): void => {
    if (hasMultiConnection) {
      let connection = toSelectedConnection(paymentRouting)

      if (!connection && subscription.paymentMethodType === PaymentMethodTypeEnum.Manual) {
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

      {hasMultiConnection ? (
        <DetailsPage.InfoGrid
          grid={[
            ...paymentItems,
            {
              label: translate('text_1773043324341qj7t72i7qnk'),
              value: (
                <PaymentMethodValue
                  selectedPaymentMethod={selectedPaymentMethod}
                  customerId={subscription.customer?.id}
                  paymentRouting={paymentRouting}
                />
              ),
            },
          ]}
        />
      ) : (
        <SubscriptionPaymentMethodDetails
          selectedPaymentMethod={selectedPaymentMethod}
          externalCustomerId={subscription.customer?.externalId}
        />
      )}

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
