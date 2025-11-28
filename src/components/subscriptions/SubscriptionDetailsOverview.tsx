import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PlanDetailsOverview } from '~/components/plans/details/PlanDetailsOverview'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import {
  SubscriptionForSubscriptionInformationsFragmentDoc,
  useGetSubscriptionForDetailsOverviewQuery,
} from '~/generated/graphql'

import { PaymentInvoiceDetails } from './PaymentInvoiceDetails'
import { SubscriptionInformations } from './SubscriptionInformations'

gql`
  query getSubscriptionForDetailsOverview($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      plan {
        id
      }
      paymentMethodType
      paymentMethod {
        id
        deletedAt
        details {
          brand
          expirationYear
          expirationMonth
          last4
          type
        }
      }
      ...SubscriptionForSubscriptionInformations
    }
  }

  ${SubscriptionForSubscriptionInformationsFragmentDoc}
`

export const SubscriptionDetailsOverview = () => {
  const hasAccessToMultiPaymentFlow = isFeatureFlagActive(FeatureFlags.MULTI_PAYMENT_FLOW)
  const { subscriptionId } = useParams()
  const { data: subscriptionResult, loading: isSubscriptionLoading } =
    useGetSubscriptionForDetailsOverviewQuery({
      variables: { subscriptionId: subscriptionId as string },
      skip: !subscriptionId,
    })
  const subscription = subscriptionResult?.subscription

  if (isSubscriptionLoading) {
    return (
      <div className="flex flex-col gap-12">
        <DetailsPage.Skeleton />
        <DetailsPage.Skeleton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <SubscriptionInformations subscription={subscription} />
      {hasAccessToMultiPaymentFlow && (
        <PaymentInvoiceDetails
          selectedPaymentMethod={{
            paymentMethodType: subscription?.paymentMethodType,
            paymentMethodId: subscription?.paymentMethod?.id,
          }}
          externalCustomerId={subscription?.customer?.externalId}
        />
      )}
      <PlanDetailsOverview planId={subscription?.plan.id} showEntitlementSection={false} />
    </div>
  )
}
