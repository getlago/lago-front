import { SubscriptionFeeInfo } from '~/components/plans/SubscriptionFeeInfo'
import { PlanDetailsV2Fragment } from '~/generated/graphql'

type SubscriptionFeeAccordionProps = {
  plan: PlanDetailsV2Fragment
}

export const SubscriptionFeeAccordion = ({ plan }: SubscriptionFeeAccordionProps) => (
  <SubscriptionFeeInfo plan={plan} />
)
