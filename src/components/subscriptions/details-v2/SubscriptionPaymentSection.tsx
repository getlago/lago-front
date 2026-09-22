import { gql } from '@apollo/client'

import {
  findConnectionRouting,
  toSelectedConnection,
} from '~/components/connectionSelection/fromConnectionRouting'
import { PaymentMethodValue } from '~/components/connectionSelection/PaymentMethodValue'
import { useConnectionRoutingGridItems } from '~/components/connectionSelection/useConnectionRoutingGridItems'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { seedConnection } from '~/components/paymentSettings/connectionFirst/seedConnection'
import { useConnectionPaymentSettingsDrawer } from '~/components/paymentSettings/connectionFirst/useConnectionPaymentSettingsDrawer'
import { usePaymentSettingsDrawer } from '~/components/paymentSettings/usePaymentSettingsDrawer'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { SubscriptionPaymentMethodDetails } from '~/components/subscriptions/SubscriptionPaymentMethodDetails'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import {
  ConnectionCategoryEnum,
  FeatureFlagEnum,
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

  const { openDrawer: openLegacyPaymentDrawer } = usePaymentSettingsDrawer({
    viewType: ViewTypeEnum.Subscription,
    externalCustomerId: subscription.customer?.externalId ?? '',
    onSave: savePayment,
  })

  const openPaymentDrawer = (): void => {
    if (hasMultiConnection) {
      const connection = seedConnection(toSelectedConnection(paymentRouting), selectedPaymentMethod)

      openConnectionPaymentDrawer({
        connection,
        paymentMethod: {
          ...selectedPaymentMethod,
          paymentMethodId: subscription.paymentMethod?.id ?? null,
        },
      })
      return
    }

    openLegacyPaymentDrawer({ paymentMethod: selectedPaymentMethod })
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
    </section>
  )
}
