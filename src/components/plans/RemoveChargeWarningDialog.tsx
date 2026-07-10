import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type OpenRemoveChargeWarningDialogParams = { callback: () => void }

export const useRemoveChargeWarningDialog = () => {
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()

  const openRemoveChargeWarningDialog = ({ callback }: OpenRemoveChargeWarningDialogParams) => {
    centralizedDialog.open({
      title: translate('text_63cfe20ad6c1a53c5352a46e'),
      description: translate('text_63cfe20ad6c1a53c5352a470'),
      actionText: translate('text_63cfe20ad6c1a53c5352a474'),
      colorVariant: 'danger',
      onAction: () => {
        callback()
      },
    })
  }

  return { openRemoveChargeWarningDialog }
}
