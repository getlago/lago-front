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
      interval
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
      <PageTitle title={translate('text_1728377307160r73ggjgpulg')} goHome={goHome} />

      <SectionTitle className="mt-8" title={translate('text_172837730716038g8qgz927f')} />

      <UsageSubscriptionItem
        subscription={customerPortalSubscription}
        applicableTimezone={customerPortalSubscription?.customer?.applicableTimezone}
      />

      {customerId && subscriptionId && (
        <div className="mt-12">
          {customerPortalSubscription?.lifetimeUsage && (
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
          )}

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
            noUsageOverride={
              <div className="mt-6 flex flex-col gap-3">
                <h6 className="text-lg font-semibold text-grey-700">
                  {translate('text_1728384061736ee3wi673knf')}
                </h6>

                <p className="text-base font-normal text-grey-600">
                  {translate('text_1728384061736kob8d52j62l')}
                </p>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

export default UsagePage
