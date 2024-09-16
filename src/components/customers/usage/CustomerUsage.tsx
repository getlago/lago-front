import { gql } from '@apollo/client'
import { RefObject, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Alert, Typography } from '~/components/designSystem'
import Gross from '~/components/graphs/Gross'
import MonthSelectorDropdown, {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { CUSTOMER_DETAILS_TAB_ROUTE } from '~/core/router'
import { useGetCustomerSubscriptionForUsageQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { CustomerDetailsTabsOptions } from '~/pages/CustomerDetails'
import { NAV_HEIGHT, theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

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
  const { data, loading } = useGetCustomerSubscriptionForUsageQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  return (
    <div>
      <SectionHeader variant="subhead">
        {translate('text_65564e8e4af2340050d431be')}

        <MonthSelectorDropdown
          periodScope={periodScope}
          setPeriodScope={setPeriodScope}
          premiumWarningDialogRef={premiumWarningDialogRef}
        />
      </SectionHeader>

      <GrossGraphWrapper $showDivider={loading}>
        <Gross
          className="analytics-graph"
          currency={data?.customer?.currency || organization?.defaultCurrency}
          period={periodScope}
          externalCustomerId={data?.customer?.externalId}
        />
      </GrossGraphWrapper>

      <Title variant="subhead">{translate('text_62c3f3fca8a1625624e8337b')}</Title>
      <Alert type="info">
        <Typography
          variant="body"
          color="grey700"
          html={translate('text_1725983967306v77yaw6dtm1', {
            link: generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
              customerId,
              tab: CustomerDetailsTabsOptions.overview,
            }),
          })}
        />
      </Alert>
    </div>
  )
}

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const GrossGraphWrapper = styled.div<{ $showDivider: boolean }>`
  ${({ $showDivider }) =>
    $showDivider &&
    css`
      border-bottom: 1px solid ${theme.palette.grey[300]};
      margin-bottom: ${theme.spacing(8)};
    `}
`
