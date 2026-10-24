import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsView } from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { toContractAppliedRateCardDetailsData } from '~/components/appliedRateCards/details/toAppliedRateCardDetailsData'
import { hasDefinedGQLError } from '~/core/apolloClient'
import {
  ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  LagoApiError,
  ProductCategoryForCatalogRelationsFragmentDoc,
  ProductFilterForCatalogRelationsFragmentDoc,
  ProductForAppliedRateCardDrawerFragmentDoc,
  ProductForCatalogRelationsFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
  useGetContractAppliedRateCardForDetailsQuery,
} from '~/generated/graphql'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'

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

const ContractRateCardDetails = (): JSX.Element => {
  const { id = '', appliedRateCardId = '' } = useParams()

  const { data, loading, error } = useGetContractAppliedRateCardForDetailsQuery({
    variables: { appliedRateCardId },
    skip: !appliedRateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const detailsData = toContractAppliedRateCardDetailsData(data?.contractAppliedRateCard, id)

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !detailsData,
    redirectTo: APPLIED_RATE_CARD_DETAILS_CONFIG.contract.buildParentRateCardsPath(id),
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })

  return (
    <AppliedRateCardDetailsView
      context="contract"
      data={detailsData}
      loading={loading}
      hasError={!!error && !hasDefinedGQLError('NotFound', error)}
    />
  )
}

export default ContractRateCardDetails
