---
name: lago-organization-slug
description: 'Which organization a tab is on comes from the URL slug, never from currentOrganizationVar — the per-caller consistency table, the audited list of legitimate var reads, and useCurrentUser vs useOrganizationInfos. TRIGGER — read BEFORE writing the code whenever anything reads or builds an organization id or slug; whenever the diff mentions currentOrganizationVar, getCurrentOrganizationId, switchCurrentOrganization, useCurrentUser, currentMembership, useOrganizationInfos, organizationSlug, OrganizationLayout or x-lago-organization; whenever the change builds a persistent identifier embedding an org — a URL a user copies, a webhook or template path, a localStorage key, a filename, a mutation argument; whenever a route, redirect or navigation target is added; and whenever the report is wrong-org data, a logo flashing another org, or a value bleeding across tabs.'
---

# Organization slug architecture

All authenticated app routes are nested under `/:organizationSlug/...`. The
URL slug is the **source of truth for the current organization in this tab**.
Multiple tabs can run on different orgs simultaneously; the legacy
`localStorage`-based current-org state is now a transitional bridge and must
not drive UI decisions.

## Mental model

Two complementary primitives:

1. **URL slug** (`useParams().organizationSlug`) — the **per-tab source of
   truth** for "which org is the user viewing here". Set by the user (typing,
   clicking the org switcher, following a link). Independent across tabs.
2. **`currentOrganizationVar`** (Apollo `makeVar<string | null>`) — a
   **per-tab in-memory centralized cache** of the org id, derived from the
   URL slug + `currentUser.memberships`. Populated by `OrganizationLayout`'s
   `useEffect` on every authenticated render. Read synchronously by the
   Apollo auth link to inject the `x-lago-organization` HTTP header.

The var is a **denormalized read of the URL** — not a competing source of
truth. Feature components that need the slug or org reference for UI or
identifier construction must derive directly from `useParams()` +
memberships; reading the var is reserved for a small, audited set of
infrastructure call sites (the Apollo auth link, `OrganizationLayout`'s
switch detection, the post-login org-recovery in `cacheUtils.onLogIn`, and
the slug-first-with-var-fallback membership resolution in `useCurrentUser`).
See **Consistency rule** below for the canonical list and the rationale per
caller.

## Consistency rule — which API to use, by caller

| Caller                                                                                                            | Source to read                          | API                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React component **inside** `/:organizationSlug/...` routes                                                        | URL + memberships                       | `useParams().organizationSlug` then `currentUser.memberships.find(m => m.organization.slug === slug)` (or `useCurrentUser().currentMembership` shortcut)   |
| React component **outside** Routes (`AiAgent`, `UserIdentifier`, anything sibling to `RouteWrapper` in `App.tsx`) | URL + memberships                       | `window.location.pathname.split('/')[1]` then `currentUser.memberships.find(...)` — `useParams` returns `{}` here because there's no matched-route context |
| Non-React code that needs synchronous access (Apollo auth link only)                                              | Var                                     | `getCurrentOrganizationId()`                                                                                                                               |
| `OrganizationLayout` itself, for org-switch detection                                                             | Var (compared against derived `org.id`) | `useReactiveVar(currentOrganizationVar)` — this is the single sync point that bridges URL → var                                                            |

**Do not** read `currentOrganizationVar` from feature components for UI or identifier construction. That is a known bug pattern (logo flashing wrong org cross-tab, webhook URLs baking the wrong UUID, slug page showing the other tab's value, etc.). The fix in every case is migrating off the var and onto `useParams` + memberships.

Legitimate var reads in the codebase (audit anchor, keep this short). Two permitted purposes only: (a) constructing the `x-lago-organization` auth header, (b) gating org-scoped queries so they don't fire header-less, (c) bridging URL → var inside `OrganizationLayout`. UI/identifier construction is never permitted.

- `src/core/apolloClient/authHeaders.ts` and `src/core/apolloClient/init.ts` — auth-header construction (the canonical reason the var exists).
- `src/layouts/OrganizationLayout.tsx` — switch detection on the `currentOrgId !== org.id` mismatch (the single sync point that writes the var from the URL slug).
- `src/components/UserIdentifier.tsx` — query-gates the `UserIdentifier` query (org-scoped `organization` field) on `!!currentOrganizationId` so it doesn't fire on slug-less surfaces (e.g. `/`).
- `src/hooks/useOrganizationInfos.ts` — query-gates `getOrganizationInfos` (org-scoped) on `!!currentOrganizationId` for the same reason.
- `src/components/developers/DevtoolsView.tsx` — query-gates the whole devtools panel (`DevtoolsRouter`) on `!!currentOrganizationId`. The panel lives in a `MemoryRouter` that is a SIBLING of the app's `BrowserRouter`, so it has no access to the URL slug and can mount before `OrganizationLayout` has derived the org — a copied inspector link opens it on first paint. Without the gate every tab fires its org-scoped query header-less and the API answers `Missing organization id`.
- `src/hooks/useCurrentUser.ts` — slug-first resolution of `currentMembership` with var as a fallback for routes outside `/:organizationSlug` (login, customer portal). The fallback exists so callers in those non-org routes still get a membership; if a future audit shows nobody consumes `currentMembership` from those contexts, the fallback can be dropped.

Anything else reading the var in a feature component is a regression — fix it.

## Source-of-truth hierarchy

| Concern                                   | Source                                        | Notes                                                                                                                                               |
| ----------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which org is the user viewing in this tab | URL slug (`useParams().organizationSlug`)     | Resolves to a `Membership` via `currentUser.memberships`                                                                                            |
| Auth                                      | `LAGO_USER_AUTH_TOKEN_KEY` in LS              | Unchanged                                                                                                                                           |
| Apollo `x-lago-organization` header       | `currentOrganizationVar` (in-memory, per-tab) | Centralized synchronous cache of the slug-derived org id. `OrganizationLayout` keeps it in sync with the URL slug. Never read directly to drive UI. |
| Browser-survival of OAuth round-trip      | `REDIRECT_AFTER_LOGIN_LS_KEY`                 | Read & cleared exclusively by `Home.tsx`                                                                                                            |

## `useCurrentUser` vs `useOrganizationInfos`

- **`useCurrentUser().currentMembership.organization`** — slug-driven. Use whenever the value lands in a **persistent identifier**: a URL the user copies (e.g. provider webhook), an LS key, a mutation argument, a filename. The hook resolves the membership by matching `useParams().organizationSlug` against the user's memberships.
- **`useOrganizationInfos().organization`** — query-driven. Use for **org-scoped behavior** that is not in the lighter membership fragment: `timezone`, `defaultCurrency`, `featureFlags`, `premiumIntegrations`, `authenticatedMethod`. The hook self-gates: when the cached `Query.organization.slug` doesn't match the URL slug it returns `loading: true, organization: undefined` (skeleton), so consumers can't render another tab's data.

  ```typescript
  // Persistent identifier (URL, LS key, mutation arg) → currentMembership
  const { currentMembership } = useCurrentUser()
  const orgId = currentMembership?.organization.id || ''
  const webhookUrl = `${apiUrl}/webhooks/foo/${orgId}`

  // Behavior config (timezone, feature flags, premium addons) → useOrganizationInfos
  const { hasFeatureFlag, timezone } = useOrganizationInfos()
  ```

## Why the distinction exists

Apollo cache is persisted to IndexedDB and shared cross-tab. Root-field
queries (`Query.organization`) are not partitioned by org-id header in their
cache key, so `cache-first` reads can briefly return another tab's org
payload on initial paint. Membership data is user-scoped and consistent
across tabs, so a slug→membership lookup always resolves to the right org
for the current tab regardless of cache state.

## Navigating to a different org

Use `navigate(`/${targetSlug}/...`, { skipSlugPrepend: true })` plus
`switchCurrentOrganization(client, targetOrgId)` (or rely on
`OrganizationLayout`'s effect to detect the slug change and resync the var
and Apollo cache automatically).
