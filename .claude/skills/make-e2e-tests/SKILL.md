---
name: make-e2e-tests
description: Create Cypress e2e tests for a specific feature. Navigates the codebase, adds data-test attributes if missing, writes tests following project conventions, and validates them with Cypress.
user-invocable: true
argument-hint: '<feature>'
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, AskUserQuestion, Agent
---

# Make E2E Tests Skill

**Target feature:** `$ARGUMENTS`

> **Important:** If no feature was provided above (empty or missing), use the AskUserQuestion tool to ask the user which feature they want e2e tests for.

## Step 0: Validate Feature Scope

Before proceeding, evaluate whether the feature description is specific enough to write targeted e2e tests.

**Too broad (ask the user to narrow down):**
- "wallet" — which page? which flow?
- "customers" — creation? editing? listing? details?
- "billing" — invoices? subscriptions? plans?
- "settings" — which settings section?

**Good scope (proceed):**
- "wallet details page"
- "customer creation form"
- "coupon create and edit flow"
- "login and signup"
- "plan creation with charges"
- "add-on creation and editing"

If the feature is too broad, use the AskUserQuestion tool to ask the user to narrow it down. Provide examples of good scope based on what you know about the feature area.

---

## Step 1: Understand the Feature

### 1.1: Find the Feature Code

Search the codebase to locate the feature's implementation:

```bash
# Search for relevant pages/components
```

Use Glob and Grep to find:
- Route definitions (check `src/core/router/` for route paths)
- Page components (check `src/pages/`)
- Feature-specific components (check `src/components/`)
- Any existing data-test attributes in these components

### 1.2: Map User Flows

Read the feature's page and component files to identify testable user flows:
- What can a user do on this page/feature?
- What forms exist? What fields do they have?
- What buttons/actions are available?
- What navigation happens after actions?
- What error states exist?
- What dialogs/modals appear?

### 1.3: Check Existing E2E Tests

Check if there are already e2e tests for this feature:

```bash
# Search existing tests
```

Look in `cypress/e2e/` for any tests covering this feature. If tests exist, understand what's already covered and what's missing.

---

## Step 2: Ensure Data Test Attributes

### 2.1: Audit Existing data-test Attributes

For each interactive element in the feature (buttons, form fields, links, list items, dialogs), check if a `data-test` attribute exists.

### 2.2: Add Missing data-test Attributes

Follow the project's test ID conventions when adding new attributes:

**Naming pattern:** `{COMPONENT_NAME}_TEST_ID` or `{ELEMENT_DESCRIPTION}_TEST_ID`

**Rules:**
1. Export test ID constants from the component file (or a dedicated `testIds.ts` / `dataTestConstants.ts` file nearby)
2. Use kebab-case for the constant value (e.g., `'create-customer-button'`, `'plan-name-input'`)
3. Apply the constant to the `data-test` attribute: `data-test={CONSTANT_NAME}`
4. Never use translation keys as test IDs

**Example:**
```tsx
// In the component file or a nearby testIds.ts
export const CREATE_PLAN_BUTTON_TEST_ID = 'create-plan-button'
export const PLAN_NAME_INPUT_TEST_ID = 'plan-name-input'

// In the component JSX
<Button data-test={CREATE_PLAN_BUTTON_TEST_ID} onClick={handleCreate}>
  {translate('text_create_plan')}
</Button>
```

**Where to look for existing patterns:**
- `src/components/customers/utils/dataTestConstants.ts`
- `src/components/MainHeader/mainHeaderTestIds.ts`
- `src/pages/auth/signUpTestIds.ts`

Match the existing organizational pattern: if the feature area already has a `testIds.ts` or `dataTestConstants.ts` file, add to it. Otherwise, export constants directly from the component file.

---

## Step 3: Write E2E Tests

### 3.1: Create the Test File

Place the test file in the appropriate directory under `cypress/e2e/`:

**Directory structure:**
```
cypress/e2e/
├── 00-auth/          # Authentication tests
├── 10-resources/     # Resource CRUD tests (taxes, customers, plans, etc.)
├── t10-*.cy.ts       # Top-level feature tests
```

**File naming convention:** `t{NN}-{feature-description}.cy.ts`
- Use a numeric prefix (t10, t20, t30...) to control execution order
- Use kebab-case for the description
- Place in the appropriate subdirectory or at the top level

### 3.2: Follow These Test Conventions

**Imports:**
```typescript
// Import test ID constants from component files
import { SOME_TEST_ID } from '~/components/path/to/testIds'

// Import reusable constants
import { customerName, userEmail } from '../../support/reusableConstants'
```

**Test structure:**
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.login().visit('/feature-page')
  })

  it('should do the main happy path', () => {
    // Test implementation
  })

  it('should handle another scenario', () => {
    // Test implementation
  })

  describe('anti-regression', () => {
    it('should handle specific edge case', () => {
      // Test implementation
    })
  })
})
```

### 3.3: Selector Priority (in order of preference)

1. **data-test attributes (preferred):**
   ```typescript
   cy.get('[data-test="create-button"]').click()
   cy.get(`[data-test="${IMPORTED_TEST_ID}"]`).click()
   ```

2. **Input name attributes (for form fields):**
   ```typescript
   cy.get('input[name="email"]').type('test@example.com')
   cy.get('textarea[name="description"]').type('Some text')
   ```

3. **Role attributes (for semantic elements):**
   ```typescript
   cy.get('[role="dialog"]').should('exist')
   cy.get('button[role="tab"]').contains('Settings').click()
   ```

4. **Scoped queries with `.within()`:**
   ```typescript
   cy.get('[data-test="charge-accordion-2"]').within(() => {
     cy.get('input[name="chargeModel"]').should('have.value', 'Value')
   })
   ```

### 3.4: Common Patterns

**Form filling:**
```typescript
cy.get('input[name="name"]').type('My Resource')
cy.get('input[name="code"]').should('have.value', 'my_resource') // Auto-generated codes
cy.get('input[name="amount"]').type('100')
```

**Combobox/dropdown selection:**
```typescript
cy.get('input[name="fieldName"]').click()
cy.get('[data-option-index="0"]').click() // Select first option
// OR select by data-test if available
cy.get('[data-test="specific-option"]').click()
```

**Form submission:**
```typescript
cy.get('[data-test="submit"]').should('not.be.disabled')
cy.get('[data-test="submit"]').click()
```

**Dialog interactions:**
```typescript
cy.get('[role="dialog"]').should('exist')
// Interact with dialog content...
cy.get('[data-test="submit-dialog"]').click()
cy.get('[role="dialog"]').should('not.exist')
```

**URL assertions:**
```typescript
cy.url().should('include', '/customers')
cy.url().should('be.equal', Cypress.config().baseUrl + '/')
```

**Content assertions:**
```typescript
cy.contains('Expected Text').should('exist')
cy.get('[data-test="name"]').should('contain.text', 'Expected')
cy.get('[data-test="error"]').should('have.length', 2)
```

**Clearing and retyping:**
```typescript
cy.get('input[name="name"]').clear().type('New Value')
```

**Scroll into view (for elements below fold):**
```typescript
cy.get('input[name="field"]').scrollIntoView({ offset: { top: -100, left: 0 }, duration: 0 })
```

**Force click (hidden elements):**
```typescript
cy.get('[data-test="button"]').click({ force: true })
```

### 3.5: Timing and Waits

- **Never use `cy.wait(ms)`** — rely on Cypress implicit waits
- Use timeout option for slow-loading elements: `cy.get('[data-test="el"]', { timeout: 10000 }).should('be.visible')`
- Use assertions as implicit waits: `cy.url().should('include', '/path')`
- Use `.should('exist')` / `.should('not.exist')` to wait for elements to appear/disappear

### 3.6: Test Data

- Use `Math.round(Math.random() * 10000)` for unique IDs to avoid conflicts between runs
- Import shared constants from `cypress/support/reusableConstants.ts`
- Use the existing test user credentials (imported from reusableConstants): `userEmail` / `userPassword`
- Add new shared constants to `reusableConstants.ts` if they'll be used across multiple test files

### 3.7: Custom Commands Available

- `cy.login(email?, password?)` — logs in (defaults to test user from reusableConstants)
- `cy.logout()` — logs out current user
- `cy.signup({ organizationName, email, password })` — signs up a new user

### 3.8: What to Test

For each feature, aim to cover:

1. **Happy path** — the main user flow works end-to-end
2. **Form validation** — required fields, invalid input, error messages
3. **CRUD operations** — create, read/view, update, delete (as applicable)
4. **Navigation** — correct URLs after actions, back navigation
5. **Edge cases** — empty states, duplicate entries, disabled fields
6. **Error states** — API errors, validation errors

---

## Step 4: Validate Tests

### 4.1: Run Cypress

Run the specific test file to validate:

```bash
cd cypress && npx cypress run --spec "e2e/path/to/test-file.cy.ts"
```

**Important:** The app must be running for Cypress tests to work. If the test fails because the app is not running, inform the user and ask them to start the dev server (`pnpm dev`) before retrying.

### 4.2: Fix Failures

If tests fail:
1. Read the error output carefully
2. Check if selectors match the actual DOM (data-test attributes may need adjustment)
3. Check if timing issues exist (add appropriate assertions as waits)
4. Check if the test data conflicts with existing data
5. Fix and re-run until all tests pass

### 4.3: Retry Strategy

The Cypress config has `retries: 3`, so flaky tests will be retried. However, aim for deterministic tests that pass on the first try. If a test is flaky:
- Add explicit waits via assertions
- Use unique test data
- Check for race conditions in the UI

---

## Checklist

### Phase 1: Analysis
- [ ] Feature scope validated (not too broad)
- [ ] Feature code located in the codebase
- [ ] User flows mapped
- [ ] Existing e2e tests checked

### Phase 2: Data Test Attributes
- [ ] Existing data-test attributes audited
- [ ] Missing data-test attributes added (following naming conventions)
- [ ] Test ID constants exported properly

### Phase 3: Test Writing
- [ ] Test file created in correct location with proper naming
- [ ] Imports follow conventions (test IDs from components, constants from reusableConstants)
- [ ] Tests use proper selectors (data-test > input[name] > role > CSS)
- [ ] No hardcoded waits (uses implicit waits via assertions)
- [ ] Unique test data generated where needed
- [ ] Happy path covered
- [ ] Form validation covered (if applicable)
- [ ] Error states covered (if applicable)

### Phase 4: Validation
- [ ] Cypress tests run successfully
- [ ] No flaky behavior observed
