import { Outlet } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { ClickAwayListener } from '@mui/material'
import { useApolloClient } from '@apollo/client'
import { useNavigate, useLocation } from 'react-router-dom'

import { useI18nContext } from '~/core/I18nContext'
import { logOut, useCurrentUserInfosVar } from '~/core/apolloClient'
import { Avatar, Button, TabButton, Popper, IconName } from '~/components/designSystem'
import { theme } from '~/styles'
import { API_KEYS_ROUTE, BILLABLE_METRICS_ROUTE } from '~/core/router'
import { MenuPopper } from '~/styles/designSystem'

const NAV_WIDTH = 240

interface TabProps {
  title: string
  icon: IconName
  link: string
  canClickOnActive?: boolean
}

const SideNav = () => {
  const client = useApolloClient()
  const { currentOrganization } = useCurrentUserInfosVar()
  const { translate } = useI18nContext()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location
  const companyName = currentOrganization?.name
  const tabs: TabProps[] = [
    {
      title: translate('text_623b497ad05b960101be3448'),
      icon: 'pulse',
      link: BILLABLE_METRICS_ROUTE,
    },
  ]
  const activeTabIndex = tabs.findIndex((tab) => pathname.includes(tab.link))
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Avoid weird scroll behaviour on navigation
    if (!contentRef.current) return

    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef])

  return (
    <Container>
      <BurgerButton
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        icon="burger"
        variant="quaternary"
      />
      <ClickAwayListener
        onClickAway={() => {
          if (open) setOpen(false)
        }}
      >
        <Drawer className="drawer" $open={open}>
          <Header className="header">
            <Popper
              PopperProps={{ placement: 'bottom-start' }}
              minWidth={320}
              maxHeight={`calc(100vh - 64px - 16px)`}
              enableFlip={false}
              opener={
                <HeaderButton
                  title={companyName}
                  icon={
                    <Avatar
                      variant="company"
                      identifier={companyName || ''}
                      size="small"
                      initials={(companyName ?? 'Lago')[0]}
                    />
                  }
                />
              }
            >
              {() => (
                <StyledMenuPopper>
                  <Logout>
                    <TabButton
                      key="menu-logout"
                      icon="logout"
                      title={translate('text_623b497ad05b960101be3444')}
                      onClick={() => logOut(client)}
                    />
                  </Logout>
                </StyledMenuPopper>
              )}
            </Popper>
          </Header>
          <Nav className="nav">
            <TabsButtons>
              {tabs.map(({ title, icon }, i) => {
                return (
                  <TabButton
                    key={`side-nav-${i}-${title}`}
                    active={activeTabIndex === i}
                    onClick={() => {
                      navigate(tabs[i].link)
                      setOpen(false)
                      const element = document.activeElement as HTMLElement

                      element.blur && element.blur()
                    }}
                    icon={icon}
                    canClickOnActive={tabs[i].canClickOnActive}
                    title={title}
                  />
                )
              })}
            </TabsButtons>
            <ApiKeyButton
              active={pathname.includes(API_KEYS_ROUTE)}
              onClick={() => {
                navigate(API_KEYS_ROUTE)
                setOpen(false)
                const element = document.activeElement as HTMLElement

                element.blur && element.blur()
              }}
              icon="key"
              title={translate('text_6227a2e847fcd700e9038943')}
            />
          </Nav>
        </Drawer>
      </ClickAwayListener>
      <Content ref={contentRef}>
        <Outlet />
        <Gift variant="quaternary" to="https://www.incredibox.com/demo/">
          <span role="img" aria-label="gift">
            🎁
          </span>
        </Gift>
      </Content>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  height: 100vh;
`

const BurgerButton = styled(Button)`
  && {
    position: absolute;
    z-index: ${theme.zIndex.drawer + 1};
    left: ${theme.spacing(4)};
    top: ${theme.spacing(4)};

    ${theme.breakpoints.up('md')} {
      display: none;
    }
  }
`

const Drawer = styled.div<{ $open: boolean }>`
  height: 100vh;
  box-shadow: ${theme.shadows[6]};
  width: ${NAV_WIDTH}px;
  overflow: hidden;
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  display: flex;
  flex-direction: column;
  background-color: ${theme.palette.common.white};

  ${theme.breakpoints.down('md')} {
    position: absolute;
    z-index: ${theme.zIndex.drawer};
    left: ${({ $open }) => ($open ? 0 : -NAV_WIDTH)}px;
  }
`

const Header = styled.div`
  padding: ${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(4)};

  ${theme.breakpoints.down('md')} {
    margin-top: calc(40px + ${theme.spacing(4)});
  }
`

const HeaderButton = styled(TabButton)`
  max-width: calc(${NAV_WIDTH}px - ${theme.spacing(8)});
  color: ${theme.palette.text.secondary};
  text-align: left;
  :hover {
    color: ${theme.palette.text.secondary};
  }

  :focus:not(:active) {
    box-shadow: none;
    border-radius: 12px;
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`

const Nav = styled.div`
  padding: ${theme.spacing(2)} ${theme.spacing(4)} ${theme.spacing(4)};
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`

const TabsButtons = styled.div`
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;

  > * {
    text-align: left;

    &:not(:last-child) {
      margin-bottom: ${theme.spacing(1)};
    }
  }
`

const StyledMenuPopper = styled(MenuPopper)`
  padding: 0;
  overflow: hidden;
  height: inherit;
  max-height: inherit;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`

const Logout = styled.div`
  box-shadow: ${theme.shadows[7]};
  padding: ${theme.spacing(2)};

  > * {
    width: 100%;
    text-align: left;
  }
`

const Gift = styled(Button)`
  && {
    position: absolute;
    bottom: ${theme.spacing(3)};
    right: ${theme.spacing(3)};
    height: 30px;
    width: 30px;
    min-width: 30px;
    padding-left: 15px;
    opacity: 0.03;
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

    &:hover {
      opacity: 1;
    }
  }
`

const ApiKeyButton = styled(TabButton)`
  margin-top: auto;
  text-align: left;
`

export default SideNav
