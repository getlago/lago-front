import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useDeleteAllMetadataDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const openDeleteAllMetadataDialog = ({
    onConfirm,
  }: {
    onConfirm: () => void | boolean | Promise<void | boolean>
  }) => {
    centralizedDialog.open({
      title: translate('text_1784642866287h7jm6pidh6u'),
      description: translate('text_17846428662872wnc279xn2s'),
      colorVariant: 'danger',
      actionText: translate('text_1784637373017e1som6d92em'),
      onAction: async () => {
        await onConfirm()
      },
    })
  }

  return { openDeleteAllMetadataDialog }
}
