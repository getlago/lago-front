import { Dialog as MuiDialog } from '@mui/material'
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useState } from 'react'

import { tw } from '~/styles/utils'

import { Typography } from './Typography'

export interface DialogProps {
  actions: (args: { closeDialog: () => void }) => JSX.Element
  title: ReactNode
  open?: boolean
  description?: ReactNode
  children?: ReactNode
  onOpen?: () => void
  onClose?: () => void
}

export interface DialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

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
