import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsView } from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { toContractAppliedRateCardDetailsData } from '~/components/appliedRateCards/details/toAppliedRateCardDetailsData'
import { useContractAppliedRateCardForDetails } from '~/components/appliedRateCards/details/useContractAppliedRateCardForDetails'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'

const ContractRateCardDetails = (): JSX.Element => {
  const { id = '', appliedRateCardId = '' } = useParams()

  const { data, loading, error } = useContractAppliedRateCardForDetails(appliedRateCardId)

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
