import { FetchResult, gql, useApolloClient } from '@apollo/client'

import {
  AgentStorefrontSoldPlansFragment,
  AgentStorefrontSoldPlansFragmentDoc,
  LagoApiError,
  UpdateAgentStorefrontSoldPlansMutation,
  useUpdateAgentStorefrontSoldPlansMutation,
} from '~/generated/graphql'

import { applySoldPlanChange, SoldPlanAmounts, SoldPlanChange } from './utils'

gql`
  fragment AgentStorefrontSoldPlans on AgentStorefrontIntegration {
    id
    plans {
      planCode
      minimumTopupCents
      maximumTopupCents
      freeCreditsCents
      plan {
        id
        name
        code
        invoiceDisplayName
        amountCurrency
      }
    }
  }

  mutation updateAgentStorefrontSoldPlans($input: UpdateAgentStorefrontIntegrationInput!) {
    updateAgentStorefrontIntegration(input: $input) {
      id
      ...AgentStorefrontSoldPlans
    }
  }
`

type SoldPlansResult =
  | { reason: 'guardrail' }
  | { reason: 'mutation'; result: FetchResult<UpdateAgentStorefrontSoldPlansMutation> }

type UseSoldPlansReturn = {
  sellPlan: (planCode: string, amounts: SoldPlanAmounts) => Promise<SoldPlansResult>
  editPlan: (planCode: string, amounts: SoldPlanAmounts) => Promise<SoldPlansResult>
  stopSellingPlan: (planCode: string) => Promise<SoldPlansResult>
}

const STOP_SELLING_CONTEXT = { silentErrorDetails: [LagoApiError.PlanNotFound] }
const SELL_OR_EDIT_CONTEXT = {
  silentErrorDetails: [LagoApiError.PlanNotFound, LagoApiError.PlanNotUsageOnly],
}

export const useSoldPlans = (integrationId: string): UseSoldPlansReturn => {
  const client = useApolloClient()
  const [updateSoldPlans] = useUpdateAgentStorefrontSoldPlansMutation()

  const applyChange = async (change: SoldPlanChange): Promise<SoldPlansResult> => {
    const integration = client.readFragment<AgentStorefrontSoldPlansFragment>({
      id: client.cache.identify({ __typename: 'AgentStorefrontIntegration', id: integrationId }),
      fragment: AgentStorefrontSoldPlansFragmentDoc,
      fragmentName: 'AgentStorefrontSoldPlans',
    })

    if (!integration) return { reason: 'guardrail' }

    const plans = applySoldPlanChange(integration.plans, change)

    if (!plans) return { reason: 'guardrail' }

    const result = await updateSoldPlans({
      variables: { input: { id: integrationId, plans } },
      context: change.type === 'stop' ? STOP_SELLING_CONTEXT : SELL_OR_EDIT_CONTEXT,
    })

    return { reason: 'mutation', result }
  }

  return {
    sellPlan: (planCode, amounts) => applyChange({ type: 'sell', planCode, amounts }),
    editPlan: (planCode, amounts) => applyChange({ type: 'edit', planCode, amounts }),
    stopSellingPlan: (planCode) => applyChange({ type: 'stop', planCode }),
  }
}
