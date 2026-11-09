import { matchPath } from 'react-router'

import { CUSTOMER_PORTAL_ROUTE } from '~/core/router/paths/customerPortal'

// The URL is the only per-tab source of the portal token: two portals opened
// side by side share every storage area.
export const getCustomerPortalToken = (pathname: string): string | undefined =>
  matchPath(`${CUSTOMER_PORTAL_ROUTE}/*`, pathname)?.params.token
