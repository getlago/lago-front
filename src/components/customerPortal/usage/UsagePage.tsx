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
  CustomerProjectedUsageForUsageDetailsFragmentDoc,
  CustomerUsageForUsageDetailsFragmentDoc,
  GetCustomerProjectedUsageForPortalQuery,
  GetCustomerUsageForPortalQuery,
  PremiumIntegrationTypeEnum,
  SubscriptionCurrentUsageTableComponentCustomerProjectedUsageFragmentDoc,
  SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc,
  useGetCustomerProjectedUsageForPortalQuery,
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

  query getCustomerProjectedUsageForPortal($subscriptionId: ID!) {
    customerPortalCustomerProjectedUsage(subscriptionId: $subscriptionId) {
      amountCents
      ...SubscriptionCurrentUsageTableComponentCustomerProjectedUsage
      ...CustomerProjectedUsageForUsageDetails
    }
  }

  ${SubscriptionCurrentUsageTableComponentCustomerUsageFragmentDoc}
  ${SubscriptionCurrentUsageTableComponentCustomerProjectedUsageFragmentDoc}
  ${CustomerUsageForUsageDetailsFragmentDoc}
  ${CustomerProjectedUsageForUsageDetailsFragmentDoc}
`

const UsagePage = () => {
  const { goHome } = useCustomerPortalNavigation()
  const { translate, documentLocale } = useCustomerPortalTranslate()
  const customerId = 'cdef1dac-c55f-4d25-985b-cb25c2c8edc1'
  const { itemId } = useParams()

  const subscriptionId = itemId

  const { data: organization, loading: organizationLoading } = useGetPortalOrgaInfosQuery()

  const customerPortalOrganization = organization?.customerPortalOrganization

  const hasAccessToProjectedUsage = customerPortalOrganization?.premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProjectedUsage,
  )

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

  const usageQuery = hasAccessToProjectedUsage
    ? useGetCustomerProjectedUsageForPortalQuery
    : useGetCustomerUsageForPortalQuery

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
    refetch: usageRefetch,
  } = usageQuery({
    variables: {
      subscriptionId: itemId as string,
    },
    skip: !itemId,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

  const customerPortalSubscription = customerPortalSubscriptionData?.customerPortalSubscription

  const customerUsage = hasAccessToProjectedUsage
    ? (usageData as GetCustomerProjectedUsageForPortalQuery)?.customerPortalCustomerProjectedUsage
    : (usageData as GetCustomerUsageForPortalQuery)?.customerPortalCustomerUsage

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
            usageData={
              customerUsage as GetCustomerUsageForPortalQuery['customerPortalCustomerUsage'] &
                GetCustomerProjectedUsageForPortalQuery['customerPortalCustomerProjectedUsage']
            }
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
                <Typography variant="subhead1" color="grey700">
                  {translate('text_1728384061736ee3wi673knf')}
                </Typography>

                <Typography variant="subhead2" color="grey600">
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
