import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'

import { authRoutes } from './AuthRoutes'
import { customerPortalRoutes } from './CustomerPortalRoutes'
import { customerObjectCreationRoutes, customerRoutes, customerVoidRoutes } from './CustomerRoutes'
import { objectCreationRoutes, objectDetailsRoutes, objectListRoutes } from './ObjectsRoutes'
import { settingRoutes } from './SettingRoutes'
import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const { appEnv } = envGlobalVar()

// ----------- Layouts -----------
const SideNavLayout = lazyLoad(() => import('~/layouts/MainNavLayout'))

// ----------- Pages -----------
const Home = lazyLoad(() => import('~/pages/Home'))
const Error404 = lazyLoad(() => import('~/pages/Error404'))
const Forbidden = lazyLoad(() => import('~/pages/Forbidden'))
const Analytic = lazyLoad(() => import('~/pages/Analytics'))
const Forecasts = lazyLoad(() => import('~/pages/forecasts/Forecasts'))
const UsageBillableMetric = lazyLoad(() => import('~/pages/analytics/UsageBillableMetric'))

// Route Available only on dev mode
const DesignSystem = lazyLoad(() => import('~/pages/__devOnly/DesignSystem'))

export const HOME_ROUTE = '/'
export const FORBIDDEN_ROUTE = '/forbidden'
export const ANALYTIC_ROUTE = '/analytics'
export const ANALYTIC_TABS_ROUTE = '/analytics/:tab'
export const ANALYTIC_USAGE_BILLABLE_METRIC_ROUTE = '/analytics/usage/:billableMetricCode'
export const FORECASTS_ROUTE = '/forecasts'
export const ERROR_404_ROUTE = '/404'

// Route Available only on dev mode
export const ONLY_DEV_DESIGN_SYSTEM_ROUTE = `/design-system`
export const ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE = `${ONLY_DEV_DESIGN_SYSTEM_ROUTE}/:tab`

export const routes: CustomRouteObject[] = [
  {
    path: '*',
    element: <Error404 />,
  },
  {
    path: ERROR_404_ROUTE,
    element: <Error404 />,
  },
  {
    path: FORBIDDEN_ROUTE,
    element: <Forbidden />,
  },
  ...settingRoutes,
  {
    element: <SideNavLayout />,
    private: true,
    children: [
      {
        path: [HOME_ROUTE],
        private: true,
        element: <Home />,
      },
      {
        path: [ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE],
        private: true,
        element: <Analytic />,
        // IMPORTANT: This is not 100% correct but can be fixed later.
        // Those 2 permissions are not the same and refer to the old and new analytics access, but are defined with the same restrictions per role
        // To preserve cached last visited route and prevent broken redirection I prefer to keepboth in the same place and not fix this now.
        // Maybe analyticsView will be removed in the future
        permissions: ['analyticsView', 'dataApiView'],
      },
      {
        path: ANALYTIC_USAGE_BILLABLE_METRIC_ROUTE,
        private: true,
        element: <UsageBillableMetric />,
        permissions: ['analyticsView', 'dataApiView'],
      },
      {
        path: FORECASTS_ROUTE,
        private: true,
        element: <Forecasts />,
        permissions: ['analyticsView', 'dataApiView'],
      },
      ...customerRoutes,
      ...objectListRoutes,
      ...objectDetailsRoutes,
      ...([AppEnvEnum.qa, AppEnvEnum.development].includes(appEnv)
        ? [
            {
              path: [ONLY_DEV_DESIGN_SYSTEM_ROUTE, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE],
              element: <DesignSystem />,
            },
          ]
        : []),
    ],
  },
  ...authRoutes,
  ...customerObjectCreationRoutes,
  ...customerVoidRoutes,
  ...objectCreationRoutes,
  ...customerPortalRoutes,
]

export * from './AuthRoutes'
export * from './CustomerRoutes'
export * from './ObjectsRoutes'
export * from './SettingRoutes'
export * from './types'
