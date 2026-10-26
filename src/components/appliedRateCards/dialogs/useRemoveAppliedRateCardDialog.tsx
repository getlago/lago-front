import { DocumentNode, gql, useApolloClient } from '@apollo/client'

import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import {
  GetContractAppliedRateCardsForRateCardsSectionDocument,
  GetPlanAppliedRateCardsForRateCardsSectionDocument,
  useDestroyContractAppliedRateCardMutation,
  useDestroyPlanAppliedRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation destroyPlanAppliedRateCard($input: DestroyPlanAppliedRateCardInput!) {
    destroyPlanAppliedRateCard(input: $input) {
      id
    }
  }

  mutation destroyContractAppliedRateCard($input: DestroyContractAppliedRateCardInput!) {
    destroyContractAppliedRateCard(input: $input) {
      id
    }
  }
`

const REMOVED_CARD_CACHE: Record<
  AppliedRateCardContext,
  { __typename: string; listFieldName: string; listQueryDocument: DocumentNode }
> = {
  plan: {
    __typename: 'PlanAppliedRateCard',
    listFieldName: 'planAppliedRateCards',
    listQueryDocument: GetPlanAppliedRateCardsForRateCardsSectionDocument,
  },
  contract: {
    __typename: 'ContractAppliedRateCard',
    listFieldName: 'contractAppliedRateCards',
    listQueryDocument: GetContractAppliedRateCardsForRateCardsSectionDocument,
  },
}

type RemoveAppliedRateCardDialogProps = {
  context: 'plan' | 'contract'
  id: string
  rateCardName: string
  onRemoved?: () => void
}

export const useRemoveAppliedRateCardDialog = (): {
  openRemoveAppliedRateCardDialog: (props: RemoveAppliedRateCardDialogProps) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const [destroyPlanAppliedRateCard] = useDestroyPlanAppliedRateCardMutation()
  const [destroyContractAppliedRateCard] = useDestroyContractAppliedRateCardMutation()

  const openRemoveAppliedRateCardDialog = (props: RemoveAppliedRateCardDialogProps): void => {
    const { context, id, rateCardName, onRemoved } = props

    const handleSuccess = (removedId: string): void => {
      evictFromCache(client, { id: removedId, ...REMOVED_CARD_CACHE[context] })
      onRemoved?.()
      addToast({
        message: translate('text_1790283913718436odi8om57'),
        severity: 'success',
      })
    }

    centralizedDialog.open({
      title: translate('text_1790283913718mpxv4h76ne5', { name: rateCardName }),
      description: translate('text_1790283913718aiyuge7g45l'),
      colorVariant: 'danger',
      actionText: translate('text_1790283913718ou6jmxoxnea'),
      onAction: async () => {
        if (context === 'plan') {
          const { data } = await destroyPlanAppliedRateCard({ variables: { input: { id } } })

          const removedId = data?.destroyPlanAppliedRateCard?.id

          if (removedId) handleSuccess(removedId)
          return
        }

        const { data } = await destroyContractAppliedRateCard({ variables: { input: { id } } })

        const removedId = data?.destroyContractAppliedRateCard?.id

        if (removedId) handleSuccess(removedId)
      },
    })
  }

  return { openRemoveAppliedRateCardDialog }
}
