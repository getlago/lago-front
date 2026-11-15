## GraphQL errors and permissions

The Apollo client (`src/core/apolloClient/init.ts`) already handles GraphQL errors
for every request. Code that does not know it handles them a second time, or not at
all.

**GraphQL errors resolve, they do not throw.** `defaultOptions` sets
`errorPolicy: 'all'` on `watchQuery` (every `useQuery` / `useLazyQuery`) and on
`mutate`. A GraphQL error (a validation failure, a `Forbidden`) comes back in the result:
`{ data: { field: null }, errors }`, so a `try/catch` around `await mutate(...)` does not
see it. Read `result.errors`, or match a code with `hasDefinedGQLError`
(`src/core/apolloClient/errorUtils.ts`). Reference:
`src/components/settings/integrations/AddHubspotDialog.tsx`. Network errors (offline, a
timeout, a 5xx) still reject, so a `catch` for those stays. A direct `client.query()`
keeps Apollo's default policy and rejects on GraphQL errors too.

**The error link already shows a toast.** `errorLink` shows a danger toast for every
GraphQL error that is not silenced. Only auth errors and `Forbidden` are silenced by
default. When the caller shows its own error UI, or the request runs in the background,
pass `context: { silentError: true }` or `context: { silentErrorCodes: [...] }`, or the
user gets two messages. Reference: `src/components/customers/CustomerActivityLogs.tsx`.
On a mutation, silence only the codes the form shows itself, usually
`silentErrorCodes: [LagoApiError.UnprocessableEntity]`. `silentError: true` also drops the
Sentry report of every outage and server error, so it is for background requests only,
never a way to keep a payload out of Sentry: fix that in the link (`one-owner-per-rule.md`).

**Gate a query on the permission its resolver needs.** `Forbidden` is silenced, so a
query the current role cannot run fails with no toast: the section renders empty, or
shows the wrong empty state, and nobody notices. Check the permission the API resolver
requires, which can differ from the page's own: a list of plans shown on a product page
still needs `plansView`. Then pass `skip: !hasPermissions([...])` from `usePermissions`
(`src/hooks/usePermissions.ts`). A permission missing from the `MembershipPermissions`
fragment there cannot be checked yet: add it first. Reference:
`CustomerActivityLogs.tsx` (`skip: !canViewLogs`).
