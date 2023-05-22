import { lazy } from 'react'

import { AppEnvEnum } from '~/globalTypes'
import { envGlobalVar } from '~/core/apolloClient'

import { CustomRouteObject } from './types'
import { authRoutes } from './AuthRoutes'
import { customerRoutes, customerObjectCreationRoutes } from './CustomerRoutes'
import { developperRoutes } from './DevelopperRoutes'
import { objectListRoutes, objectCreationRoutes } from './ObjectsRoutes'
import { settingRoutes } from './SettingRoutes'
import { customerPortalRoutes } from './CustomerPortalRoutes'

export * from './types'
export * from './AuthRoutes'
export * from './CustomerRoutes'
export * from './DevelopperRoutes'
export * from './ObjectsRoutes'
export * from './SettingRoutes'

const { appEnv } = envGlobalVar()

// ----------- Layouts -----------
const SideNavLayout = lazy(
  () => import(/* webpackChunkName: 'side-nav-layout' */ '~/layouts/SideNavLayout')
)

// ----------- Pages -----------
const Error404 = lazy(() => import(/* webpackChunkName: 'error-404' */ '~/pages/Error404'))
// Route Available only on dev mode
const DesignSystem = lazy(
  () => import(/* webpackChunkName: 'design-system' */ '~/pages/__devOnly/DesignSystem')
)

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
    element: <SideNavLayout />,
    private: true,
    children: [
      ...customerRoutes,
      ...developperRoutes,
      ...objectListRoutes,
      ...settingRoutes,
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
