import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PlanDetailsV2 } from '~/components/plans/details-v2/PlanDetailsV2'
import {
  LagoApiError,
  PlanDetailsV2FragmentDoc,
  useGetSubscriptionForDetailsV2PlanQuery,
} from '~/generated/graphql'

gql`
  query getSubscriptionForDetailsV2Plan($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      plan {
        id
        ...PlanDetailsV2
      }
    }
  }

  ${PlanDetailsV2FragmentDoc}
`

type Props = {
  subscriptionId: string
}

export const SubscriptionDetailsV2Plan = ({ subscriptionId }: Props) => {
  const { data, loading } = useGetSubscriptionForDetailsV2PlanQuery({
    variables: { subscriptionId },
    skip: !subscriptionId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const plan = data?.subscription?.plan

  if (loading && !plan) {
    return <DetailsPage.Skeleton />
  }

  if (!plan) {
    return null
  }

  return <PlanDetailsV2 planId={plan.id} isInSubscriptionForm subscriptionId={subscriptionId} />
}
