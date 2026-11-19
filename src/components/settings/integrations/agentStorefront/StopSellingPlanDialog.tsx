import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast, onNetworkError } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useSoldPlans } from './useSoldPlans'
import { getSoldPlanName, SoldPlan } from './utils'

type UseStopSellingPlanDialogReturn = {
  openStopSellingPlanDialog: (soldPlan: SoldPlan) => void
}

export const useStopSellingPlanDialog = (integrationId: string): UseStopSellingPlanDialogReturn => {
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()
  const { stopSellingPlan } = useSoldPlans(integrationId)

  const openStopSellingPlanDialog = (soldPlan: SoldPlan): void => {
    void centralizedDialog.open({
      title: translate('text_179509644997399umzpa4474', { name: getSoldPlanName(soldPlan) }),
      description: translate('text_17950964499739gsd7e8oh7y'),
      colorVariant: 'danger',
      actionText: translate('text_1795096449973pi06nk2ocoy'),
      closeOnError: false,
      onError: onNetworkError,
      onAction: async () => {
        const response = await stopSellingPlan(soldPlan.planCode)

        if (response.reason === 'guardrail') {
          addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })

          return
        }

        if (response.result.errors || !response.result.data?.updateAgentStorefrontIntegration) {
          return
        }

        addToast({ severity: 'success', translateKey: 'text_1795096449973qg9fyttndtl' })
      },
    })
  }

  return { openStopSellingPlanDialog }
}
