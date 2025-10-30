import { gql, useApolloClient } from '@apollo/client'
import { ClickAwayListener, Stack } from '@mui/material'
import { Avatar, ConditionalWrapper, Icon, IconName, Spinner, Tooltip } from 'lago-design-system'
import { useEffect, useRef, useState } from 'react'
import { Location, Outlet, useLocation, useNavigate } from 'react-router-dom'

import {
  Button,
  Popper,
  Skeleton,
  Typography,
  VerticalMenu,
  VerticalMenuSectionTitle,
} from '~/components/designSystem'
import { envGlobalVar, logOut, switchCurrentOrganization } from '~/core/apolloClient'
import { authenticationMethodsMapping } from '~/core/constants/authenticationMethodsMapping'
import { DOCUMENTATION_URL, FEATURE_REQUESTS_URL } from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import {
  ADD_ON_DETAILS_ROUTE,
  ADD_ONS_ROUTE,
  ANALYTIC_ROUTE,
  ANALYTIC_TABS_ROUTE,
  BILLABLE_METRIC_DETAILS_ROUTE,
  BILLABLE_METRICS_ROUTE,
  COUPON_DETAILS_ROUTE,
  COUPONS_ROUTE,
  CREDIT_NOTES_ROUTE,
  CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_DETAILS_ROUTE,
  CUSTOMER_DETAILS_TAB_ROUTE,
  CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
  CUSTOMER_INVOICE_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  CUSTOMER_SUBSCRIPTION_PLAN_DETAILS,
  CUSTOMERS_LIST_ROUTE,
  FEATURE_DETAILS_ROUTE,
  FEATURES_ROUTE,
  FORECASTS_ROUTE,
  HOME_ROUTE,
  INVOICES_ROUTE,
  ONLY_DEV_DESIGN_SYSTEM_ROUTE,
  ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE,
  PAYMENT_DETAILS_ROUTE,
  PAYMENTS_ROUTE,
  PLAN_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  PLANS_ROUTE,
  SETTINGS_ROUTE,
  SUBSCRIPTIONS_ROUTE,
} from '~/core/router'
import { useSideNavInfosQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { NavLayout } from '~/layouts/NavLayout'
import { BadgeAI } from '~/pages/forecasts/Forecasts'
import { MenuPopper } from '~/styles/designSystem'

// 280 + 2px for the border
const POPPER_MIN_WIDTH = 282

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

const VerticalMenuSkeleton = ({ numberOfElements }: { numberOfElements: number }) => {
  return (
    <div className="mt-1 flex flex-1 flex-col gap-4">
      {Array.from({ length: numberOfElements }).map((_, i) => (
        <div
          key={`skeleton-upper-nav-${i}`}
          className="flex flex-1 flex-row items-center gap-1 pt-1"
        >
          <Skeleton variant="circular" size="small" />
          <Skeleton variant="text" className="w-30" />
        </div>
      ))}
    </div>
  )
}

const MainNavLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const client = useApolloClient()
  const [open, setOpen] = useState(false)
  const { currentUser, loading: currentUserLoading, refetchCurrentUserInfos } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const {
    organization,
    loading: currentOrganizationLoading,
    refetchOrganizationInfos,
  } = useOrganizationInfos()
  const { translate } = useInternationalization()
  const { data, loading, error } = useSideNavInfosQuery()
  const {
    openPanel: openInspector,
    closePanel: closeInspector,
    panelOpen: isInspectorOpen,
  } = useDeveloperTool()

  const { pathname, state } = location as Location & { state: { disableScrollTop?: boolean } }
  const contentRef = useRef<HTMLDivElement>(null)
  const organizationList = currentUser?.memberships.map((membership) => membership.organization)
  const isLoading = currentOrganizationLoading || currentUserLoading || loading

  useEffect(() => {
    // Avoid weird scroll behavior on navigation
    if (!contentRef.current || state?.disableScrollTop) return
    contentRef.current?.scrollTo(0, 0)
  }, [pathname, contentRef, state?.disableScrollTop])

  const canSeeReportsSection = hasPermissions(['analyticsView'])

  return (
    <NavLayout.NavWrapper>
      <NavLayout.NavBurgerButton onClick={() => setOpen((prev) => !prev)} />
      <ClickAwayListener
        onClickAway={() => {
          if (open) setOpen(false)
        }}
      >
        <NavLayout.Nav isOpen={open}>
          {/* Organization popper */}
          <NavLayout.NavStickyElementContainer>
            <Popper
              PopperProps={{ placement: 'bottom-start' }}
              minWidth={POPPER_MIN_WIDTH}
              maxHeight={`calc(100vh - 64px - 16px)`}
              enableFlip={false}
              opener={
                <Button
                  className="max-w-[calc(240px-theme(space.8))] text-left *:first:mr-2"
                  data-test="side-nav-name"
                  variant="quaternary"
                  size="small"
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                      <Typography variant="caption" color="textSecondary" noWrap>
                        {organization?.name}
                      </Typography>
                    </>
                  )}
                </Button>
              }
            >
              {({ closePopper }) => (
                <MenuPopper className="gap-0 overflow-hidden p-0 not-last-child:shadow-b">
                  {!!organizationList?.length && (
                    <div
                      className="flex flex-col gap-1 overflow-auto p-2"
                      style={{ maxHeight: 'calc(100vh - 80px)' }}
                    >
                      <VerticalMenuSectionTitle
                        title={currentUser?.email || ''}
                        loading={isLoading}
                      />

                      {organizationList
                        .sort((a, b) => {
                          // First sort by accessibleByCurrentSession (accessible first)
                          if (a.accessibleByCurrentSession !== b.accessibleByCurrentSession) {
                            return a.accessibleByCurrentSession ? -1 : 1
                          }

                          // Then sort alphabetically by name
                          return (
                            a.name.toLowerCase()?.localeCompare(b.name.toLowerCase() ?? '') ?? 0
                          )
                        })
                        ?.map(({ id, name, logoUrl, accessibleByCurrentSession }) => (
                          <ConditionalWrapper
                            key={`organization-in-side-nav-${id}`}
                            condition={accessibleByCurrentSession}
                            validWrapper={(children) => <>{children}</>}
                            invalidWrapper={(children) => (
                              <Tooltip
                                placement="right"
                                title={
                                  organization
                                    ? translate('text_1752158380555tozrnmtmxcz', {
                                        method: translate(
                                          authenticationMethodsMapping[
                                            organization?.authenticatedMethod
                                          ],
                                        ),
                                      })
                                    : translate('text_1752158380555tozrnmtmxc1')
                                }
                              >
                                {children}
                              </Tooltip>
                            )}
                          >
                            <Button
                              align="left"
                              size="small"
                              fullWidth
                              variant={id === organization?.id ? 'secondary' : 'quaternary'}
                              disabled={!accessibleByCurrentSession}
                              endIcon={accessibleByCurrentSession ? undefined : 'lock'}
                              onClick={async () => {
                                await switchCurrentOrganization(client, id)
                                isInspectorOpen && closeInspector()
                                navigate(HOME_ROUTE)
                                await Promise.all([
                                  refetchOrganizationInfos(),
                                  refetchCurrentUserInfos(),
                                ])
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
                              <Typography variant="caption" color="inherit" noWrap>
                                {name}
                              </Typography>
                            </Button>
                          </ConditionalWrapper>
                        ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 first-child:text-left">
                    <Button
                      variant="quaternary"
                      align="left"
                      size="small"
                      startIcon="logout"
                      onClick={async () => await logOut(client, true)}
                    >
                      {translate('text_623b497ad05b960101be3444')}
                    </Button>
                    {data && !error && !loading ? (
                      <div className="flex h-5 items-center justify-between py-3 pl-5 pr-2">
                        <a
                          className="flex items-center gap-2 text-blue visited:text-blue"
                          href={data?.currentVersion?.githubUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {data?.currentVersion?.number}
                          <Icon className="hover:cursor-pointer" name="outside" size="small" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex h-5 items-center justify-between py-3 pl-5 pr-2">
                        <Skeleton variant="text" className="w-30" />
                      </div>
                    )}
                  </div>
                </MenuPopper>
              )}
            </Popper>
          </NavLayout.NavStickyElementContainer>

          {/* Top menu entries */}
          <NavLayout.NavSectionGroup>
            {/* Reports */}
            {canSeeReportsSection && (
              <NavLayout.NavSection>
                <VerticalMenuSectionTitle
                  title={translate('text_1750864025932bnohjbzci3f')}
                  loading={isLoading}
                />
                <VerticalMenu
                  loading={isLoading}
                  loadingComponent={<VerticalMenuSkeleton numberOfElements={1} />}
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
                      title: translate('text_1753014457040hxp6wkphkvw'),
                      icon: 'forecast',
                      link: FORECASTS_ROUTE,
                      match: [FORECASTS_ROUTE],
                      hidden: !hasPermissions(['analyticsView']),
                      extraComponent: <BadgeAI />,
                    },
                  ]}
                />
              </NavLayout.NavSection>
            )}

            {/* Configuration */}
            <NavLayout.NavSection>
              <VerticalMenuSectionTitle
                title={translate('text_1750864088654kxz304zdo2z')}
                loading={isLoading}
              />
              <VerticalMenu
                loading={isLoading}
                loadingComponent={<VerticalMenuSkeleton numberOfElements={5} />}
                onClick={() => setOpen(false)}
                tabs={[
                  {
                    title: translate('text_623b497ad05b960101be3448'),
                    icon: 'pulse',
                    link: BILLABLE_METRICS_ROUTE,
                    canBeClickedOnActive: true,
                    match: [BILLABLE_METRICS_ROUTE, BILLABLE_METRIC_DETAILS_ROUTE],
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
                    title: translate('text_1752692673070k7z0mmf0494'),
                    icon: 'switch',
                    link: FEATURES_ROUTE,
                    canBeClickedOnActive: true,
                    match: [FEATURES_ROUTE, FEATURE_DETAILS_ROUTE],
                    hidden: !hasPermissions(['featuresView']),
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
                ]}
              />
            </NavLayout.NavSection>

            {/* Billing & operations */}
            <NavLayout.NavSection>
              <VerticalMenuSectionTitle
                title={translate('text_1750864088654s9qo2h9fvp7')}
                loading={isLoading}
              />
              <VerticalMenu
                loading={isLoading}
                loadingComponent={<VerticalMenuSkeleton numberOfElements={2} />}
                onClick={() => setOpen(false)}
                tabs={[
                  {
                    title: translate('text_624efab67eb2570101d117a5'),
                    icon: 'user-multiple',
                    link: CUSTOMERS_LIST_ROUTE,
                    canBeClickedOnActive: true,
                    match: [
                      CUSTOMERS_LIST_ROUTE,
                      CUSTOMER_DETAILS_ROUTE,
                      CUSTOMER_DETAILS_TAB_ROUTE,
                    ],
                    hidden: !hasPermissions(['customersView']),
                  },
                  {
                    title: translate('text_6250304370f0f700a8fdc28d'),
                    icon: 'clock',
                    link: SUBSCRIPTIONS_ROUTE,
                    match: [
                      SUBSCRIPTIONS_ROUTE,
                      CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
                      PLAN_SUBSCRIPTION_DETAILS_ROUTE,
                    ],
                    canBeClickedOnActive: true,
                    hidden: !hasPermissions(['subscriptionsView']),
                  },
                  {
                    title: translate('text_63ac86d797f728a87b2f9f85'),
                    icon: 'document',
                    link: INVOICES_ROUTE,
                    canBeClickedOnActive: true,
                    match: [INVOICES_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE],
                    hidden: !hasPermissions(['invoicesView']),
                  },
                  {
                    title: translate('text_6672ebb8b1b50be550eccbed'),
                    icon: 'coin-dollar',
                    link: PAYMENTS_ROUTE,
                    match: [PAYMENTS_ROUTE, PAYMENT_DETAILS_ROUTE],
                    canBeClickedOnActive: true,
                    hidden: !hasPermissions(['paymentsView']),
                  },
                  {
                    title: translate('text_66461ada56a84401188e8c63'),
                    icon: 'receipt',
                    link: CREDIT_NOTES_ROUTE,
                    match: [
                      CREDIT_NOTES_ROUTE,
                      CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE,
                      CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE,
                    ],
                    canBeClickedOnActive: true,
                    hidden: !hasPermissions(['creditNotesView']),
                  },
                ]}
              />
            </NavLayout.NavSection>
          </NavLayout.NavSectionGroup>

          {/* Bottom menu entries */}
          <NavLayout.NavSection className="sticky bottom-0 bg-white p-4 animate-shadow-top">
            <VerticalMenu
              loading={isLoading}
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
                  title: translate('text_62728ff857d47b013204c726'),
                  icon: 'settings',
                  link: SETTINGS_ROUTE,
                  hidden: !hasPermissions(['organizationView']),
                },
                {
                  title: translate('text_6271200984178801ba8bdeac'),
                  icon: 'terminal',
                  onAction: openInspector,
                  canBeClickedOnActive: true,
                  hidden: !hasPermissions(['developersManage']),
                },
              ]}
            />
          </NavLayout.NavSection>
        </NavLayout.Nav>
      </ClickAwayListener>
      <NavLayout.ContentWrapper ref={contentRef}>
        {isLoading && <Spinner />}
        {!isLoading && <Outlet />}
      </NavLayout.ContentWrapper>
    </NavLayout.NavWrapper>
  )
}

export default MainNavLayout
