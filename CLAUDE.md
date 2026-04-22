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
