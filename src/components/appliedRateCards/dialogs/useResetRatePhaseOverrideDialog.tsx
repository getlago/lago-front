import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useUpdateContractRatePhaseMutation, useUpdateRatePhaseMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RATE_PHASE_REFETCH_QUERIES, RatePhaseDialogProps } from './useDeleteRatePhaseDialog'

export const useResetRatePhaseOverrideDialog = (): {
  openResetRatePhaseOverrideDialog: (props: RatePhaseDialogProps) => void
} => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()
  const [updateRatePhase] = useUpdateRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.plan,
  })
  const [updateContractRatePhase] = useUpdateContractRatePhaseMutation({
    refetchQueries: RATE_PHASE_REFETCH_QUERIES.contract,
  })

  const openResetRatePhaseOverrideDialog = (props: RatePhaseDialogProps): void => {
    const { context, appliedRateCardId, phase } = props

    const handleSuccess = (): void => {
      addToast({
        message: translate('text_17925045582370oiauno9u9a'),
        severity: 'success',
      })
    }

    centralizedDialog.open({
      title: translate('text_1792504558237e30tbqnye82', { name: phase.name }),
      description: translate('text_1792504558237c76cown33ob'),
      colorVariant: 'danger',
      actionText: translate('text_179250455823743gk265fc61'),
      onAction: async () => {
        if (context === 'plan') {
          const { data } = await updateRatePhase({
            variables: {
              input: {
                planAppliedRateCardId: appliedRateCardId,
                code: phase.code,
                rateOverride: null,
              },
            },
          })

          if (data?.updateRatePhase?.id) handleSuccess()
          return
        }

        const { data } = await updateContractRatePhase({
          variables: {
            input: {
              contractAppliedRateCardId: appliedRateCardId,
              code: phase.code,
              rateOverride: null,
            },
          },
        })

        if (data?.updateContractRatePhase?.id) handleSuccess()
      },
    })
  }

  return { openResetRatePhaseOverrideDialog }
}
