import { create, useModal } from '@ebay/nice-modal-react'
import { tw } from 'lago-design-system'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem'

import BaseDialog from './BaseDialog'
import { CLOSE_PARAMS, DIALOG_OPENING_WARNING_DIALOG_NAME } from './const'
import { dialogActionWrapper } from './dialogActionWrapper'
import { ExecutableHookDialogReturnType, MainFunction } from './types'
import { useWarningDialog, WarningDialogProps } from './WarningDialog'

export type DialogOpeningWarningDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  actions: ReactNode
  canOpenWarningDialog?: boolean
  openWarningDialogText?: string
  warningDialogProps: WarningDialogProps
}

const DialogOpeningWarningDialog = create(
  ({
    title,
    description,
    headerContent,
    children,
    actions,
    canOpenWarningDialog,
    openWarningDialogText,
    warningDialogProps,
  }: DialogOpeningWarningDialogProps) => {
    const modal = useModal()

    const warningDialog = useWarningDialog()

    const handleClose = async () => {
      modal.resolve(CLOSE_PARAMS)
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
        description={description}
        headerContent={headerContent}
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
  (): ExecutableHookDialogReturnType<DialogOpeningWarningDialogProps> => {
    const modal = useModal(DIALOG_OPENING_WARNING_DIALOG_NAME)

    return {
      open: (props?: DialogOpeningWarningDialogProps) => modal.show(props),
      close: () => {
        modal.resolve(CLOSE_PARAMS)
        modal.hide()
      },
      execute: (mainFunctionToExecute: MainFunction) => {
        dialogActionWrapper(mainFunctionToExecute, modal)
      },
    }
  }
