import { gql } from '@apollo/client'
import { useMemo } from 'react'

import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  SubscriptionForUseProgressiveBillingTabFragment,
  ThresholdForRecurringThresholdsTableFragmentDoc,
  ThresholdForThresholdsTableFragmentDoc,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment SubscriptionForUseProgressiveBillingTab on Subscription {
    id
    progressiveBillingDisabled
    usageThresholds {
      id
      recurring
      ...ThresholdForThresholdsTable
      ...ThresholdForRecurringThresholdsTable
    }
    plan {
      id
      amountCurrency
      usageThresholds {
        id
        recurring
        ...ThresholdForThresholdsTable
        ...ThresholdForRecurringThresholdsTable
      }
    }
  }

  mutation switchProgressiveBillingDisabledValue($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      progressiveBillingDisabled
    }
  }

  ${ThresholdForThresholdsTableFragmentDoc}
  ${ThresholdForRecurringThresholdsTableFragmentDoc}
`

interface UseSubscriptionProgressiveBillingTabProps {
  subscription?: SubscriptionForUseProgressiveBillingTabFragment | null
}

export const useSubscriptionProgressiveBillingTab = ({
  subscription,
}: UseSubscriptionProgressiveBillingTabProps) => {
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const currency = subscription?.plan?.amountCurrency || CurrencyEnum.Usd
  const hasPremiumIntegration = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  // Threshold filtering
  const subscriptionThresholds = useMemo(
    () => subscription?.usageThresholds || [],
    [subscription?.usageThresholds],
  )
  const planThresholds = useMemo(
    () => subscription?.plan?.usageThresholds || [],
    [subscription?.plan?.usageThresholds],
  )

  const nonRecurringSubscriptionThresholds = useMemo(
    () => subscriptionThresholds.filter((t) => !t.recurring),
    [subscriptionThresholds],
  )
  const recurringSubscriptionThresholds = useMemo(
    () => subscriptionThresholds.filter((t) => t.recurring),
    [subscriptionThresholds],
  )
  const nonRecurringPlanThresholds = useMemo(
    () => planThresholds.filter((t) => !t.recurring),
    [planThresholds],
  )
  const recurringPlanThresholds = useMemo(
    () => planThresholds.filter((t) => t.recurring),
    [planThresholds],
  )

  // Edit path generation

  return {
    // State
    currency,
    hasPremiumIntegration,

    // Thresholds
    subscriptionThresholds,
    nonRecurringSubscriptionThresholds,
    recurringSubscriptionThresholds,
    nonRecurringPlanThresholds,
    recurringPlanThresholds,
  }
}
