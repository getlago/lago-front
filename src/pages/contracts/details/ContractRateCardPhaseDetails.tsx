import { useRef } from 'react'
import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  RATE_PHASE_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { RatePhaseDetailsView } from '~/components/appliedRateCards/details/RatePhaseDetailsView'
import { toContractAppliedRateCardDetailsData } from '~/components/appliedRateCards/details/toAppliedRateCardDetailsData'
import { useContractAppliedRateCardForDetails } from '~/components/appliedRateCards/details/useContractAppliedRateCardForDetails'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { AppliedRateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'

const ContractRateCardPhaseDetails = (): JSX.Element => {
  const { id = '', appliedRateCardId = '', phaseId = '' } = useParams()
  const config = APPLIED_RATE_CARD_DETAILS_CONFIG.contract

  const { data, loading, error } = useContractAppliedRateCardForDetails(appliedRateCardId)

  const detailsData = toContractAppliedRateCardDetailsData(data?.contractAppliedRateCard, id)
  const deletedPhaseIdRef = useRef<string | null>(null)

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !detailsData,
    redirectTo: config.buildParentRateCardsPath(id),
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })

  useNotFoundRedirect({
    error: undefined,
    loading,
    notFound:
      !!detailsData &&
      deletedPhaseIdRef.current !== phaseId &&
      !detailsData.appliedRateCard.ratePhases.some((phase) => phase.id === phaseId),
    redirectTo: config.buildCardPath({
      parentId: id,
      appliedRateCardId,
      tab: AppliedRateCardDetailsTabsOptionsEnum.overview,
    }),
    translateKey: RATE_PHASE_NOT_FOUND_TRANSLATION_KEY,
  })

  return (
    <RatePhaseDetailsView
      context="contract"
      data={detailsData}
      phaseId={phaseId}
      loading={loading}
      hasError={!!error && !hasDefinedGQLError('NotFound', error)}
      onPhaseDeleted={() => {
        deletedPhaseIdRef.current = phaseId
      }}
    />
  )
}

export default ContractRateCardPhaseDetails
