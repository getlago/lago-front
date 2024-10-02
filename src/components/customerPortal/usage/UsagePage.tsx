import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import UsageSubscriptionItem from '~/components/customerPortal/usage/UsageSubscriptionItem'
import { SubscriptionCurrentUsageTableComponent } from '~/components/subscriptions/SubscriptionCurrentUsageTable'
import { SubscriptionUsageLifetimeGraphComponent } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import {
  SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc,
  useGetCustomerUsageForPortalQuery,
  useGetPortalOrgaInfosQuery,
  useGetSubscriptionForPortalQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment SubscriptionForPortalUsage on Subscription {
    id
    currentBillingPeriodEndingAt

    plan {
      id
      name
      code
      amountCents
      amountCurrency
    }

    customer {
      id
      currency
      applicableTimezone
    }

    lifetimeUsage {
      lastThresholdAmountCents
      nextThresholdAmountCents
      totalUsageAmountCents
      totalUsageFromDatetime
      totalUsageToDatetime
    }
  }

  query getSubscriptionForPortal($subscriptionId: ID!) {
    customerPortalSubscription(id: $subscriptionId) {
      id
      ...SubscriptionForPortalUsage
    }
  }

  query getCustomerUsageForPortal($subscriptionId: ID!) {
    customerPortalCustomerUsage(subscriptionId: $subscriptionId) {
      amountCents
      ...SubscriptionCurrentUsageTableComponentCustomerUsage
    }
  }

  ${SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc}
`

type PortalUsagePageProps = {
  goHome: () => void
}

const UsagePage = ({ goHome }: PortalUsagePageProps) => {
  const { translate } = useInternationalization()
  const customerId = 'cdef1dac-c55f-4d25-985b-cb25c2c8edc1'
  const { itemId } = useParams()

  const subscriptionId = itemId

  const {
    data: customerPortalSubscriptionData,
    loading: customerPortalSubscriptionLoading,
    error: customerPortalSubscriptionError,
    refetch: customerPortalSubscriptionRefetch,
  } = useGetSubscriptionForPortalQuery({
    variables: {
      subscriptionId: itemId as string,
    },
    skip: !itemId,
  })

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
    refetch: usageRefetch,
  } = useGetCustomerUsageForPortalQuery({
    variables: {
      subscriptionId: itemId as string,
    },
    skip: !itemId,
  })

  const { data: organization, loading: organizationLoading } = useGetPortalOrgaInfosQuery()

  const customerPortalSubscription = customerPortalSubscriptionData?.customerPortalSubscription
  const customerPortalOrganization = organization?.customerPortalOrganization

  return (
    <div>
      <PageTitle title={translate('TODO: Usage')} goHome={goHome} />

      <SectionTitle className="mt-8" title={translate('TODO: Plan')} />

      <UsageSubscriptionItem
        subscription={customerPortalSubscription}
        applicableTimezone={customerPortalSubscription?.customer?.applicableTimezone}
      />

      {customerId && subscriptionId && (
        <div className="mt-12">
          <SubscriptionUsageLifetimeGraphComponent
            subscriptionId={subscriptionId}
            customerId={customerId}
            organization={customerPortalOrganization}
            organizationLoading={organizationLoading}
            subscription={customerPortalSubscription}
            subscriptionLoading={customerPortalSubscriptionLoading}
            subscriptionError={customerPortalSubscriptionError}
            refetchLifetimeData={() => customerPortalSubscriptionRefetch()}
          />

          <SubscriptionCurrentUsageTableComponent
            usageData={usageData?.customerPortalCustomerUsage}
            usageLoading={usageLoading}
            usageError={usageError}
            subscription={customerPortalSubscription}
            subscriptionLoading={customerPortalSubscriptionLoading}
            subscriptionError={customerPortalSubscriptionError}
            customerData={customerPortalSubscription?.customer}
            customerLoading={customerPortalSubscriptionLoading}
            customerError={customerPortalSubscriptionError}
            refetchUsage={() => usageRefetch()}
          />
        </div>
      )}
    </div>
  )
}

export default UsagePage
