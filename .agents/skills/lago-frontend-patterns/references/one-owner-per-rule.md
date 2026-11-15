# One owner per rule

A feature PR is reviewed as a flow (gate, queries, form, mutation, error reporting,
display), not file by file. Most findings on a feature come down to one rule that
has two owners, so each one drifts from the other. Before opening the PR, trace the
flow and give each rule below exactly one owner.

**Access gates live on the route.** A feature flag, a license or a permission is
declared once, on the route entry in `src/core/router/*Routes.tsx` (`featureFlag`,
`permissions`). `RouteWrapper` and `useLocationHistory` enforce it. A gate the route
config can't express yet is added there, next to `featureFlag`, not in the page. Never
re-check it in the page with a redirect effect and a `skip`. The copies drift, and the
`skip` waits on another query while `loading` is `false`, so a deep link flashes an
empty page before the real query starts (`loading-states.md`). The entry point that
opens the feature (a card, a menu item) may hide itself, but it never replaces the
route gate.

**A value shown in two places is computed in one function.** A label, a status or a
precedence rule (which field wins when two are set) that two surfaces display, such
as a table chip and an email, is computed once and imported by both. Before writing
the second copy, grep for the first one. When you move a precedence rule, read what
`main` does on every surface it reaches. Flipping the order regresses the screens
that relied on it.

**One page, one request.** A page that needs one more fact (does any connection
exist? is this plan used?) extends its own query, gated with `@include(if: $flag)`
when the fact is conditional. A second query adds a round trip and a second loading
flag, and the content the two flags drive often needs manual `snapshotKey` wiring
(`main-header.md`).

**Lists the API validates come from the API.** Supported networks, providers,
currencies and other server-owned catalogs are read from GraphQL, as an enum or a
query, never copied into a front constant. A copy goes stale the day the API adds a
value: a record using that value loses its label, and a form that derives a required
field from it can never be saved again. When the API does not expose the list yet,
open the API change, and until it lands never block a form on a value the copy
doesn't know.

**Fix shared plumbing once, not per operation.** When a global layer misbehaves for
your operation (the error link sends variables to Sentry, the slow-query link logs a
payload), fix the layer for every operation. Don't opt your operation out of it. An
opt-out such as `silentError: true` also hides every real failure of that operation,
and the next operation with the same problem won't know it needs the flag. Silence
only the codes your UI shows itself (`graphql-errors.md`).

**Pass keys, not translated strings, to props typed `Key | string`.** `Status`
`label` accepts a `StatusLabel` key or any string. A pre-translated string
type-checks, so a renamed key silently prints raw text. Return the key from a
function typed with the key union.
