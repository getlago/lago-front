import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type TerminateContractDialogData = {
  name: string
}

export const useTerminateContractDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const openTerminateContractDialog = ({ name }: TerminateContractDialogData) => {
    centralizedDialog.open({
      title: translate('text_1789636691484vy3pf1f7c2r', { contractName: name }),
      description: (
        <div className="flex flex-col gap-2">
          <Typography>{translate('text_1789636691484w2nd40iyljv')}</Typography>
          <Typography color="grey600">{translate('text_1789636691484vv5ug3lqzuo')}</Typography>
        </div>
      ),
      colorVariant: 'danger',
      actionText: translate('text_17896366914848hled21jz6q'),
      disableOnContinue: true,
      cancelOrCloseText: 'cancel',
      onAction: () => undefined,
    })
  }

  return { openTerminateContractDialog }
}
