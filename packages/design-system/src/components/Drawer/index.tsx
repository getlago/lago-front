import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material'
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { tw } from '~/lib'

import {
  PreventClosingDrawerDialog,
  PreventClosingDrawerDialogRef,
} from './PreventClosingDrawerDialog'

import { Button } from '../Button'
import { Typography } from '../Typography'

interface DrawerProps extends Pick<MuiDrawerProps, 'anchor'> {
  className?: string
  stickyBottomBarClassName?: string
  title: string | ReactNode
  opener?: ReactElement
  forceOpen?: boolean
  showCloseWarningDialog?: boolean
  fullContentHeight?: boolean
  children: (({ closeDrawer }: { closeDrawer: () => void }) => ReactNode) | ReactNode
  stickyBottomBar?: (({ closeDrawer }: { closeDrawer: () => void }) => ReactNode) | ReactNode
  withPadding?: boolean
  onOpen?: () => void
  onClose?: () => void
}

export interface DrawerRef {
  openDrawer: () => unknown
  closeDrawer: () => unknown
}

export const Drawer = forwardRef<DrawerRef, DrawerProps>(
  (
    {
      forceOpen = false,
      showCloseWarningDialog = false,
      children,
      stickyBottomBar,
      opener,
      anchor = 'right',
      title,
      fullContentHeight,
      withPadding = true,
      stickyBottomBarClassName,
      onOpen,
      onClose,
    }: DrawerProps,
    ref,
  ) => {
    const preventClosingDrawerDialogRef = useRef<PreventClosingDrawerDialogRef>(null)
    const [isOpen, setIsOpen] = useState(forceOpen)

    useImperativeHandle(ref, () => ({
      openDrawer: () => {
        setIsOpen(true)
        onOpen && onOpen()
      },
      closeDrawer: () => setIsOpen(false),
    }))

    return (
      <>
        {!!opener && cloneElement(opener, { onClick: () => setIsOpen((prev) => !prev) })}
        <MuiDrawer
          open={isOpen}
          anchor={anchor}
          elevation={4}
          onClose={() => {
            const closeAction = () => {
              onClose && onClose()
              setIsOpen(false)
            }

            if (showCloseWarningDialog) {
              preventClosingDrawerDialogRef.current?.openDialog({
                onContinue: () => {
                  closeAction()
                },
              })
            } else {
              closeAction()
            }
          }}
          transitionDuration={250}
          slotProps={{
            backdrop: {
              classes: {
                root: 'bg-grey-700/40',
              },
            },
          }}
          PaperProps={{
            className: tw(
              'w-full max-w-[816px] md:w-[calc(100vw-48px)]',
              !!stickyBottomBar && 'grid grid-rows-[72px_1fr_80px]',
            ),
          }}
        >
          <div className="sticky top-0 z-drawer flex h-nav min-h-nav items-center justify-between bg-white px-4 py-0 shadow-b md:px-12">
            {typeof title === 'string' ? (
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {title}
              </Typography>
            ) : (
              title
            )}
            <Button
              icon="close"
              variant="quaternary"
              onClick={() => {
                const closeAction = () => {
                  onClose && onClose()
                  setIsOpen(false)
                }

                if (showCloseWarningDialog) {
                  preventClosingDrawerDialogRef.current?.openDialog({
                    onContinue: () => {
                      closeAction()
                    },
                  })
                } else {
                  closeAction()
                }
              }}
            />
          </div>
          <div
            className={tw(
              fullContentHeight && 'h-full',
              withPadding && 'px-4 pb-20 pt-12 md:px-12',
            )}
          >
            {typeof children === 'function'
              ? children({ closeDrawer: () => setIsOpen(false) })
              : children}
          </div>

          {!!stickyBottomBar && (
            <div
              className={tw(
                'sticky bottom-0 box-border bg-white p-4 text-right shadow-t md:px-12 md:py-4',
                stickyBottomBarClassName,
              )}
            >
              {typeof stickyBottomBar === 'function'
                ? stickyBottomBar({ closeDrawer: () => setIsOpen(false) })
                : stickyBottomBar}
            </div>
          )}
        </MuiDrawer>

        <PreventClosingDrawerDialog ref={preventClosingDrawerDialogRef} />
      </>
    )
  },
)

Drawer.displayName = 'Drawer'
