import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'

import { authRoutes } from './AuthRoutes'
import { customerPortalRoutes } from './CustomerPortalRoutes'
import { customerObjectCreationRoutes, customerRoutes } from './CustomerRoutes'
import { developperRoutes } from './DevelopperRoutes'
import { objectCreationRoutes, objectDetailsRoutes, objectListRoutes } from './ObjectsRoutes'
import { settingRoutes } from './SettingRoutes'
import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

export * from './types'
export * from './AuthRoutes'
export * from './CustomerRoutes'
export * from './DevelopperRoutes'
export * from './ObjectsRoutes'
export * from './SettingRoutes'

const { appEnv } = envGlobalVar()

// ----------- Layouts -----------
const SideNavLayout = lazyLoad(
  () => import(/* webpackChunkName: 'side-nav-layout' */ '~/layouts/SideNavLayout'),
)

// ----------- Pages -----------
const Home = lazyLoad(() => import(/* webpackChunkName: 'home' */ '~/pages/Home'))
const Error404 = lazyLoad(() => import(/* webpackChunkName: 'error-404' */ '~/pages/Error404'))
const Forbidden = lazyLoad(() => import(/* webpackChunkName: 'forbidden' */ '~/pages/Forbidden'))
const Analytic = lazyLoad(() => import(/* webpackChunkName: 'analytics' */ '~/pages/Analytics'))

// Route Available only on dev mode
const DesignSystem = lazyLoad(
  () => import(/* webpackChunkName: 'design-system' */ '~/pages/__devOnly/DesignSystem'),
)

export const HOME_ROUTE = '/'
export const FORBIDDEN_ROUTE = '/forbidden'
export const ANALYTIC_ROUTE = '/analytics'
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
        path: [ANALYTIC_ROUTE],
        private: true,
        element: <Analytic />,
      },
      ...customerRoutes,
      ...developperRoutes,
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
  ...objectCreationRoutes,
  ...customerPortalRoutes,
]
