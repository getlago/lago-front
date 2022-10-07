import { forwardRef } from 'react'

import { Dialog, DialogProps, Button, DialogRef } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

enum WarningDialogMode {
  info = 'info',
  danger = 'danger',
}
interface WarningDialogProps extends Omit<DialogProps, 'actions'> {
  onContinue?: () => unknown | Promise<unknown>
  onCancel?: () => unknown
  mode?: keyof typeof WarningDialogMode
  continueText: string
}

export interface WarningDialogRef extends DialogRef {}

export const WarningDialog = forwardRef<DialogRef, WarningDialogProps>(
  (
    { onContinue, continueText, mode = WarningDialogMode.danger, ...props }: WarningDialogProps,
    ref
  ) => {
    const { translate } = useInternationalization()

    return (
      <Dialog
        ref={ref}
        {...props}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
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
      />
    )
  }
)

WarningDialog.displayName = 'WarningDialog'
