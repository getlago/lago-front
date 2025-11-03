# Lago Billing System - Development Assistant

You are an expert development assistant for the Lago billing system project. Always follow these critical guidelines:

## CRITICAL: Package Manager & Workspace

- **ALWAYS use `pnpm` for all package management tasks**
- Use `pnpm install`, `pnpm add`, `pnpm run`, etc.
- Never suggest npm or yarn commands
- The project uses pnpm workspaces with packages in `packages/*`:
  - `packages/configs/` - Shared ESLint, TypeScript, Tailwind configs
  - `packages/design-system/` - Shared UI components and icons
- **Important**: After making changes to workspace packages, run `pnpm install` to trigger postinstall scripts and update the local version

## Project Stack & Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material UI + TailwindCSS + Custom Design System based on MUI
- **State**: Apollo Client (GraphQL) with reactive variables
- **Forms**: Formik + Yup validation
- **Routing**: React Router DOM + TanStack Router (newer routes)
- **Testing**: Jest + Cypress + Testing Library
- **Development**: Runs in Docker container in dev mode
- **Code Generation**: GraphQL Code Generator for type-safe queries
- **Linting**: ESLint + Prettier with custom configs from `lago-configs`
- **Note**: Avoid suggesting build scripts as the project runs in development mode

## Development Guidelines

- Follow TypeScript strict mode practices with path aliases (`~/*` maps to `src/*`)
- Use existing design system components from `packages/design-system/`
- Maintain consistent import order and file structure
- Leverage existing hooks and utilities in `src/hooks/`
- Write comprehensive tests for new features (Jest for unit, Cypress for e2e)
- Use GraphQL queries/mutations for API calls (generated types in `src/generated/`)
- Store translations in `translations/base.json`
- Use Apollo Client reactive variables for global state (`src/core/apolloClient/reactiveVars/`)
- Follow the established serialization patterns in `src/core/serializers/`

## File Structure & Conventions

- `src/components/` - Feature components organized by domain
- `packages/design-system/` - Shared UI components, icons, and themes
- `src/core/` - Core utilities, serializers, constants, Apollo setup
- `src/pages/` - Route components
- `src/hooks/` - Custom React hooks
- `src/generated/` - Auto-generated GraphQL types
- `translations/` - i18n JSON files (base.json, de.json, es.json, etc.)
- `cypress/e2e/` - End-to-end tests organized by feature
- `src/core/tanstackRouter/` - Newer routing structure

## Key Scripts & Commands

- `pnpm dev` - Start development server
- `pnpm test` - Run Jest tests
- `pnpm test:e2e` - Run Cypress tests
- `pnpm lint` - Check code style
- `pnpm lint:fix` - Fix code style issues
- `pnpm codegen` - Generate GraphQL types
- `pnpm translations:add` - Add new translation keys

## Code Quality Standards

- Use TypeScript strict mode with proper typing
- Follow ESLint rules from `lago-configs` package
- Write tests for new functionality
- Use existing design system components before creating new ones
- Maintain consistent naming conventions (camelCase for variables, PascalCase for components)
- Use proper error handling with Apollo Client error boundaries

Always provide solutions that align with Lago's architecture and use pnpm for any package-related operations.
