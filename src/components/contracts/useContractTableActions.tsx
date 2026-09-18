import { getContractDisplayName } from '~/components/contracts/getContractDisplayName'
import { ActionItem } from '~/components/designSystem/Table/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useTerminateContractDialog } from './useTerminateContractDialog'

type ContractTableActionTarget = {
  externalId: string
  name?: string | null
  plan?: { name: string } | null
}

export const useContractTableActions = () => {
  const { translate } = useInternationalization()
  const { openTerminateContractDialog } = useTerminateContractDialog()

  const getContractTableActions = <T extends ContractTableActionTarget>(
    contract: T,
  ): ActionItem<T>[] => [
    {
      startIcon: 'duplicate',
      title: translate('text_1789636691484c9hodzevcvd'),
      dataTest: 'copy-contract-external-id',
      onAction: () => {
        copyToClipboard(contract.externalId)
        addToast({
          severity: 'info',
          translateKey: 'text_1789636691484fyt51yyc9uh',
        })
      },
    },
    {
      startIcon: 'trash',
      title: translate('text_17896366914848hled21jz6q'),
      dataTest: 'terminate-contract',
      onAction: () => {
        openTerminateContractDialog({ name: getContractDisplayName(contract) })
      },
    },
  ]

  return {
    getContractTableActions,
    contractTableActionsTooltip: translate('text_1789637038124d2rpm0ng6c2'),
  }
}
