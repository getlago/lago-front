import { alpha, Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material'
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import styled, { css } from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

import {
  PreventClosingDrawerDialog,
  PreventClosingDrawerDialogRef,
} from './PreventClosingDrawerDialog'

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
        <StyledDrawer
          $hasStickyBottomBar={!!stickyBottomBar}
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
          PaperProps={{ className: 'drawerPaper' }}
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
          <Content $fullContentHeight={fullContentHeight} $withPadding={withPadding}>
            {typeof children === 'function'
              ? children({ closeDrawer: () => setIsOpen(false) })
              : children}
          </Content>

          {!!stickyBottomBar && (
            <div
              className={tw(
                'border-t-grey200 sticky bottom-0 box-border border-t border-solid bg-white p-4 text-right md:px-12 md:py-4',
                stickyBottomBarClassName,
              )}
            >
              {typeof stickyBottomBar === 'function'
                ? stickyBottomBar({ closeDrawer: () => setIsOpen(false) })
                : stickyBottomBar}
            </div>
          )}
        </StyledDrawer>

        <PreventClosingDrawerDialog ref={preventClosingDrawerDialogRef} />
      </>
    )
  },
)

Drawer.displayName = 'Drawer'

const StyledDrawer = styled(MuiDrawer)<{ $hasStickyBottomBar?: boolean }>`
  .drawerPaper {
    max-width: 816px;
    width: calc(100vw - ${theme.spacing(12)});

    ${({ $hasStickyBottomBar }) =>
      $hasStickyBottomBar &&
      css`
        display: grid;
        grid-template-rows: 72px 1fr 80px;
      `}

    ${theme.breakpoints.down('md')} {
      width: 100%;
    }
  }

  .MuiBackdrop-root {
    background-color: ${alpha(theme.palette.grey[700], 0.4)};
  }
`

const Content = styled.div<{ $fullContentHeight?: boolean; $withPadding?: boolean }>`
  height: ${({ $fullContentHeight }) => ($fullContentHeight ? '100%' : ' ')};
  padding: ${({ $withPadding }) =>
    $withPadding ? `${theme.spacing(12)} ${theme.spacing(12)} ${theme.spacing(20)}` : undefined};

  ${theme.breakpoints.down('md')} {
    padding: ${({ $withPadding }) =>
      $withPadding
        ? `${theme.spacing(12)} ${theme.spacing(4)} ${theme.spacing(20)} ${theme.spacing(4)}`
        : undefined};
  }
`
