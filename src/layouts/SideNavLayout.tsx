import { gql } from '@apollo/client'
import { useApolloClient } from '@apollo/client'
import { ClickAwayListener, Stack } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Location, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  Icon,
  IconName,
  NavigationTab,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { envGlobalVar, logOut, switchCurrentOrganization } from '~/core/apolloClient'
import { DOCUMENTATION_URL, FEATURE_REQUESTS_URL } from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import {
  ADD_ONS_ROUTE,
  ANALYTIC_ROUTE,
  API_KEYS_ROUTE,
  BILLABLE_METRICS_ROUTE,
  COUPON_DETAILS_ROUTE,
  COUPONS_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_PLAN_DETAILS,
  CUSTOMERS_LIST_ROUTE,
  DEBUGGER_ROUTE,
  DEVELOPERS_ROUTE,
  EMAILS_SCENARIO_CONFIG_ROUTE,
  EMAILS_SETTINGS_ROUTE,
  HOME_ROUTE,
  INTEGRATIONS_ROUTE,
  INVOICE_SETTINGS_ROUTE,
  INVOICES_ROUTE,
  INVOICES_TAB_ROUTE,
  MEMBERS_ROUTE,
  ONLY_DEV_DESIGN_SYSTEM_ROUTE,
  ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE,
  ORGANIZATION_INFORMATIONS_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  PLANS_ROUTE,
  SETTINGS_ROUTE,
  TAXES_SETTINGS_ROUTE,
  WEBHOOK_LOGS_ROUTE,
  WEBHOOK_LOGS_TAB_ROUTE,
  WEBHOOK_ROUTE,
} from '~/core/router'
import { useSideNavInfosQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { theme } from '~/styles'
import { MenuPopper } from '~/styles/designSystem'

const NAV_WIDTH = 240
const { appEnv } = envGlobalVar()

gql`
  query SideNavInfos {
    currentVersion {
      githubUrl
      number
    }
  }
`

interface TabProps {
  title: string
  icon: IconName
  link: string
  match?: string[]
  external?: boolean
}

const SideNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const client = useApolloClient()
  const [open, setOpen] = useState(false)
  const { currentUser, loading: currentUserLoading } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { organization } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const { data, loading, error } = useSideNavInfosQuery()
  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }
  const contentRef = useRef<HTMLDivElement>(null)
  const organizationList = currentUser?.memberships.map((membership) => membership.organization)

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
                <HeaderButton data-test="side-nav-name" variant="quaternary">
                  {organization?.logoUrl ? (
                    <Avatar size="small" variant="connector">
                      <img
                        src={organization?.logoUrl as string}
                        alt={`${organization?.name}'s logo`}
                      />
                    </Avatar>
                  ) : (
                    <Avatar
                      variant="company"
                      identifier={organization?.name || ''}
                      size="small"
                      initials={(organization?.name ?? 'Lago')[0]}
                    />
                  )}
                  <Typography color="textSecondary" noWrap>
                    {organization?.name}
                  </Typography>
                </HeaderButton>
              }
            >
              {({ closePopper }) => (
                <StyledMenuPopper>
                  <UserEmail variant="captionHl" noWrap>
                    {currentUser?.email}
                  </UserEmail>
                  {!!organizationList?.length && (
                    <OrganizationList>
                      {organizationList
                        .sort(
                          (a, b) =>
                            a.name.toLowerCase()?.localeCompare(b.name.toLowerCase() ?? '') ?? 0,
                        )
                        ?.map(({ id, name, logoUrl }) => (
                          <Button
                            key={id}
                            align="left"
                            variant={id === organization?.id ? 'secondary' : 'quaternary'}
                            onClick={async () => {
                              await switchCurrentOrganization(client, id)
                              navigate(HOME_ROUTE)
                              closePopper()
                            }}
                          >
                            {!!logoUrl ? (
                              <OrganizationAvatar size="small" variant="connector">
                                <img src={logoUrl} alt={`${name}'s logo`} />
                              </OrganizationAvatar>
                            ) : (
                              <OrganizationAvatar
                                variant="company"
                                identifier={name || ''}
                                size="small"
                                initials={(name ?? 'Lago')[0]}
                              />
                            )}
                            <Typography noWrap color="inherit">
                              {name}
                            </Typography>
                          </Button>
                        ))}
                    </OrganizationList>
                  )}
                  <Logout>
                    <Button
                      variant="quaternary"
                      align="left"
                      startIcon="logout"
                      onClick={async () => await logOut(client, true)}
                    >
                      {translate('text_623b497ad05b960101be3444')}
                    </Button>
                    {!!loading && !error ? (
                      <Version>
                        <Skeleton variant="text" height={12} width={48} />
                        <Skeleton variant="text" height={12} width={120} />
                      </Version>
                    ) : !!data && !error ? (
                      <Version>
                        <ExternalLink
                          href={data?.currentVersion?.githubUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {data?.currentVersion?.number}
                          <ExternalLinkIcon name="outside" size="small" />
                        </ExternalLink>
                      </Version>
                    ) : undefined}
                  </Logout>
                </StyledMenuPopper>
              )}
            </Popper>
          </Header>
          <Nav className="nav">
            <TabsButtons>
              <NavigationTab
                loading={currentUserLoading}
                loadingComponent={
                  <Stack flex={1} gap={4}>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Stack
                        key={`skeleton-upper-nav-${i}`}
                        flex={1}
                        gap={3}
                        direction={'row'}
                        paddingTop={3}
                      >
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton variant="text" height={16} width={120} />
                      </Stack>
                    ))}
                  </Stack>
                }
                onClick={() => setOpen(false)}
                tabs={[
                  ...(hasPermissions(['analyticsView'])
                    ? [
                        {
                          title: translate('text_6553885df387fd0097fd7384'),
                          icon: 'chart-bar',
                          link: ANALYTIC_ROUTE,
                          match: [ANALYTIC_ROUTE],
                        } as TabProps,
                      ]
                    : []),

                  ...(hasPermissions(['billableMetricsView'])
                    ? [
                        {
                          title: translate('text_623b497ad05b960101be3448'),
                          icon: 'pulse',
                          link: BILLABLE_METRICS_ROUTE,
                          match: [BILLABLE_METRICS_ROUTE],
                        } as TabProps,
                      ]
                    : []),

                  {
                    title: translate('text_62442e40cea25600b0b6d85a'),
                    icon: 'board',
                    link: PLANS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [PLANS_ROUTE, PLAN_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS],
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
                    match: [COUPONS_ROUTE, COUPON_DETAILS_ROUTE],
                  },
                  {
                    title: translate('text_624efab67eb2570101d117a5'),
                    icon: 'user-multiple',
                    link: CUSTOMERS_LIST_ROUTE,
                    canBeClickedOnActive: true,
                    match: [
                      CUSTOMERS_LIST_ROUTE,
                      CUSTOMER_DETAILS_ROUTE,
                      CUSTOMER_DETAILS_TAB_ROUTE,
                      CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
                      PLAN_SUBSCRIPTION_DETAILS_ROUTE,
                    ],
                  },
                  {
                    title: translate('text_63ac86d797f728a87b2f9f85'),
                    icon: 'document',
                    link: INVOICES_ROUTE,
                    match: [INVOICES_ROUTE, INVOICES_TAB_ROUTE],
                  },
                ]}
                orientation="vertical"
              />
            </TabsButtons>
            <BottomButtons>
              <NavigationTab
                loading={currentUserLoading}
                loadingComponent={
                  <Stack flex={1} gap={4}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Stack
                        key={`skeleton-lower-nav-${i}`}
                        flex={1}
                        gap={3}
                        direction={'row'}
                        paddingTop={3}
                      >
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton variant="text" height={16} width={120} />
                      </Stack>
                    ))}
                  </Stack>
                }
                onClick={() => setOpen(false)}
                tabs={[
                  ...([AppEnvEnum.qa, AppEnvEnum.development].includes(appEnv)
                    ? [
                        {
                          title: 'Design System',
                          icon: 'rocket',
                          link: ONLY_DEV_DESIGN_SYSTEM_ROUTE,
                          match: [ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, ONLY_DEV_DESIGN_SYSTEM_ROUTE],
                        } as TabProps,
                      ]
                    : []),
                  {
                    title: translate('text_63fdd3e4076c80ecf4136f33'),
                    icon: 'bulb',
                    link: FEATURE_REQUESTS_URL,
                    external: true,
                  },
                  {
                    title: translate('text_6295e58352f39200d902b01c'),
                    icon: 'book',
                    link: DOCUMENTATION_URL,
                    external: true,
                  },
                  {
                    title: translate('text_6271200984178801ba8bdeac'),
                    icon: 'laptop',
                    link: DEVELOPERS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [
                      API_KEYS_ROUTE,
                      WEBHOOK_ROUTE,
                      DEBUGGER_ROUTE,
                      WEBHOOK_LOGS_ROUTE,
                      WEBHOOK_LOGS_TAB_ROUTE,
                    ],
                  },
                  {
                    title: translate('text_62728ff857d47b013204c726'),
                    icon: 'settings',
                    link: SETTINGS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [
                      EMAILS_SCENARIO_CONFIG_ROUTE,
                      EMAILS_SETTINGS_ROUTE,
                      INTEGRATIONS_ROUTE,
                      INVOICE_SETTINGS_ROUTE,
                      MEMBERS_ROUTE,
                      ORGANIZATION_INFORMATIONS_ROUTE,
                      TAXES_SETTINGS_ROUTE,
                    ],
                  },
                ]}
                orientation="vertical"
              />
            </BottomButtons>
          </Nav>
        </Drawer>
      </ClickAwayListener>
      <Content ref={contentRef}>
        <Outlet />
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
    z-index: ${theme.zIndex.drawer};
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
    z-index: ${theme.zIndex.drawer - 1};
    left: ${({ $open }) => ($open ? 0 : -NAV_WIDTH)}px;
  }
`

const Header = styled.div`
  padding: ${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(4)};

  ${theme.breakpoints.down('md')} {
    margin-top: calc(40px + ${theme.spacing(4)});
  }
`

const HeaderButton = styled(Button)`
  max-width: calc(${NAV_WIDTH}px - ${theme.spacing(8)});
  text-align: left;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
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
  gap: ${theme.spacing(1)};

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
  max-width: 320px;

  & > *:not(:last-child) {
    margin-bottom: 0px;
  }
`

const UserEmail = styled(Typography)`
  padding: ${theme.spacing(4)} ${theme.spacing(5)} ${theme.spacing(0)};
  min-height: 44px;
  box-sizing: border-box;
`

const OrganizationList = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(2)};
  max-height: calc(100vh - 80px);
  overflow: auto;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

const OrganizationAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(2)};
`

const Logout = styled.div`
  box-shadow: ${theme.shadows[5]};
  padding: ${theme.spacing(2)};
  display: flex;
  align-items: center;
  justify-content: space-between;

  > *:first-child {
    text-align: left;
  }
`

const Version = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(3)} ${theme.spacing(5)};
  height: ${theme.spacing(5)};
`

const ExternalLinkIcon = styled(Icon)`
  margin-left: ${theme.spacing(2)};

  &:hover {
    cursor: pointer;
  }
`

const ExternalLink = styled.a`
  color: ${theme.palette.primary[600]};

  &:visited {
    color: ${theme.palette.primary[600]};
  }
`

export default SideNav
