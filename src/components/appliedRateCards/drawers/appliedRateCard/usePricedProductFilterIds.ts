import { gql } from '@apollo/client'

import {
  useGetContractAppliedRateCardSlicesForAppliedRateCardDrawerQuery,
  useGetPlanAppliedRateCardSlicesForAppliedRateCardDrawerQuery,
} from '~/generated/graphql'

gql`
  fragment AppliedRateCardSliceForAppliedRateCardDrawer on RateCard {
    id
    productFilter {
      id
    }
  }

  query getPlanAppliedRateCardSlicesForAppliedRateCardDrawer(
    $planId: ID!
    $productIds: [ID!]
    $limit: Int
  ) {
    planAppliedRateCards(planId: $planId, productIds: $productIds, limit: $limit) {
      collection {
        id
        rateCard {
          id
          ...AppliedRateCardSliceForAppliedRateCardDrawer
        }
      }
    }
  }

  query getContractAppliedRateCardSlicesForAppliedRateCardDrawer(
    $contractId: ID!
    $productIds: [ID!]
    $limit: Int
  ) {
    contractAppliedRateCards(contractId: $contractId, productIds: $productIds, limit: $limit) {
      collection {
        id
        rateCard {
          id
          ...AppliedRateCardSliceForAppliedRateCardDrawer
        }
      }
    }
  }
`

export type AppliedRateCardParent =
  { context: 'plan'; planId: string } | { context: 'contract'; contractId: string }

// Renaming either query breaks the create mutations' `refetchQueries`, which reference them by name.
export const PRICED_SLICES_REFETCH_QUERIES: Record<AppliedRateCardParent['context'], string> = {
  plan: 'getPlanAppliedRateCardSlicesForAppliedRateCardDrawer',
  contract: 'getContractAppliedRateCardSlicesForAppliedRateCardDrawer',
}

export const ALREADY_PRICED_TRANSLATION_KEY: Record<AppliedRateCardParent['context'], string> = {
  plan: 'text_1792683486646v7np3oh22jc',
  contract: 'text_1792683486646r8re8d0scxh',
}

// One product holds one card per filter slice, so its applied cards always fit in one page.
const PRICED_SLICES_LIMIT = 100

// `PlanRateCards::CreateService` / `ContractRateCards::CreateService` price a (product, filter)
// slice once per plan or contract; `null` stands for the slice without filter.
export const usePricedProductFilterIds = (
  parent: AppliedRateCardParent,
  productId: string,
): Set<string | null> => {
  // Not cached: these list fields leave `limit` out of their cache key, so this page could
  // overwrite the rate cards section list.
  const { data: planData } = useGetPlanAppliedRateCardSlicesForAppliedRateCardDrawerQuery({
    variables: {
      planId: parent.context === 'plan' ? parent.planId : '',
      productIds: [productId],
      limit: PRICED_SLICES_LIMIT,
    },
    skip: parent.context !== 'plan' || !productId,
    fetchPolicy: 'no-cache',
  })
  const { data: contractData } = useGetContractAppliedRateCardSlicesForAppliedRateCardDrawerQuery({
    variables: {
      contractId: parent.context === 'contract' ? parent.contractId : '',
      productIds: [productId],
      limit: PRICED_SLICES_LIMIT,
    },
    skip: parent.context !== 'contract' || !productId,
    fetchPolicy: 'no-cache',
  })

  const appliedRateCards =
    parent.context === 'plan'
      ? planData?.planAppliedRateCards.collection
      : contractData?.contractAppliedRateCards.collection

  return new Set((appliedRateCards ?? []).map(({ rateCard }) => rateCard.productFilter?.id ?? null))
}
