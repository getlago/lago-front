import { gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import useCustomerPortalNavigation from '~/components/customerPortal/common/hooks/useCustomerPortalNavigation'
import PageTitle from '~/components/customerPortal/common/PageTitle'
import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import useCustomerPortalTranslate from '~/components/customerPortal/common/useCustomerPortalTranslate'
import UsageSubscriptionItem from '~/components/customerPortal/usage/UsageSubscriptionItem'
import { Typography } from '~/components/designSystem'
import { SubscriptionCurrentUsageTableComponent } from '~/components/subscriptions/SubscriptionCurrentUsageTable'
import { SubscriptionUsageLifetimeGraphComponent } from '~/components/subscriptions/SubscriptionUsageLifetimeGraph'
import {
  CustomerUsageForUsageDetailsFragmentDoc,
  SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc,
  useGetCustomerUsageForPortalQuery,
  useGetPortalOrgaInfosQuery,
  useGetSubscriptionForPortalQuery,
} from '~/generated/graphql'

gql`
  fragment SubscriptionForPortalUsage on Subscription {
    id
    currentBillingPeriodEndingAt
    name

    plan {
      id
      name
      invoiceDisplayName
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
      ...CustomerUsageForUsageDetails
    }
  }

  ${SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc}
  ${CustomerUsageForUsageDetailsFragmentDoc}
`

const UsagePage = () => {
  const { goHome } = useCustomerPortalNavigation()
  const { translate, documentLocale } = useCustomerPortalTranslate()
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

      <SectionTitle title={translate('text_172837730716038g8qgz927f')} />

      <UsageSubscriptionItem
        subscription={customerPortalSubscription}
        applicableTimezone={customerPortalSubscription?.customer?.applicableTimezone}
        loading={customerPortalSubscriptionLoading}
      />

      {customerId && subscriptionId && customerPortalSubscription?.lifetimeUsage && (
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
            translate={translate}
            locale={documentLocale}
          />
        </div>
      )}

      {customerId && subscriptionId && (
        <div className="mt-12">
          <SubscriptionCurrentUsageTableComponent
            showExcludingTaxLabel
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
                <Typography className="text-lg font-semibold text-grey-700">
                  {translate('text_1728384061736ee3wi673knf')}
                </Typography>

                <Typography className="text-base font-normal text-grey-600">
                  {translate('text_1728384061736kob8d52j62l')}
                </Typography>
              </div>
            }
            translate={translate}
            locale={documentLocale}
          />
        </div>
      )}
    </div>
  )
}

export default UsagePage
