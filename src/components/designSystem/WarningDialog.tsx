import { forwardRef } from 'react'

import { Button, Dialog, DialogProps, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// Test IDs
export const WARNING_DIALOG_TEST_ID = 'warning-dialog'
export const WARNING_DIALOG_CANCEL_BUTTON_TEST_ID = 'warning-cancel'
export const WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID = 'warning-confirm'

export enum WarningDialogMode {
  info = 'info',
  danger = 'danger',
}
interface WarningDialogProps extends Omit<DialogProps, 'actions'> {
  onContinue?: () => unknown | Promise<unknown>
  onCancel?: () => unknown
  mode?: keyof typeof WarningDialogMode
  continueText: string
  forceOpen?: boolean
  disableOnContinue?: boolean
}

/**
 * @deprecated Please use the new dialog management system in ~/components/dialogs
 */
export type WarningDialogRef = DialogRef

/**
 * @deprecated Please use the new dialog management system in ~/components/dialogs
 */
export const WarningDialog = forwardRef<DialogRef, WarningDialogProps>(
  (
    {
      onContinue,
      continueText,
      mode = WarningDialogMode.danger,
      forceOpen = false,
      disableOnContinue = false,
      ...props
    }: WarningDialogProps,
    ref,
  ) => {
    const { translate } = useInternationalization()

    return (
      <Dialog
        open={!!forceOpen}
        ref={ref}
        {...props}
        actions={({ closeDialog }) => (
          <>
            <Button
              variant="quaternary"
              onClick={closeDialog}
              data-test={WARNING_DIALOG_CANCEL_BUTTON_TEST_ID}
            >
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={disableOnContinue}
              data-test={WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID}
              danger={mode === WarningDialogMode.danger}
              onClick={async () => {
                onContinue && (await onContinue())
                closeDialog()
              }}
            >
              {continueText}
            </Button>
          </>
        )}
        data-test={WARNING_DIALOG_TEST_ID}
      />
    )
  },
)

WarningDialog.displayName = 'WarningDialog'
