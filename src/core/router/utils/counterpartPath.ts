import { findOrganizationRoute } from './routeRegistry'

import { HOME_ROUTE } from '../index'

// A segment naming a resource (an id, code or token) points at a record of one organization only.
const RESOURCE_PARAM_PATTERN = /^:.*(id|code|token)$/i

const hasResourceParam = (routePath: string): boolean =>
  routePath.split('/').some((segment) => RESOURCE_PARAM_PATTERN.test(segment))

type GetCounterpartPathArgs = {
  targetSlug: string
  strippedPathname: string
  search?: string
}

// The current page and query string in another organization of the pair, or that organization's home when
// the route does not exist there or names a resource.
export const getCounterpartPath = ({
  targetSlug,
  strippedPathname,
  search = '',
}: GetCounterpartPathArgs): string => {
  const currentRoute = findOrganizationRoute(strippedPathname)

  if (!currentRoute || hasResourceParam(currentRoute.path)) {
    return `/${targetSlug}${HOME_ROUTE}`
  }

  return `/${targetSlug}${strippedPathname}${search}`
}
