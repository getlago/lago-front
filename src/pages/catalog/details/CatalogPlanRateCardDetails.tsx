import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsView } from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { toPlanAppliedRateCardDetailsData } from '~/components/appliedRateCards/details/toAppliedRateCardDetailsData'
import { usePlanAppliedRateCardForDetails } from '~/components/appliedRateCards/details/usePlanAppliedRateCardForDetails'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'

const CatalogPlanRateCardDetails = (): JSX.Element => {
  const { catalogPlanId = '', appliedRateCardId = '' } = useParams()

  const { data, loading, error } = usePlanAppliedRateCardForDetails(appliedRateCardId)

  const detailsData = toPlanAppliedRateCardDetailsData(data?.planAppliedRateCard, catalogPlanId)

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !detailsData,
    redirectTo: APPLIED_RATE_CARD_DETAILS_CONFIG.plan.buildParentRateCardsPath(catalogPlanId),
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })

  return (
    <AppliedRateCardDetailsView
      context="plan"
      data={detailsData}
      loading={loading}
      hasError={!!error && !hasDefinedGQLError('NotFound', error)}
    />
  )
}

export default CatalogPlanRateCardDetails
