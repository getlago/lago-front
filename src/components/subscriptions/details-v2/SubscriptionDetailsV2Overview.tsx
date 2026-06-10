import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  InvoicingPaymentsSectionFragmentDoc,
  LagoApiError,
  SubscriptionInformationSectionFragmentDoc,
  useGetSubscriptionForDetailsV2OverviewQuery,
} from '~/generated/graphql'

import { InvoicingPaymentsSection } from './InvoicingPaymentsSection'
import { SubscriptionInformationSection } from './SubscriptionInformationSection'

gql`
  query getSubscriptionForDetailsV2Overview($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      ...SubscriptionInformationSection
      ...InvoicingPaymentsSection
    }
  }

  ${SubscriptionInformationSectionFragmentDoc}
  ${InvoicingPaymentsSectionFragmentDoc}
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
    <div className="flex flex-col gap-12 pt-6">
      <SubscriptionInformationSection subscription={subscription} />
      <InvoicingPaymentsSection subscription={subscription} />
    </div>
  )
}
