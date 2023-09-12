import { alpha, Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material'
import {
  cloneElement,
  forwardRef,
  ReactElement,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react'
import styled from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { NAV_HEIGHT, theme } from '~/styles'

export interface DrawerProps extends Pick<MuiDrawerProps, 'anchor'> {
  className?: string
  title: string | ReactNode
  opener?: ReactElement
  forceOpen?: boolean
  children: (({ closeDrawer }: { closeDrawer: () => void }) => ReactNode) | ReactNode
  onOpen?: () => void
  onClose?: () => void
}

export interface DrawerRef {
  openDrawer: () => unknown
  closeDrawer: () => unknown
}

export const Drawer = forwardRef<DrawerRef, DrawerProps>(
  (
    { forceOpen = false, children, opener, anchor = 'right', title, onOpen, onClose }: DrawerProps,
    ref
  ) => {
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
          open={isOpen}
          anchor={anchor}
          elevation={4}
          onClose={() => {
            onClose && onClose()
            setIsOpen(false)
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
                onClose && onClose()
                setIsOpen(false)
              }}
            />
          </Header>
          <Content>
            {typeof children === 'function'
              ? children({ closeDrawer: () => setIsOpen(false) })
              : children}
          </Content>
        </StyledDrawer>
      </>
    )
  }
)

Drawer.displayName = 'Drawer'

const StyledDrawer = styled(MuiDrawer)`
  .drawerPaper {
    max-width: 816px;
    width: calc(100vw - ${theme.spacing(12)});

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

const Content = styled.div`
  padding: ${theme.spacing(12)} ${theme.spacing(12)} ${theme.spacing(20)};

  ${theme.breakpoints.down('md')} {
    padding: ${theme.spacing(12)} ${theme.spacing(4)} ${theme.spacing(20)} ${theme.spacing(4)};
  }
`
