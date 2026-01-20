import { create, useModal } from '@ebay/nice-modal-react'
import { tw } from 'lago-design-system'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem'

import BaseDialog from './BaseDialog'
import { HookDialogReturnType } from './types'
import { useWarningDialog, WarningDialogProps } from './WarningDialog'

export const DIALOG_OPENING_WARNING_DIALOG_NAME = 'DialogOpeningWarningDialog'
export const DIALOG_TITLE_TEST_ID = 'dialog-title'

export type DialogOpeningWarningDialogProps = {
  title: ReactNode
  children?: ReactNode
  actions: ReactNode
  canOpenWarningDialog?: boolean
  openWarningDialogText?: string
  warningDialogProps: WarningDialogProps
}

const DialogOpeningWarningDialog = create(
  ({
    title,
    children,
    actions,
    canOpenWarningDialog,
    openWarningDialogText,
    warningDialogProps,
  }: DialogOpeningWarningDialogProps) => {
    const modal = useModal()

    const warningDialog = useWarningDialog()

    const handleClose = async () => {
      modal.reject()
      modal.hide()
    }

    const definedActions = (
      <div
        className={tw('flex flex-row items-center justify-between gap-3', {
          'w-full': canOpenWarningDialog,
        })}
      >
        {canOpenWarningDialog && (
          <Button
            danger
            variant="quaternary"
            onClick={() => {
              modal.hide()
              warningDialog.open(warningDialogProps)
            }}
          >
            {openWarningDialogText}
          </Button>
        )}
        <div className="flex flex-row items-center gap-3">{actions}</div>
      </div>
    )

    return (
      <BaseDialog
        title={title}
        actions={definedActions}
        isOpen={modal.visible}
        closeDialog={handleClose}
        removeDialog={modal.remove}
      >
        {children}
      </BaseDialog>
    )
  },
)

export default DialogOpeningWarningDialog

export const useDialogOpeningWarningDialog =
  (): HookDialogReturnType<DialogOpeningWarningDialogProps> => {
    const modal = useModal(DIALOG_OPENING_WARNING_DIALOG_NAME)

    return {
      open: (props?: DialogOpeningWarningDialogProps) => modal.show(props),
      close: () => modal.hide(),
      resolve: (args?: unknown) => modal.resolve(args),
      reject: (args?: unknown) => modal.reject(args),
    }
  }
