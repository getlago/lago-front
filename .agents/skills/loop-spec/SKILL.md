---
name: loop-spec
description: 'Phase 1 of the loop pipeline for lago-front. Takes a Linear ticket URL (required) and optionally Notion spec page URLs, reads all sources, verifies every premise the ticket states against the running code, and writes an operational spec to the run state dir. Use when user says "/loop-spec <linear-url> [notion-urls...]" or asks to spec a ticket for the loop pipeline.'
---

# Loop Spec — phase 1 of loop-run

**Input:** a Linear ticket URL (REQUIRED — it provides the ISSUE-ID that keys the whole pipeline), plus optionally one or more Notion page URLs with product/technical specs. Both can be given together.
If no Linear URL was provided, ask for it with AskUserQuestion and stop until given.

**Repo:** the lago-front checkout, `front/` inside the lago monorepo. If the current session is not in the lago project, STOP — this pipeline is lago-front only.

**State dir:** `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`) — per-developer, outside the repo, never committed.

**This phase is the only one that fetches.** spec.md carries everything the builder and the reviewers need from Linear, Notion and Figma, verbatim where it matters; no later phase re-reads a source.

## Steps

1. **Extract the issue ID** from the URL (pattern `[A-Z]+-\d+`, uppercase — any Linear team prefix). All state for this run lives in the state dir — create the directory.

2. **Fetch all sources**:
   - Linear ticket via the Linear MCP `get_issue` tool — the WHOLE ticket: title, description, acceptance criteria, current state, labels, relations, attachments and linked designs. Then the full comment thread via `list_comments`: comments carry decisions, scope changes and repro details that never made it back into the description — on conflict, a later comment overrides the description; note it in spec.md.
   - **A design attachment is a source, not a bookmark.** When the ticket links a Figma node or any mockup, OPEN it (`get_screenshot` on the node, `get_metadata` for its sub-frames) and derive acceptance criteria from it: the literal copy of every label and empty state, the container shape, one criterion per state the mockup draws for the same control.
   - Every Notion URL given, via the Notion MCP `notion-fetch` tool, plus any Notion page linked inside the ticket that clearly holds the product/tech spec.
   - Conflict between sources → the Linear ticket wins for scope, Notion wins for product/UX detail; note the conflict in spec.md.

3. **Explore the codebase.** Locate every file the ticket touches (components, hooks, GraphQL documents, translations, tests). Follow existing patterns — read neighboring code, don't invent structure. If GraphQL operations change, note that `pnpm codegen` is required. Then apply the checks below; they are capped by `scripts/skill-budget.sh`.

   <!-- checks:start -->
   1. **Every premise is verified or marked.** For each constraint the ticket states as a fact about the code ("the frontend must handle X itself", "the backend does not send Y", "this component is only used here"), find the line that confirms it and record it under `## Premises` as `verified: <path:line>`. Nothing confirms it → `premise: unverified — <what the code shows instead>`. A criterion resting on an unverified premise is flagged in `## Acceptance criteria`. The most expensive diff this pipeline has shipped solved around a constraint that was false against the running code.
   2. **A backend default is a backend fact.** When the ticket says the backend derives, defaults or backfills a value, open the model and the service: record the callback, when it fires, and what input triggers it, then state which side owns the default. A front-end fallback mirroring a backend default is duplication to delete, not scope to add.
   3. **Date fields** are pinned as calendar day or instant, with write zone and display zone stated together. Lago floors arrears dates to UTC midnight and date-only pickers are pinned to `TimezoneEnum.TzUtc`, so a date-only field is written AND displayed in UTC.
   4. **Existing mechanism first.** For each behaviour the ticket asks for, name the global or shared thing that may already provide it (Apollo error link, toast layer, router wrappers, design-system component, a sibling hook) and record whether it covers the case. "Files to touch" lists a new file only when this search came back empty, with the search recorded.
   <!-- checks:end -->

4. **Write `spec.md`** in the state dir, with exactly these sections:

   ```markdown
   # <ISSUE-ID>: <ticket title>

   ## Sources
   - Linear: <linear URL>
   - Notion: <each notion URL, or "none">

   ## Ticket
   <the ticket verbatim: title, description, acceptance criteria as written, and every comment that changed scope or carries a decision — quoted, with author role and date. Reviewers read this instead of Linear.>

   ## Summary
   <2-4 sentences: what changes and why>

   ## Premises
   <one line per claim the ticket makes about the code: `verified: <path:line>` or `premise: unverified — <what the code shows>`>

   ## Acceptance criteria
   <numbered list, testable statements, taken/derived from the ticket; a criterion resting on an unverified premise says so>

   ## Files to touch
   <bullet list of exact paths relative to front/, one line each with what changes there; a new file names the existing-mechanism search that came back empty>

   ## Non-goals
   <what is explicitly out of scope>

   ## Verification
   - `pnpm lint`
   - `pnpm types`
   - `pnpm translations:inspect`
   - `pnpm translations:ensure-consistency`
   <optional: scoped jest paths ONLY for the touched domain, e.g. `pnpm test src/components/foo`>
   <optional: `pnpm codegen` + clean-diff check if GraphQL changed>
   ```

5. **Report** the spec path, a 3-line summary, and every `unverified` premise to the operator.

## Hard rules

- Read-only on Linear: no comments, no state changes in this phase.
- No code edits in this phase. No files written inside the repo.
- If the ticket lacks enough detail to write testable acceptance criteria, STOP and ask the operator — never guess.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
