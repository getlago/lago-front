# gh cookbook

Every GitHub call babysit needs. Repo is `getlago/lago-front` throughout.

## PR state

```bash
gh pr view <n> --json number,url,title,body,headRefName,baseRefName,state,isDraft,\
mergeStateStatus,reviewDecision,statusCheckRollup,reviews,comments
```

Current branch's PR: drop `<n>`. Exits non-zero with
`no pull requests found for branch "x"` when there is none, which is the signal to
open one.

## Checks

```bash
gh pr checks <n>                          # snapshot
gh pr checks <n> --watch --interval 30    # block until they settle
gh run view <run-id> --log-failed         # why a job failed
```

## Review threads (the decline ledger source)

Must fetch resolved and outdated threads too. That is where the prior decline markers
live, and skipping them makes the ledger forget everything.

```bash
gh api graphql -F n=<n> -f query='
query($n:Int!) {
  repository(owner:"getlago", name:"lago-front") {
    pullRequest(number:$n) {
      headRefOid
      reviewThreads(first:100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          comments(first:20) {
            nodes { databaseId author { login } body url createdAt }
          }
        }
      }
    }
  }
}'
```

`nodes[].id` is the thread id used to resolve. `comments.nodes[0].databaseId` is the
comment id used to reply. `comments.nodes[0].author.login` decides bot versus human.

## Reply in a thread

```bash
gh api repos/getlago/lago-front/pulls/<n>/comments \
  -f body='...' \
  -F in_reply_to=<databaseId>
```

## Resolve a thread

```bash
gh api graphql -f id='<threadId>' -f query='
mutation($id:ID!) {
  resolveReviewThread(input:{threadId:$id}) { thread { isResolved } }
}'
```

## Open a PR

```bash
git push -u origin HEAD                      # only if the branch has no upstream
gh pr create --base main --title '...' --body-file <path> --assignee @me
```

Body comes from `.github/pull_request_template.md` with the `Fixes LAGO-XXX` line
filled in. Do not pass `--draft`.

## Pushing

```bash
git fetch origin
git push origin HEAD:<headRefName>
```

Always push with the explicit `HEAD:<headRefName>` refspec. In a Conductor worktree
the local branch name can differ from the PR's head branch, and
`git push origin <local-branch>` then creates a stray branch while leaving the PR
untouched.

## Concurrency guard

Before each push, confirm the remote head has not moved since the round started:

```bash
gh api repos/getlago/lago-front/pulls/<n> --jq .head.sha
```

Different from the sha the round began with means another session or a teammate
pushed. Abandon this round's push, refresh, start a new round. Never force.

## Verified

The `reviewThreads` query above returns four `copilot-pull-request-reviewer` threads
on PR #4014, all resolved, three outdated. Use that PR when testing ledger behaviour.
