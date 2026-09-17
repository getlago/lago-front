## Frontend coding styleguide — local mirror

Source: the Notion page "Frontend coding styleguide" (Tech › Frontend coding styleguide) and its sub-pages.
Synced: 2026-09-16 · Notion last edited: 2026-01-30. The loop pipeline reads this file instead of
fetching Notion on every run; `loop-flywheel` refreshes it when the Notion page's last-edited date
moves past the one above.

Most of the guide already lives in this folder. Read the mirrored section, not the summary:

| Notion section | Local home |
|---|---|
| Discriminated unions rather than conditional props | `typescript-conventions.md` |
| Explicit function return type | `typescript-conventions.md` |
| No nested ternary, prefer early returns, logic out of JSX | `typescript-conventions.md` |
| Testing: `data-test` constants (`*_TEST_ID`) | `testing-practices.md` |
| Folder architecture | `folder-architecture.md` |
| GraphQL fragments and cache safety | `graphql-fragments.md` |

Two rules have no other home yet:

### No `any`, no type casting

Outside tests, never force-cast and never use `any`. Prefer an explicit type, and `unknown` refined
with a type guard as the last resort. `value as SomeType` in production code is a review finding;
`as unknown as` doubly so (see `typescript-conventions.md` and the loop-build checks for the two
shapes that replace it: `Pick<...>` on a prop type, an exhaustive `Record<Source, Target>` between
two enums).

### GraphQL operations are colocated with their consumer

Every hook or component that uses a generated query/mutation hook defines the operation with `gql`
in the same file (or in a dedicated `*.gql.ts` beside it when it is large). Importing a generated
hook whose operation is declared in another page or component is a hidden dependency: renaming or
removing that file breaks the consumer, and two files can declare same-named operations with
different fields. Fetch only the fields the consumer reads; share shape through fragments, never by
importing another file's query type.

The Notion sub-page "ESLint Warnings Cleanup Strategy" is a snapshot of open `no-nested-ternary`
warnings with the policy "fix one or two inside your own PR, never all at once"; it needs no mirror.
