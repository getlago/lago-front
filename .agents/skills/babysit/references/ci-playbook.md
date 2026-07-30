# CI playbook

Maps each CI check on `getlago/lago-front` to the command that reproduces it locally.
Always reproduce a failure locally before pushing a fix. Never push a speculative fix.

## Check to command

| Check                        | Local command                     | Notes                                                                     |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `Run linters`                | `pnpm lint`, then `pnpm lint:fix` | prettier + eslint. `lint:fix` handles almost everything                   |
| `Tests (shard N/4)`          | `pnpm test <explicit file paths>` | Never pass a directory. Pull the failing spec paths out of the job log    |
| `Run Codegen`                | `pnpm codegen`                    | Fails when `src/generated/graphql.tsx` is stale, or the backend schema is not on main yet |
| `Run Test E2E`               | `pnpm test:e2e`                   | ~11 min in CI. Opens the interactive Cypress runner locally               |
| `Merge coverage & SonarQube` | `pnpm test:coverage`              | Gate result arrives as a `sonarqubecloud` PR comment, not as check output |
| `SonarCloud Code Analysis`   | read the PR comment               | Usually coverage on new code, or duplication                              |
| `CodeQL`, `Analyze (...)`    | none                              | Security scan. Escalate rather than guessing at a fix                     |

## Rules

- **`pnpm code:style` is the pre-push hook.** Run it once after all edits in a round,
  before the final push. It runs lint, types, and both translation checks in parallel.
- **Scope test runs.** `pnpm test src/path/to/One.test.tsx src/path/to/Two.test.tsx`.
  Passing a directory runs far more than needed and slows every round.
- **Never `npm`, `yarn`, `npx`, or `vitest`.** `.agents/hooks/enforce-tooling.sh`
  blocks them at the tool layer and the call will fail. Use `pnpm`, and `pnpm dlx`
  in place of `npx`.
- **Codegen in a Conductor worktree** needs `CODEGEN_API=http://api.lago.dev/graphql`,
  otherwise it fails with `ENOTFOUND api`.
- **Translations** are never hand written. `pnpm translations:add <count>` generates
  the keys, then fill the values in `translations/base.json`.

## Reading a failure

```bash
gh pr checks <n>                     # which check failed
gh run view <run-id> --log-failed    # why
```

For a sharded test failure, extract the failing spec paths from the log and feed
exactly those paths to `pnpm test`. Do not re-run the whole suite to find them.

## A codegen failure that is not yours

`Run Codegen` fails when the backend GraphQL schema for a new field has not been
merged to main yet. That is not a fixable frontend problem. Report it and treat the
check as blocked on the backend rather than trying to patch generated output.
