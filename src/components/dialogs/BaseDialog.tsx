import { Dialog as MuiDialog } from '@mui/material'
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
  return (
    <MuiDialog
      className="z-dialog box-border"
      classes={{
        container: 'px-4 py-20 box-border',
        scrollBody: 'after:h-20',
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
          'flex flex-col md:max-w-xl mx-auto my-0 rounded-xl z-dialog p-10 max-w-full shadow-xl',
      }}
      transitionDuration={80}
    >
      {/* Header */}
      <Typography
        className={children ? 'mb-3' : 'mb-8'}
        variant="headline"
        data-test={DIALOG_TITLE_TEST_ID}
      >
        {title}
      </Typography>

      {/* Content */}
      {children && <div className="mb-8">{children}</div>}

      {/* Footer */}
      <div className="flex flex-col-reverse flex-wrap justify-end gap-3 md:flex-row">{actions}</div>
    </MuiDialog>
  )
}

export default BaseDialog
