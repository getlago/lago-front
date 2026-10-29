import { gql } from '@apollo/client'

import {
  GetPlanAppliedRateCardForDetailsQueryResult,
  LagoApiError,
  PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  ProductCategoryForCatalogRelationsFragmentDoc,
  ProductFilterForCatalogRelationsFragmentDoc,
  ProductForAppliedRateCardDrawerFragmentDoc,
  ProductForCatalogRelationsFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
  useGetPlanAppliedRateCardForDetailsQuery,
} from '~/generated/graphql'

gql`
  fragment PlanAppliedRateCardForDetails on PlanAppliedRateCard {
    id
    units
    catalogPlan {
      id
      name
      attachedToContracts
    }
    ...PlanAppliedRateCardForAppliedRateCardsTable
    product {
      id
      ...ProductForAppliedRateCardDrawer
      ...ProductForCatalogRelations
      productCategory {
        id
        ...ProductCategoryForCatalogRelations
      }
    }
    rateCard {
      id
      ...RateCardForAppliedRateCardDrawer
      productFilter {
        id
        ...ProductFilterForCatalogRelations
      }
    }
    ratePhases {
      id
      ...RatePhaseForDrawer
    }
  }

  query getPlanAppliedRateCardForDetails($appliedRateCardId: ID!) {
    planAppliedRateCard(id: $appliedRateCardId) {
      id
      ...PlanAppliedRateCardForDetails
    }
  }

  ${PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc}
  ${ProductForAppliedRateCardDrawerFragmentDoc}
  ${ProductForCatalogRelationsFragmentDoc}
  ${ProductCategoryForCatalogRelationsFragmentDoc}
  ${RateCardForAppliedRateCardDrawerFragmentDoc}
  ${ProductFilterForCatalogRelationsFragmentDoc}
  ${RatePhaseForDrawerFragmentDoc}
`

// Shared by the card details page and the phase details page: both need the
// full sibling-phase list (the phase page's not-found check) from one cache entry
// (an edit on either page must update both).
export const usePlanAppliedRateCardForDetails = (
  appliedRateCardId: string,
): GetPlanAppliedRateCardForDetailsQueryResult =>
  useGetPlanAppliedRateCardForDetailsQuery({
    variables: { appliedRateCardId },
    skip: !appliedRateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
