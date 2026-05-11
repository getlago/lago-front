import { getCurrentOrganizationId } from '~/core/apolloClient/reactiveVars'
import { CurrentUserInfosFragment } from '~/generated/graphql'

type CurrentUser = CurrentUserInfosFragment | undefined

/**
 * Resolves the current org slug from the user's memberships.
 *
 * Priority:
 *   1. Org matching `getCurrentOrganizationId()` (from the reactive var/LS)
 *   2. Fallback to the first membership's org slug
 *
 * Returns `undefined` only if the user has no memberships.
 */
export const resolveOrgSlug = (currentUser: CurrentUser): string | undefined => {
  const currentOrgId = getCurrentOrganizationId()
  const fromCurrentOrg = currentUser?.memberships.find((m) => m.organization.id === currentOrgId)
    ?.organization.slug

  return fromCurrentOrg || currentUser?.memberships[0]?.organization.slug
}

/**
 * Returns true if the path already starts with one of the user's org slugs
 * (e.g. `/acme/customers` when the user is a member of `acme`).
 */
export const pathHasValidSlug = (path: string, currentUser: CurrentUser): boolean =>
  currentUser?.memberships?.some(
    (m) => m.organization.slug && path.startsWith(`/${m.organization.slug}/`),
  ) ?? false

/**
 * Prepends the given slug to the path if the path doesn't already contain
 * a valid user org slug. Used to upgrade legacy pre-migration paths to
 * slug-prefixed URLs.
 */
export const ensureSlugPrefix = (path: string, slug: string, currentUser: CurrentUser): string => {
  if (pathHasValidSlug(path, currentUser)) return path

  return `/${slug}${path.startsWith('/') ? '' : '/'}${path}`
}
