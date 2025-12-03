// This component is not used in the app anymore
// Keeping it here as it's used in some packages/design-system components
// Until they are not all used in the app anymore, it's easier to keep this one here and remove later
import { Dialog as MuiDialog } from '@mui/material'
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useState } from 'react'

import { tw } from '~/lib'

import { Typography } from './Typography'

/**
 * @deprecated This Dialog component from lago-design-system package should not be used in the app.
 * Please use the Dialog component from ~/components/designSystem instead.
 * This component is only kept for internal lago-design-system package usage (e.g., WarningDialog).
 */
export interface DialogProps {
  actions: (args: { closeDialog: () => void }) => JSX.Element
  title: ReactNode
  open?: boolean
  description?: ReactNode
  children?: ReactNode
  onOpen?: () => void
  onClose?: () => void
}

/**
 * @deprecated This DialogRef from lago-design-system package should not be used in the app.
 * Please use the DialogRef from ~/components/designSystem instead.
 */
export interface DialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

/**
 * @deprecated This Dialog component from lago-design-system package should not be used in the app.
 * Please use the Dialog component from ~/components/designSystem instead.
 * This component is only kept for internal lago-design-system package usage (e.g., WarningDialog).
 *
 * @example
 * // ❌ Don't use this
 * import { Dialog } from 'lago-design-system'
 *
 * // ✅ Use this instead
 * import { Dialog } from '~/components/designSystem'
 */
export const Dialog = forwardRef<DialogRef, DialogProps>(
  (
    { title, description, actions, children, onOpen, onClose, open = false, ...props }: DialogProps,
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(open)

    useImperativeHandle(ref, () => ({
      openDialog: () => {
        setIsOpen(true)
        onOpen && onOpen()
      },
      closeDialog: () => closeDialog(),
    }))

    const closeDialog = () => {
      setIsOpen(false)
      onClose && onClose()
    }

    useEffect(() => setIsOpen(open), [open])

    return (
      <>
        <MuiDialog
          className="z-dialog box-border"
          classes={{
            container: 'px-4 py-20 box-border',
            scrollBody: 'after:h-20',
          }}
          scroll="body"
          onKeyDown={(e) => {
            if (e.code === 'Escape') {
              closeDialog()
            }
          }}
          open={isOpen}
          onClose={(_, reason) => {
            if (['backdropClick', 'escapeKeyDown'].includes(reason)) {
              closeDialog()
            }
          }}
          slotProps={{
            backdrop: {
              classes: {
                root: 'bg-grey-700/40',
              },
            },
          }}
          PaperProps={{
            className:
              'flex flex-col md:max-w-xl mx-auto my-0 rounded-xl z-dialog p-10 max-w-full shadow-xl',
          }}
          transitionDuration={80}
          {...props}
        >
          <Typography
            className={tw(!!description ? 'mb-3' : 'mb-8')}
            variant="headline"
            data-test="dialog-title"
          >
            {title}
          </Typography>

          {description && (
            <Typography className="mb-8" data-test="dialog-description">
              {description}
            </Typography>
          )}

          {children && children}

          <div className="flex flex-col-reverse flex-wrap justify-end gap-3 md:flex-row">
            {actions({ closeDialog })}
          </div>
        </MuiDialog>
      </>
    )
  },
)

Dialog.displayName = 'Dialog'
