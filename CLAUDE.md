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
- **Forms**: Tanstack form + zod validation
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
- In tests, import and reuse the real exported types/interfaces (e.g. `MainHeaderTab`) instead of redeclaring a partial copy of a production type just for assertions — a local stub drifts from the source and hides type errors
- Always use direct MUI imports, never barrel imports:
  ```typescript
  // Correct
  import Button from '@mui/material/Button'
  // Wrong — triggers full MUI bundle parsing
  import { Button } from '@mui/material'
  ```
- Never import `useNavigate`, `Link`, `useLocation`, or `useMatch` from `react-router-dom`.
  Import them from `~/core/router` — the slug-aware wrappers auto-prepend
  `/${organizationSlug}` to navigation targets and expose `strippedPathname`
  on the location object. Instead of `useMatch`, use `matchPath` (from
  `react-router-dom`) with `strippedPathname` from the slug-aware
  `useLocation` — this is the established pattern throughout the codebase.
  Enforced by the custom `lago/no-direct-rrd-nav-import` ESLint rule.
  Other `react-router-dom` exports (`useParams`, `matchPath`, `generatePath`,
  `Outlet`, etc.) are unrestricted.
  ```typescript
  // Correct — slug-aware wrappers
  import { useNavigate, Link, useLocation } from '~/core/router'
  // Correct — route matching with strippedPathname
  import { matchPath } from 'react-router-dom'
  const { strippedPathname } = useLocation()
  const match = matchPath(SOME_ROUTE, strippedPathname)
  // Wrong — useMatch uses raw pathname (includes slug), never matches
  import { useMatch } from 'react-router-dom'
  ```

## Subsystem rules — extracted skills

Five areas carry rules too long and too narrow to live in this file. Each one is a skill
under `.agents/skills/` whose description auto-triggers on the relevant work. Read the
skill before writing code in that area — never reconstruct these rules from memory or
from the nearest existing file.

- **Forms** (new TanStack forms) → `lago-forms`. `useAppForm` + a zod schema, the
  submit-first validation contract, and the stored value shape of each registered field
  component that a schema must be written against.
- **Pagination** (numbered lists & tables) → `lago-pagination`. `PaginatedContent`,
  `usePageSearchParam`, and the `createSinglePageFieldPolicy` cache registration that a
  new paginated field silently breaks without.
- **Drawers** → `lago-drawers`. The `use<Feature>Drawer` hook is the only pattern allowed
  in new code; two legacy generations survive in the codebase and must not be copied.
- **Dialogs** → `lago-dialogs`. `useFormDialog` / `useCentralizedDialog` /
  `useFormDialogOpeningDialog`; the imperative `forwardRef` + `Dialog` pattern is gone and
  must not come back.
- **Organization slug architecture** → `lago-organization-slug`. The URL slug is the
  per-tab source of truth for the current org; reading `currentOrganizationVar` from a
  feature component is a known bug pattern.

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

## Detailed Guidelines

TypeScript conventions are small and broadly applicable, so they are imported
automatically into every session (bare `@` reference, not backtick-wrapped):

@.agents/docs/typescript-conventions.md

Read these on demand when working on the relevant area (backtick-wrapped so they
are referenced, not auto-loaded):

- **Folder architecture**: `@.agents/docs/folder-architecture.md`
- **Library documentation**: `@.agents/docs/documentation.md`
- **GraphQL fragments & type safety**: `@.agents/docs/graphql-fragments.md`
- **Testing best practices**: `@.agents/docs/testing-practices.md`
- **Icons, logos & brand assets**: `@.agents/docs/icons-and-logos.md`

## Maintaining this file

This file loads into every session, so its budget belongs to the rules that apply to
*any* change. Extract a section into a skill under `.agents/skills/` when all three hold:

1. **Narrow scope** — it only matters while touching one subsystem.
2. **Long** — more than ~20-25 lines.
3. **Detectable trigger** — the work is recognisable from concrete signals (symbols, file
   paths, task phrasings) that fit in the skill's `description`.

Write those signals as an explicit `TRIGGER — ...` clause in the description: the
description is the only part surfaced every turn, so a rule its trigger does not name is a
rule that will not fire. Leave a 2-3 line pointer here. A section failing any of the three
stays inline.
