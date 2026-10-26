import { matchPath } from 'react-router'

import {
  AUTH_TOKEN_LS_KEY,
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
  getCurrentOrganizationId,
  TMP_AUTH_TOKEN_LS_KEY,
} from '~/core/apolloClient/reactiveVars'
import { CUSTOMER_PORTAL_ROUTE } from '~/core/router/paths/customerPortal'
import { getItemFromLS } from '~/core/utils/localStorage'

// Credentials are scoped by route: a logged-in admin previewing a customer
// portal keeps both tokens in localStorage, and only the URL tells which
// context the request belongs to. Sending the admin Bearer on portal routes
// breaks the portal when that token is expired (the API rejects it before
// reading customer-portal-token), and sending the portal token on admin
// routes leaks it on every request after visiting any portal link.
const isCustomerPortalPath = (pathname: string): boolean =>
  !!matchPath(`${CUSTOMER_PORTAL_ROUTE}/*`, pathname)

type AdminCredentials = { token: string | undefined; organizationId: string | undefined }

const resolveAdminCredentials = (pathname: string): AdminCredentials | null => {
  if (isCustomerPortalPath(pathname)) return null

  return {
    token: getItemFromLS(AUTH_TOKEN_LS_KEY) || getItemFromLS(TMP_AUTH_TOKEN_LS_KEY) || undefined,
    organizationId: getCurrentOrganizationId() || undefined,
  }
}

export const buildAuthHeaders = (pathname: string): Record<string, string> => {
  const admin = resolveAdminCredentials(pathname)

  if (!admin) {
    const customerPortalToken = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

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
