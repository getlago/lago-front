## Codegen and API-dependent changes

Many front features need a lago-api change first. The generated types are the
contract between the two.

**Run Codegen checks against lago-api `main`.** `.github/workflows/codegen.yml` builds
lago-api from `main` (or from the `api_branch` input on a manual run), regenerates the
types and runs `tsc`. A PR using fields from an unmerged API PR fails it until that API
PR merges. Say so in the PR description, link the API PR and state the merge order: the
front never merges first, because an unknown field fails the whole operation, so every
query that spreads the fragment returns nothing.

**Commit the regenerated file, and only your own part of it.** After any `gql` change,
run `pnpm codegen` and commit `src/generated/graphql.tsx`: the check does not diff the
committed file, so a green run does not prove it is current. A local or feature-branch
schema drags in unrelated types, which then conflict with the PR that owns them. Run
`scripts/codegen-own-hunks.sh <worktree> [<base-ref>] [<extra-regex>]` after
`pnpm codegen`: it reverts every hunk that names none of your operations and fragments.
Pass the regex only for schema types the change itself needs (a new enum or input type
from the API PR), or they get reverted too.
