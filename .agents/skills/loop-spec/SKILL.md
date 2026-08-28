---
name: loop-spec
description: 'Phase 1 of the loop pipeline for lago-front. Takes a Linear ticket URL (required) and optionally Notion spec page URLs, reads all sources, explores the lago-front codebase, and writes an operational spec to the run state dir. Use when user says "/loop-spec <linear-url> [notion-urls...]" or asks to spec a ticket for the loop pipeline.'
---

# Loop Spec — phase 1 of loop-run

**Input:** a Linear ticket URL (REQUIRED — it provides the ISSUE-ID that keys the whole pipeline), plus optionally one or more Notion page URLs with product/technical specs. Both can be given together.
If no Linear URL was provided, ask for it with AskUserQuestion and stop until given.

**Repo:** the lago-front checkout, `front/` inside the lago monorepo. If the current session is not in the lago project, STOP — this pipeline is lago-front only.

**State dir:** `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`) — per-developer, outside the repo, never committed.

## Steps

1. **Extract the issue ID** from the URL (pattern `[A-Z]+-\d+`, uppercase — any Linear team prefix: LAGO, ING, ...). All state for this run lives in the state dir — create the directory.

2. **Fetch all sources**:
   - Linear ticket via the Linear MCP `get_issue` tool — the WHOLE ticket, not just the description: title, description, acceptance criteria, current state, labels, relations (blocked-by/related/duplicates), attachments and linked designs. Then fetch the full comment thread via `list_comments`: comments often carry decisions, scope changes and repro details that never made it back into the description — on conflict, a later comment overrides the description; note it in spec.md.
   - Every Notion URL given, via the Notion MCP `notion-fetch` tool: product requirements, technical constraints, edge cases.
   - If a Notion page linked INSIDE the Linear ticket clearly holds the product/tech spec, fetch that too.
   - Conflict between sources → the Linear ticket wins for scope, Notion wins for product/UX detail; note the conflict in spec.md.

3. **Explore the codebase.** Locate every file the ticket touches (components, hooks, GraphQL documents, translations, tests). Follow existing patterns — read neighboring code, don't invent structure. If GraphQL operations change, note that `pnpm codegen` is required.

   **Date fields**: for every date in scope, pin in spec.md whether it is a calendar day or an instant, and state the write zone and the display zone together. Lago floors arrears dates to UTC midnight and the codebase pins date-only pickers to `TimezoneEnum.TzUtc`, so a date-only field must be written AND displayed in UTC. Naming the org timezone for one is how the display ends up disagreeing with the stored value.

4. **Write `spec.md`** in the state dir, with exactly these sections:

   ```markdown
   # <ISSUE-ID>: <ticket title>

   ## Sources
   - Linear: <linear URL>
   - Notion: <each notion URL, or "none">

   ## Summary
   <2-4 sentences: what changes and why>

   ## Acceptance criteria
   <numbered list, testable statements, taken/derived from the ticket>

   ## Files to touch
   <bullet list of exact paths relative to front/, one line each with what changes there>

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

5. **Report** the spec path and a 3-line summary to the operator.

## Hard rules

- Read-only on Linear: no comments, no state changes in this phase.
- No code edits in this phase. No files written inside the repo.
- If the ticket lacks enough detail to write testable acceptance criteria, STOP and ask the operator — never guess.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
