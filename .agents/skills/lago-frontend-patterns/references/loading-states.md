## Loading states and feature flags

`loading` is not "no data yet", and "no data yet" is not "no data". Code that treats
them as the same takes the empty or flag-off branch while a request is still in flight.

**`loading` is `true` while data is already on screen.** `cache-and-network` is the
client's default fetch policy (`watchQuery` in `src/core/apolloClient/init.ts`), so
`loading` is `true` on mount for every `useQuery` without its own `fetchPolicy`, even
when the cache already answered. With `notifyOnNetworkStatusChange: true` (pagination
queries, the organization query, the current user) it also flips back to `true` on
every refetch. Gating a form, a section or a page on `loading` unmounts it mid-edit and
loses its local state, or flashes a skeleton over valid data: gate it on the first load
only, `loading && !data`. Reference: `src/pages/settings/Dunnings/Dunnings.tsx`. A
paginated `Table` is the exception: it keeps `isLoading={loading}` so a page change
shows skeletons, as in `pagination.md`. For the organization query a refetch unmounts the
whole routed page: see `.agents/docs/graphql-fragments.md`.

**`hasFeatureFlag` returns `false` until the organization loads.** It reads
`featureFlags?.includes(flag)` (`src/hooks/useOrganizationInfos.ts`), and the query is
skipped while `currentOrganizationId` is unset, so `loading` can be `false` with no
`organization` yet. Wait for `organization` before deriving anything from a flag: list
query variables, form default values, which permissions or columns to show, route
guards. Otherwise a flagged organization first renders, fetches or saves with the
non-flagged behaviour.

**Redirect only once the query has resolved, and from an effect.** The first render
of a details page is always `loading: true` with no data, so
`if (!entity) navigate(...)` bounces every deep link and hard refresh back to the list.
Use `if (!loading && !entity)` inside a `useEffect`: navigating during render also
triggers a React warning. An effect does not stop its own render, so pair it with an
early `return null` on the same condition, after all hooks. Reference:
`src/pages/settings/teamAndSecurity/authentication/SSOAuthenticationDetails.tsx`. A test
with a mocked `useNavigate` does not catch the bounce, because nothing unmounts: assert
that no navigation happens while `loading` is true.
