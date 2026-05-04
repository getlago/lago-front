import { makeVar } from '@apollo/client'

/**
 * Per-organization in-memory slug overrides, decoupled from Apollo cache
 * reactivity (which gets unreliable after `client.stop() + clearStore()`
 * during org switches).
 *
 * - Written by `useEditOrganizationSlugDialog` on a successful slug update,
 *   keyed by org id.
 * - Read by `OrgSlugRolloutBanner` via `useReactiveVar`, with fallback to
 *   `currentMembership.organization.slug` when no override exists for the
 *   active org. The map persists across org switches so coming back to a
 *   previously-edited org still shows the local edit, even when the cache
 *   round-trip would otherwise return stale data.
 *
 * Reactive vars guarantee a re-render on every set, regardless of Apollo
 * observer state.
 *
 * TODO(org-slug-rollout): delete with the banner — see ticket LAGO-1437.
 */
export const orgSlugOverridesVar = makeVar<Record<string, string>>({})

export const setOrgSlugOverride = (orgId: string, slug: string) => {
  orgSlugOverridesVar({ ...orgSlugOverridesVar(), [orgId]: slug })
}
