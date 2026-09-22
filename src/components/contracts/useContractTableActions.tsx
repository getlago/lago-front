import { ActionItem } from '~/components/designSystem/Table/types'
import { ContractStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useContractPermissionsActions } from '~/hooks/useContractPermissionsActions'

import { useCopyContractExternalId } from './useCopyContractExternalId'
import {
  getContractTerminationCopy,
  useTerminateContractDialog,
} from './useTerminateContractDialog'

type ContractTableActionTarget = {
  externalId: string
  status: ContractStatusEnum
}

export const CONTRACT_TABLE_TERMINATE_TEST_ID = 'terminate-contract'
export const CONTRACT_TABLE_CANCEL_TEST_ID = 'cancel-contract'

export const useContractTableActions = () => {
  const { translate } = useInternationalization()
  const { canTerminateContract } = useContractPermissionsActions()
  const { copyContractExternalId, copyContractExternalIdLabel } = useCopyContractExternalId()
  const { openTerminateContractDialog } = useTerminateContractDialog()

  const getContractTableActions = <T extends ContractTableActionTarget>(
    contract: T,
  ): ActionItem<T>[] => {
    const actions: ActionItem<T>[] = [
      {
        startIcon: 'duplicate',
        title: copyContractExternalIdLabel,
        dataTest: 'copy-contract-external-id',
        onAction: () => copyContractExternalId(contract.externalId),
      },
    ]
    const terminationCopy = getContractTerminationCopy(contract.status)

    if (terminationCopy && canTerminateContract(contract.status)) {
      actions.push({
        startIcon: 'stop',
        title: translate(terminationCopy.actionText),
        dataTest:
          contract.status === ContractStatusEnum.Pending
            ? CONTRACT_TABLE_CANCEL_TEST_ID
            : CONTRACT_TABLE_TERMINATE_TEST_ID,
        onAction: () => openTerminateContractDialog(contract),
      })
    }

    return actions
  }

  return {
    getContractTableActions,
    contractTableActionsTooltip: translate('text_637f813d31381b1ed90ab326'),
  }
}
