import { ActionItem } from '~/components/designSystem/Table/types'
import { ContractForContractDrawerFragment, ContractStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useContractPermissionsActions } from '~/hooks/useContractPermissionsActions'
import { CONTRACT_DRAWER_TITLE_EDIT_KEY } from '~/pages/contracts/drawers/contract/constants'
import { useContractDrawer } from '~/pages/contracts/drawers/contract/useContractDrawer'

import { useCopyContractExternalId } from './useCopyContractExternalId'
import {
  getContractTerminationCopy,
  useTerminateContractDialog,
} from './useTerminateContractDialog'

export const CONTRACT_TABLE_TERMINATE_TEST_ID = 'terminate-contract'
export const CONTRACT_TABLE_CANCEL_TEST_ID = 'cancel-contract'
export const CONTRACT_TABLE_EDIT_TEST_ID = 'edit-contract'

export const useContractTableActions = () => {
  const { translate } = useInternationalization()
  const { canTerminateContract, canEditContract } = useContractPermissionsActions()
  const { openDrawer: openContractDrawer } = useContractDrawer()
  const { copyContractExternalId, copyContractExternalIdLabel } = useCopyContractExternalId()
  const { openTerminateContractDialog } = useTerminateContractDialog()

  const getContractTableActions = <T extends ContractForContractDrawerFragment>(
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

    if (canEditContract(contract.status)) {
      actions.push({
        startIcon: 'pen',
        title: translate(CONTRACT_DRAWER_TITLE_EDIT_KEY),
        dataTest: CONTRACT_TABLE_EDIT_TEST_ID,
        onAction: () => openContractDrawer({ contract }),
      })
    }

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
