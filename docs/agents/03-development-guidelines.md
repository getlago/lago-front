## Development Guidelines

- Follow TypeScript strict mode practices with path aliases (`~/*` maps to `src/*`)
- Use existing design system components from `packages/design-system/`
- Maintain consistent import order and file structure
- Leverage existing hooks and utilities in `src/hooks/`
- Write comprehensive tests for new features (Jest for unit, Cypress for e2e)
- Use GraphQL queries/mutations for API calls (generated types in `src/generated/`)
- **IMPORTANT**: After making any changes to GraphQL schemas, queries, or fragments, always run `pnpm codegen` to regenerate TypeScript types in `src/generated/`. This ensures type safety and enables IntelliSense for your GraphQL operations.
- Store translations in `translations/base.json`
- Use Apollo Client reactive variables for global state (`src/core/apolloClient/reactiveVars/`)
- Follow the established serialization patterns in `src/core/serializers/`
