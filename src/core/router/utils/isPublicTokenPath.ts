import { matchPath } from 'react-router'

import { AGENT_CLAIM_ROUTE } from '~/core/router/paths/agentClaim'
import { isCustomerPortalPath } from '~/core/router/utils/isCustomerPortalPath'

export const isPublicTokenPath = (pathname: string): boolean =>
  isCustomerPortalPath(pathname) || !!matchPath(`${AGENT_CLAIM_ROUTE}/*`, pathname)
