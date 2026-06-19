import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { PlanDetailsV2 } from '~/components/plans/details-v2/PlanDetailsV2'
import { PlanDetailsV2Skeleton } from '~/components/plans/details-v2/PlanDetailsV2Skeleton'
import PremiumFeature from '~/components/premium/PremiumFeature'
import {
  LagoApiError,
  PlanDetailsV2FragmentDoc,
  useGetSubscriptionFixedChargeUnitsOverridesQuery,
  useGetSubscriptionForDetailsV2PlanQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

gql`
  query getSubscriptionForDetailsV2Plan($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      plan {
        id
        parent {
          id
        }
        ...PlanDetailsV2
      }
    }
  }

  # Override-aware units come from Subscription.fixedCharges. FixedCharge is
  # normalised by id in the Apollo cache, so this selection is fetched with
  # fetchPolicy: 'no-cache' to avoid overwriting the plan-scoped units on the
  # same FixedCharge entry — plan pages must keep showing plan defaults.
  query getSubscriptionFixedChargeUnitsOverrides($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      fixedCharges {
        id
        units
      }
    }
  }

  ${PlanDetailsV2FragmentDoc}
`

type Props = {
  subscriptionId: string
}

export const SubscriptionDetailsV2Plan = ({ subscriptionId }: Props) => {
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { data, loading } = useGetSubscriptionForDetailsV2PlanQuery({
    variables: { subscriptionId },
    skip: !subscriptionId,
    context: { silentError: [LagoApiError.NotFound] },
  })

  const {
    data: overridesData,
    loading: overridesLoading,
    refetch: refetchOverrides,
  } = useGetSubscriptionFixedChargeUnitsOverridesQuery({
    variables: { subscriptionId },
    skip: !subscriptionId,
    fetchPolicy: 'no-cache',
    context: { silentError: [LagoApiError.NotFound] },
  })

  const subscriptionFixedChargeUnitsById = useMemo(() => {
    const map: Record<string, string> = {}

    for (const fixedCharge of overridesData?.subscription?.fixedCharges ?? []) {
      map[fixedCharge.id] = fixedCharge.units
    }

    return map
  }, [overridesData])

  const plan = data?.subscription?.plan

  const banner = useMemo(() => {
    if (!isPremium) {
      return (
        <PremiumFeature
          feature={translate('text_65118a52df984447c18694d1')}
          title={translate('text_65118a52df984447c18694d0')}
          description={translate('text_65118a52df984447c18694da')}
        />
      )
    }

    if (!plan?.parent) {
      return <Alert type="info">{translate('text_652525609f420d00b83dd602')}</Alert>
    }

    return undefined
  }, [isPremium, plan?.parent, translate])

  if (loading && !plan) {
    return <PlanDetailsV2Skeleton />
  }

  if (!plan) {
    return null
  }

  // The fixed-charge rows derive their units from `override ?? planDefault`.
  // Override units come from the separate no-cache overrides query, which
  // resolves independently of the cached plan data. Holding the skeleton until
  // it has settled avoids rendering the plan default first and then snapping to
  // the override (or vice-versa) — the units flicker seen on initial load.
  if (overridesLoading) {
    return <PlanDetailsV2Skeleton />
  }

  return (
    <PlanDetailsV2
      planId={plan.id}
      isInSubscriptionForm
      subscriptionId={subscriptionId}
      subscriptionFixedChargeUnitsById={subscriptionFixedChargeUnitsById}
      refetchOverrides={refetchOverrides}
      banner={banner}
    />
  )
}
