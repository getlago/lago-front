import { create, useModal } from '@ebay/nice-modal-react'
import { tw } from 'lago-design-system'

import { Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import BaseDialog from './BaseDialog'
import { CentralizedDialogProps, useCentralizedDialog } from './CentralizedDialog'
import { CLOSE_PARAMS, DIALOG_OPENING_DIALOG_NAME } from './const'
import { HookDialogReturnType } from './types'

export type DialogOpeningDialogProps = CentralizedDialogProps & {
  canOpenDialog?: boolean
  openDialogText?: string
  otherDialogProps: CentralizedDialogProps
  otherDialogSuccess?: (args: unknown) => unknown
  otherDialogError?: (args: unknown) => unknown
}

const DialogOpeningDialog = create(
  ({
    title,
    description,
    headerContent,
    children,
    onAction,
    actionText,
    colorVariant = 'info',
    disableOnContinue = false,
    cancelOrCloseText = 'close',
    closeOnError = true,
    canOpenDialog,
    openDialogText,
    otherDialogProps,
    otherDialogSuccess,
    otherDialogError,
  }: DialogOpeningDialogProps) => {
    const modal = useModal()
    const { translate } = useInternationalization()

    const centralizedDialog = useCentralizedDialog()

    const handleCancel = async () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    }

    const closeText =
      cancelOrCloseText === 'cancel'
        ? translate('text_6244277fe0975300fe3fb94a')
        : translate('text_62f50d26c989ab03196884ae')

    const handleContinue = async (): Promise<void> => {
      try {
        const result = await onAction()

        modal.resolve(result)
        modal.hide()
      } catch (error) {
        modal.reject({
          reason: 'error',
          error: error as Error,
        })
        if (closeOnError) modal.hide()
      }
    }

    const definedActions = (
      <div
        className={tw('flex flex-row items-center justify-between gap-3', {
          'w-full': canOpenDialog,
        })}
      >
        {canOpenDialog && (
          <Button
            danger
            variant="quaternary"
            onClick={() => {
              modal.hide()
              centralizedDialog
                .open(otherDialogProps)
                .then((value) => {
                  otherDialogSuccess?.(value)
                })
                .catch((error) => {
                  otherDialogError?.(error)
                })
            }}
          >
            {openDialogText}
          </Button>
        )}
        <div className="flex flex-row items-center gap-3">
          <Button variant="quaternary" onClick={handleCancel}>
            {closeText}
          </Button>
          <Button
            disabled={disableOnContinue}
            danger={colorVariant === 'danger'}
            onClick={handleContinue}
          >
            {actionText}
          </Button>
        </div>
      </div>
    )

    return (
      <BaseDialog
        title={title}
        description={description}
        headerContent={headerContent}
        actions={definedActions}
        isOpen={modal.visible}
        closeDialog={handleCancel}
        removeDialog={modal.remove}
      >
        {children}
      </BaseDialog>
    )
  },
)

export default DialogOpeningDialog

export const useDialogOpeningDialog = (): HookDialogReturnType<DialogOpeningDialogProps> => {
  const modal = useModal(DIALOG_OPENING_DIALOG_NAME)

  return {
    open: (props?: DialogOpeningDialogProps) => modal.show(props),
    close: () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    },
  }
}
