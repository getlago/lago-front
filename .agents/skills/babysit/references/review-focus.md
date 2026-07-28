# Review focus areas

Handed to `/review` as extra focus. `/review` already reads `CLAUDE.md`, so this file
is not a restatement of it. It lists the rules that actually get broken in this repo,
each with the concrete failure it causes, so they get weighted above generic findings.

## Drawers

New drawer code must use the `use<Feature>Drawer()` hook pattern returning
`{ openDrawer }`. Two legacy shapes are findings when they appear in new code:

- `useFormDrawer` wrapped in a `forwardRef` + `useImperativeHandle` component that
  returns `null`, with the parent holding a ref.
- `~/components/designSystem/Drawer` with a `DrawerRef`, rendered in the parent's JSX.

Their presence elsewhere in the codebase is migration debt, not permission to copy.

## Pagination

A new `{ collection, metadata }` list field must be registered in `queryFieldPolicies`
(`src/core/apolloClient/cache.ts`) with `createSinglePageFieldPolicy()`. Skipping it
makes page 2 silently return page 1, and fails the `cache.test.ts` guard in CI.

- `createPaginatedFieldPolicy()` in new code is a finding. It is the legacy
  append/infinite-scroll policy.
- `PaginatedContent` must receive `metadata`, or `totalCount` is 0 and the pager is
  hidden entirely.
- `pageSize` on `PaginatedContent` must match the query `limit`, or the "X-Y of N"
  label lies.

## Router imports

`useNavigate`, `Link`, `useLocation`, `useMatch` imported from `react-router-dom`
instead of `~/core/router`. The wrappers prepend `/${organizationSlug}`; the raw
versions silently navigate to the wrong place. `useMatch` in particular never matches,
because it sees the slug-prefixed pathname. Use `matchPath` with `strippedPathname`.

## MUI barrel imports

`import { Button } from '@mui/material'` pulls in the whole library. Must be
`import Button from '@mui/material/Button'`.

## Translations

New `text_*` keys must come from `pnpm translations:add <count>`. Hand-written keys do
not match the generated format and break the consistency checks.

## Organization slug

`currentOrganizationVar` read from a feature component to drive UI or build an
identifier is a known bug pattern: it shows another tab's org after a cross-tab switch.
The permitted call sites are listed in `CLAUDE.md` and are all infrastructure.

- Persistent identifiers (URLs the user copies, LS keys, mutation args, filenames) come
  from `useCurrentUser().currentMembership`.
- Behaviour config (timezone, currency, feature flags, premium integrations) comes from
  `useOrganizationInfos()`.

## GraphQL

Every consumer of GraphQL fields defines its own named fragment; parents spread child
fragments rather than inlining the child's field needs. Schema, query, or fragment
changes must come with a regenerated `src/generated/graphql.tsx`.

## TypeScript conventions

- Explicit return types on functions.
- Discriminated unions instead of several optional props that are really one choice.
- No ternary nested deeper than one level.
- Early returns over nested conditionals.
- Non-trivial conditional JSX extracted into a `renderX()` helper above the return, not
  inlined in a prop.
- No `any`.

## Tests

- `data-test` values referenced by tests are exported `*_TEST_ID` constants, never
  inline strings and never translation keys.
- Any component touching a drawer needs `jest.mock('~/components/drawers/useDrawer')`.
  The drawer stack uses `import.meta`, which crashes Jest.
- Components opening a CentralizedDialog must register it with NiceModal in the test,
  or the confirm button never renders.
- Cypress uses `cy.visitApp()` for authenticated paths and slug-tolerant URL regexes.

## Table

Columns, placeholder, and actionColumn are extracted as typed consts
(`TableColumn<Fragment>[]`, `TablePlaceholder`, `ActionColumn<Fragment>`), never
inlined in JSX and never typed with `typeof` on query data.

## Out of scope for this review

Do not report anything CI already catches: formatting, type errors, failing tests, lint
violations. Those are handled by the babysit loop, not by triage. Do not report
pre-existing issues on lines the PR did not touch.
