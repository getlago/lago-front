---
name: make-tests
description: Create unit and integration tests for code changes in a GitHub PR. Use this skill to generate tests with 80% coverage on new code, following BDD approach and project conventions.
argument-hint: '#<pr-number>'
---

# Make Tests Skill

**Target PR:** `$ARGUMENTS`

> **Important:** If no PR number was provided above (empty or missing), use the AskUserQuestion tool to ask the user for the PR number they want to create tests for (format: #123).

Extract the PR number from the argument. The user may provide it as `#123` or `123` - remove the `#` prefix if present to get the numeric PR number.

This skill creates comprehensive tests for code changes in a GitHub Pull Request, following the established patterns and conventions in this codebase.

## Overview

This skill will:

1. Analyze the PR to identify changed/added files
2. **Critically evaluate** which parts of the new code actually need tests
3. Create tests following BDD approach (GIVEN/WHEN/THEN)
4. Target ~80% coverage **on new code only** (not the entire codebase)
5. Reuse existing factories/mocks and refactor shared ones

## Critical Testing Philosophy

**Quality over quantity.** The goal is NOT to blindly achieve 80% coverage, but to write meaningful tests that provide real value.

### The 80% Target is a Guideline, Not a Rule

- **80% coverage on new code** is the target when the code has testable logic
- If achieving 80% would require writing trivial tests, **it's better to have lower coverage**
- A PR with 50% coverage of meaningful tests is better than 80% coverage with trivial tests

### When to Write Tests

Write tests when the new code has:

- Business logic with conditional paths
- State management or side effects
- User interactions (forms, buttons, navigation)
- Data transformations or calculations
- Error handling that needs verification
- Edge cases that could break in production

### When NOT to Write Tests (Even If Coverage Drops)

Do NOT write tests just to increase coverage if the code is:

- Simple prop pass-through with no logic
- Pure presentational (only renders what it receives)
- A thin wrapper around a well-tested library
- Configuration or constants
- Type definitions or interfaces
- Simple getters/setters with no logic

### Critical Analysis Required

Before writing any test, ask yourself:

1. "What bug would this test catch?"
2. "What behavior am I actually verifying?"
3. "Would a change in this code break something important?"

If you can't answer these questions clearly, **don't write the test**.

---

## Prerequisites

Before starting, gather context by reading these reference files:

1. **Testing Best Practices**: `agents/testing-practices.md`
2. **Code Quality Standards**: `agents/code-quality.md`
3. **Existing Test Example**: `src/components/invoices/details/__tests__/InvoiceDetailsTable.integration.test.tsx`
4. **Test Utils**: `src/test-utils.tsx`

---

## Phase 1: PR Analysis

### Step 1.1: Fetch PR Information

Extract the PR number from the argument and fetch PR details:

```bash
# Get PR diff and changed files
gh pr view <PR_NUMBER> --json files,additions,deletions,body,title
gh pr diff <PR_NUMBER>
```

### Step 1.2: Identify Files Requiring Tests

Analyze the changed files and categorize them:

**Files that NEED tests:**

- Components (`.tsx` files in `src/components/`, `src/pages/`)
- Hooks (`.ts` files in `src/hooks/`)
- Utilities (`.ts` files in `src/core/utils/`, `src/utils/`)
- Business logic modules

**Files that DO NOT need tests:**

- Type definitions (`.d.ts`, pure type files)
- GraphQL query/mutation definitions (`.graphql`, generated files)
- Configuration files
- Style files (`.css`, `.scss`)
- Index/barrel exports
- Constants-only files (unless complex logic)
- Translation files

### Step 1.3: Assess Test Value

For each file requiring tests, evaluate:

1. **Complexity**: Does it have conditional logic, loops, or state management?
2. **Business criticality**: Is it handling payments, invoices, or sensitive operations?
3. **User interaction**: Does it handle form submissions, button clicks, or navigation?
4. **Edge cases**: Are there null checks, error handling, or boundary conditions?

**DO NOT test:**

- Simple pass-through components with no logic
- Pure presentational components that only render props
- Components that only re-export other components
- Trivial getters/setters

### Step 1.4: Check for Implicit Coverage and Related Files

Before creating tests, verify that ALL new files in the PR are accounted for:

**1. Supporting Files (schemas, configs, types)**

- Check if these are already tested implicitly through component tests
- If a component test exercises the supporting file's behavior, separate tests may not be needed
- Only create separate tests if the file has complex logic not covered elsewhere

**2. Custom Hooks**

- Hooks should be tested for their **core contract**: what they return and what side effects they trigger
- Focus on: callbacks return expected values, correct parameters passed to external dependencies
- Don't skip hook tests just because the hook is "simple" - if it has a contract, test it

**3. New Patterns Introduced by the PR**

- Identify if the PR introduces new approaches or replaces old patterns
- Focus tests specifically on the NEW behavior, not on unchanged existing logic
- If a PR changes HOW something is done (e.g., navigation, state management), test that the new approach works correctly

---

## Phase 2: Test Planning

### Step 2.1: Critical Code Review

Before planning tests, analyze the new code and categorize it:

```markdown
## Code Analysis: [ComponentName]

### File: `src/path/to/Component.tsx`

### Code Classification:

**Testable Logic (WILL test):**

- Lines 25-40: Form validation logic with multiple conditions
- Lines 55-70: API response handling with error states
- Lines 90-110: Complex calculation for pricing

**Trivial Code (will NOT test):**

- Lines 10-20: Simple prop destructuring
- Lines 45-52: Basic JSX rendering with no conditions
- Lines 120-130: Loading skeleton (pure presentational)

### Test Value Assessment:

- [ ] Does this code have conditional logic? → If no, consider skipping tests
- [ ] Could a bug here cause real user impact? → If no, lower priority
- [ ] Is this code likely to change/break? → If yes, worth testing
```

### Step 2.2: Create Test Plan (Only for Testable Code)

For code that passed the critical review:

```markdown
## Test Plan: [ComponentName]

### File: `src/path/to/Component.tsx`

### Key Behaviors to Test (with justification):

1. "Form validation rejects invalid email" - Prevents user errors
2. "Submit button disabled during API call" - Prevents double submission
3. "Error message displayed on API failure" - Critical UX feedback

### Behaviors NOT Testing (with justification):

1. "Component renders" - Too trivial, would catch no bugs
2. "Loading spinner appears" - Pure presentational, library handles it

### Expected Coverage: ~75%

- Untested code is intentionally trivial (lines 45-52, 120-130)

### Existing Mocks/Factories to Reuse:

- [List any existing mocks from __tests__ folders or shared mock files]

### New Mocks Needed:

- [List any new mocks that need to be created]
```

### Step 2.2: Search for Existing Mocks and Factories

Before creating new mocks, search for existing ones:

```bash
# Search for existing factories
find src -name "*factory*" -o -name "*Factory*" | head -20

# Search for existing mocks
find src -name "*mock*" -o -name "*Mock*" | head -20

# Search for shared test utilities
ls -la src/__mocks__/ 2>/dev/null || echo "No shared mocks folder"
```

---

## Phase 3: Implementation

### Step 3.1: Add data-test Constants to Components

**CRITICAL:** Before writing tests, add `data-test` constants to the component being tested.

**In the component file:**

```typescript
// Export data-test constants at the top of the component file (after imports)
export const COMPONENT_NAME_TEST_ID = 'component-name'
export const COMPONENT_NAME_TITLE_TEST_ID = 'component-name-title'
export const COMPONENT_NAME_SUBMIT_BUTTON_TEST_ID = 'component-name-submit-button'
export const COMPONENT_NAME_ERROR_MESSAGE_TEST_ID = 'component-name-error-message'
// Add more as needed for testable elements

export const ComponentName = ({ ... }) => {
  return (
    <div data-test={COMPONENT_NAME_TEST_ID}>
      <Typography data-test={COMPONENT_NAME_TITLE_TEST_ID}>
        {translate('...')}
      </Typography>
      {/* For form.SubmitButton use dataTest (camelCase) */}
      <form.SubmitButton dataTest={COMPONENT_NAME_SUBMIT_BUTTON_TEST_ID}>
        Submit
      </form.SubmitButton>
    </div>
  )
}
```

**Naming convention:**

- Use SCREAMING_SNAKE_CASE for constant names
- Use kebab-case for the actual data-test value
- Pattern: `{COMPONENT_NAME}_{ELEMENT_DESCRIPTION}_TEST_ID`

### Step 3.2: Create Test File

Create test file at: `src/path/to/__tests__/ComponentName.test.tsx`

**Test file structure:**

```typescript
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  COMPONENT_NAME_TEST_ID,
  COMPONENT_NAME_TITLE_TEST_ID,
  COMPONENT_NAME_SUBMIT_BUTTON_TEST_ID,
  ComponentName,
} from '../ComponentName'
import { render } from '~/test-utils'

// Mock dependencies
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should display the main container', () => {
        render(<ComponentName />)

        expect(screen.getByTestId(COMPONENT_NAME_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the title', () => {
        render(<ComponentName />)

        expect(screen.getByTestId(COMPONENT_NAME_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN user interacts with the form', () => {
      it('THEN should enable submit button after valid input', async () => {
        const user = userEvent.setup()
        render(<ComponentName />)

        const input = screen.getByTestId(COMPONENT_NAME_INPUT_TEST_ID)
        await user.type(input, 'valid value')

        const submitButton = screen.getByTestId(COMPONENT_NAME_SUBMIT_BUTTON_TEST_ID)
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN the component receives props', () => {
    describe('WHEN isLoading is true', () => {
      it('THEN should display loading state', () => {
        render(<ComponentName isLoading={true} />)

        expect(screen.getByTestId(COMPONENT_LOADING_SKELETON_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
```

### Step 3.3: BDD Test Structure Rules

**MANDATORY:** All test descriptions MUST follow this pattern:

1. **describe** blocks use `GIVEN` or `WHEN` (always UPPERCASE)
2. **it** blocks use `THEN` (always UPPERCASE)
3. The rest of the description is lowercase

**Pattern:**

```typescript
describe('GIVEN [precondition]', () => {
  describe('WHEN [action or state]', () => {
    it('THEN should [expected outcome]', () => {
      // test implementation
    })
  })
})
```

**Examples:**

```typescript
// Correct
describe('GIVEN the user is logged in', () => {
  describe('WHEN clicking the logout button', () => {
    it('THEN should redirect to login page', () => { ... })
    it('THEN should clear the session', () => { ... })
  })
})

// Incorrect - don't do this
describe('Given the user is logged in', () => { ... })  // Wrong case
describe('When clicking the logout button', () => { ... })  // Wrong case
it('Then should redirect', () => { ... })  // Wrong case
it('should redirect', () => { ... })  // Missing THEN
```

### Step 3.4: Using it.each for Similar Tests

**IMPORTANT:** When you have multiple tests that follow the same pattern but with different inputs/outputs, use `it.each` to reduce code duplication and improve maintainability.

**When to use `it.each`:**

- Testing multiple elements are rendered (e.g., form fields, buttons)
- Testing multiple inputs produce expected outputs
- Testing the same behavior with different props/states
- Testing multiple validation cases

**Pattern for checking multiple elements are displayed:**

```typescript
describe('WHEN the component renders', () => {
  it.each([
    ['name input field', COMPONENT_NAME_INPUT_TEST_ID],
    ['email input field', COMPONENT_EMAIL_INPUT_TEST_ID],
    ['cancel button', COMPONENT_CANCEL_BUTTON_TEST_ID],
    ['submit button', COMPONENT_SUBMIT_BUTTON_TEST_ID],
  ])('THEN should display the %s', (_, testId) => {
    render(<ComponentName />)

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })
})
```

**Pattern for checking default values:**

```typescript
describe('WHEN form fields are empty', () => {
  it.each([
    ['name', COMPONENT_NAME_INPUT_TEST_ID],
    ['email', COMPONENT_EMAIL_INPUT_TEST_ID],
    ['phone', COMPONENT_PHONE_INPUT_TEST_ID],
  ])('THEN should have empty %s input by default', (_, testId) => {
    render(<ComponentName />)

    const container = screen.getByTestId(testId)
    const input = container.querySelector('input')

    expect(input).toHaveValue('')
  })
})
```

**Pattern for testing multiple validation cases:**

```typescript
describe('WHEN user enters invalid data', () => {
  it.each([
    ['empty email', '', 'Email is required'],
    ['invalid email format', 'invalid', 'Invalid email format'],
    ['email too long', 'a'.repeat(256) + '@test.com', 'Email too long'],
  ])('THEN should show error for %s', async (_, inputValue, expectedError) => {
    const user = userEvent.setup()
    render(<ComponentName />)

    const input = screen.getByTestId(COMPONENT_EMAIL_INPUT_TEST_ID)
    await user.type(input, inputValue)
    await user.tab() // trigger blur validation

    expect(screen.getByText(expectedError)).toBeInTheDocument()
  })
})
```

**Pattern with object parameters for complex cases:**

```typescript
describe('WHEN displaying different states', () => {
  it.each([
    { status: 'pending', expectedColor: 'yellow', expectedText: 'In Progress' },
    { status: 'completed', expectedColor: 'green', expectedText: 'Done' },
    { status: 'failed', expectedColor: 'red', expectedText: 'Error' },
  ])('THEN should display $status state correctly', ({ status, expectedColor, expectedText }) => {
    render(<StatusBadge status={status} />)

    const badge = screen.getByTestId(STATUS_BADGE_TEST_ID)
    expect(badge).toHaveClass(expectedColor)
    expect(badge).toHaveTextContent(expectedText)
  })
})
```

**When NOT to use `it.each`:**

- When tests have significantly different setup or assertions
- When the test logic is complex and would be harder to read in a table
- When you only have 1-2 similar tests (not worth the abstraction)
- When debugging would be harder due to the abstraction

### Step 3.5: Selector Rules

**NEVER use translation keys as selectors:**

```typescript
// WRONG - Never do this
expect(screen.getByText('text_17440321235444hcxi31f8j6')).toBeInTheDocument()
expect(screen.getByText(translate('some_key'))).toBeInTheDocument()

// CORRECT - Use data-test IDs
expect(screen.getByTestId(COMPONENT_NAME_TITLE_TEST_ID)).toBeInTheDocument()
```

**For form inputs, use the data-test container:**

```typescript
// CORRECT - Find input within data-test container
const inputContainer = screen.getByTestId(COMPONENT_NAME_INPUT_TEST_ID)
const input = inputContainer.querySelector('input')
await user.type(input!, 'test value')
```

### Step 3.6: Reuse and Refactor Mocks

**Step 3.6.1: Check for existing mocks**

Before creating new mocks, search the codebase:

```typescript
// Search in existing test files for similar mocks
grep -r "mockInvoice" src/**/__tests__/*.tsx
grep -r "createMock" src/**/__tests__/*.tsx
```

**Step 3.6.2: Refactor shared mocks**

If you find the same mock used in multiple test files, move it to a shared location:

1. Create shared mock files in `src/__mocks__/` or `src/test-utils/mocks/`
2. Export factory functions for creating mock objects
3. Update existing tests to import from the shared location

**Shared mock pattern:**

```typescript
// src/__mocks__/invoiceMocks.ts
import { CurrencyEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'

export const createMockInvoice = (overrides = {}) => ({
  id: 'invoice-1',
  status: InvoiceStatusTypeEnum.Finalized,
  currency: CurrencyEnum.Usd,
  totalAmountCents: 10000,
  ...overrides,
})

export const createMockCustomer = (overrides = {}) => ({
  id: 'customer-1',
  name: 'Test Customer',
  ...overrides,
})
```

**Usage in tests:**

```typescript
import { createMockInvoice, createMockCustomer } from '~/mocks/invoiceMocks'

const mockInvoice = createMockInvoice({ status: InvoiceStatusTypeEnum.Draft })
```

---

## Phase 4: Coverage Analysis (Critical Evaluation)

### Step 4.1: Run Tests with Coverage on New Files Only

```bash
# Run coverage ONLY on the new/changed files from the PR
pnpm test:coverage -- --collectCoverageFrom='src/path/to/new-file.tsx' src/path/to/__tests__/new-file.test.tsx
```

### Step 4.2: Analyze Uncovered Code Critically

When reviewing coverage results, for each uncovered line/branch ask:

1. **Is this code worth testing?**
   - If it's error handling for an edge case that could break production → YES, add test
   - If it's a simple return statement or trivial else branch → NO, leave it

2. **What would a test for this code look like?**
   - If the test would be meaningful and catch real bugs → Write it
   - If the test would just be `expect(component).toBeInTheDocument()` with no real assertion → Skip it

3. **Would adding this test improve confidence in the code?**
   - If yes → Write it
   - If the test would just be testing implementation details → Skip it

### Step 4.3: Coverage Targets (Guidelines, Not Rules)

**Target: ~80% on new code**, but accept lower coverage when justified:

| Scenario                         | Acceptable Coverage | Reason                                    |
| -------------------------------- | ------------------- | ----------------------------------------- |
| Complex business logic           | 80-100%             | High value, many edge cases               |
| Form with validation             | 70-90%              | Test validation, skip trivial rendering   |
| Simple component with some logic | 60-80%              | Test the logic, skip presentational parts |
| Mostly presentational component  | 40-60%              | Only test meaningful interactions         |
| Pure presentational, no logic    | 0%                  | No tests needed, would be trivial         |

### Step 4.4: Keep Test Files Clean

**IMPORTANT:** Do NOT add coverage note comments to test files. Test files should contain only tests, mocks, and necessary setup code.

```typescript
// DON'T DO THIS
/**
 * Coverage Note: This test file achieves ~65% coverage...
 * Uncovered code includes: ...
 */
```

The coverage targets in Step 4.3 are guidelines. If coverage is lower because the untested code is trivial, that's fine - no documentation needed.

### Step 4.5: Run All Tests

```bash
pnpm test src/path/to/__tests__/file.test.tsx
```

---

## Phase 5: Final Checklist

### Test Quality Checklist

- [ ] **Critical analysis performed** - Each test has a clear purpose (what bug would it catch?)
- [ ] Tests follow BDD structure (GIVEN/WHEN/THEN in UPPERCASE)
- [ ] **it.each used** where appropriate for similar tests
- [ ] All selectors use data-test IDs (no translation keys)
- [ ] data-test constants are exported from the component
- [ ] Tests import data-test constants from the component
- [ ] Existing mocks/factories are reused
- [ ] Shared mocks are extracted to `src/__mocks__/` if used in multiple files
- [ ] **Coverage is appropriate** (80% target, but lower is OK if justified)
- [ ] **No trivial tests** - Every test verifies meaningful behavior
- [ ] **Snapshot tests considered** - Added where they provide value (not forced)
- [ ] Tests pass: `pnpm test <test-file>`
- [ ] Linting passes: `pnpm lint <test-file>`

### Coverage Decision Guide

| New Code Type                       | Recommended Action           | Expected Coverage |
| ----------------------------------- | ---------------------------- | ----------------- |
| Complex logic with branches         | Full test coverage           | 80-100%           |
| Form handling + validation          | Test validation + submission | 70-90%            |
| Component with some conditionals    | Test the conditionals only   | 60-80%            |
| Mostly presentational + minor logic | Test only the logic          | 40-60%            |
| Pure presentational, no logic       | **Skip tests entirely**      | 0%                |
| Configuration / constants           | **Skip tests entirely**      | 0%                |

### Snapshot Tests (When Appropriate)

Use snapshot tests **where they add value**, but don't force them.

**Good candidates for snapshots:**

- Complex UI structures that should remain stable
- Components with multiple visual states (loading, error, success)
- Tables or lists with specific formatting
- Components where visual regression would be a bug

**NOT good for snapshots:**

- Simple components with 1-2 elements
- Components that change frequently (snapshots become noisy)
- Dynamic content (timestamps, IDs, random values)
- Components where the structure is obvious from the code

**Snapshot test pattern:**

```typescript
describe('GIVEN the component renders different states', () => {
  describe('WHEN in default state', () => {
    it('THEN should match snapshot', () => {
      const { container } = render(<Component />)

      expect(container).toMatchSnapshot()
    })
  })

  describe('WHEN in error state', () => {
    it('THEN should match snapshot', () => {
      const { container } = render(<Component error="Something failed" />)

      expect(container).toMatchSnapshot()
    })
  })
})
```

**Important:** If a component has dynamic content (dates, IDs), either:

- Mock the dynamic values before snapshot
- Skip snapshot for that component
- Use inline snapshots with specific assertions instead

### What NOT to Test (Even If It Reduces Coverage)

- Translation key values (dynamic and can change)
- Pure UI styling (colors, fonts, spacing)
- Third-party library internals
- Simple prop pass-through
- Components that only re-export other components
- Loading skeletons / spinners (pure presentational)
- Simple conditional rendering with no business logic
- Basic JSX structure (e.g., "component renders a div")

---

## Common Patterns

### Testing Loading States

```typescript
describe('GIVEN the component is loading', () => {
  describe('WHEN data is being fetched', () => {
    it('THEN should display loading skeleton', () => {
      render(<Component isLoading={true} />)

      expect(screen.getByTestId(COMPONENT_LOADING_SKELETON_TEST_ID)).toBeInTheDocument()
    })

    it('THEN should not display content', () => {
      render(<Component isLoading={true} />)

      expect(screen.queryByTestId(COMPONENT_CONTENT_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
```

### Testing Error States

```typescript
describe('GIVEN an error occurred', () => {
  describe('WHEN the error is displayed', () => {
    it('THEN should show error message', () => {
      render(<Component error="Something went wrong" />)

      expect(screen.getByTestId(COMPONENT_ERROR_TEST_ID)).toBeInTheDocument()
    })
  })
})
```

### Testing Form Submissions

```typescript
describe('GIVEN the form is filled', () => {
  describe('WHEN user submits the form', () => {
    it('THEN should call the submit handler with form values', async () => {
      const onSubmit = jest.fn()
      const user = userEvent.setup()
      render(<FormComponent onSubmit={onSubmit} />)

      const nameInput = screen.getByTestId(FORM_NAME_INPUT_TEST_ID).querySelector('input')
      await user.type(nameInput!, 'Test Name')

      const submitButton = screen.getByTestId(FORM_SUBMIT_BUTTON_TEST_ID)
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Test Name' })
        )
      })
    })
  })
})
```

### Testing Conditional Rendering

```typescript
describe('GIVEN the feature flag is enabled', () => {
  describe('WHEN component renders', () => {
    it('THEN should display the new feature', () => {
      render(<Component featureEnabled={true} />)

      expect(screen.getByTestId(COMPONENT_NEW_FEATURE_TEST_ID)).toBeInTheDocument()
    })
  })
})

describe('GIVEN the feature flag is disabled', () => {
  describe('WHEN component renders', () => {
    it('THEN should not display the new feature', () => {
      render(<Component featureEnabled={false} />)

      expect(screen.queryByTestId(COMPONENT_NEW_FEATURE_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
```

### Testing with Timezone (for date components)

```typescript
import { Settings } from 'luxon'

describe('ComponentWithDates', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  // ... tests
})
```

---

## Usage

Invoke this skill with:

```
/make-tests #<PR-number>
```

Example:

```
/make-tests #123
```

The skill will analyze PR #123, identify files needing tests, and create comprehensive tests following the BDD approach and project conventions.
