import { makeVar } from '@apollo/client'

import { LAST_USED_ORGANIZATION_LS_KEY } from '~/core/constants/localStorageKeys'

/**
 * Current organization id (UUID) for THIS tab — in-memory only, derived from
 * the URL slug. `OrganizationLayout` populates it from
 * `useParams().organizationSlug` + `currentUser.memberships` on every
 * authenticated render; the Apollo auth link reads it via
 * `getCurrentOrganizationId()` to set the `x-lago-organization` header.
 *
 * It is NOT seeded from / persisted to localStorage: the slug is the source of
 * truth, and a query with no current org id must not be sent (the backend
 * `organization` resolver rejects a missing header).
 */
export const currentOrganizationVar = makeVar<string | null>(null)

export const getCurrentOrganizationId = (): string | null => currentOrganizationVar()

export const setCurrentOrganizationId = (id: string | null): void => {
  currentOrganizationVar(id)
}

/**
 * Last used organization SLUG, persisted in localStorage. This is the ONLY
 * org-related use of localStorage and it never feeds the auth header: it is
 * read solely by the root redirect (`RootRedirect`) to choose a landing slug
 * when the URL has none, and written by `OrganizationLayout` whenever an org
 * route is entered. Always re-validated against the user's memberships before
 * use, so a stale/foreign value is harmless.
 *
 * Uses `localStorage` directly (not the `cacheUtils` helpers) on purpose: the
 * value is a plain slug string, and importing `cacheUtils` here would pull a
 * heavy module graph (cacheUtils → … → apolloClient init) and create an import
 * cycle for the many feature hooks that read this var.
 */
export const getPersistedOrganizationSlug = (): string | null => {
  if (typeof window === 'undefined') return null

  return localStorage.getItem(LAST_USED_ORGANIZATION_LS_KEY) || null
}

export const setPersistedOrganizationSlug = (slug: string | null): void => {
  if (typeof window === 'undefined') return

  if (slug) {
    localStorage.setItem(LAST_USED_ORGANIZATION_LS_KEY, slug)
  } else {
    localStorage.removeItem(LAST_USED_ORGANIZATION_LS_KEY)
  }
}
