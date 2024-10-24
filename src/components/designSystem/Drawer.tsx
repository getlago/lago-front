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
import { NAV_HEIGHT, theme } from '~/styles'

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
          <Header>
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
          </Header>
          <Content $fullContentHeight={fullContentHeight} $withPadding={withPadding}>
            {typeof children === 'function'
              ? children({ closeDrawer: () => setIsOpen(false) })
              : children}
          </Content>

          {!!stickyBottomBar && (
            <StickyBottomBar className={stickyBottomBarClassName}>
              {typeof stickyBottomBar === 'function'
                ? stickyBottomBar({ closeDrawer: () => setIsOpen(false) })
                : stickyBottomBar}
            </StickyBottomBar>
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

const Header = styled.div`
  height: ${NAV_HEIGHT}px;
  min-height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${theme.spacing(12)};
  position: sticky;
  top: 0;
  background-color: ${theme.palette.common.white};
  z-index: ${theme.zIndex.drawer};

  ${theme.breakpoints.down('md')} {
    padding: 0 ${theme.spacing(4)};
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

const StickyBottomBar = styled.div`
  position: sticky;
  bottom: 0;
  border-top: 1px solid ${theme.palette.grey[200]};
  padding: ${theme.spacing(4)} ${theme.spacing(12)};
  box-sizing: border-box;
  text-align: right;
  background-color: ${theme.palette.background.paper};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(4)};
  }
`
