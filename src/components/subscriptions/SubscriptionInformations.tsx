import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { generatePath, Link } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Status } from '~/components/designSystem/Status'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { subscriptionStatusMapping } from '~/core/constants/statusSubscriptionMapping'
import { PlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS } from '~/core/router'
import {
  formatSubscriptionEndDate,
  getPaymentActivationRule,
  getTimeoutDisplayValue,
  shouldShowTimeoutField,
} from '~/core/utils/subscriptionUtils'
import { SubscriptionForSubscriptionInformationsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { SubscriptionDetailAlerts } from './SubscriptionDetailAlerts'

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
    cancellationReason
    activationRules {
      lagoId
      type
      timeoutHours
      status
      expiresAt
    }
    nextPlan {
      id
      name
    }
    customer {
      id
      name
      displayName
      externalId
      deletedAt
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

export const SubscriptionInformations = ({
  subscription,
}: {
  subscription?: SubscriptionForSubscriptionInformationsFragment | null
}) => {
  const { translate } = useInternationalization()

  const isCustomerDeleted = !!subscription?.customer?.deletedAt
  const hasPaymentActivationRule = !!getPaymentActivationRule(subscription)

  const customerNameForDisplay = [
    subscription?.customer?.displayName || subscription?.customer?.externalId,
    isCustomerDeleted ? translate('text_1764874328964clrgkmh7i9h') : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section>
      <DetailsPage.SectionTitle variant="subhead1" noWrap>
        {translate('text_6335e8900c69f8ebdfef5312')}
      </DetailsPage.SectionTitle>
      <div className="flex flex-col gap-4">
        <SubscriptionDetailAlerts subscription={subscription} />

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
                  condition={!!subscription?.customer?.id && !isCustomerDeleted}
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
                  {customerNameForDisplay}
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
              value: formatSubscriptionEndDate(subscription),
            },
            hasPaymentActivationRule && {
              label: translate('text_17743520804341uzgeu20x8b'),
              value: translate('text_1774352080434jni2qajf3vs'),
            },
            shouldShowTimeoutField(subscription) && {
              label: translate('text_17743520804341zw721mkq81'),
              value: getTimeoutDisplayValue(subscription, translate),
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
