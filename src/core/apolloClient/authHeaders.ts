import { matchPath } from 'react-router'

import {
  AUTH_TOKEN_LS_KEY,
  envGlobalVar,
  getCurrentOrganizationId,
  TMP_AUTH_TOKEN_LS_KEY,
} from '~/core/apolloClient/reactiveVars'
import { CREATE_ORGANIZATION_ROUTE } from '~/core/router/paths/createOrganization'
import { getCustomerPortalToken } from '~/core/router/utils/getCustomerPortalToken'
import { isCustomerPortalPath } from '~/core/router/utils/isCustomerPortalPath'
import { getItemFromLS } from '~/core/utils/localStorage'

type AdminCredentials = { token: string | undefined; organizationId: string | undefined }

const isCreateOrganizationPath = (pathname: string): boolean =>
  envGlobalVar().selfServeEnabled && !!matchPath(CREATE_ORGANIZATION_ROUTE, pathname)

// Scoped by route: the API rejects an expired admin Bearer before reading
// customer-portal-token, and a portal token sent on admin routes would leak.
const resolveAdminCredentials = (pathname: string): AdminCredentials | null => {
  if (isCustomerPortalPath(pathname)) return null

  return {
    token: getItemFromLS(AUTH_TOKEN_LS_KEY) || getItemFromLS(TMP_AUTH_TOKEN_LS_KEY) || undefined,
    organizationId: isCreateOrganizationPath(pathname)
      ? undefined
      : getCurrentOrganizationId() || undefined,
  }
}

export const buildAuthHeaders = (pathname: string): Record<string, string> => {
  const admin = resolveAdminCredentials(pathname)

  if (!admin) {
    // Never from storage: two portals open side by side share localStorage, so a
    // stored token answers for whichever customer was opened last.
    const customerPortalToken = getCustomerPortalToken(pathname)

    return customerPortalToken ? { 'customer-portal-token': customerPortalToken } : {}
  }

  return {
    ...(admin.token ? { authorization: `Bearer ${admin.token}` } : {}),
    ...(admin.organizationId ? { 'x-lago-organization': admin.organizationId } : {}),
  }
}

export const CABLE_TOKEN_SUBPROTOCOL_PREFIX = 'lago-token.'

// Browsers cannot set websocket headers, and the URL and channel params are logged.
export const buildCableSubprotocols = (pathname: string): string[] => {
  const token = resolveAdminCredentials(pathname)?.token

  return token ? [`${CABLE_TOKEN_SUBPROTOCOL_PREFIX}${token}`] : []
}

export const buildCableConnectionParams = (pathname: string): Record<string, string> => {
  const organizationId = resolveAdminCredentials(pathname)?.organizationId

  return organizationId ? { organization_id: organizationId } : {}
}
