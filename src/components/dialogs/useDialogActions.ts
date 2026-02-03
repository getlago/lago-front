import { useModal } from '@ebay/nice-modal-react'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { CLOSE_PARAMS } from './const'
import { PromiseReturnType } from './types'

type UseDialogActionsParams = {
  modal: ReturnType<typeof useModal>
  onAction: () => PromiseReturnType | Promise<PromiseReturnType> | void
  cancelOrCloseText: 'close' | 'cancel'
  closeOnError: boolean
}

type UseDialogActionsReturn = {
  handleCancel: () => Promise<void>
  handleContinue: () => Promise<void>
  closeText: string
}

export const useDialogActions = ({
  modal,
  onAction,
  cancelOrCloseText,
  closeOnError,
}: UseDialogActionsParams): UseDialogActionsReturn => {
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

  return {
    handleCancel,
    handleContinue,
    closeText,
  }
}
