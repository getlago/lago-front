import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  MouseEvent,
} from 'react'
import {
  Popper as MuiPopper,
  ClickAwayListener,
  PopperProps as MUIPopperProps,
} from '@mui/material'
import styled from 'styled-components'

import { theme } from '~/styles'

export interface PopperProps {
  className?: string
  opener?: ReactElement | (({ isOpen }: { isOpen: boolean }) => ReactElement)
  maxHeight?: number | string
  minWidth?: number
  PopperProps?: Pick<MUIPopperProps, 'placement' | 'modifiers' | 'disablePortal'>
  enableFlip?: boolean
  displayInDialog?: boolean
  popperGroupName?: string
  popperName?: string
  children: (({ closePopper }: { closePopper: () => void }) => ReactNode) | ReactNode
  onClickAway?: () => void
}

export interface PopperRef {
  openPopper: () => unknown
  closePopper: () => unknown
}

export const Popper = forwardRef<PopperRef, PopperProps>(
  (
    {
      opener,
      PopperProps,
      maxHeight,
      children,
      className,
      minWidth,
      enableFlip = true,
      displayInDialog = false,
      onClickAway,
    }: PopperProps,
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openerRef = useRef<any>(null)

    const updateIsOpen = useCallback(
      (open: boolean) => {
        setIsOpen(open)
      },
      [setIsOpen]
    )

    const toggle = useCallback(() => updateIsOpen(!isOpen), [updateIsOpen, isOpen])

    const onClickAwayProxy = useCallback(() => {
      updateIsOpen(false)
      onClickAway && onClickAway()
    }, [updateIsOpen, onClickAway])

    useImperativeHandle(ref, () => ({
      openPopper: () => updateIsOpen(true),
      closePopper: () => updateIsOpen(false),
    }))

    return (
      <ClickAwayListener onClickAway={onClickAwayProxy}>
        <div className={className}>
          {typeof opener === 'function'
            ? cloneElement(opener({ isOpen }), {
                onClick: (e: MouseEvent<HTMLDivElement>) => {
                  const element = opener({ isOpen })

                  element?.props?.onClick && element.props.onClick(e)
                  toggle()
                },
                ref: openerRef,
              })
            : // @ts-expect-error
              cloneElement(opener, { onClick: toggle, ref: openerRef })}
          <StyledPopper
            onKeyDown={(e) => {
              if (e.code === 'Escape') {
                updateIsOpen(false)
              }
            }}
            $displayInDialog={displayInDialog}
            open={isOpen}
            anchorEl={openerRef.current}
            $minWidth={minWidth ?? openerRef?.current?.offsetWidth ?? 0}
            modifiers={[
              {
                name: 'flip',
                enabled: enableFlip,
              },
              {
                name: 'offset',
                enabled: true,
                options: {
                  offset: [0, 8],
                },
              },
            ]}
            {...PopperProps}
          >
            <StyledCard $maxHeight={maxHeight}>
              {typeof children === 'function'
                ? children({ closePopper: () => updateIsOpen(false) })
                : children}
            </StyledCard>
          </StyledPopper>
        </div>
      </ClickAwayListener>
    )
  }
)

Popper.displayName = 'Popper'

const StyledPopper = styled(MuiPopper)<{ $minWidth?: number; $displayInDialog?: boolean }>`
  min-width: ${({ $minWidth }) => $minWidth}px;
  z-index: ${({ $displayInDialog }) =>
    $displayInDialog ? theme.zIndex.dialog + 1 : theme.zIndex.popper};
`

const StyledCard = styled.div<{ $maxHeight?: number | string }>`
  background-color: ${theme.palette.background.default};
  box-shadow: ${theme.shadows[2]};
  border: 1px solid ${theme.palette.grey[200]};
  border-radius: 12px;
  overflow: auto;
  scroll-behavior: smooth;
  max-height: ${({ $maxHeight }) =>
    $maxHeight ? (typeof $maxHeight === 'string' ? $maxHeight : `${$maxHeight}px`) : '90vh'};

  > :not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`
