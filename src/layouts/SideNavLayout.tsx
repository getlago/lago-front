import { Outlet } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { ClickAwayListener } from '@mui/material'
import { useApolloClient } from '@apollo/client'
import { useNavigate, useLocation, Location, matchPath } from 'react-router-dom'

import { useInternationalization } from '~/hooks/useInternationalization'
import { logOut, useCurrentUserInfosVar } from '~/core/apolloClient'
import { Avatar, Button, TabButton, Popper, IconName } from '~/components/designSystem'
import { theme } from '~/styles'
import { DOCUMENTATION_URL } from '~/externalUrls'
import {
  BILLABLE_METRICS_ROUTE,
  PLANS_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  DEVELOPPERS_ROUTE,
  SETTINGS_ROUTE,
  HOME_ROUTE,
  COUPONS_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  ADD_ONS_ROUTE,
} from '~/core/router'
import { MenuPopper } from '~/styles/designSystem'

const NAV_WIDTH = 240

interface TabProps {
  title: string
  icon: IconName
  link: string
  canClickOnActive?: boolean
  match?: string[]
  external?: boolean
}

const SideNav = () => {
  const client = useApolloClient()
  const { currentOrganization } = useCurrentUserInfosVar()
  const { translate } = useInternationalization()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }
  const companyName = currentOrganization?.name
  const tabs: TabProps[] = [
    {
      title: translate('text_623b497ad05b960101be3448'),
      icon: 'pulse',
      link: BILLABLE_METRICS_ROUTE,
      match: [BILLABLE_METRICS_ROUTE, HOME_ROUTE],
    },
    {
      title: translate('text_62442e40cea25600b0b6d85a'),
      icon: 'board',
      link: PLANS_ROUTE,
    },
    {
      title: translate('text_629728388c4d2300e2d3801a'),
      icon: 'puzzle',
      link: ADD_ONS_ROUTE,
    },
    {
      title: translate('text_62865498824cc10126ab2940'),
      icon: 'coupon',
      link: COUPONS_ROUTE,
    },
    {
      title: translate('text_624efab67eb2570101d117a5'),
      icon: 'user-multiple',
      link: CUSTOMERS_LIST_ROUTE,
      match: [CUSTOMERS_LIST_ROUTE, CUSTOMER_DETAILS_ROUTE, CUSTOMER_DETAILS_TAB_ROUTE],
      canClickOnActive: true,
    },
  ]

  const bottomTabButtons: TabProps[] = [
    {
      title: translate('text_6295e58352f39200d902b01c'),
      icon: 'book',
      link: DOCUMENTATION_URL,
      external: true,
    },
    {
      title: translate('text_6271200984178801ba8bdeac'),
      icon: 'laptop',
      link: DEVELOPPERS_ROUTE,
    },
    {
      title: translate('text_62728ff857d47b013204c726'),
      icon: 'settings',
      link: SETTINGS_ROUTE,
    },
  ]

  const activeTabIndex = tabs.findIndex(
    (tab) => tab.link === pathname || !!tab.match?.find((match) => !!matchPath(match, pathname))
  )
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Avoid weird scroll behaviour on navigation
    if (!contentRef.current || state?.disableScrollTop) return

    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef, state?.disableScrollTop])

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
              {tabs.map(({ title, icon, canClickOnActive, link }, i) => {
                return (
                  <TabButton
                    key={`side-nav-${i}-${title}`}
                    active={activeTabIndex === i}
                    onClick={() => {
                      navigate(link)
                      setOpen(false)
                      const element = document.activeElement as HTMLElement

                      element.blur && element.blur()
                    }}
                    icon={icon}
                    canClickOnActive={canClickOnActive}
                    title={title}
                  />
                )
              })}
            </TabsButtons>
            <BottomButtons>
              {bottomTabButtons.map(({ title, icon, link, canClickOnActive, external }, i) => {
                return (
                  <TabButton
                    key={`side-nav-bottom-${i}-${title}`}
                    active={pathname.includes(link)}
                    onClick={() => {
                      if (external) {
                        window.open(link, '_newtab')
                      } else {
                        navigate(link)
                      }
                      const element = document.activeElement as HTMLElement

                      element.blur && element.blur()
                      setOpen(false)
                    }}
                    icon={icon}
                    canClickOnActive={canClickOnActive}
                    title={title}
                  />
                )
              })}
            </BottomButtons>
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

const BottomButtons = styled.div`
  margin-top: auto;
  width: 100%;
  box-sizing: border-box;
  flex-direction: column;
  display: flex;

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

export default SideNav
