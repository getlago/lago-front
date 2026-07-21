import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ActionType = 'setDefault' | 'removeDefault'

type OpenDefaultCampaignDialogProps = {
  type: ActionType
  onConfirm: () => void
}

export const useDefaultCampaignDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const openDefaultCampaignDialog = ({ type, onConfirm }: OpenDefaultCampaignDialogProps) => {
    centralizedDialog.open({
      title: translate(
        type === 'setDefault' ? 'text_1728574726495xzb3xvrlprn' : 'text_1728575305796wa2yf2sn2ct',
      ),
      description: translate(
        type === 'setDefault' ? 'text_17285753057960sioe6ltl0p' : 'text_1728575305796optuxlg8q3p',
      ),
      actionText: translate(
        type === 'setDefault' ? 'text_1728574726495n9jdse2hnrf' : 'text_1728575305796o7kwackkbj6',
      ),
      onAction: () => {
        onConfirm()
      },
    })
  }

  return { openDefaultCampaignDialog }
}
