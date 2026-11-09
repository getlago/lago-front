import { matchPath } from 'react-router'

import { CUSTOMER_PORTAL_ROUTE } from '~/core/router/paths/customerPortal'

// `matchPath` hands params back percent-encoded (it only restores `%2F`), while the
// router decodes them before `PortalInit` reads one: decode to send the same token.
const decodeToken = (token: string): string => {
  try {
    return decodeURIComponent(token)
  } catch {
    return token
  }
}

export const getCustomerPortalToken = (pathname: string): string | undefined => {
  const token = matchPath(`${CUSTOMER_PORTAL_ROUTE}/*`, pathname)?.params.token

  return token === undefined ? undefined : decodeToken(token)
}
