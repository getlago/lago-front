## GraphQL errors and permissions

The Apollo client (`src/core/apolloClient/init.ts`) already handles GraphQL errors
for every request. Code that does not know it handles them a second time, or not at
all.

**Hooks and mutations resolve, they do not throw.** `defaultOptions` sets
`errorPolicy: 'all'` on `watchQuery` (every `useQuery` / `useLazyQuery`) and on
`mutate`. A GraphQL error comes back in the result: `{ data: { field: null }, errors }`.
A `try/catch` around `await mutate(...)` never sees it. Read `result.errors`, or match a
code with `hasDefinedGQLError` (`src/core/apolloClient/errorUtils.ts`). Reference:
`src/components/settings/integrations/AddHubspotDialog.tsx`. A test that mocks the
mutation to reject covers a path production never takes. A direct `client.query()` is
the exception: it keeps Apollo's default policy and does throw.

**The error link already shows a toast.** `errorLink` shows a danger toast for every
GraphQL error that is not silenced. Only auth errors and `Forbidden` are silenced by
default. When the caller shows its own error UI, or the request runs in the background,
pass `context: { silentError: true }` or `context: { silentErrorCodes: [...] }`, or the
user gets two messages. Reference: `src/components/customers/CustomerActivityLogs.tsx`.

**Gate a query on the permission its resolver needs.** `Forbidden` is silenced, so a
query the current role cannot run fails with no toast: the section renders empty, or
shows the wrong empty state, and nobody notices. Check the permission the API resolver
requires, which can differ from the page's own: a list of plans shown on a product page
still needs `plansView`. Then pass `skip: !hasPermissions([...])` from `usePermissions`
(`src/hooks/usePermissions.ts`). A permission missing from the `MembershipPermissions`
fragment there cannot be checked yet: add it first. Reference:
`CustomerActivityLogs.tsx` (`skip: !canViewLogs`).
