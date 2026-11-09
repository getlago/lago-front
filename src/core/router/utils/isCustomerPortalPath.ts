import { matchPath } from 'react-router'

import { CUSTOMER_PORTAL_ROUTE } from '~/core/router/paths/customerPortal'

export const isCustomerPortalPath = (pathname: string): boolean =>
  !!matchPath(`${CUSTOMER_PORTAL_ROUTE}/*`, pathname)
