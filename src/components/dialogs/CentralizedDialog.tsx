import { create, useModal } from '@ebay/nice-modal-react'
import { ReactNode } from 'react'

import { Button } from '~/components/designSystem'
import BaseDialog from '~/components/dialogs/BaseDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  CENTRALIZED_DIALOG_CANCEL_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
  CENTRALIZED_DIALOG_TEST_ID,
  CLOSE_PARAMS,
} from './const'
import { HookDialogReturnType, PromiseReturnType } from './types'

export type CentralizedDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  onAction: () => PromiseReturnType | Promise<PromiseReturnType> | void
  actionText: string
  colorVariant?: 'info' | 'danger'
  disableOnContinue?: boolean
  cancelOrCloseText?: 'close' | 'cancel'
  closeOnError?: boolean
}

const CentralizedDialog = create(
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
  }: CentralizedDialogProps) => {
    const modal = useModal()
    const { translate } = useInternationalization()

    const handleCancel = async (): Promise<void> => {
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

    return (
      <BaseDialog
        isOpen={modal.visible}
        closeDialog={handleCancel}
        removeDialog={modal.remove}
        title={title}
        description={description}
        headerContent={headerContent}
        data-test={CENTRALIZED_DIALOG_TEST_ID}
        actions={
          <>
            <Button
              variant="quaternary"
              onClick={handleCancel}
              data-test={CENTRALIZED_DIALOG_CANCEL_BUTTON_TEST_ID}
            >
              {closeText}
            </Button>
            <Button
              disabled={disableOnContinue}
              danger={colorVariant === 'danger'}
              onClick={handleContinue}
              data-test={CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID}
            >
              {actionText}
            </Button>
          </>
        }
      >
        {children}
      </BaseDialog>
    )
  },
)

export default CentralizedDialog

export const useCentralizedDialog = (): HookDialogReturnType<CentralizedDialogProps> => {
  const modal = useModal(CENTRALIZED_DIALOG_NAME)

  return {
    open: (props?: CentralizedDialogProps) => modal.show(props),
    close: () => {
      modal.resolve(CLOSE_PARAMS)
      modal.hide()
    },
  }
}
