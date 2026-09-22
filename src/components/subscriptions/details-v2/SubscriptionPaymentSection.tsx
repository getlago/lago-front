import { gql } from '@apollo/client'

import { usePaymentSettingsDrawer } from '~/components/paymentSettings/usePaymentSettingsDrawer'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { SubscriptionPaymentMethodDetails } from '~/components/subscriptions/SubscriptionPaymentMethodDetails'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { SubscriptionPaymentSectionFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionSettings } from '~/hooks/customer/useUpdateSubscriptionSettings'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment SubscriptionPaymentSection on Subscription {
    id
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
  const { savePayment } = useUpdateSubscriptionSettings(subscription.id)

  const selectedPaymentMethod = {
    paymentMethodType: subscription.paymentMethodType,
    paymentMethodId: subscription.paymentMethod?.id,
  }

  const { openDrawer } = usePaymentSettingsDrawer({
    viewType: ViewTypeEnum.Subscription,
    externalCustomerId: subscription.customer?.externalId ?? '',
    onSave: savePayment,
  })

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1782825858647rr5zp42t63m')}
        description={translate('text_1782825858647ro8ahgg7uys')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          startIcon: 'pen',
          onClick: () => openDrawer({ paymentMethod: selectedPaymentMethod }),
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
      />

      <SubscriptionPaymentMethodDetails
        selectedPaymentMethod={selectedPaymentMethod}
        externalCustomerId={subscription.customer?.externalId}
      />
    </section>
  )
}
