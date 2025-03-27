import { gql } from '@apollo/client'
import { RefObject, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import Gross from '~/components/graphs/Gross'
import MonthSelectorDropdown, {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useGetCustomerSubscriptionForUsageQuery } from '~/generated/graphql'
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

interface CustomerUsageProps {
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export const CustomerUsage = ({ premiumWarningDialogRef }: CustomerUsageProps) => {
  const { customerId = '' } = useParams()
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const [periodScope, setPeriodScope] = useState<TPeriodScopeTranslationLookupValue>(
    AnalyticsPeriodScopeEnum.Year,
  )
  const { data } = useGetCustomerSubscriptionForUsageQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  return (
    <div>
      <PageSectionTitle
        title={translate('text_65564e8e4af2340050d431be')}
        subtitle={translate('text_173764736415670g9n7v9tth')}
        customAction={
          <MonthSelectorDropdown
            periodScope={periodScope}
            setPeriodScope={setPeriodScope}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />
        }
      />

      <AnalyticsStateProvider>
        <Gross
          // eslint-disable-next-line tailwindcss/no-custom-classname
          className="analytics-graph py-0"
          currency={data?.customer?.currency || organization?.defaultCurrency}
          period={periodScope}
          externalCustomerId={data?.customer?.externalId}
        />
      </AnalyticsStateProvider>
    </div>
  )
}
