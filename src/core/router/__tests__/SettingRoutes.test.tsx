import { matchRoutes } from 'react-router'

import {
  OKTA_AUTHENTICATION_ROUTE,
  ROLE_CREATE_ROUTE,
  ROLE_DETAILS_ROUTE,
  ROLE_EDIT_ROUTE,
  settingRoutes,
  TEAM_AND_SECURITY_GROUP_ROUTE,
} from '../SettingRoutes'

const routes = settingRoutes
  .flatMap((route) => route.children ?? [route])
  .flatMap((route) => {
    const paths = Array.isArray(route.path) ? route.path : [route.path]

    return paths.map((path) => ({ path, handle: route }))
  })

describe('settings route resolution', () => {
  it.each([
    {
      url: '/settings/team-and-security/roles/billing-manager',
      path: ROLE_DETAILS_ROUTE,
      permissions: ['rolesView'],
    },
    {
      url: '/settings/team-and-security/roles/create',
      path: ROLE_CREATE_ROUTE,
      permissionsOr: ['rolesCreate', 'rolesUpdate'],
    },
    {
      url: '/settings/team-and-security/roles/billing-manager/edit',
      path: ROLE_EDIT_ROUTE,
      permissionsOr: ['rolesCreate', 'rolesUpdate'],
    },
    {
      url: '/settings/team-and-security/roles',
      path: TEAM_AND_SECURITY_GROUP_ROUTE,
      permissionsOr: [
        'organizationMembersView',
        'rolesView',
        'authenticationMethodsView',
        'securityLogsView',
      ],
    },
    {
      url: '/settings/team-and-security/authentication/okta/okta-id',
      path: OKTA_AUTHENTICATION_ROUTE,
      permissions: ['organizationIntegrationsView', 'authenticationMethodsView'],
    },
  ])('resolves $url with its access requirements', ({ url, path, ...permissions }) => {
    const match = matchRoutes(routes, url)?.at(-1)

    expect(match?.route.path).toBe(path)
    expect(match?.route.handle).toMatchObject({ private: true, ...permissions })
  })

  it('does not resolve the obsolete roles URL outside team and security', () => {
    expect(matchRoutes(routes, '/settings/roles/billing-manager')).toBeNull()
  })
})
