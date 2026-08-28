import MuiDialog from '@mui/material/Dialog'
import { tw } from 'lago-design-system'
import { ReactNode } from 'react'

import { Typography } from '~/components/designSystem/Typography'

import { DIALOG_BODY_TEST_ID, DIALOG_HEADER_CONTENT_TEST_ID, DIALOG_TITLE_TEST_ID } from './const'
import { FormProps } from './types'

export type BaseDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  actions: ReactNode
  isOpen: boolean
  closeDialog: () => Promise<unknown>
  removeDialog: () => void
  onEntered?: (container: HTMLElement) => void
  'data-test'?: string
  form?: FormProps
}

const BaseDialog = ({
  title,
  description,
  headerContent,
  children,
  actions,
  isOpen,
  closeDialog,
  removeDialog,
  onEntered,
  'data-test': dataTest,
  form,
}: BaseDialogProps) => {
  const childrenNeedsWrapping = children && typeof children === 'string'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    return form?.submit()
  }

  const hasScrollingHeader = !!description || !!headerContent

  const generateContent = () => {
    return (
      <>
        {/* Title */}
        <header className={tw('shrink-0 px-8 pt-8', { 'pb-8': !hasScrollingHeader })}>
          <Typography variant="subhead1" data-test={DIALOG_TITLE_TEST_ID}>
            {title}
          </Typography>
        </header>

        {/* Body: description, header content and children share a single scroll area */}
        {(hasScrollingHeader || children) && (
          <div className="overflow-auto" data-test={DIALOG_BODY_TEST_ID}>
            {hasScrollingHeader && (
              <div className="flex flex-col gap-8 px-8 pb-8 pt-2">
                {description && <Typography variant="body">{description}</Typography>}
                {headerContent && (
                  <div data-test={DIALOG_HEADER_CONTENT_TEST_ID}>{headerContent}</div>
                )}
              </div>
            )}

            {children && (
              <div
                className={tw('shadow-t', {
                  'p-8': childrenNeedsWrapping,
                })}
              >
                {children}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse flex-wrap justify-end gap-3 px-8 py-4 shadow-t md:flex-row">
          {actions}
        </div>
      </>
    )
  }

  return (
    <MuiDialog
      className="z-dialog box-border"
      classes={{
        container: 'px-4 py-20 box-border overflow-hidden',
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
      TransitionProps={{
        onExited: () => removeDialog(),
        onEntered: (node) => onEntered?.(node as HTMLElement),
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
      data-test={dataTest}
    >
      {form ? (
        <form
          id={form.id}
          onSubmit={handleSubmit}
          className="flex max-h-[calc(100vh-10rem)] flex-col"
        >
          {generateContent()}
        </form>
      ) : (
        <>{generateContent()}</>
      )}
    </MuiDialog>
  )
}

export default BaseDialog
