import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'

import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS } from '~/core/router'
import {
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PlanDetailsTabsOptionsEnum } from '~/pages/PlanDetails'
import { theme } from '~/styles'
import { DetailsInfoGrid, DetailsInfoItem, DetailsSectionTitle } from '~/styles/detailsPage'

import { ConditionalWrapper } from '../ConditionalWrapper'
import { Alert, Status, StatusType } from '../designSystem'
import LifetimeUsage from '../graphs/LifetimeUsage'

gql`
  fragment SubscriptionForSubscriptionInformations on Subscription {
    id
    externalId
    status
    subscriptionAt
    endingAt
    nextPendingStartDate
    nextPlan {
      id
      name
    }
    customer {
      id
      name
    }
    plan {
      id
      name
      parent {
        id
        name
      }
    }
  }
`

const SubscriptionInformations = ({
  subscription,
}: {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}) => {
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  return (
    <section>
      <LifetimeUsage />
      <DetailsSectionTitle variant="subhead" noWrap>
        {translate('text_6335e8900c69f8ebdfef5312')}
      </DetailsSectionTitle>
      <ContentWrapper>
        {!!subscription?.nextPlan?.id && (
          <Alert type="info">
            {translate('text_62681c60582e4f00aa82938a', {
              planName: subscription?.nextPlan?.name,
              dateStartNewPlan: formatTimeOrgaTZ(subscription?.nextPendingStartDate),
            })}
          </Alert>
        )}
        <DetailsInfoItem
          label={translate('text_65201c5a175a4b0238abf298')}
          value={subscription?.externalId}
        />
        <DetailsInfoGrid
          grid={[
            {
              label: translate('text_65201c5a175a4b0238abf29a'),
              value: (
                <ConditionalWrapper
                  condition={!!subscription?.customer?.id}
                  validWrapper={(children) => (
                    <Link
                      to={generatePath(CUSTOMER_DETAILS_ROUTE, {
                        customerId: subscription?.customer?.id as string,
                      })}
                    >
                      {children}
                    </Link>
                  )}
                  invalidWrapper={(children) => <>{children}</>}
                >
                  {subscription?.customer?.name}
                </ConditionalWrapper>
              ),
            },
            {
              label: translate('text_62d7f6178ec94cd09370e5fb'),
              value: (
                <Status
                  {...(subscription?.status === StatusTypeEnum.Pending
                    ? {
                        type: StatusType.default,
                        label: 'pending',
                      }
                    : {
                        type: StatusType.success,
                        label: 'active',
                      })}
                />
              ),
            },
            {
              label: translate('text_65201c5a175a4b0238abf29e'),
              value: DateTime.fromISO(subscription?.subscriptionAt).toFormat('LLL. dd, yyyy'),
            },
            {
              label: translate('text_65201c5a175a4b0238abf2a0'),
              value: !!subscription?.endingAt
                ? DateTime.fromISO(subscription?.endingAt).toFormat('LLL. dd, yyyy')
                : '-',
            },
            !!subscription?.plan?.parent?.id && {
              label: translate('text_65201c5a175a4b0238abf2a2'),
              value: (
                <ConditionalWrapper
                  condition={
                    !!subscription?.customer?.id &&
                    !!subscription?.id &&
                    !!subscription?.plan?.parent?.id
                  }
                  validWrapper={(children) => (
                    <Link
                      to={generatePath(CUSTOMER_SUBSCRIPTION_PLAN_DETAILS, {
                        customerId: subscription?.customer?.id as string,
                        subscriptionId: subscription?.id as string,
                        planId: subscription?.plan?.parent?.id as string,
                        tab: PlanDetailsTabsOptionsEnum.overview,
                      })}
                    >
                      {children}
                    </Link>
                  )}
                  invalidWrapper={(children) => <>{children}</>}
                >
                  {subscription?.plan?.parent?.name}
                </ConditionalWrapper>
              ),
            },
          ]}
        />
      </ContentWrapper>
    </section>
  )
}

export default SubscriptionInformations

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`
