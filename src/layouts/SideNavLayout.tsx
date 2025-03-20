import { gql, useApolloClient } from '@apollo/client'
import { ClickAwayListener, Stack } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Location, Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  Avatar,
  Button,
  Icon,
  IconName,
  Popper,
  Skeleton,
  Typography,
  VerticalMenu,
} from '~/components/designSystem'
import { envGlobalVar, logOut, switchCurrentOrganization } from '~/core/apolloClient'
import { DOCUMENTATION_URL, FEATURE_REQUESTS_URL } from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import {
  ADD_ON_DETAILS_ROUTE,
  ADD_ONS_ROUTE,
  ANALYTIC_ROUTE,
  ANALYTIC_TABS_ROUTE,
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
import { MenuPopper } from '~/styles/designSystem'
import { tw } from '~/styles/utils'

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
  const { organization, loading: currentOrganizationLoading } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const { data, loading, error } = useSideNavInfosQuery()
  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }
  const contentRef = useRef<HTMLDivElement>(null)
  const organizationList = currentUser?.memberships.map((membership) => membership.organization)

  useEffect(() => {
    // Avoid weird scroll behavior on navigation
    if (!contentRef.current || state?.disableScrollTop) return
    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef, state?.disableScrollTop])

  return (
    <div className="flex h-screen">
      <Button
        className="absolute left-4 top-4 z-drawer md:hidden"
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
        <div
          className={tw(
            'absolute z-sideNav flex h-full w-60 flex-col overflow-hidden bg-white transition-[left] duration-250 shadow-r md:static md:left-auto md:z-auto',
            open ? 'left-0' : '-left-60',
          )}
        >
          <div className="mt-14 px-4 pb-2 pt-4 md:mt-0">
            <Popper
              PopperProps={{ placement: 'bottom-start' }}
              minWidth={320}
              maxHeight={`calc(100vh - 64px - 16px)`}
              enableFlip={false}
              opener={
                <Button
                  className="max-w-[calc(240px-theme(space.8))] text-left *:first:mr-2"
                  data-test="side-nav-name"
                  variant="quaternary"
                  disabled={currentOrganizationLoading}
                >
                  {currentOrganizationLoading ? (
                    <div className="flex flex-row items-center gap-2">
                      <Skeleton variant="circular" size="small" />
                      <Skeleton variant="text" className="w-30" />
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </Button>
              }
            >
              {({ closePopper }) => (
                <MenuPopper className="max-w-80 overflow-hidden p-0">
                  <Typography className="min-h-11 px-5 py-4" variant="captionHl" noWrap>
                    {currentUser?.email}
                  </Typography>
                  {!!organizationList?.length && (
                    <div
                      className="flex flex-col gap-1 overflow-auto p-2 pt-0"
                      style={{ maxHeight: 'calc(100vh - 80px)' }}
                    >
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
                              <Avatar className="mr-2" size="small" variant="connector">
                                <img src={logoUrl} alt={`${name}'s logo`} />
                              </Avatar>
                            ) : (
                              <Avatar
                                className="mr-2"
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
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 shadow-t first-child:text-left">
                    <Button
                      variant="quaternary"
                      align="left"
                      startIcon="logout"
                      onClick={async () => await logOut(client, true)}
                    >
                      {translate('text_623b497ad05b960101be3444')}
                    </Button>
                    {!!loading && !error ? (
                      <div className="flex h-5 items-center justify-between py-3 pl-5 pr-2">
                        <Skeleton variant="text" className="w-12" />
                        <Skeleton variant="text" className="w-30" />
                      </div>
                    ) : !!data && !error ? (
                      <div className="flex h-5 items-center justify-between py-3 pl-5 pr-2">
                        <a
                          className="text-blue visited:text-blue"
                          href={data?.currentVersion?.githubUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {data?.currentVersion?.number}
                          <Icon className="ml-2 hover:cursor-pointer" name="outside" size="small" />
                        </a>
                      </div>
                    ) : undefined}
                  </div>
                </MenuPopper>
              )}
            </Popper>
          </div>
          <div className="flex flex-1 flex-col overflow-auto px-4 pb-4 pt-2">
            <div className="flex w-full flex-col gap-1 *:text-left">
              <VerticalMenu
                loading={currentUserLoading}
                loadingComponent={
                  <div className="flex flex-1 flex-col gap-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div
                        key={`skeleton-upper-nav-${i}`}
                        className="flex flex-1 flex-row items-center gap-3 pt-3"
                      >
                        <Skeleton variant="circular" size="small" />
                        <Skeleton variant="text" className="w-30" />
                      </div>
                    ))}
                  </div>
                }
                onClick={() => setOpen(false)}
                tabs={[
                  {
                    title: translate('text_6553885df387fd0097fd7384'),
                    icon: 'chart-bar',
                    link: ANALYTIC_ROUTE,
                    match: [ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE],
                    hidden: !hasPermissions(['analyticsView']),
                  },
                  {
                    title: translate('text_623b497ad05b960101be3448'),
                    icon: 'pulse',
                    link: BILLABLE_METRICS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [BILLABLE_METRICS_ROUTE],
                    hidden: !hasPermissions(['billableMetricsView']),
                  },
                  {
                    title: translate('text_62442e40cea25600b0b6d85a'),
                    icon: 'board',
                    link: PLANS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [PLANS_ROUTE, PLAN_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS],
                    hidden: !hasPermissions(['plansView']),
                  },
                  {
                    title: translate('text_629728388c4d2300e2d3801a'),
                    icon: 'puzzle',
                    link: ADD_ONS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [ADD_ONS_ROUTE, ADD_ON_DETAILS_ROUTE],
                    hidden: !hasPermissions(['addonsView']),
                  },
                  {
                    title: translate('text_62865498824cc10126ab2940'),
                    icon: 'coupon',
                    link: COUPONS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [COUPONS_ROUTE, COUPON_DETAILS_ROUTE],
                    hidden: !hasPermissions(['couponsView']),
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
                    hidden: !hasPermissions(['customersView']),
                  },
                  {
                    title: translate('text_63ac86d797f728a87b2f9f85'),
                    icon: 'document',
                    link: INVOICES_ROUTE,
                    canBeClickedOnActive: true,
                    match: [INVOICES_ROUTE, INVOICES_TAB_ROUTE],
                    hidden: !hasPermissions(['invoicesView', 'creditNotesView']),
                  },
                ]}
              />
            </div>
            <div className="mt-auto flex w-full flex-col gap-1 *:text-left">
              <VerticalMenu
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
                        <Skeleton variant="circular" size="small" />
                        <Skeleton variant="text" className="w-30" />
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
                    hidden: !hasPermissions(['developersManage']),
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
                    hidden: !hasPermissions(['organizationView']),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </ClickAwayListener>
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <Outlet />
      </div>
    </div>
  )
}

export default SideNav
