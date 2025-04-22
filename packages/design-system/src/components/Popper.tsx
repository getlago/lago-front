import {
  ClickAwayListener,
  Popper as MuiPopper,
  PopperProps as MUIPopperProps,
} from '@mui/material'
import {
  cloneElement,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { tw } from '~/lib'

export interface PopperProps {
  className?: string
  opener?:
    | ReactElement
    | (({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => ReactElement)
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

interface PopperRef {
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
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openerRef = useRef<any>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    const updateIsOpen = useCallback(
      (open: boolean) => {
        setIsOpen(open)
      },
      [setIsOpen],
    )

    const toggle = useCallback(() => {
      updateIsOpen(!isOpen)
      if (!isOpen) {
        setTimeout(() => {
          cardRef?.current?.focus()
        }, 200)
      }
    }, [updateIsOpen, isOpen])

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
        <div className={tw(className)}>
          {typeof opener === 'function'
            ? cloneElement(opener({ isOpen, onClick: toggle }), {
                onClick: (e: MouseEvent<HTMLDivElement>) => {
                  const element = opener({ isOpen, onClick: toggle })

                  element?.props?.onClick && element.props.onClick(e)
                  // Only toggle if the event wasn't prevented
                  if (!e.isPropagationStopped()) {
                    toggle()
                  }
                },
                ref: openerRef,
              })
            : !!opener
              ? cloneElement(opener, { onClick: toggle, ref: openerRef })
              : null}
          <MuiPopper
            className={tw(displayInDialog ? 'z-dialog' : 'z-popper')}
            style={{ minWidth: `${minWidth ?? openerRef?.current?.offsetWidth ?? 0}px` }}
            onKeyDown={(e) => {
              if (e.code === 'Escape') {
                updateIsOpen(false)
              }
            }}
            open={isOpen}
            anchorEl={openerRef.current}
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
            <div
              ref={cardRef}
              className={tw(
                'overflow-auto scroll-smooth rounded-xl border border-grey-200 bg-white shadow-md focus:outline-none not-last-child:mb-1',
              )}
              style={{
                maxHeight: maxHeight
                  ? typeof maxHeight === 'string'
                    ? maxHeight
                    : `${maxHeight}px`
                  : '90vh',
              }}
            >
              {typeof children === 'function'
                ? children({ closePopper: () => updateIsOpen(false) })
                : children}
            </div>
          </MuiPopper>
        </div>
      </ClickAwayListener>
    )
  },
)

Popper.displayName = 'Popper'
