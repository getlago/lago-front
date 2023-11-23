import { gql } from '@apollo/client'
import { RefObject, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Typography } from '~/components/designSystem'
import Gross from '~/components/graphs/Gross'
import MonthSelectorDropdown, {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  StatusTypeEnum,
  TimezoneEnum,
  useGetCustomerSubscriptionForUsageQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { NAV_HEIGHT, theme } from '~/styles'
import { SectionHeader } from '~/styles/customer'

import { UsageItem, UsageItemSkeleton } from './UsageItem'

gql`
  fragment CustomerSubscriptionForUsage on Subscription {
    id
    name
    status
    plan {
      id
      name
      code
    }
  }

  query getCustomerSubscriptionForUsage($id: ID!) {
    customer(id: $id) {
      id
      externalId
      currency
      subscriptions(status: [active, pending]) {
        id
        ...CustomerSubscriptionForUsage
      }
    }
  }
`

interface CustomerUsageProps {
  customerTimezone?: TimezoneEnum
  premiumWarningDialogRef: RefObject<PremiumWarningDialogRef>
}

export const CustomerUsage = ({
  customerTimezone,
  premiumWarningDialogRef,
}: CustomerUsageProps) => {
  const { customerId } = useParams()
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const [periodScope, setPeriodScope] = useState<TPeriodScopeTranslationLookupValue>(
    AnalyticsPeriodScopeEnum.Year,
  )
  const { data, loading } = useGetCustomerSubscriptionForUsageQuery({
    variables: { id: customerId as string },
    skip: !customerId,
  })
  const subscriptions = data?.customer?.subscriptions

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

      <GrossGraphWrapper $showDivider={loading || !!subscriptions?.length}>
        <Gross
          className="analytics-graph"
          currency={data?.customer?.currency || organization?.defaultCurrency}
          period={periodScope}
          externalCustomerId={data?.customer?.externalId}
        />
      </GrossGraphWrapper>

      {(loading || !!subscriptions?.length) && (
        <>
          <Title variant="subhead">{translate('text_62c3f3fca8a1625624e8337b')}</Title>
          {loading ? (
            <Content>
              {[0, 1, 2].map((i) => (
                <UsageItemSkeleton key={`customer-usage-skeleton-${i}`} />
              ))}
            </Content>
          ) : (
            <Content>
              {subscriptions
                ?.filter((s) => s.status === StatusTypeEnum.Active)
                .map((subscription) => (
                  <UsageItem
                    key={subscription?.id}
                    customerId={customerId as string}
                    subscription={subscription}
                    customerTimezone={customerTimezone}
                  />
                ))}
            </Content>
          )}
        </>
      )}
    </div>
  )
}

const Title = styled(Typography)`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Content = styled.div`
  > :not(:last-child) {
    margin-bottom: ${theme.spacing(4)};
  }
`

const GrossGraphWrapper = styled.div<{ $showDivider: boolean }>`
  ${({ $showDivider }) =>
    $showDivider &&
    css`
      border-bottom: 1px solid ${theme.palette.grey[300]};
      margin-bottom: ${theme.spacing(8)};
    `}
`
