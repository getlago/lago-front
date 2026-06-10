import { gql } from '@apollo/client'

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
import { tw } from '~/styles/utils'

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

  if (loading && !plan) {
    return <PlanDetailsV2Skeleton />
  }

  if (!plan) {
    return null
  }

  return (
    <>
      {/* Editing a subscription's plan overrides is a premium feature (the BE
          override services are premium-gated). Mirror the masked upsell from the
          subscription edit form: non-premium users see the upsell + a faded,
          inert (non-interactive) preview of the whole scrolling area. */}
      {!isPremium && (
        <PremiumFeature
          className="mt-12"
          feature={translate('text_65118a52df984447c18694d0')}
          title={translate('text_65118a52df984447c18694d0')}
          description={translate('text_65118a52df984447c18694da')}
        />
      )}

      <div
        className={tw(
          'flex flex-col',
          !isPremium && '[mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]',
        )}
        {...(!isPremium && { inert: '' })}
      >
        <PlanDetailsV2
          planId={plan.id}
          isInSubscriptionForm
          subscriptionId={subscriptionId}
          banner={
            !plan.parent ? (
              <Alert className="pl-[-4px]" type="info" fullWidth>
                {translate('text_652525609f420d00b83dd602')}
              </Alert>
            ) : undefined
          }
        />
      </div>
    </>
  )
}
