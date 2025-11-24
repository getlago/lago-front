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
- **IMPORTANT**: After making any changes to GraphQL schemas, queries, or fragments, always run `pnpm codegen` to regenerate TypeScript types in `src/generated/`. This ensures type safety and enables IntelliSense for your GraphQL operations.
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
- `pnpm codegen` - Generate GraphQL types (run after modifying schemas, queries, or fragments)
- `pnpm translations:add` - Add new translation keys

## Code Quality Standards

- Use TypeScript strict mode with proper typing
- Follow ESLint rules from `lago-configs` package
- Write tests for new functionality
- Use existing design system components before creating new ones
- Maintain consistent naming conventions (camelCase for variables, PascalCase for components)
- Use proper error handling with Apollo Client error boundaries

## TypeScript Conventions

### Discriminated Unions Rather Than Conditional Props

We prefer to have our props described with "discrimination" and prevent optional props overuse. Do it as much as possible as it helps understanding the logic of how props are used.

```tsx
// ❌ Bad - Optional props create ambiguity
type Props = {
  authenticated: boolean
  level?: 'basic' | 'admin'
}

// ✅ Good - Discriminated union makes the relationship clear
type Props =
  | { authenticated: true; level: 'basic' | 'admin' }
  | { authenticated: false };
```

### Explicit Function Return Types

Always write the return type of a function explicitly. This improves code readability, helps catch errors early, and makes the codebase more maintainable.

```tsx
// ❌ Bad - Implicit return type
const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Good - Explicit return type
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### No Nested Ternary

Prevent anything deeper than 2 levels.

```tsx
// ❌ Bad
const role = isAdmin ? (isManager ? "Manager" : "Admin") : "User";

// ✅ Good
function getRole(): string {
  if (!isAdmin) return "User"
  if (isManager) return "Manager"

  return "Admin"
}

const role = getRole()
```

### Prefer Early Returns

Makes the code way more readable.

```tsx
// ❌ Bad
function getStatus(user) {
  let status;
  if (user.isActive) {
    if (user.isAdmin) {
      status = "Admin";
    } else {
      status = "Active";
    }
  } else {
    status = "Inactive";
  }
  return status;
}

// ✅ Good
function getStatus(user) {
  if (!user.isActive) return "Inactive";
  if (user.isAdmin) return "Admin";
  return "Active";
}
```

### Prefer Logic Out of JSX

Extract any logic above, when it starts to be complex.

```tsx
// ❌ Bad
return (
  <div>
    {score > 80 ? "High" : score > 50 ? "Medium" : "Low"}
  </div>
);

// ✅ Good
let label;
if (score > 80) {
  label = "High";
} else if (score > 50) {
  label = "Medium";
} else {
  label = "Low";
}

return (
  <div>
    {label}
  </div>
);
```

## Folder architecture

The folder architecture is a really hard and vast subject.

Here at Lago, we try to keep the concepts as simple and straightforward as possible. This is why, we want our folder architecture to be simple to understand and to dive in

The folders are created around the ideas of features. features that have finite scope and live around the page it presents its concepts.

Here is how we structure our folders

```tsx
src/
|-- components/
|---- MySharedComponent/
|------ MySharedComponent.tsx
|------ types.ts
|------ componentLogic.ts
|------ __tests__/
|-------- MySharedComponent.test.tsx
|-------- componentLogic.test.ts
|-- core/
|---- sharedLogicFunction.ts
|---- __tests__/
|------ sharedLogicfunction.test.ts
|-- hooks/
|---- useSharedHook.ts
|---- __tests__/
|------ useSharedhook.test.ts
|-- pages/
|---- myFeature/
|------ MyFeaturePage.ts
|------ common/
|-------- aLogicFunction.ts
|-------- ASharedComponent.tsx
|-------- __tests__/
|---------- aLogicFunction.test.ts
|---------- ASharedComponent.test.tsx
|------ ANotSharedComponent/
|-------- ANotSharedComponent.tsx
|-------- useNotSharedFeatureHook.ts
|-------- __tests__/
|---------- ANotSharedComponent.test.tsx
|---------- useNotSharedFeatureHook.test.ts
```

The idea behind this is simple: keep it as close to where it’s used as possible until you need it elsewhere.

If you need it somewhere else, this means that it becomes shared thus we move it one folder up.
As an example, if our `useNotSharedFeatureHook.ts` was to be shared in differents components of the same feature, it would go to the `common` folder.

And if we needed it in components from other features, we would move it to the `hooks` folder where it would be shared throughout the whole application

## Documentation & Library References

### Using Context7 MCP (If Installed)

If the user has Context7 MCP configured, **ALWAYS use it** to fetch up-to-date documentation for third-party libraries before making assumptions or using outdated knowledge:

1. **When to Use Context7**:
   - When working with React, TypeScript, Vite, Apollo Client, Formik, Yup, Material UI, or any npm package
   - Before implementing features using external libraries
   - When debugging library-specific issues
   - When the user asks questions about library APIs or best practices

2. **How to Use Context7**:
   - First, resolve the library ID: Use `resolve-library-id` with the library name (e.g., "react", "apollo-client", "@mui/material")
   - Then, fetch docs: Use `get-library-docs` with the resolved Context7-compatible library ID
   - Optionally specify a `topic` to focus on specific features (e.g., "hooks", "routing", "forms")

3. **Example Workflow**:

   ```
   User asks: "How do I use Apollo Client mutations?"

   Step 1: resolve-library-id("apollo-client") → /apollographql/apollo-client
   Step 2: get-library-docs("/apollographql/apollo-client", topic: "mutations")
   Step 3: Use the fetched documentation to provide accurate, up-to-date guidance
   ```

4. **Key Libraries in This Project**:
   - React 18: `/facebook/react` or `/facebook/react/v18.x.x`
   - Apollo Client: `/apollographql/apollo-client`
   - Material UI: `/mui/material-ui`
   - Formik: `/jaredpalmer/formik`
   - Vite: `/vitejs/vite`
   - TypeScript: `/microsoft/TypeScript`

**Note**: If Context7 is not installed or not configured, fall back to your training data knowledge, but always prefer Context7 when available for the most accurate and current information.

Always provide solutions that align with Lago's architecture and use pnpm for any package-related operations.
