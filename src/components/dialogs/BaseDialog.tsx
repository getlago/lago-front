import { Dialog as MuiDialog } from '@mui/material'
import { tw } from 'lago-design-system'
import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem/Typography'

export const DIALOG_TITLE_TEST_ID = 'dialog-title'

export type BaseDialogProps = {
  title: ReactNode
  children?: ReactNode
  actions: ReactNode
  isOpen: boolean
  closeDialog: () => Promise<unknown>
  removeDialog: () => void
}

const BaseDialog = ({
  title,
  children,
  actions,
  isOpen,
  closeDialog,
  removeDialog,
}: BaseDialogProps) => {
  const childrenNeedsWrapping = children && typeof children === 'string'

  return (
    <MuiDialog
      className="z-dialog box-border"
      classes={{
        container: 'px-4 py-20 box-border',
        scrollBody: 'after:h-20',
        paper: 'max-h-[calc(100vh-10rem)]', // 10 rem because of py-20 on the container
      }}
      scroll="body"
      open={isOpen}
      onClose={(_, reason) => {
        if (['backdropClick', 'escapeKeyDown'].includes(reason)) {
          closeDialog()
        }
      }}
      onKeyDown={(e) => {
        if (e.code === 'Escape') {
          closeDialog()
        }
      }}
      TransitionProps={{
        onExited: () => removeDialog(),
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
          'flex flex-col md:max-w-xl my-0 rounded-xl z-dialog max-w-full shadow-xl mx-auto',
      }}
      transitionDuration={80}
    >
      {/* Header */}
      <header className="p-8">
        <Typography variant="headline" data-test={DIALOG_TITLE_TEST_ID}>
          {title}
        </Typography>
      </header>

      {/* Content */}
      {children && (
        <div
          className={tw('max-h-[calc(100vh-20.5rem)] overflow-auto', {
            'px-8 pb-8': childrenNeedsWrapping,
          })}
        >
          {children}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col-reverse flex-wrap justify-end gap-3 px-8 py-4 md:flex-row">
        {actions}
      </div>
    </MuiDialog>
  )
}

export default BaseDialog
