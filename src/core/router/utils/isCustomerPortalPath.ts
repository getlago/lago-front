import { matchPath } from 'react-router'

import { CUSTOMER_PORTAL_ROUTE } from '~/core/router/paths/customerPortal'

// Single source of truth: HTTP credentials, websocket credentials, auth-error logout
// and cache persistence all branch on it and must agree on the answer.
export const isCustomerPortalPath = (pathname: string): boolean =>
  !!matchPath(`${CUSTOMER_PORTAL_ROUTE}/*`, pathname)
