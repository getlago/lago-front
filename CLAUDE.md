# Lago Frontend

## Package Manager & Workspace

- The project uses pnpm workspaces with packages in `packages/*`:
  - `packages/configs/` — shared ESLint, TypeScript, Tailwind configs
  - `packages/design-system/` — shared UI components and icons
- After changes to workspace packages, run `pnpm install` to trigger postinstall scripts

## Project Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material UI + TailwindCSS + Custom Design System (MUI-based)
- **State**: Apollo Client (GraphQL) with reactive variables
- **Forms**: Formik + Yup validation
- **Routing**: React Router DOM + TanStack Router (newer routes)
- **Testing**: Jest + Cypress + Testing Library
- **Code Generation**: GraphQL Code Generator for type-safe queries
- **Linting**: ESLint + Prettier with custom configs from `lago-configs`
- Avoid suggesting build scripts — the project runs in development mode

## Key Commands

- `pnpm dev` — start development server
- `pnpm code:style` — command executed by the pre-push hook, better to run it after all modifications are done
- `pnpm test` — run Jest tests
- `pnpm test:coverage` — Jest tests with coverage
- `pnpm test:e2e` — run Cypress tests
- `pnpm lint:fix` — fix code style issues
- `pnpm codegen` — generate GraphQL types (**run after any GraphQL changes**)
- `pnpm translations:add <count>` — add new translation keys

## Development Guidelines

- TypeScript strict mode with path aliases (`~/*` maps to `src/*`)
- Use existing design system components from `packages/design-system/`
- Use hooks and utilities in `src/hooks/`
- GraphQL queries/mutations for API calls (generated types in `src/generated/`)
- **After any GraphQL schema/query/fragment changes, run `pnpm codegen`**
- Store translations in `translations/base.json` — **never manually create translation keys**, use `pnpm translations:add <number>`
- Apollo Client reactive variables for global state (`src/core/apolloClient/reactiveVars/`)
- Follow serialization patterns in `src/core/serializers/`

## Code Quality

- TypeScript strict mode with proper typing
- ESLint rules from `lago-configs` package
- Consistent naming: camelCase for variables, PascalCase for components
- Use existing design system components before creating new ones
- Always use direct MUI imports, never barrel imports:
  ```typescript
  // Correct
  import Button from '@mui/material/Button'
  // Wrong — triggers full MUI bundle parsing
  import { Button } from '@mui/material'
  ```
- Never import `useNavigate`, `Link`, or `useLocation` from `react-router-dom`.
  Import them from `~/core/router` — the slug-aware wrappers auto-prepend
  `/${organizationSlug}` to navigation targets and expose `strippedPathname`
  on the location object. Enforced by the custom
  `lago/no-direct-rrd-nav-import` ESLint rule. Other `react-router-dom`
  exports (`useParams`, `matchPath`, `generatePath`, `Outlet`, etc.) are
  unrestricted.
  ```typescript
  // Correct
  import { useNavigate, Link, useLocation } from '~/core/router'
  // Wrong — bypasses slug-awareness, flagged by ESLint as error
  import { useNavigate, Link, useLocation } from 'react-router-dom'
  ```

## Organization slug architecture

All authenticated app routes are nested under `/:organizationSlug/...`. The
URL slug is the **source of truth for the current organization in this tab**.
Multiple tabs can run on different orgs simultaneously; the legacy
`localStorage`-based current-org state is now a transitional bridge and must
not drive UI decisions.

### Source-of-truth hierarchy

| Concern | Source | Notes |
|---|---|---|
| Which org is the user viewing in this tab | URL slug (`useParams().organizationSlug`) | Resolves to a `Membership` via `currentUser.memberships` |
| Auth | `LAGO_USER_AUTH_TOKEN_KEY` in LS | Unchanged |
| Apollo `x-lago-organization` header | `currentOrganizationVar` (LS-backed) | Internal bridge — `OrganizationLayout` keeps it in sync with the URL slug. Never read directly to drive UI. |
| Browser-survival of OAuth round-trip | `REDIRECT_AFTER_LOGIN_LS_KEY` | Read & cleared exclusively by `Home.tsx` |

### `useCurrentUser` vs `useOrganizationInfos`

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

### Why the distinction exists

Apollo cache is persisted to IndexedDB and shared cross-tab. Root-field
queries (`Query.organization`) are not partitioned by org-id header in their
cache key, so `cache-first` reads can briefly return another tab's org
payload on initial paint. Membership data is user-scoped and consistent
across tabs, so a slug→membership lookup always resolves to the right org
for the current tab regardless of cache state.

### Navigating to a different org

Use `navigate(`/${targetSlug}/...`, { skipSlugPrepend: true })` plus
`switchCurrentOrganization(client, targetOrgId)` (or rely on
`OrganizationLayout`'s effect to detect the slug change and resync the var
and Apollo cache automatically).

## Cypress e2e tests

- Authenticated navigation goes through `cy.visitApp(path)`, not `cy.visit(path)`.
  `cy.visitApp` prepends `/${orgSlug}` captured by `cy.login()` / `cy.signup()`
  so spec files write paths as they would look without the slug (e.g.
  `cy.visitApp('/customers')` lands on `/${slug}/customers`).
  ```typescript
  // Correct — authenticated
  cy.login().visitApp('/customers')
  cy.visitApp('/settings/taxes')
  // Correct — public paths pass through unchanged
  cy.visit('/login')
  cy.visit('/sign-up')
  ```
- For strict URL assertions use the slug-tolerant regex pattern instead of
  `be.equal(baseUrl + '/path')`:
  ```typescript
  // Correct
  cy.url().should('match', /\/[^/]+\/create\/plans$/)
  // Wrong — `baseUrl + '/create/plans'` is never the full URL anymore
  cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
  ```
- `cy.url().should('include', '/path')` continues to work — `/acme/customers`
  still includes `/customers` — so existing `include` assertions need no changes.
- Keep `cy.visit()` with slug-less paths only when the test is intentionally
  probing legacy-URL behavior (e.g. testing the auth-guard redirect from a
  slug-less path to `/login`). Always add an inline comment explaining why.

## Detailed Guidelines (read on demand)

When working on these areas, read the relevant file first:

- **TypeScript conventions**: `@.agents/docs/typescript-conventions.md`
- **Folder architecture**: `@.agents/docs/folder-architecture.md`
- **Library documentation**: `@.agents/docs/documentation.md`
- **GraphQL fragments & type safety**: `@.agents/docs/graphql-fragments.md`
- **Testing best practices**: `@.agents/docs/testing-practices.md`
