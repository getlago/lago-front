# Make E2E Tests Skill

**Target:** `<PR_NUMBER | BRANCH_NAME>`

> **Important:** If no argument was provided above (empty or missing), ask the user what they want to create E2E tests for. They can provide:
>
> - A PR number (format: `#123` or `123`)
> - A branch name (local or remote, e.g., `feature/my-feature` or `origin/feature/my-feature`)

This skill creates Cypress E2E tests for features implemented in a PR or branch, following the established patterns and conventions in this codebase.

## Usage

Invoke this skill with a PR number or branch name:

```
/make-e2e-tests #3041
/make-e2e-tests 3041
/make-e2e-tests feature/webhook-events
/make-e2e-tests origin/feature/webhook-events
```

If you omit the argument, you will be asked to provide one.

---

## Philosophy: Happy Path Only

**E2E tests cover ONLY the macro happy paths** — the core user journeys that prove the feature works end-to-end. Deep coverage (edge cases, error states, complex validations) belongs in unit and integration tests.

**What E2E tests should cover:**
- Create a resource via form → verify success
- Edit a resource → verify changes persisted
- Navigate through key UI flows (list → detail → action)
- Apply filters / interact with key UI controls

**What E2E tests should NOT cover:**
- Validation error states (test in unit tests)
- API error handling (test in integration tests)
- Complex cross-resource flows (too fragile)
- Edge cases and boundary conditions
- Delete flows (destructive, hard to make idempotent)

**Key principles:**
- Each test should be **short** (5-10 actions max)
- Prefer **few robust tests** over many fragile ones
- Tests should be **independent** where possible, but can share setup via `before()` hooks
- Never test implementation details — only visible user outcomes
- **Zero tests is a valid outcome.** If the PR only changes internal logic, refactors code, fixes styling, or has no meaningful user-facing flow that warrants E2E coverage, report that no E2E tests are needed and explain why. Not every PR deserves an E2E test.

---

## Overview

This skill will:

1. Analyze the PR/branch to understand what feature was implemented
2. Identify the **core happy path flows** (create, edit, key interactions)
3. Generate a minimal test plan with only essential test cases
4. Read the relevant components to find `data-test` attributes and routes
5. Generate the `.cy.ts` file following project conventions
6. Add any needed constants to support files

---

## Phase 1: Input Detection & PR Analysis

### Step 1.1: Detect Input Type and Fetch Changed Files

Execute the following logic to detect input type and fetch the diff:

```bash
INPUT="$ARGUMENTS"

# Step 1: Check if PR Number
if [[ "$INPUT" =~ ^#?[0-9]+$ ]]; then
  PR_NUMBER="${INPUT#\#}"
  if gh pr view "$PR_NUMBER" --json number &>/dev/null; then
    echo "Detected: PR #$PR_NUMBER"
    gh pr view "$PR_NUMBER" --json files,additions,deletions,body,title
    gh pr diff "$PR_NUMBER"
    exit 0
  fi
fi

# Step 2: Check if Local Branch
if git branch --list "$INPUT" | grep -q "$INPUT"; then
  echo "Detected: Local branch '$INPUT'"
  git diff main..."$INPUT" --name-only
  git diff main..."$INPUT"
  exit 0
fi

# Step 3: Check if Remote Branch
git fetch origin &>/dev/null
REMOTE_BRANCH="${INPUT#origin/}"
if git branch -r --list "origin/$REMOTE_BRANCH" | grep -q "origin/$REMOTE_BRANCH"; then
  echo "Detected: Remote branch 'origin/$REMOTE_BRANCH'"
  git diff main...origin/"$REMOTE_BRANCH" --name-only
  git diff main...origin/"$REMOTE_BRANCH"
  exit 0
fi

# Step 4: Fallback to current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Input '$INPUT' not found. Using current branch: '$CURRENT_BRANCH'"
git diff main...HEAD --name-only
git diff main...HEAD
```

### Step 1.2: Understand the Feature

From the PR diff and description, determine:

1. **What feature was implemented** — Read the PR title, description, and changed files
2. **Which pages/routes are affected** — Look for route changes, new pages, modified pages
3. **What user flows are involved** — Create, Read, Update, Delete operations
4. **What UI components were added/modified** — Forms, dialogs, tables, lists

Focus on **user-facing behavior**, not implementation details. E2E tests simulate real user interactions.

### Step 1.3: Identify Happy Path Flows

From the changes, identify **only the core user journeys** worth E2E testing:

| Flow Type | Include in E2E? | Notes |
|---|---|---|
| **Create resource** | Yes | Fill form with valid data → submit → verify |
| **Edit resource** | Yes | Navigate to existing → modify → submit → verify |
| **Key UI interactions** | Yes | Filters, tabs, navigation — but keep minimal |
| **Navigation** | Only if new routes | Verify route access, not deep navigation |
| **Delete flows** | No | Too destructive, test in integration tests |
| **Validation errors** | No | Test in unit tests |
| **Error states** | No | Test in integration tests |
| **Cross-page flows** | No | Too fragile for E2E |
| **Edge cases** | No | Test in unit/integration tests |

### Step 1.4: Read Component Source Code

For each page/component involved in the flows, read the source to extract:

1. **All `data-test` attributes** — These are your selectors
2. **All `input[name="..."]` fields** — These are your form field selectors
3. **Navigation paths** — Where `navigate()` or `<Link>` goes
4. **Conditional UI** — What shows/hides based on state
5. **Existing TestIds files** — Check if the component has a `*TestIds.ts` file

```bash
# Find data-test attributes in a component
grep -n 'data-test' src/pages/TargetPage.tsx
grep -n 'data-test' src/components/feature/FeatureComponent.tsx

# Find existing TestIds files
find src -name "*TestIds*" -o -name "*testIds*" -o -name "*dataTestConstants*"
```

**CRITICAL: If key UI elements lack `data-test` attributes, you MUST add them before writing the E2E test.** Follow the pattern in Phase 3, Step 3.1.

---

## Phase 2: Test Plan

### Step 2.1: Determine File Location

Based on the feature, determine where the test file should go:

| Feature Area | Folder | Example |
|---|---|---|
| Authentication | `cypress/e2e/00-auth/` | `t40-password-reset.cy.ts` |
| Core resources (CRUD) | `cypress/e2e/10-resources/` | `t80-webhook-create-edit.cy.ts` |
| Cross-resource flows | `cypress/e2e/` (root) | `t40-assign-plan-to-customer.cy.ts` |

**Numbering rules:**
- Check existing files in the target folder to determine the next number
- Use increments of 10 (`t10`, `t20`, `t30`, ...)
- The number indicates execution order within the folder

### Step 2.2: Generate Test Plan & Ask for Confirmation (MANDATORY STOP)

After the analysis is complete, **you MUST present a structured test plan and wait for user confirmation before writing any code.**

Present the following to the user. **Keep to 2-4 test cases max** — only the essential happy paths:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
E2E Test Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source: PR #<NUMBER> "<PR TITLE>"  (or Branch: <branch-name>)

Summary of Changes Analyzed:
  - <Brief description of what the PR/branch implements>
  - <Key pages/components affected>

Target File: cypress/e2e/<folder>/t<NN>-<feature-name>.cy.ts

Prerequisites:
  - [List any resources that must exist, e.g., "logged-in user", "existing webhook endpoint"]

Test Cases (happy paths only):
  1. ✅ should be able to create a <resource>
     Flow: login → navigate → fill form → submit → verify success
     Selectors needed: [list key data-test / input selectors]

  2. ✅ should be able to edit the <resource>
     Flow: login → navigate to resource → click edit → modify → submit → verify
     Selectors needed: [list key data-test / input selectors]

  3. ✅ should be able to <key interaction> (e.g., apply filters)
     Flow: login → navigate → interact → verify outcome
     Selectors needed: [list key data-test / input selectors]

Components Needing New data-test Attributes:
  - [List components that need new data-test attributes, or "None — all selectors already exist"]

Excluded from E2E (covered elsewhere):
  - [List what was intentionally left out, e.g., "validation errors (unit tests)", "delete flow (destructive)"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Do NOT include:** validation error tests, delete flows, access/navigation-only tests, or edge cases.

**STOP HERE — Ask the user for confirmation before proceeding:**

> "Here is the E2E test plan based on my analysis of [PR #X / branch Y]. Do you want me to proceed with implementation, or would you like to adjust anything? You can:
> - Add or remove test cases
> - Change the file name or location
> - Adjust prerequisites
> - Request specific additional flows"

**Do NOT proceed to Phase 3 until the user explicitly confirms.** Wait for their response. If the user requests changes, regenerate the plan with their feedback and ask again.

---

## Phase 3: Implementation

### Step 3.1: Add Missing data-test Attributes

If the analysis in Phase 1 found components lacking `data-test` attributes for key interactive elements, add them now.

**Rules for adding data-test attributes:**

1. **NEVER wrap elements in extra `<div>` just for data-test** — this breaks CSS/layout
2. Only add `data-test` to elements that already exist in the JSX
3. For elements that cannot accept `data-test` (React fragments, some third-party components), skip them

**CRITICAL: Always define data-test values as exported constants in a dedicated file.**

Data-test constants MUST live in a **standalone `.ts` file** (no React imports, no JSX, only plain string exports). This is because:
- E2E tests (Cypress) cannot import React components — they can only import plain JS/TS modules
- Unit/integration tests also import these constants for consistent selectors
- The file must be importable by both `src/` (React) and `cypress/` (no React bundler)

**Where to put the constants file:**

```
src/components/<feature>/utils/dataTestConstants.ts   ← preferred location
src/pages/<feature>/featureTestIds.ts                 ← alternative (see signUpTestIds.ts)
```

**Existing examples to follow:**

```typescript
// src/components/customers/utils/dataTestConstants.ts
// Data test constants for customer components and e2e tests

// CustomersList
export const CREATE_CUSTOMER_DATA_TEST = 'create-customer'

// CreateCustomer
export const SUBMIT_CUSTOMER_DATA_TEST = 'submit-customer'
```

```typescript
// src/pages/auth/signUpTestIds.ts
// Data test ids for SignUp – shared with e2e. No app imports so Cypress can bundle this file alone.

export const SIGNUP_SUBMIT_BUTTON_TEST_ID = 'signup-submit-button'
export const SIGNUP_EMAIL_FIELD_TEST_ID = 'signup-email-field'
```

**Naming conventions:**
- Constants: `SCREAMING_SNAKE_CASE` ending with `_DATA_TEST` or `_TEST_ID`
- Values: `kebab-case` matching the feature/element name
- File header comment: describe what feature the constants belong to
- Group constants by component with a `// ComponentName` comment

**Then import in the component:**

```typescript
// In the React component
import { FEATURE_SUBMIT_DATA_TEST } from '~/components/feature/utils/dataTestConstants'

// Usage in JSX
<Button data-test={FEATURE_SUBMIT_DATA_TEST} />
```

**And import in the E2E test:**

```typescript
// In the Cypress test
import { FEATURE_SUBMIT_DATA_TEST } from '~/components/feature/utils/dataTestConstants'

cy.get(`[data-test="${FEATURE_SUBMIT_DATA_TEST}"]`).click({ force: true })
```

### Step 3.2: Add Reusable Constants (if needed)

If the test needs shared constants, add them to `cypress/support/reusableConstants.ts`:

```typescript
// Only add if the value is used across multiple test files
export const newConstant = 'value'
```

If adding new custom commands, update both:
- `cypress/support/e2e.ts` — Command implementation
- `cypress/support/index.d.ts` — TypeScript declaration

### Step 3.3: Write the E2E Test File

Create the test file following these **mandatory conventions**:

#### File Structure Template

```typescript
// Imports (constants from support files and/or TestIds files)
import { someConstant } from '../support/reusableConstants'
// Or from TestIds:
// import { FEATURE_SUBMIT_TEST_ID } from '~/pages/feature/featureTestIds'

// Test-scoped unique data (outside describe, shared across tests in file)
const randomId = Math.round(Math.random() * 10000)
const resourceName = `Resource ${randomId}`
const resourceUrl = `https://example.com/resource-${randomId}`

describe('Feature Name', () => {
  // Use beforeEach for login — each test starts from a clean login state
  beforeEach(() => {
    cy.login()
  })

  // Happy path 1: Create
  it('should be able to create a <resource>', () => {
    cy.visit('/resource/create')

    // Fill only required fields
    cy.get('input[name="name"]').type(resourceName)
    cy.get('input[name="url"]').type(resourceUrl)

    // Submit and verify success (navigation away from form)
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('not.include', '/create')
  })

  // Happy path 2: Edit (depends on create above)
  it('should be able to edit the <resource>', () => {
    // Navigate to the resource (via UI, not direct URL if inside MemoryRouter)
    cy.get('[data-test="bottom-nav-section"]').contains('Section').click({ force: true })
    cy.contains(resourceUrl).click({ force: true })

    // Open edit via actions menu
    cy.get('[data-test="resource-detail-actions"]').click({ force: true })
    cy.get('[data-test="resource-detail-edit"]').click({ force: true })

    // Modify a field
    cy.get('input[name="url"]').clear().type('https://example.com/edited')

    // Submit and verify
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('not.include', '/edit')
  })

  // Happy path 3: Key UI interaction (e.g., filters)
  it('should be able to apply filters', () => {
    // Navigate to the relevant view
    // Open filter panel
    // Select filter type and value
    // Apply and verify the filter was applied
  })
})
```

**Important:** Keep each test to **5-10 Cypress actions max**. If a test is getting long, it's testing too much.

### Step 3.4: Convention Checklist

Before finalizing, verify the test follows ALL conventions:

#### Selectors
- [ ] Primary: `[data-test="..."]` for buttons, containers, actions
- [ ] Forms: `input[name="..."]` for input fields, `textarea[name="..."]` for textareas
- [ ] Dropdowns: `input[name="..."]` to open, `[data-option-index="N"]` to select
- [ ] Dialogs: `[role="dialog"]` for existence checks
- [ ] Tables: `[data-test="table-name"] tr` with `.contains()` for row selection
- [ ] Never use translation keys as selectors

#### Interactions
- [ ] `.click({ force: true })` for buttons that may be overlapped
- [ ] `.type()` for text input (already has `delay: 0` from global override)
- [ ] `.clear().type()` when replacing existing values
- [ ] `.within(() => { })` for scoped interactions inside containers

#### Assertions
- [ ] `cy.url().should('be.equal', Cypress.config().baseUrl + '/path')` for exact URL match
- [ ] `cy.url().should('include', '/partial-path')` for partial URL match
- [ ] `.should('exist')` / `.should('not.exist')` for element presence
- [ ] `.should('be.disabled')` / `.should('not.be.disabled')` for button states
- [ ] `.should('have.value', 'expected')` for input values
- [ ] `.should('have.length', N)` for collection counts
- [ ] `.should('contain.text', 'text')` for text within elements

#### Data
- [ ] Unique IDs: `Math.round(Math.random() * 10000)` for resource names
- [ ] Name pattern: `Resource ${randomId}`
- [ ] Code pattern: `resource_${randomId}`
- [ ] Dates (if needed): Use `luxon` — `DateTime.now().plus({ days: N }).toFormat('LL/dd/yyyy')`

#### Structure
- [ ] `describe('Feature Name', () => { ... })` as top-level
- [ ] `beforeEach` with `cy.login()` and optional `.visit()`
- [ ] Tests follow logical flow: access → create → verify → edit → verify
- [ ] `describe('anti-regression', () => { ... })` for bug fix tests with PR link
- [ ] Comments to separate logical sections within long tests

#### File
- [ ] Location: correct folder under `cypress/e2e/`
- [ ] Name: `tNN-feature-name.cy.ts` with correct number
- [ ] Imports from `reusableConstants.ts` or TestIds files as needed

---

## Phase 4: Validation

### Step 4.1: Verify Test Completeness

After writing the test, verify:

1. **All identified flows are covered** — Check against the test plan from Phase 2
2. **Selectors exist in components** — Every `data-test` used in the test must exist in source code
3. **No hardcoded test IDs** — Use imported constants where TestIds files exist
4. **Test data won't conflict** — Unique random IDs prevent cross-test collisions

### Step 4.2: Present Summary

Show the user what was created/modified:

```
E2E Test Summary:

Files Created:
  - cypress/e2e/<folder>/tNN-feature-name.cy.ts (N test cases)

Files Modified:
  - src/pages/feature/Component.tsx (added data-test attributes)
  - cypress/support/reusableConstants.ts (added constants) [if applicable]

Test Cases:
  1. ✅ should be able to access feature page
  2. ✅ should be able to create a resource
  3. ✅ should show validation errors
  4. ✅ should be able to edit the resource

To run:
  pnpm --filter lago-front cypress:open
  # Then select the test file in the Cypress UI
```

---

## Reference: Selector Quick Guide

| Element | Selector Pattern | Example |
|---|---|---|
| Button/CTA | `[data-test="action-name"]` | `[data-test="create-plan"]` |
| Submit button | `[data-test="submit"]` | `[data-test="submit"]` |
| Text input | `input[name="fieldName"]` | `input[name="email"]` |
| Textarea | `textarea[name="fieldName"]` | `textarea[name="description"]` |
| Dropdown input | `input[name="fieldName"]` | `input[name="currency"]` |
| Dropdown option | `[data-option-index="N"]` | `[data-option-index="0"]` |
| Named option | `[data-test="option-value"]` | `[data-test="USD"]` |
| Dialog | `[role="dialog"]` | `[role="dialog"]` |
| Dialog confirm | `[data-test="warning-confirm"]` | `[data-test="warning-confirm"]` |
| Table row | `[data-test="table-name"] tr` | `[data-test="table-customers-list"] tr` |
| Table row by ID | `#table-name-row-N` | `#table-customer-invoices-row-0` |
| Error message | `[data-test="text-field-error"]` | `[data-test="text-field-error"]` |
| Alert | `[data-test="alert-type-danger"]` | `[data-test="alert-type-danger"]` |
| Tab | `[role="tab"]` + `.contains()` | `[role="tab"]` |
| Checkbox | `[data-test="checkbox-name"]` | `[data-test="checkbox-hasPlanLimit"]` |
| Actions menu | `button[data-test="*-actions"]` | `button[data-test="coupon-details-actions"]` |
| Accordion | `[data-test="charge-accordion-N"]` | `[data-test="charge-accordion-0"]` |
| Dynamic ID | `` `[data-test="${variable}"]` `` | `` `[data-test="${couponName}"]` `` |
| Prefix match | `[data-test^="prefix-"]` | `[data-test^="combobox-item-"]` |

## Reference: Custom Commands

| Command | Usage | Description |
|---|---|---|
| `cy.login()` | `cy.login()` or `cy.login(email, password)` | Login with default or custom credentials |
| `cy.logout()` | `cy.logout()` | Logout current user |
| `cy.signup({...})` | `cy.signup({ organizationName, email, password })` | Create new organization and user |
