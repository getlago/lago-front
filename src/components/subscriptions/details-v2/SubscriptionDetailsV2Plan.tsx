import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { PlanDetailsV2 } from '~/components/plans/details-v2/PlanDetailsV2'
import { PlanDetailsV2Skeleton } from '~/components/plans/details-v2/PlanDetailsV2Skeleton'
import PremiumFeature from '~/components/premium/PremiumFeature'
import {
  LagoApiError,
  PlanDetailsV2FragmentDoc,
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

  return (
    <PlanDetailsV2
      planId={plan.id}
      isInSubscriptionForm
      subscriptionId={subscriptionId}
      banner={banner}
    />
  )
}
