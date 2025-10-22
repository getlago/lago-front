import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { generatePath, Link } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Alert, Status } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { subscriptionStatusMapping } from '~/core/constants/statusSubscriptionMapping'
import { PlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS } from '~/core/router'
import {
  NextSubscriptionTypeEnum,
  StatusTypeEnum,
  SubscriptionForSubscriptionInformationsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment SubscriptionForSubscriptionInformations on Subscription {
    id
    externalId
    status
    subscriptionAt
    endingAt
    terminatedAt
    nextSubscriptionAt
    nextSubscriptionType
    nextPlan {
      id
      name
    }
    customer {
      id
      name
      displayName
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

const SubscriptionEndOrTerminatedAt = ({
  subscription,
}: {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}) => {
  if (subscription?.status === StatusTypeEnum.Terminated) {
    return DateTime.fromISO(subscription?.terminatedAt).toFormat('LLL. dd, yyyy')
  }

  if (subscription?.endingAt) {
    return DateTime.fromISO(subscription?.endingAt).toFormat('LLL. dd, yyyy')
  }

  return '-'
}

export const SubscriptionInformations = ({
  subscription,
}: {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const customerName = subscription?.customer?.displayName

  return (
    <section>
      <DetailsPage.SectionTitle variant="subhead1" noWrap>
        {translate('text_6335e8900c69f8ebdfef5312')}
      </DetailsPage.SectionTitle>
      <div className="flex flex-col gap-4">
        {!!subscription?.nextPlan?.id &&
          subscription?.nextSubscriptionType === NextSubscriptionTypeEnum.Downgrade && (
            <Alert type="info">
              {translate('text_62681c60582e4f00aa82938a', {
                planName: subscription?.nextPlan?.name,
                dateStartNewPlan: intlFormatDateTimeOrgaTZ(subscription?.nextSubscriptionAt).date,
              })}
            </Alert>
          )}
        <DetailsPage.InfoGridItem
          label={translate('text_65201c5a175a4b0238abf298')}
          value={subscription?.externalId}
        />
        <DetailsPage.InfoGrid
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
                  {customerName}
                </ConditionalWrapper>
              ),
            },
            {
              label: translate('text_62d7f6178ec94cd09370e5fb'),
              value: <Status {...subscriptionStatusMapping(subscription?.status ?? undefined)} />,
            },
            {
              label: translate('text_65201c5a175a4b0238abf29e'),
              value: DateTime.fromISO(subscription?.subscriptionAt).toFormat('LLL. dd, yyyy'),
            },
            {
              label: translate('text_65201c5a175a4b0238abf2a0'),
              value: <SubscriptionEndOrTerminatedAt subscription={subscription} />,
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
      </div>
    </section>
  )
}
