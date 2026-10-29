# Evidence for frontend reviews

Shared by loop-review and babysit. This defines review evidence, not coding rules;
load the applicable repository docs and subsystem skills for those rules.

## Trace behavior before concluding

Record the base and head SHA (plus local changes, for a worktree review). Keep a compact
record for each materially changed user flow:

| Flow / risk | Producer → consumer inspected | Scenario and evidence | Remaining gap |
| --- | --- | --- | --- |
| Edit then reopen | mutation → cache → header action → form defaults | Change a field without changing the title, reopen, save again; code trace or focused test | State explicitly if not executed |

Choose scenarios from the actual diff, not a fixed quota. For forms and dialogs, trace
validation, GraphQL errors returned as data, rejected requests, success, retry and
closing through the real shared helpers. For persisted edits, follow refresh, callbacks
retained by header/configuration consumers, reopening and the next save. For queries,
distinguish first load from refresh with cached data. A call-site read alone is not
proof of the consumer's behavior; open the relevant implementation outside the diff.

A shared error handler may cover only some error classes. A form submission resolving
may not mean its mutation succeeded. Verify these contracts before recommending a
shared helper: the replacement must preserve failure propagation and user feedback.

## Compare against current patterns

Read the applicable documented pattern, the shared helper implementation, and a current
caller. Neighboring legacy code is evidence of usage, not authority over the docs.
Inspect custom submission wrappers, added type assertions and mixed responsibilities:
prefer an existing helper, narrowing/generated types, or a cohesive extraction only
when a concrete local alternative improves this change. `as const` is not inherently a
problem. File length alone is not grounds for splitting a component.

Separate behavior defects from bounded maintainability suggestions. A suggestion must
name the exact location, the existing pattern or alternative, and its practical benefit.
Keep optional improvements at low priority (normally P3); discard subjective preferences,
duplicates and changes requiring unrelated redesign. Pre-existing debt is a follow-up.
A new caller can introduce a bug through unchanged shared code: anchor the finding to
that caller, rather than discarding it because the failure occurs outside the diff.

## Validate the claim, not the test count

Select focused tests from the traced risks. Check that mocks preserve the contract under
review: manually invoking a mocked callback does not establish real mutation/promise
orchestration. For a claimed regression, prefer a reproduction that fails before the fix
and passes after it. If execution is unavailable, give the concrete code path and label
the evidence as static; do not present it as a reproduced failure.

Green CI or many passing tests are not proof of no regressions. Record dependency-blocked
checks separately, honor explicit instructions to ignore known unrelated CI failures,
and continue the code review. Before reporting, confirm the reviewed head is still
current; if it moved, review the increment or state exactly which revision was checked.

## Close the review with an auditable result

For each retained finding record location, trigger, consequence, evidence, priority and
a scoped remedy. Distinguish confirmed defects, mandatory convention violations,
non-blocking suggestions and unverified questions. Do not manufacture findings to fill
a bucket. Report checked flows and material gaps even when no issue is confirmed;
never replace that with an unconditional “no regressions” claim.

On a follow-up commit, map every earlier finding to resolved, partially resolved,
unresolved, or no longer applicable, with evidence at the new head. Recheck the original
failure scenario and whether the fix changes neighboring behavior. An outdated GitHub
thread is not evidence of a fix. Preserve any low-priority residue without re-escalating
it. Publishing comments or resolving threads follows the user's authorized scope;
a request to verify fixes alone does not authorize either.
