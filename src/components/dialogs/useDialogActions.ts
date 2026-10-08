import { useModal } from '@ebay/nice-modal-react'
import { useRef, useState } from 'react'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { CLOSE_PARAMS } from './const'
import { DialogResult } from './types'

type UseDialogActionsParams = {
  modal: ReturnType<typeof useModal>
  onAction?: () => DialogResult | Promise<DialogResult> | void | Promise<void>
  cancelOrCloseText: 'close' | 'cancel'
  closeOnError: boolean
  onError?: (error: Error) => void
  didSubmitSucceed?: () => boolean
}

type UseDialogActionsReturn = {
  handleCancel: () => Promise<void>
  handleContinue: () => Promise<void>
  closeText: string
  isActionPending: boolean
}

export const useDialogActions = ({
  modal,
  onAction,
  cancelOrCloseText,
  closeOnError,
  onError,
  didSubmitSucceed,
}: UseDialogActionsParams): UseDialogActionsReturn => {
  const { translate } = useInternationalization()
  const [isActionPending, setIsActionPending] = useState(false)
  // A ref, not the state: two clicks can land before React re-renders, and both
  // would then read the stale `false` and run the action twice.
  const isActionPendingRef = useRef(false)

  const handleCancel = async (): Promise<void> => {
    modal.resolve(CLOSE_PARAMS)
    modal.hide()
  }

  const closeText =
    cancelOrCloseText === 'cancel'
      ? translate('text_6244277fe0975300fe3fb94a')
      : translate('text_62f50d26c989ab03196884ae')

  const handleContinue = async (): Promise<void> => {
    if (!onAction || isActionPendingRef.current) return

    isActionPendingRef.current = true
    setIsActionPending(true)

    try {
      const result = await onAction()

      // A failed validation is not an error: the form resolved without submitting, so
      // keep the dialog open on its inline field errors instead of resolving it.
      if (didSubmitSucceed && !didSubmitSucceed()) return

      const response = result ?? { reason: 'success' }

      modal.resolve(response)
      modal.hide()
    } catch (error) {
      if (closeOnError) {
        modal.reject({
          reason: 'error',
          error: error as Error,
        })
        modal.hide()
      } else {
        onError?.(error as Error)
      }
    } finally {
      // Also on the paths that keep the dialog open — a failed validation or a
      // handled error — so its button goes back to being clickable.
      isActionPendingRef.current = false
      setIsActionPending(false)
    }
  }

  return {
    handleCancel,
    handleContinue,
    closeText,
    isActionPending,
  }
}
