# Triage learnings

Durable rules learned from real triage outcomes. Read this **before** judging, and apply it —
entries override the skill's defaults where they conflict.

Two hard limits on what an entry may do:

1. It may adjust **judgement and calibration** — depth tier, how much evidence a claim needs,
   which patterns to suspect. It may never soften a **guardrail**: the Linear write limits, the
   mandatory independent review at `full` depth, the one-way depth latch, the evidence
   requirement itself.
2. It must be backed by something **identifiable and human**: a review that overruled the
   analysis, a comment correcting it, a fix that landed differently from the handoff. Never an
   inference, never "this seems better in hindsight".

An entry that cannot name what corrected it does not belong here.

## Format

```
## YYYY-MM-DD — <one-line rule>

**What happened:** <the specific outcome, named by its surface — never a ticket id — with the
correcting signal>
**Rule:** <what to do differently, stated as an instruction>
```

---

## 2026-08-26 — A symptom matching a documented regression class is a hypothesis, not a cause

**What happened:** a members-list ticket reported "matching items beyond the initial page are
omitted", which matches the documented pagination-field-policy defect. `cache.ts:29,33` showed
both collections *are* registered with `createSinglePageFieldPolicy()`; the real cause was
client-side filtering over a server-paginated page. The independent review re-verified the
exclusion and confirmed it.

**Rule:** open the call site and confirm the documented cause is actually present before it
enters the comment. A matching row narrows the search; it never closes it.

## 2026-08-26 — Sweep the writers of a shared key, not only its readers

**What happened:** on that same members-list ticket the handoff proposed changing a URL param
from a role name to a role code, and listed every component reading the param. The independent
review found `RoleDetails.tsx:72`, which *builds* a deep link with the old shape. The change
would have made the Members tab render empty from that link, with no failing test.

**Rule:** when the fix changes the shape of a shared key or identifier, enumerate producers and
consumers. Grep the exported constant, then the bare literal.

## 2026-08-26 — Judge each reported symptom separately

**What happened:** that members-list ticket listed two symptoms. The analysis filed both as
blocked on an API change. One of them — the page not resetting when the filter changes — was
fixable in the frontend that day.

**Rule:** a ticket reporting several symptoms gets a verdict per symptom. A shared headline is
fine; the body keeps them apart.

## 2026-08-26 — An acceptance criterion phrased against user-facing copy is not testable here

**What happened:** a criterion read "the role button label reads Admin". `translate` is mocked
in jest, so the rendered value is the translation key, and the button carried no `data-test`.

**Rule:** phrase criteria against the translation key or an exported `data-test` constant, and
give every criterion a concrete expected value.

## 2026-08-26 — Only a defect that changes the implementation makes a review FAIL

**What happened:** on an invoice amount-filter ticket both review rounds returned FAIL. Round 1
was earned — the fix swapped bounds inside `parseFromToValue`, which re-seeds the panel inputs
mid-typing through `FiltersPanelPopper.tsx:247-249` + `enableReinitialize`. Round 2 carried one
real blocker (no acceptance criterion covered the `FILTER_VALUE_MAP` rewiring, so all twelve
passed on a change that shipped the ticket's bug) and five nits: a wrong git hash, an enum with
the same string value, a false parenthetical about `translate`, a loose criterion, a mis-cited
doc. The operator pushed back that a binary gate over an unbounded nit generator can never
pass, and that a third cycle would find five more at the same rate.

**Rule:** ask the reviewer to mark every finding blocking or non-blocking, and reserve FAIL for
the blocking ones: wrong diagnosis, a fix that does not work, a missed call site, or an
acceptance criterion that lets the bug ship. Everything else is `PASS with notes` — apply the
notes and post, without spending a review round. Do not raise the cap of 2 to compensate; the
cap is what makes the loop converge.
