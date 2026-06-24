import { gql } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { BillingEntityLabel } from '~/components/billingEntity/BillingEntityLabel'
import { Alert } from '~/components/designSystem/Alert'
import { Status } from '~/components/designSystem/Status'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { getBillingTimeEnumTranslationKey } from '~/core/constants/form'
import { subscriptionStatusMapping } from '~/core/constants/statusSubscriptionMapping'
import { PlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS, Link } from '~/core/router'
import {
  FeatureFlagEnum,
  NextSubscriptionTypeEnum,
  StatusTypeEnum,
  SubscriptionInformationFieldsFragment,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment SubscriptionInformationFields on Subscription {
    id
    externalId
    name
    status
    startedAt
    subscriptionAt
    endingAt
    terminatedAt
    billingTime
    downgradePlanDate
    nextSubscriptionAt
    nextSubscriptionType
    billingEntityId
    nextPlan {
      id
      name
    }
    previousPlan {
      id
      name
    }
    previousSubscription {
      id
      downgradePlanDate
    }
    customer {
      id
      name
      displayName
      externalId
      deletedAt
      billingEntity {
        id
        code
        name
      }
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
  subscription?: SubscriptionInformationFieldsFragment | null
}) => {
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  if (subscription?.status === StatusTypeEnum.Terminated) {
    return intlFormatDateTimeOrgaTZ(subscription?.terminatedAt ?? '').date
  }

  if (subscription?.endingAt) {
    return intlFormatDateTimeOrgaTZ(subscription.endingAt).date
  }

  return '-'
}

export const SubscriptionDowngradeAlert = ({
  subscription,
}: {
  subscription?: SubscriptionInformationFieldsFragment | null
}) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  let content: string | null = null

  if (
    subscription?.nextPlan?.id &&
    subscription?.nextSubscriptionType === NextSubscriptionTypeEnum.Downgrade
  ) {
    content = translate('text_62681c60582e4f00aa82938a', {
      planName: subscription.nextPlan.name,
      dateStartNewPlan: intlFormatDateTimeOrgaTZ(subscription.downgradePlanDate).date,
    })
  } else if (subscription?.previousPlan?.id && subscription?.status === StatusTypeEnum.Pending) {
    content = translate('text_1776951742342o96gqg8qg8j', {
      planName: subscription.previousPlan.name,
      dateStartNewPlan: intlFormatDateTimeOrgaTZ(
        subscription.previousSubscription?.downgradePlanDate,
      ).date,
    })
  }

  if (!content) return null

  return <Alert type="info">{content}</Alert>
}

const getSubscriptionInformationGrid = ({
  subscription,
  translate,
  intlFormatDateTimeOrgaTZ,
  showBillingEntityRow,
}: {
  subscription?: SubscriptionInformationFieldsFragment | null
  translate: TranslateFunc
  intlFormatDateTimeOrgaTZ: ReturnType<typeof useOrganizationInfos>['intlFormatDateTimeOrgaTZ']
  showBillingEntityRow: boolean
}) => {
  const isCustomerDeleted = !!subscription?.customer?.deletedAt
  const customerId = subscription?.customer?.id ?? ''
  const subscriptionId = subscription?.id ?? ''
  const parentPlanId = subscription?.plan?.parent?.id

  const customerNameForDisplay = [
    subscription?.customer?.displayName || subscription?.customer?.externalId,
    isCustomerDeleted ? translate('text_1764874328964clrgkmh7i9h') : '',
  ]
    .filter(Boolean)
    .join(' ')

  return [
    {
      label: translate('text_65201c5a175a4b0238abf29a'),
      value:
        !!customerId && !isCustomerDeleted ? (
          <Link to={generatePath(CUSTOMER_DETAILS_ROUTE, { customerId })}>
            {customerNameForDisplay}
          </Link>
        ) : (
          customerNameForDisplay
        ),
    },
    {
      label: translate('text_62ea7cd44cd4b14bb9ac1db7'),
      value: subscription?.billingTime
        ? translate(getBillingTimeEnumTranslationKey[subscription.billingTime])
        : '-',
    },
    {
      label: translate('text_65201c5a175a4b0238abf29e'),
      value: intlFormatDateTimeOrgaTZ(subscription?.startedAt ?? '').date,
    },
    {
      label: translate('text_1781859135627z59hpfpa8pt'),
      value: intlFormatDateTimeOrgaTZ(subscription?.subscriptionAt ?? '').date,
    },
    {
      label: translate('text_65201c5a175a4b0238abf2a0'),
      value: <SubscriptionEndOrTerminatedAt subscription={subscription} />,
    },
    showBillingEntityRow && {
      label: translate('text_17436114971570doqrwuwhf0'),
      value: (
        <BillingEntityLabel
          ownId={subscription?.billingEntityId}
          customerEntity={subscription?.customer?.billingEntity}
        />
      ),
    },
    !!parentPlanId && {
      label: translate('text_65201c5a175a4b0238abf2a2'),
      value:
        !!customerId && !!subscriptionId ? (
          <Link
            to={generatePath(CUSTOMER_SUBSCRIPTION_PLAN_DETAILS, {
              customerId,
              subscriptionId,
              planId: parentPlanId,
              tab: PlanDetailsTabsOptionsEnum.overview,
            })}
          >
            {subscription?.plan?.parent?.name}
          </Link>
        ) : (
          subscription?.plan?.parent?.name
        ),
    },
  ]
}

export const SubscriptionInformationFields = ({
  subscription,
}: {
  subscription?: SubscriptionInformationFieldsFragment | null
}) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ, hasFeatureFlag } = useOrganizationInfos()
  const showBillingEntityRow = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)

  return (
    <div className="flex flex-col gap-4">
      <SubscriptionDowngradeAlert subscription={subscription} />

      <DetailsPage.InfoGridItem
        label={translate('text_1780604419477p7xvwx52oad')}
        value={<Status {...subscriptionStatusMapping(subscription?.status ?? undefined)} />}
      />
      <DetailsPage.InfoGridItem
        label={translate('text_65201c5a175a4b0238abf298')}
        value={
          subscription?.externalId ? (
            <TypographyWithCopy variant="body" color="grey700">
              {subscription.externalId}
            </TypographyWithCopy>
          ) : (
            '-'
          )
        }
      />
      {subscription?.name && (
        <DetailsPage.InfoGridItem
          label={translate('text_1780604419477ujb85w6pk81')}
          value={
            <TypographyWithCopy variant="body" color="grey700">
              {subscription.name}
            </TypographyWithCopy>
          }
        />
      )}
      <DetailsPage.InfoGrid
        grid={getSubscriptionInformationGrid({
          subscription,
          translate,
          intlFormatDateTimeOrgaTZ,
          showBillingEntityRow,
        })}
      />
    </div>
  )
}
