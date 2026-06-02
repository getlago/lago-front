import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  LagoApiError,
  SubscriptionInformationSectionFragmentDoc,
  useGetSubscriptionForDetailsV2OverviewQuery,
} from '~/generated/graphql'

import { SubscriptionInformationSection } from './SubscriptionInformationSection'

gql`
  query getSubscriptionForDetailsV2Overview($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      ...SubscriptionInformationSection
    }
  }

  ${SubscriptionInformationSectionFragmentDoc}
`

type Props = {
  subscriptionId: string
}

export const SubscriptionDetailsV2Overview = ({ subscriptionId }: Props) => {
  const { data, loading } = useGetSubscriptionForDetailsV2OverviewQuery({
    variables: { subscriptionId },
    skip: !subscriptionId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const subscription = data?.subscription

  if (loading && !subscription) {
    return <DetailsPage.Skeleton />
  }

  if (!subscription) {
    return null
  }

  return (
    <div className="flex flex-col gap-12">
      <SubscriptionInformationSection subscription={subscription} />
    </div>
  )
}
