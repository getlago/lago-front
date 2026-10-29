import { gql } from '@apollo/client'

import {
  ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  GetContractAppliedRateCardForDetailsQueryResult,
  LagoApiError,
  ProductCategoryForCatalogRelationsFragmentDoc,
  ProductFilterForCatalogRelationsFragmentDoc,
  ProductForAppliedRateCardDrawerFragmentDoc,
  ProductForCatalogRelationsFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
  useGetContractAppliedRateCardForDetailsQuery,
} from '~/generated/graphql'

gql`
  fragment ContractAppliedRateCardForDetails on ContractAppliedRateCard {
    id
    units
    effectiveDate
    contract {
      id
      name
      externalId
      status
      plan {
        id
        name
      }
    }
    ...ContractAppliedRateCardForAppliedRateCardsTable
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

  query getContractAppliedRateCardForDetails($appliedRateCardId: ID!) {
    contractAppliedRateCard(id: $appliedRateCardId) {
      id
      ...ContractAppliedRateCardForDetails
    }
  }

  ${ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc}
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
export const useContractAppliedRateCardForDetails = (
  appliedRateCardId: string,
): GetContractAppliedRateCardForDetailsQueryResult =>
  useGetContractAppliedRateCardForDetailsQuery({
    variables: { appliedRateCardId },
    skip: !appliedRateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })
