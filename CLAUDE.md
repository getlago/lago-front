# Lago Frontend

## Package Manager & Workspace

- **Always use `pnpm`** — never npm or yarn
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
- Store translations in `translations/base.json` — **never manually create translation keys**, use `pnpm translations:add`
- Apollo Client reactive variables for global state (`src/core/apolloClient/reactiveVars/`)
- Follow serialization patterns in `src/core/serializers/`

## File Structure

- `src/components/` — feature components organized by domain
- `packages/design-system/` — shared UI components, icons, themes
- `src/core/` — utilities, serializers, constants, Apollo setup
- `src/pages/` — route components
- `src/hooks/` — custom React hooks
- `src/generated/` — auto-generated GraphQL types
- `translations/` — i18n JSON files
- `cypress/e2e/` — e2e tests organized by feature

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

## Detailed Guidelines (read on demand)

When working on these areas, read the relevant file first:

- **TypeScript conventions**: `@agents/typescript-conventions.md`
- **Folder architecture**: `@agents/folder-architecture.md`
- **Library documentation**: `@agents/documentation.md`
- **GraphQL fragments & type safety**: read `agents/graphql-fragments.md`
- **Testing best practices**: read `agents/testing-practices.md`
