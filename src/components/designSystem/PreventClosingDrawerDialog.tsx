import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type PreventClosingDrawerDialogParams = {
  onContinue: () => void
}

export const usePreventClosingDrawerDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const openPreventClosingDrawerDialog = ({ onContinue }: PreventClosingDrawerDialogParams) => {
    centralizedDialog.open({
      title: translate('text_665deda4babaf700d603ea13'),
      description: translate('text_665dedd557dc3c00c62eb83d'),
      actionText: translate('text_645388d5bdbd7b00abffa033'),
      colorVariant: 'danger',
      onAction: () => {
        onContinue()
      },
    })
  }

  return { openPreventClosingDrawerDialog }
}
