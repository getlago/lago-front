import { ActionItem } from '~/components/designSystem/Table/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ContractTableActionTarget = {
  externalId: string
}

export const useContractTableActions = () => {
  const { translate } = useInternationalization()

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
  ]

  return {
    getContractTableActions,
    contractTableActionsTooltip: translate('text_637f813d31381b1ed90ab326'),
  }
}
