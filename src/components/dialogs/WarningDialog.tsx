import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const WARNING_DIALOG_NAME = 'WarningDialog'

export const WARNING_DIALOG_TEST_ID = 'warning-dialog'
export const WARNING_DIALOG_CANCEL_BUTTON_TEST_ID = 'warning-cancel'
export const WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID = 'warning-confirm'

export type WarningDialogProps = {
  title: string
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  onContinue: () => unknown | Promise<unknown>
  continueText: string
  mode?: 'info' | 'danger'
  disableOnContinue?: boolean
}

const WarningDialog = create(
  ({
    title,
    description,
    headerContent,
    children,
    onContinue,
    continueText,
    mode = 'danger',
    disableOnContinue = false,
  }: WarningDialogProps) => {
    const modal = useModal()
    const { translate } = useInternationalization()

    const handleCancel = async (): Promise<void> => {
      modal.reject()
      modal.hide()
    }

    const handleContinue = async (): Promise<void> => {
      await onContinue()
      modal.resolve()
      modal.hide()
    }

    return (
      <BaseDialog
        isOpen={modal.visible}
        closeDialog={handleCancel}
        removeDialog={modal.remove}
        title={title}
        description={description}
        headerContent={headerContent}
        data-test={WARNING_DIALOG_TEST_ID}
        actions={
          <>
            <Button
              variant="quaternary"
              onClick={handleCancel}
              data-test={WARNING_DIALOG_CANCEL_BUTTON_TEST_ID}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={disableOnContinue}
              danger={mode === 'danger'}
              onClick={handleContinue}
              data-test={WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID}
            >
              {continueText}
            </Button>
          </>
        }
      >
        {children}
      </BaseDialog>
    )
  },
)

export default WarningDialog

export type WarningDialogHookReturnType = {
  open: (props: WarningDialogProps) => Promise<unknown>
  close: () => void
  resolve: (args?: unknown) => void
  reject: (args?: unknown) => void
}

export const useWarningDialog = (): WarningDialogHookReturnType => {
  const modal = useModal(WARNING_DIALOG_NAME)

  return {
    open: (props: WarningDialogProps) => modal.show(props),
    close: () => modal.hide(),
    resolve: (args?: unknown) => modal.resolve(args),
    reject: (args?: unknown) => modal.reject(args),
  }
}
