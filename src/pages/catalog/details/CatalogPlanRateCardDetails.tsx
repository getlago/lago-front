import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsView } from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { AppliedRateCardDetailsData } from '~/components/appliedRateCards/details/types'
import {
  LagoApiError,
  PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  PlanAppliedRateCardForDetailsFragment,
  ProductForAppliedRateCardDrawerFragmentDoc,
  RateCardForAppliedRateCardDrawerFragmentDoc,
  RatePhaseForDrawerFragmentDoc,
  useGetPlanAppliedRateCardForDetailsQuery,
} from '~/generated/graphql'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'

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
    }
    rateCard {
      id
      ...RateCardForAppliedRateCardDrawer
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
  ${RateCardForAppliedRateCardDrawerFragmentDoc}
  ${RatePhaseForDrawerFragmentDoc}
`

const toDetailsData = (
  appliedRateCard: PlanAppliedRateCardForDetailsFragment | null | undefined,
  catalogPlanId: string,
): AppliedRateCardDetailsData | undefined => {
  if (!appliedRateCard || appliedRateCard.catalogPlan.id !== catalogPlanId) return undefined

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

const CatalogPlanRateCardDetails = (): JSX.Element => {
  const { catalogPlanId = '', appliedRateCardId = '' } = useParams()

  const { data, loading, error } = useGetPlanAppliedRateCardForDetailsQuery({
    variables: { appliedRateCardId },
    skip: !appliedRateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const detailsData = toDetailsData(data?.planAppliedRateCard, catalogPlanId)

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !detailsData,
    redirectTo: APPLIED_RATE_CARD_DETAILS_CONFIG.plan.buildParentRateCardsPath(catalogPlanId),
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })

  return <AppliedRateCardDetailsView data={detailsData} loading={loading} />
}

export default CatalogPlanRateCardDetails
