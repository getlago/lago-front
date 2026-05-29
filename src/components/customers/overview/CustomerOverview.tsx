import { gql } from '@apollo/client'
import { FC, useEffect } from 'react'

import { PageSectionTitle } from '~/components/layouts/Section'
import {
  CurrencyEnum,
  FeatureFlagEnum,
  useGetCustomerGrossRevenuesLazyQuery,
  useGetCustomerOverdueBalancesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { CustomerInvoiceBalancesBreakdown } from './CustomerInvoiceBalancesBreakdown'
import { CustomerInvoiceBalancesLegacyCards } from './CustomerInvoiceBalancesLegacyCards'

export { OVERDUE_INVOICES_ALERT_TEST_ID } from './CustomerInvoiceBalancesLegacyCards'

export const CUSTOMER_OVERVIEW_BREAKDOWN = 'customer-overview-breakdown'
export const CUSTOMER_OVERVIEW_LEGACY_CARDS = 'customer-overview-legacy-cards'

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
  userCurrency?: CurrencyEnum
  customerBillingEntity?: { id: string; code: string; name?: string | null } | null
}

export const CustomerOverview: FC<CustomerOverviewProps> = ({
  externalCustomerId,
  userCurrency,
  customerBillingEntity,
}) => {
  const { translate } = useInternationalization()
  const { organization, hasFeatureFlag } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()

  const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)
  const hasMultiEntityBilling = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)
  const showBreakdown = hasMultiCurrency || hasMultiEntityBilling

  const currency = userCurrency ?? organization?.defaultCurrency ?? CurrencyEnum.Usd

  const [
    getCustomerOverdueBalances,
    { data: overdueBalancesData, loading: overdueBalancesLoading, error: overdueBalancesError },
  ] = useGetCustomerOverdueBalancesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
    },
  })
  const [
    getCustomerGrossRevenues,
    { data: grossRevenuesData, loading: grossRevenuesLoading, error: grossRevenuesError },
  ] = useGetCustomerGrossRevenuesLazyQuery({
    variables: {
      externalCustomerId: externalCustomerId || '',
    },
  })

  const refreshOverdueBalances = () =>
    getCustomerOverdueBalances({
      variables: {
        expireCache: true,
        externalCustomerId: externalCustomerId || '',
      },
    })

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
  const lastPaymentRequestCreatedAt =
    overdueBalancesData?.paymentRequests.collection[0]?.createdAt ?? undefined

  if (overdueBalancesError && grossRevenuesError) return null

  const isLoadingAnalytics = grossRevenuesLoading || overdueBalancesLoading
  const hideEmptyBreakdown =
    showBreakdown &&
    !isLoadingAnalytics &&
    grossRevenues.length === 0 &&
    overdueBalances.length === 0

  if (hideEmptyBreakdown) return null

  return (
    <div className="flex flex-col gap-12">
      <section
        data-test={showBreakdown ? CUSTOMER_OVERVIEW_BREAKDOWN : CUSTOMER_OVERVIEW_LEGACY_CARDS}
      >
        <PageSectionTitle
          title={
            showBreakdown
              ? translate('text_1746526888530pbjcvaaox2c')
              : translate('text_6670a7222702d70114cc7954')
          }
          subtitle={
            showBreakdown
              ? translate('text_17797160260210wwib2sy0sb')
              : translate('text_1737649151689ldyvwtq9ov1')
          }
        />

        {showBreakdown ? (
          <CustomerInvoiceBalancesBreakdown
            grossRevenues={grossRevenues}
            overdueBalances={overdueBalances}
            customerBillingEntity={customerBillingEntity}
            isLoading={grossRevenuesLoading || overdueBalancesLoading}
          />
        ) : (
          <CustomerInvoiceBalancesLegacyCards
            currency={currency}
            grossRevenues={grossRevenues}
            grossRevenuesLoading={grossRevenuesLoading}
            grossRevenuesError={grossRevenuesError}
            overdueBalances={overdueBalances}
            overdueBalancesLoading={overdueBalancesLoading}
            overdueBalancesError={overdueBalancesError}
            lastPaymentRequestCreatedAt={lastPaymentRequestCreatedAt}
            refreshOverdueBalances={refreshOverdueBalances}
          />
        )}
      </section>
    </div>
  )
}
