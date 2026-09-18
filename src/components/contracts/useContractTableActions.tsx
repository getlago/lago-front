import { getContractDisplayName } from '~/components/contracts/getContractDisplayName'
import { ActionItem } from '~/components/designSystem/Table/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useCopyContractExternalId } from './useCopyContractExternalId'
import { useTerminateContractDialog } from './useTerminateContractDialog'

type ContractTableActionTarget = {
  externalId: string
  name?: string | null
  plan?: { name: string } | null
}

export const useContractTableActions = () => {
  const { translate } = useInternationalization()
  const { copyContractExternalId, copyContractExternalIdLabel } = useCopyContractExternalId()
  const { openTerminateContractDialog } = useTerminateContractDialog()

  const getContractTableActions = <T extends ContractTableActionTarget>(
    contract: T,
  ): ActionItem<T>[] => [
    {
      startIcon: 'duplicate',
      title: copyContractExternalIdLabel,
      dataTest: 'copy-contract-external-id',
      onAction: () => copyContractExternalId(contract.externalId),
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
