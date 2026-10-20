import { gql } from '@apollo/client'

import { RATE_PHASE_REFETCH_QUERIES } from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  useDestroyContractRatePhaseMutation,
  useDestroyRatePhaseMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation destroyRatePhase($input: DestroyRatePhaseInput!) {
    destroyRatePhase(input: $input) {
      id
    }
  }

  mutation destroyContractRatePhase($input: DestroyContractRatePhaseInput!) {
    destroyContractRatePhase(input: $input) {
      id
    }
  }
`

export type RatePhaseDialogProps = {
  context: AppliedRateCardContext
  appliedRateCardId: string
  phase: { code: string; name: string }
}

export const useDeleteRatePhaseDialog = (): {
  openDeleteRatePhaseDialog: (props: RatePhaseDialogProps & { onDeleted?: () => void }) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const [destroyRatePhase] = useDestroyRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.plan,
  })
  const [destroyContractRatePhase] = useDestroyContractRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.contract,
  })

  const openDeleteRatePhaseDialog = (
    props: RatePhaseDialogProps & { onDeleted?: () => void },
  ): void => {
    const { context, appliedRateCardId, phase, onDeleted } = props

    const handleSuccess = (): void => {
      onDeleted?.()
      addToast({
        message: translate('text_179250455823726yiyqps1z3'),
        severity: 'success',
      })
    }

    centralizedDialog.open({
      title: translate('text_1792504558237fi9a27bn0p2', { name: phase.name }),
      description: translate('text_1792504558237qwb88fdpgp7'),
      colorVariant: 'danger',
      actionText: translate('text_1791838459984x6zh06klebn'),
      onAction: async () => {
        if (context === 'plan') {
          const { data } = await destroyRatePhase({
            variables: { input: { planAppliedRateCardId: appliedRateCardId, code: phase.code } },
          })

          if (data?.destroyRatePhase?.id) handleSuccess()
          return
        }

        const { data } = await destroyContractRatePhase({
          variables: { input: { contractAppliedRateCardId: appliedRateCardId, code: phase.code } },
        })

        if (data?.destroyContractRatePhase?.id) handleSuccess()
      },
    })
  }

  return { openDeleteRatePhaseDialog }
}
