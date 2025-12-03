import { forwardRef } from 'react'

import { Button } from './Button'
import { Dialog, DialogProps, DialogRef } from './Dialog'

/**
 * @deprecated This WarningDialogMode from lago-design-system package should not be used in the app.
 * Please use the WarningDialogMode from ~/components/WarningDialog instead.
 */
export enum WarningDialogMode {
  info = 'info',
  danger = 'danger',
}

/**
 * @deprecated This WarningDialogProps from lago-design-system package should not be used in the app.
 * Please use the WarningDialog component from ~/components/WarningDialog instead.
 */
interface WarningDialogProps extends Omit<DialogProps, 'actions'> {
  onContinue?: () => unknown | Promise<unknown>
  onCancel?: () => unknown
  mode?: keyof typeof WarningDialogMode
  continueText: string
  forceOpen?: boolean
  disableOnContinue?: boolean
}

/**
 * @deprecated This WarningDialogRef from lago-design-system package should not be used in the app.
 * Please use the WarningDialogRef from ~/components/WarningDialog instead.
 */
export type WarningDialogRef = DialogRef

/**
 * @deprecated This WarningDialog component from lago-design-system package should not be used in the app.
 * Please use the WarningDialog component from ~/components/WarningDialog instead.
 *
 * @example
 * // ❌ Don't use this
 * import { WarningDialog } from 'lago-design-system'
 *
 * // ✅ Use this instead
 * import { WarningDialog } from '~/components/WarningDialog'
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
