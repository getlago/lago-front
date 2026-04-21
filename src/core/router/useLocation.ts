import {
  Location,
  useParams,
  // eslint-disable-next-line lago/no-direct-rrd-nav-import
  useLocation as useRRLocation,
} from 'react-router-dom'

import { stripOrgSlug } from './utils/stripOrgSlug'

export interface SlugAwareLocation<State = unknown> extends Location<State> {
  /**
   * `location.pathname` with the leading `/${organizationSlug}` stripped,
   * so slug-unaware patterns (route constants, `tab.link`) can be compared
   * against it via `matchPath` or equality.
   *
   * Example:
   *   URL: `/acme/plans/123`
   *   pathname:         `/acme/plans/123`
   *   strippedPathname: `/plans/123`
   *
   * Outside `/:organizationSlug` returns `pathname` unchanged. When the
   * stripped result would be empty, returns `/`.
   */
  strippedPathname: string
}

/**
 * Slug-aware `useLocation` wrapper.
 *
 * Returns the standard `Location` object plus `strippedPathname`. All other
 * fields (`pathname`, `search`, `hash`, `state`, `key`) pass through
 * unchanged from `react-router-dom`'s `useLocation`.
 */
export const useLocation = <State = unknown>(): SlugAwareLocation<State> => {
  const location = useRRLocation() as Location<State>
  // `useParams()` can return undefined outside a Router context (e.g. some tests).
  const params = useParams<{ organizationSlug?: string }>()
  const organizationSlug = params?.organizationSlug

  return { ...location, strippedPathname: stripOrgSlug(location.pathname, organizationSlug) }
}
