import { gql } from '@apollo/client'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { BillingEntityFilterPicker } from '~/components/billingEntity/BillingEntityFilterPicker'
import { CurrencyPicker } from '~/components/form'
import Gross from '~/components/graphs/Gross'
import MonthSelectorDropdown, {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { PageSectionTitle } from '~/components/layouts/Section'
import {
  CurrencyEnum,
  FeatureFlagEnum,
  useGetCustomerSubscriptionForUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getCustomerSubscriptionForUsage($id: ID!) {
    customer(id: $id) {
      id
      externalId
      currency
    }
  }
`

export const CustomerUsage = () => {
  const { customerId = '' } = useParams()
  const { organization, hasFeatureFlag } = useOrganizationInfos()
  const { translate } = useInternationalization()

  const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)
  const hasMultiEntityBilling = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)

  const [periodScope, setPeriodScope] = useState<TPeriodScopeTranslationLookupValue>(
    AnalyticsPeriodScopeEnum.Year,
  )
  const { data } = useGetCustomerSubscriptionForUsageQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyEnum | undefined>(undefined)
  const [selectedBillingEntity, setSelectedBillingEntity] = useState<{
    id: string
    code: string
    label: string
  } | null>(null)

  return (
    <div>
      <PageSectionTitle
        title={translate('text_65564e8e4af2340050d431be')}
        subtitle={translate('text_173764736415670g9n7v9tth')}
        customAction={
          <div className="flex items-center gap-2">
            <MonthSelectorDropdown periodScope={periodScope} setPeriodScope={setPeriodScope} />

            {hasMultiCurrency && (
              <CurrencyPicker
                value={selectedCurrency}
                onChange={(currency) => setSelectedCurrency(currency)}
                onClear={() => setSelectedCurrency(undefined)}
                placeholder={translate('text_632b4acf0c41206cbcb8c324')}
                containerClassName="w-36"
              />
            )}

            {hasMultiEntityBilling && (
              <BillingEntityFilterPicker
                value={selectedBillingEntity?.code}
                onChange={({ id, code, label }) => setSelectedBillingEntity({ id, code, label })}
                onClear={() => setSelectedBillingEntity(null)}
                placeholder={translate('text_17436114971570doqrwuwhf0')}
                containerClassName="w-40"
              />
            )}
          </div>
        }
      />

      <AnalyticsStateProvider>
        <Gross
          className="analytics-graph py-0"
          currency={
            hasMultiCurrency
              ? selectedCurrency
              : data?.customer?.currency || organization?.defaultCurrency || CurrencyEnum.Usd
          }
          period={periodScope}
          externalCustomerId={data?.customer?.externalId}
          billingEntityId={selectedBillingEntity?.id}
        />
      </AnalyticsStateProvider>
    </div>
  )
}
