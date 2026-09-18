import { ActionItem } from '~/components/designSystem/Table/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { useCopyContractExternalId } from './useCopyContractExternalId'

type ContractTableActionTarget = {
  externalId: string
}

export const useContractTableActions = () => {
  const { translate } = useInternationalization()
  const { copyContractExternalId, copyContractExternalIdLabel } = useCopyContractExternalId()

  const getContractTableActions = <T extends ContractTableActionTarget>(
    contract: T,
  ): ActionItem<T>[] => [
    {
      startIcon: 'duplicate',
      title: copyContractExternalIdLabel,
      dataTest: 'copy-contract-external-id',
      onAction: () => copyContractExternalId(contract.externalId),
    },
  ]

  return {
    getContractTableActions,
    contractTableActionsTooltip: translate('text_637f813d31381b1ed90ab326'),
  }
}
