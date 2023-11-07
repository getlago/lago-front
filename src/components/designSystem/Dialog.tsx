import { alpha, Dialog as MuiDialog } from '@mui/material'
import { forwardRef, ReactNode, useImperativeHandle, useState } from 'react'
import { useEffect } from 'react'
import styled from 'styled-components'

import { ButtonGroup, theme } from '~/styles'

import { Typography } from './Typography'

export interface DialogProps {
  actions?: ReactNode | ((args: { closeDialog: () => void }) => JSX.Element)
  title: ReactNode
  open?: boolean
  description?: ReactNode
  children?: ReactNode
  onOpen?: () => void
  onClickAway?: () => void
}

export interface DialogRef {
  openDialog: () => unknown
  closeDialog: () => unknown
}

export const Dialog = forwardRef<DialogRef, DialogProps>(
  (
    {
      title,
      description,
      actions,
      children,
      onOpen,
      onClickAway,
      open = false,
      ...props
    }: DialogProps,
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(open)

    useImperativeHandle(ref, () => ({
      openDialog: () => {
        setIsOpen(true)
        onOpen && onOpen()
      },
      closeDialog: () => setIsOpen(false),
    }))

    const onDialogClose = () => {
      setIsOpen(false)
      onClickAway && onClickAway()
    }

    useEffect(() => setIsOpen(open), [open])

    return (
      <>
        <StyledDialog
          scroll="body"
          onKeyDown={(e) => {
            if (e.code === 'Escape') {
              onDialogClose()
            }
          }}
          open={isOpen}
          onClose={(_, reason) => {
            if (['backdropClick', 'escapeKeyDown'].includes(reason)) {
              onDialogClose()
            }
          }}
          PaperProps={{ className: 'dialogPaper' }}
          transitionDuration={80}
          {...props}
        >
          <Title $hasDescription={!!description} variant="headline" data-test="dialog-title">
            {title}
          </Title>
          {description && <Description data-test="dialog-description">{description}</Description>}

          {children && children}

          <StyledButtonGroup>
            {typeof actions === 'function'
              ? actions({ closeDialog: () => setIsOpen(false) })
              : actions}
          </StyledButtonGroup>
        </StyledDialog>
      </>
    )
  }
)

Dialog.displayName = 'Dialog'

const StyledDialog = styled(MuiDialog)`
  && {
    box-sizing: border-box;
    z-index: ${theme.zIndex.dialog} !important;

    .MuiDialog-container {
      padding: ${theme.spacing(20)} ${theme.spacing(4)} 0;
      box-sizing: border-box;
    }

    .MuiBackdrop-root {
      background-color: ${alpha(theme.palette.grey[700], 0.4)};
    }

    .MuiDialog-scrollBody:after {
      height: ${theme.spacing(20)};
    }

    .dialogPaper {
      display: flex;
      flex-direction: column;
      max-width: 496px;
      margin: 0 auto;
      border-radius: 12px;
      box-shadow: ${theme.shadows[4]};
      padding: ${theme.spacing(10)};
      z-index: ${theme.zIndex.dialog};

      ${theme.breakpoints.down('md')} {
        max-width: 100%;
      }
    }
  }
`

const Title = styled(Typography)<{ $hasDescription?: boolean }>`
  && {
    margin-bottom: ${({ $hasDescription }) =>
      $hasDescription ? theme.spacing(3) : theme.spacing(8)};
  }
`
const Description = styled(Typography)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

const StyledButtonGroup = styled(ButtonGroup)`
  && {
    margin-left: auto;
    align-items: initial;

    ${theme.breakpoints.down('md')} {
      margin-left: 0;
      flex-direction: column-reverse;
    }
  }
`
