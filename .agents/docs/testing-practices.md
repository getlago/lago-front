## Testing Best Practices

### Using `data-test` Attributes with Constants

Any `data-test` value a test references must be an exported `*_TEST_ID` constant, **and** that constant's value must be a semantic kebab-case string. Those are two separate requirements and both are mandatory: meeting one does not excuse the other.

1. **The indirection** - the string lives in an exported constant, applied in the component and imported in the test. Never an inline literal on either side.
2. **The value itself** - a hand-written kebab-case string like `'default-badge'`. Never a translation key from `translations/base.json` (`text_1744...`), never translated copy, never a `translate()` call.

`export const DEFAULT_BADGE_TEST_ID = 'text_17440321235444hcxi31f8j6'` satisfies half 1 and still breaks the rule.

An element rendering translated copy is not exempt from either half: it gets its own `data-test` carrying its own constant. A translation key is not a test id, and a test never queries by one.

This keeps tests green when copy changes but the logic under test does not.

**Pattern to Follow**:

1. **Export test ID constants from the component file**:
   - Define constants with the naming pattern: `{COMPONENT_NAME}_TEST_ID` or `{ELEMENT_DESCRIPTION}_TEST_ID`
   - Use kebab-case for the constant value (e.g., `'default-badge'`, `'overdue-invoices-alert'`)

2. **Use the constant in the component**:
   - Apply the constant to the `data-test` attribute: `data-test={CONSTANT_NAME}`

3. **Import and use the constant in tests**:
   - Import the constant from the component file
   - Use it with `getByTestId()` or `queryByTestId()` from Testing Library

4. **Never derive the test id from i18n** - not the translation key, not the translated string. The constant's value is written by hand and owes nothing to `translations/base.json`

**Example**:

```tsx
// ❌ Bad - Hardcoded string in component
export const PaymentMethodDetailsCell = ({ item }: Props): JSX.Element => {
  return (
    <Chip data-test="default-badge" label="Default" />
  )
}

// ❌ Bad - Hardcoded string in test
import { PaymentMethodDetailsCell } from '../PaymentMethodDetailsCell'

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  const badge = screen.getByTestId('default-badge') // Hardcoded string
  expect(badge).toBeInTheDocument()
})

// ❌ Bad - Translation key used as the test id
export const PaymentMethodDetailsCell = ({ item }: Props): JSX.Element => {
  return <Chip data-test="text_17440321235444hcxi31f8j6" label={translate('text_17440321235444hcxi31f8j6')} />
}

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  const badge = screen.getByTestId('text_17440321235444hcxi31f8j6')
  expect(badge).toBeInTheDocument()
})

// ❌ Bad - Exported const, but its value is a translation key. Still wrong.
export const DEFAULT_BADGE_TEST_ID = 'text_17440321235444hcxi31f8j6'

// ❌ Bad - Test id computed from i18n
<Chip data-test={translate('text_17440321235444hcxi31f8j6')} label="Default" />

// ✅ Good - Exported constant; the translated copy has nothing to do with the test id
export const DEFAULT_BADGE_TEST_ID = 'default-badge'

export const PaymentMethodDetailsCell = ({ item }: Props): JSX.Element => {
  return (
    <Chip data-test={DEFAULT_BADGE_TEST_ID} label={translate('text_17440321235444hcxi31f8j6')} />
  )
}

// ✅ Good - Constant imported and used in test
import {
  DEFAULT_BADGE_TEST_ID,
  PaymentMethodDetailsCell,
} from '../PaymentMethodDetailsCell'

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  const badge = screen.getByTestId(DEFAULT_BADGE_TEST_ID)
  expect(badge).toBeInTheDocument()
})
```

**Why**:

- **Hardcoded strings**: Prone to typos, difficult to refactor, no type safety
- **Translation keys**: Couple the test to i18n. Reword the copy or re-mint the key and the test breaks while the logic it covers never moved. `pnpm translations:add` produces opaque ids too, so `getByTestId('text_1744...')` says nothing about what is being queried.
- There is no "strictly necessary" exception. An existing test id that is a translation key is a reason to replace it, not a precedent to copy.

**Benefits**:

- Type safety, easier refactoring, consistency, and semantic clarity

**Note**: The project is configured to use `data-test` as the test ID attribute (configured in `src/test-utils.tsx`), so always use `data-test` instead of `data-testid`.

### Real-World Example: InvoiceDetailsTable

Here's a complete example from the codebase showing proper use of test ID constants:

**Component file** (`src/components/invoices/details/InvoiceDetailsTable.tsx`):

```tsx
// Test ID constants exported after imports
export const INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID = 'invoice-details-subscription-table'
export const INVOICE_DETAILS_TABLE_ADD_FEE_BUTTON_TEST_ID = 'invoice-details-add-fee-button'

export const InvoiceDetailsTable = memo(({ invoice, ... }) => {
  return (
    <table
      key={`subscription-${subscriptionId}`}
      data-test={INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID}
    >
      <tbody>
        {/* ... */}
        {showAddNewFeeButton && (
          <tr>
            <td>
              <Button
                data-test={INVOICE_DETAILS_TABLE_ADD_FEE_BUTTON_TEST_ID}
                onClick={addNewFeeOnClick}
              >
                Add fee
              </Button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
})
```

**Test file** (`src/components/invoices/details/__tests__/InvoiceDetailsTable.integration.test.tsx`):

```tsx
import {
  INVOICE_DETAILS_TABLE_ADD_FEE_BUTTON_TEST_ID,
  INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID,
  InvoiceDetailsTable,
} from '~/components/invoices/details/InvoiceDetailsTable'

describe('InvoiceDetailsTable', () => {
  it('should render subscription table with correct data-test attribute', () => {
    render(<InvoiceDetailsTable invoice={mockInvoice} />)

    // Using the constant instead of hardcoded string
    const subscriptionTable = screen.getByTestId(INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID)
    expect(subscriptionTable).toBeInTheDocument()
  })

  it('should render add fee button when conditions are met', () => {
    render(<InvoiceDetailsTable invoice={mockDraftInvoice} />)

    const addFeeButton = screen.getByTestId(INVOICE_DETAILS_TABLE_ADD_FEE_BUTTON_TEST_ID)
    expect(addFeeButton).toBeInTheDocument()
  })

  it('should not render add fee button when conditions are not met', () => {
    render(<InvoiceDetailsTable invoice={mockFinalizedInvoice} />)

    const addFeeButton = screen.queryByTestId(INVOICE_DETAILS_TABLE_ADD_FEE_BUTTON_TEST_ID)
    expect(addFeeButton).not.toBeInTheDocument()
  })
})
```

**Benefits demonstrated**:

- Constants are defined once in the component file
- Tests import and use the same constants
- Refactoring the test ID only requires changing it in one place
- TypeScript provides autocomplete and catches typos
- No coupling with translation keys or hardcoded strings

### Fixture Defaults Must Not Disable the Branch Under Test

A shared factory default that encodes the "off" state of the very branch a test covers makes
the test pass for the wrong reason. `buildRateCardForRateDrawer` defaulted `activeRate: null`,
so the "edit an active rate" test never reached the append boundary that made every save fail,
and it stayed green through two review cycles.

- A test that names a condition sets that condition explicitly. Never inherit it from a factory
  default: a null relation, a false flag, an empty collection.
- After writing a test for a conditional, reread it and ask: would this still pass if the
  condition were inverted in the source? If yes, the test does not cover the branch.

```typescript
// ❌ Bad - the fixture default is what makes the assertion pass
const rateCard = buildRateCardForRateDrawer() // activeRate: null
render(<RateDrawer rateCard={rateCard} />)

// ✅ Good - the branch under test is set explicitly
const rateCard = buildRateCardForRateDrawer({ activeRate: buildRate() })
render(<RateDrawer rateCard={rateCard} />)
```

### Use Component Props Types in Tests

**ALWAYS** import and use the component's exported props type when writing tests. Never create a separate type definition that duplicates the component's props structure.

**Why this matters**:

- Ensures tests stay in sync with component prop changes
- TypeScript will catch breaking changes immediately
- Reduces duplication and maintenance burden
- Provides better IDE support and autocomplete

### Timezone Handling in Tests

When testing components that display dates/times, **always enforce UTC timezone** to ensure consistent behavior across different environments (local development vs CI).

**Why this matters**:

- Local development machines may be in different timezones (e.g., UTC-3)
- CI servers typically run in UTC
- A date like `'2024-01-20T00:00:00Z'` (midnight UTC) will display as Jan 19 in timezones west of UTC

**Pattern to follow**:

```tsx
import { Settings } from 'luxon'

const originalDefaultZone = Settings.defaultZone

describe('MyComponent', () => {
  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  // ... your tests
})
```

**Key points**:

- Store the original timezone before tests run
- Set `Settings.defaultZone = 'UTC'` in `beforeAll` or `beforeEach`
- Always restore the original timezone in `afterAll` or `afterEach` to avoid affecting other tests
- This applies to any test involving date formatting, especially snapshot tests

### Premium vs non-premium in Cypress e2e

CI enables premium features by booting the API with the `LAGO_LICENSE` **secret**
(`.github/workflows/cypress.yml` → `ci/docker-compose.ci.yml`). GitHub does **not**
expose repo secrets to `pull_request` runs originating from **forks**, so
community/fork PRs run against a **non-premium** org (`currentUser.premium = false`).

A spec that unconditionally clicks a premium-gated control (graduated-percentage
charge model, percentage per-transaction min/max, spending minimum, minimum
commitment, progressive billing, subscription plan-override editing, …) gets the
`PremiumWarningDialog` instead of the expected input, so the assertion times out
on forks while passing internally — which is exactly what blocked contributions
in LAGO-1555.

**Rule: any step touching a premium-gated control must branch on premium.**
`cy.login()` / `cy.signup()` capture the org's premium state from the
`getCurrentUserInfos` response; read it via the helpers in `cypress/support/e2e.ts`:

```ts
// Exercise the premium-only control only when licensed.
cy.whenPremium(() => {
  cy.get('[data-test="graduated_percentage"]').click({ force: true })
  // ... fill the tier table, save, assert ...
})

// Otherwise assert the gate so coverage is meaningful non-premium too.
cy.whenNotPremium(() => {
  cy.get(`[data-test="${DIALOG_TITLE_TEST_ID}"]`).should('exist') // PremiumWarningDialog
})

// Or read the boolean directly.
cy.getIsPremium().then((isPremium) => { /* ... */ })
```

Keep assertions that are true regardless of license (URL, plan name, submit)
**outside** the branches. See `t40-create-plan.cy.ts` for a worked example.
