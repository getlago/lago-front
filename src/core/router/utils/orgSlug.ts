import { gql } from '@apollo/client'

import {
  getCurrentOrganizationId,
  getPersistedOrganizationSlug,
} from '~/core/apolloClient/reactiveVars'
import { OrgSlugResolverDataFragment } from '~/generated/graphql'

import { getFirstPathSegment } from './getFirstPathSegment'

gql`
  fragment OrgSlugResolverData on User {
    memberships {
      id
      organization {
        id
        slug
        accessibleByCurrentSession
      }
    }
  }
`

type CurrentUser = OrgSlugResolverDataFragment | undefined
type Membership = OrgSlugResolverDataFragment['memberships'][number]

// The API refuses every request to the other orgs (e.g. an Okta session on an org bound to another IdP).
export const getAccessibleMemberships = (currentUser: CurrentUser): Membership[] =>
  currentUser?.memberships?.filter((m) => m.organization.accessibleByCurrentSession) ?? []

export const isAccessibleOrgSlug = (slug: string | undefined, currentUser: CurrentUser): boolean =>
  !!slug && getAccessibleMemberships(currentUser).some((m) => m.organization.slug === slug)

export const findRefusedOrganization = <User extends OrgSlugResolverDataFragment>(
  slug: string | undefined,
  currentUser: User | undefined,
): User['memberships'][number]['organization'] | undefined => {
  if (!slug) return undefined

  return currentUser?.memberships?.find(
    (m) => m.organization.slug === slug && !m.organization.accessibleByCurrentSession,
  )?.organization
}

/**
 * Resolves the org slug to land on when the URL has no (valid) slug — e.g. a
 * legacy slug-less path or the user deleting the slug from the URL bar.
 *
 * Priority (each validated against the memberships the session can open):
 *   1. The in-memory current org (`getCurrentOrganizationId()`) — set per-tab
 *      while navigating inside an org. Correct mid-session and multi-tab safe,
 *      but `null` after a hard reload (the var is not persisted).
 *   2. The persisted "last used" slug (`getPersistedOrganizationSlug()`) — the
 *      only signal that survives a hard reload, so a cold load of a slug-less
 *      path recovers to the org the user was last on instead of `memberships[0]`.
 *   3. Fallback to the first accessible membership's org slug.
 *
 * Returns `undefined` when the session cannot open any of the user's organizations.
 */
export const resolveOrgSlug = (currentUser: CurrentUser): string | undefined => {
  const memberships = getAccessibleMemberships(currentUser)

  const currentOrgId = getCurrentOrganizationId()
  const fromCurrentOrg = memberships.find((m) => m.organization.id === currentOrgId)?.organization
    .slug

  const persistedSlug = getPersistedOrganizationSlug()
  const fromPersisted = memberships.find((m) => m.organization.slug === persistedSlug)?.organization
    .slug

  return fromCurrentOrg || fromPersisted || memberships[0]?.organization.slug
}

/**
 * Returns true if the first segment of the path is one of the user's org slugs
 * (e.g. `/acme`, `/acme/customers` or `/acme?tab=1` when the user is a member of `acme`).
 */
export const pathHasValidSlug = (path: string, currentUser: CurrentUser): boolean => {
  const firstSegment = getFirstPathSegment(path)

  if (!firstSegment) return false

  return currentUser?.memberships?.some((m) => m.organization.slug === firstSegment) ?? false
}

export const pathTargetsInaccessibleOrg = (path: string, currentUser: CurrentUser): boolean =>
  !!findRefusedOrganization(getFirstPathSegment(path), currentUser)

/**
 * Prepends the given slug to the path if the path doesn't already contain
 * a valid user org slug. Used to upgrade legacy pre-migration paths to
 * slug-prefixed URLs.
 */
export const ensureSlugPrefix = (path: string, slug: string, currentUser: CurrentUser): string => {
  if (pathHasValidSlug(path, currentUser)) return path

  return `/${slug}${path.startsWith('/') ? '' : '/'}${path}`
}
