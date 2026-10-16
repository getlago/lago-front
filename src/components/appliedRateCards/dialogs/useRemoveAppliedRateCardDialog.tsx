import { gql } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
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
  const [destroyPlanAppliedRateCard] = useDestroyPlanAppliedRateCardMutation()
  const [destroyContractAppliedRateCard] = useDestroyContractAppliedRateCardMutation()

  const openRemoveAppliedRateCardDialog = (props: RemoveAppliedRateCardDialogProps): void => {
    const { context, id, rateCardName, onRemoved } = props

    const handleSuccess = (): void => {
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

          if (data?.destroyPlanAppliedRateCard?.id) handleSuccess()
          return
        }

        const { data } = await destroyContractAppliedRateCard({ variables: { input: { id } } })

        if (data?.destroyContractAppliedRateCard?.id) handleSuccess()
      },
    })
  }

  return { openRemoveAppliedRateCardDialog }
}
