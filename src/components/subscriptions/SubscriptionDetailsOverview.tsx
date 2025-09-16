import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PlanDetailsOverview } from '~/components/plans/details/PlanDetailsOverview'
import {
  SubscriptionForSubscriptionInformationsFragmentDoc,
  useGetSubscriptionForDetailsOverviewQuery,
} from '~/generated/graphql'

import { SubscriptionInformations } from './SubscriptionInformations'

gql`
  query getSubscriptionForDetailsOverview($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      plan {
        id
      }
      ...SubscriptionForSubscriptionInformations
    }
  }

  ${SubscriptionForSubscriptionInformationsFragmentDoc}
`

export const SubscriptionDetailsOverview = () => {
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
      <PlanDetailsOverview planId={subscription?.plan.id} showEntitlementSection={false} />
    </div>
  )
}
