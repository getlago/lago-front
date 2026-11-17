import { AppliedRateCardDetailsData } from '~/components/appliedRateCards/details/types'
import {
  ContractAppliedRateCardForDetailsFragment,
  ContractStatusEnum,
  PlanAppliedRateCardForDetailsFragment,
} from '~/generated/graphql'

export const toPlanAppliedRateCardDetailsData = (
  appliedRateCard: PlanAppliedRateCardForDetailsFragment | null | undefined,
  catalogPlanId: string,
): AppliedRateCardDetailsData | undefined => {
  if (appliedRateCard?.catalogPlan.id !== catalogPlanId) return undefined

  const { catalogPlan } = appliedRateCard

  return {
    context: 'plan',
    parent: {
      id: catalogPlan.id,
      name: catalogPlan.name,
      isLocked: catalogPlan.attachedToContracts,
    },
    appliedRateCard,
  }
}

export const toContractAppliedRateCardDetailsData = (
  appliedRateCard: ContractAppliedRateCardForDetailsFragment | null | undefined,
  contractId: string,
): AppliedRateCardDetailsData | undefined => {
  if (appliedRateCard?.contract.id !== contractId) return undefined

  const { contract } = appliedRateCard

  return {
    context: 'contract',
    parent: {
      id: contract.id,
      name: contract.name || contract.plan?.name || contract.externalId,
      isLocked: contract.status !== ContractStatusEnum.Pending,
    },
    appliedRateCard,
  }
}
