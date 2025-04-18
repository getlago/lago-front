import { forwardRef } from 'react'

import { Button } from './Button'
import { Dialog, DialogProps, DialogRef } from './Dialog'

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

export type WarningDialogRef = DialogRef

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
    return (
      <Dialog
        open={!!forceOpen}
        ref={ref}
        {...props}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {/* TODO: Handle translation */}
              Cancel
              {/* {translate('text_6244277fe0975300fe3fb94a')} */}
            </Button>
            <Button
              disabled={disableOnContinue}
              data-test="warning-confirm"
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
        data-test="warning-dialog"
      />
    )
  },
)

WarningDialog.displayName = 'WarningDialog'
