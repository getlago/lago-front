import { gql } from '@apollo/client'
import { useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_DETAILS_CONFIG,
  APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
} from '~/components/appliedRateCards/details/appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsView } from '~/components/appliedRateCards/details/AppliedRateCardDetailsView'
import { AppliedRateCardDetailsData } from '~/components/appliedRateCards/details/types'
import {
  ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  ContractAppliedRateCardForDetailsFragment,
  ContractStatusEnum,
  LagoApiError,
  ProductForAppliedRateCardDrawerFragmentDoc,
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

  query getContractAppliedRateCardForDetails($appliedRateCardId: ID!) {
    contractAppliedRateCard(id: $appliedRateCardId) {
      id
      ...ContractAppliedRateCardForDetails
    }
  }

  ${ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc}
  ${ProductForAppliedRateCardDrawerFragmentDoc}
  ${RateCardForAppliedRateCardDrawerFragmentDoc}
  ${RatePhaseForDrawerFragmentDoc}
`

const toDetailsData = (
  appliedRateCard: ContractAppliedRateCardForDetailsFragment | null | undefined,
  contractId: string,
): AppliedRateCardDetailsData | undefined => {
  if (!appliedRateCard || appliedRateCard.contract.id !== contractId) return undefined

  const { contract } = appliedRateCard

  return {
    context: 'contract',
    parent: {
      id: contract.id,
      name: contract.name || contract.plan?.name || '',
      isLocked: contract.status !== ContractStatusEnum.Pending,
    },
    appliedRateCard,
  }
}

const ContractRateCardDetails = (): JSX.Element => {
  const { id = '', appliedRateCardId = '' } = useParams()

  const { data, loading, error } = useGetContractAppliedRateCardForDetailsQuery({
    variables: { appliedRateCardId },
    skip: !appliedRateCardId,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const detailsData = toDetailsData(data?.contractAppliedRateCard, id)

  useNotFoundRedirect({
    error,
    loading,
    notFound: !!data && !detailsData,
    redirectTo: APPLIED_RATE_CARD_DETAILS_CONFIG.contract.buildParentRateCardsPath(id),
    translateKey: APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY,
  })

  return <AppliedRateCardDetailsView data={detailsData} loading={loading} />
}

export default ContractRateCardDetails
