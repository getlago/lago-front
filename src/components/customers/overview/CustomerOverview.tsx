import { gql } from '@apollo/client'
import { FC, useEffect, useState } from 'react'

import { PageSectionTitle } from '~/components/layouts/Section'
import {
  useGetCustomerGrossRevenuesLazyQuery,
  useGetCustomerOverdueBalancesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { CustomerInvoiceBalancesBreakdown } from './CustomerInvoiceBalancesBreakdown'

export const CUSTOMER_OVERVIEW_BREAKDOWN = 'customer-overview-breakdown'

gql`
  query getCustomerOverdueBalances(
    $externalCustomerId: String!
    $currency: CurrencyEnum
    $expireCache: Boolean
  ) {
    paymentRequests(externalCustomerId: $externalCustomerId) {
      collection {
        createdAt
      }
    }

    overdueBalances(
      externalCustomerId: $externalCustomerId
      currency: $currency
      expireCache: $expireCache
    ) {
      collection {
        amountCents
        billingEntityId
        currency
        lagoInvoiceIds
      }
    }
  }

  query getCustomerGrossRevenues(
    $externalCustomerId: String!
    $currency: CurrencyEnum
    $expireCache: Boolean
  ) {
    grossRevenues(
      externalCustomerId: $externalCustomerId
      currency: $currency
      expireCache: $expireCache
    ) {
      collection {
        amountCents
        billingEntityId
        currency
        invoicesCount
        month
      }
    }
  }
`

interface CustomerOverviewProps {
  externalCustomerId?: string
  customerBillingEntity?: { id: string; code: string; name?: string | null } | null
}

export const CustomerOverview: FC<CustomerOverviewProps> = ({
  externalCustomerId,
  customerBillingEntity,
}) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()

  const [
    getCustomerOverdueBalances,
    { data: overdueBalancesData, loading: overdueBalancesLoading, error: overdueBalancesError },
  ] = useGetCustomerOverdueBalancesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
    },
    notifyOnNetworkStatusChange: true,
  })
  const [
    getCustomerGrossRevenues,
    { data: grossRevenuesData, loading: grossRevenuesLoading, error: grossRevenuesError },
  ] = useGetCustomerGrossRevenuesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
    },
    notifyOnNetworkStatusChange: true,
  })

  // Apollo's `loading` flag is unreliable when previous data sits in the
  // cache: even with `notifyOnNetworkStatusChange + network-only`, the hook
  // returns `loading: false` synchronously because there is already a payload
  // to render. A dedicated state explicitly mirrors the refresh round-trip
  // so the Table skeleton renders for the full duration of the click.
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshBreakdown = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        getCustomerOverdueBalances({
          fetchPolicy: 'network-only',
          variables: {
            expireCache: true,
            externalCustomerId: externalCustomerId || '',
          },
        }),
        getCustomerGrossRevenues({
          fetchPolicy: 'network-only',
          variables: {
            expireCache: true,
            externalCustomerId: externalCustomerId || '',
          },
        }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!externalCustomerId) return

    if (hasPermissions(['analyticsView'])) {
      getCustomerOverdueBalances()
      getCustomerGrossRevenues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCustomerId])

  const grossRevenues = grossRevenuesData?.grossRevenues.collection ?? []
  const overdueBalances = overdueBalancesData?.overdueBalances.collection ?? []

  if (overdueBalancesError && grossRevenuesError) return null

  const isLoadingAnalytics = grossRevenuesLoading || overdueBalancesLoading || isRefreshing
  const hideEmptyBreakdown =
    !isLoadingAnalytics && grossRevenues.length === 0 && overdueBalances.length === 0

  if (hideEmptyBreakdown) return null

  return (
    <div className="flex flex-col gap-12">
      <section data-test={CUSTOMER_OVERVIEW_BREAKDOWN}>
        <PageSectionTitle
          className="items-center"
          title={translate('text_1746526888530pbjcvaaox2c')}
          subtitle={translate('text_17797160260210wwib2sy0sb')}
          action={
            hasPermissions(['analyticsView'])
              ? {
                  title: translate('text_1738748043939zqoqzz350yj'),
                  onClick: refreshBreakdown,
                }
              : undefined
          }
        />

        <CustomerInvoiceBalancesBreakdown
          grossRevenues={grossRevenues}
          overdueBalances={overdueBalances}
          customerBillingEntity={customerBillingEntity}
          isLoading={isLoadingAnalytics}
        />
      </section>
    </div>
  )
}
