import { create, useModal } from '@ebay/nice-modal-react'

import { Button } from '~/components/designSystem'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { HookDialogReturnType } from './types'

export const PREMIUM_WARNING_DIALOG_NAME = 'PremiumWarningDialog'

export type PremiumWarningDialogProps = {
  title?: string
  description?: string
  mailtoSubject?: string
  mailtoBody?: string
}

const PremiumWarningDialog = create(
  ({ title, description, mailtoSubject, mailtoBody }: PremiumWarningDialogProps) => {
    const modal = useModal()
    const { translate } = useInternationalization()

    const displayTitle = title || translate('text_63b3155768489ee342482f4f')
    const displayDescription = description || translate('text_63b3155768489ee342482f51')
    const displayMailtoSubject = mailtoSubject || translate('text_63b3f676d44671bf24d81411')
    const displayMailtoBody = mailtoBody || translate('text_63b3f676d44671bf24d81413')

    const handleClose = async () => {
      modal.reject()
      modal.hide()
    }

    return (
      <BaseDialog
        isOpen={modal.visible}
        closeDialog={handleClose}
        removeDialog={modal.remove}
        title={displayTitle}
        description={displayDescription}
        actions={
          <>
            <Button variant="quaternary" onClick={handleClose}>
              {translate('text_62f50d26c989ab03196884ae')}
            </Button>
            <a
              className="mb-0 mr-0"
              href={`mailto:hello@getlago.com?subject=${displayMailtoSubject}&body=${displayMailtoBody}`}
            >
              <Button className="w-full">{translate('text_63b3155768489ee342482f55')}</Button>
            </a>
          </>
        }
      />
    )
  },
)

export default PremiumWarningDialog

export const usePremiumWarningDialog = (): HookDialogReturnType<PremiumWarningDialogProps> => {
  const modal = useModal(PREMIUM_WARNING_DIALOG_NAME)

  return {
    open: (props?: PremiumWarningDialogProps) => modal.show(props),
    close: () => modal.hide(),
    resolve: (args?: unknown) => modal.resolve(args),
    reject: (args?: unknown) => modal.reject(args),
  }
}
