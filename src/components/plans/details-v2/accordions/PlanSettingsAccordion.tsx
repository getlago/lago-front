import { PlanSettingsInfo } from '~/components/plans/PlanSettingsInfo'
import { PlanDetailsV2Fragment } from '~/generated/graphql'

type PlanSettingsAccordionProps = {
  plan: PlanDetailsV2Fragment
}

export const PlanSettingsAccordion = ({ plan }: PlanSettingsAccordionProps) => (
  <PlanSettingsInfo plan={plan} />
)
