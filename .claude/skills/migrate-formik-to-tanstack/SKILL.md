---
name: migrate-formik-to-tanstack
description: Migrate a React form from Formik to TanStack Form following project conventions. Use this skill when the user wants to migrate a form component from Formik to TanStack Form.
user-invocable: true
argument-hint: '<path-to-form>'
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, AskUserQuestion
---

# Formik to TanStack Form Migration Skill

**Target form to migrate:** `$ARGUMENTS`

> **Important:** If no path was provided above (empty or missing), use the AskUserQuestion tool to ask the user for the path to the Formik form they want to migrate before proceeding.

This skill guides the migration of React form components from Formik to TanStack Form, following the established patterns in this codebase.

## Prerequisites

Before starting, gather context by reading these reference files:

### Simple Forms

1. **Hook Pattern**: `src/hooks/forms/useAppform.ts` - The custom `useAppForm` hook
2. **Validation Schema Example**: `src/pages/auth/signUpForm/validationSchema.ts`
3. **Form Component Example**: `src/pages/settings/roles/roleCreateEdit/RoleCreateEdit.tsx`

### Complex Forms (with sub-components)

4. **Complex Form Example**: `src/pages/createCustomers/CreateCustomer.tsx` - Main form with sub-components
5. **Complex Validation Schema**: `src/pages/createCustomers/formInitialization/validationSchema.ts` - Nested Zod schemas with refinements
6. **Sub-component with withForm**: `src/pages/createCustomers/customerInformation/CustomerInformation.tsx` - HOC pattern

## Migration Steps

### Phase 1: Pre-Migration Analysis

#### Step 1.1: Analyze the Current Form Structure

1. Read the target form file completely
2. Identify:
   - Form fields and their types
   - Current Formik configuration (`useFormik` or `<Formik>`)
   - Submit handler logic
   - Field components used (`TextInputField`, `Checkbox`, etc.)
   - Any `formikProps` usage
   - Sub-components that receive `formikProps`

#### Step 1.2: Deep Validation Analysis (CRITICAL)

**This step is critical. Document ALL validations before proceeding.**

1. **Locate validation sources** - Search for:

   ```typescript
   // Yup schema (most common)
   validationSchema: yupSchema

   // Inline validate function
   validate: (values) => { ... }

   // Field-level validation
   <Field validate={(value) => ...} />

   // validateOnBlur, validateOnChange settings
   ```

2. **Create Validation Mapping Table**:

   | Field Name | Current Validation (Formik/Yup)        | Zod Equivalent                     | Notes |
   | ---------- | -------------------------------------- | ---------------------------------- | ----- |
   | name       | `yup.string().required()`              | `z.string().min(1)`                |       |
   | email      | `yup.string().email().required()`      | `z.string().email().min(1)`        |       |
   | age        | `yup.number().min(18).max(100)`        | `z.number().min(18).max(100)`      |       |
   | password   | `yup.string().min(8).matches(/[A-Z]/)` | `z.string().min(8).regex(/[A-Z]/)` |       |

3. **Identify Cross-Field Validations**:

   ```typescript
   // Example: password confirmation
   .test('passwords-match', 'Passwords must match', function(value) {
     return this.parent.password === value
   })

   // Maps to Zod .refine():
   .refine((data) => data.password === data.confirmPassword, {
     message: 'Passwords must match',
     path: ['confirmPassword'],
   })
   ```

4. **Document Conditional Validations**:

   ```typescript
   // Example: required only if another field has value
   .when('hasAddress', {
     is: true,
     then: yup.string().required(),
   })

   // Maps to Zod .refine():
   .refine((data) => !data.hasAddress || data.address, {
     message: 'Address is required',
     path: ['address'],
   })
   ```

5. **Check for Custom Validation Messages**:
   - Note all custom error messages
   - These must be preserved in Zod schema

6. **Identify Async Validations** (if any):
   ```typescript
   // Formik async validation
   .test('unique-email', 'Email already exists', async (value) => {
     const exists = await checkEmailExists(value)
     return !exists
   })
   ```
   Note: Async validations require special handling in TanStack Form.

#### Step 1.3: Create Validation Migration Plan

Before writing any code, create a plan document:

```markdown
## Validation Migration Plan: [FormName]

### Validation Sources Found

- [ ] Yup validationSchema: `path/to/schema.ts`
- [ ] Inline validate function: line XX
- [ ] Field-level validations: lines XX, YY
- [ ] No explicit validation (form relies on required HTML attributes)

### Field Validations

| Field | Yup Validation | Zod Equivalent | Custom Message |
| ----- | -------------- | -------------- | -------------- |
| ...   | ...            | ...            | ...            |

### Cross-Field Validations

| Fields Involved | Yup Logic | Zod .refine() Logic |
| --------------- | --------- | ------------------- |
| ...             | ...       | ...                 |

### Conditional Validations

| Condition | Affected Fields | Zod Implementation |
| --------- | --------------- | ------------------ |
| ...       | ...             | ...                |

### Async Validations

| Field | Current Implementation | TanStack Approach |
| ----- | ---------------------- | ----------------- |
| ...   | ...                    | ...               |

### Submit Button Disabled Logic

Current: `disabled={!formikProps.isValid || !formikProps.dirty || loading}`
TanStack: `form.SubmitButton` handles isValid + dirty automatically

### Validation Timing

- validateOnMount: [true/false]
- validateOnChange: [true/false]
- validateOnBlur: [true/false]
```

---

### Phase 2: Implementation

#### Step 2.1: Create Validation Schema

Create a new file: `src/pages/<path>/<formName>/validationSchema.ts`

**Use your Validation Migration Plan from Phase 1 to implement each validation.**

```typescript
import { z } from 'zod'

// Import any enums from generated GraphQL if needed
import { SomeEnum } from '~/generated/graphql'

// Define field schemas
const fieldSchema = z.object({
  id: z.nativeEnum(SomeEnum),
  // ... other fields
})

// Main form schema - implement ALL validations from the plan
export const <formName>ValidationSchema = z.object({
  // Required string (was: yup.string().required())
  fieldName: z.string().min(1, 'Field is required'),

  // Optional string (was: yup.string())
  optionalField: z.string().optional(),

  // Email validation (was: yup.string().email().required())
  email: z.string().email('Invalid email').min(1, 'Email is required'),

  // Number with range (was: yup.number().min(0).max(100))
  percentage: z.number().min(0).max(100),

  // Enum (was: yup.string().oneOf([...]))
  status: z.nativeEnum(SomeEnum),

  // Array (was: yup.array().of(...))
  items: z.array(fieldSchema),
})
// Add cross-field validations from the plan
.refine(
  (data) => /* validation logic from plan */,
  { message: 'Error message', path: ['fieldName'] }
)

export type <FormName>Values = z.infer<typeof <formName>ValidationSchema>
```

**Yup to Zod Quick Reference:**

| Yup                              | Zod                             |
| -------------------------------- | ------------------------------- |
| `yup.string().required()`        | `z.string().min(1, 'Required')` |
| `yup.string().email()`           | `z.string().email()`            |
| `yup.string().min(5)`            | `z.string().min(5)`             |
| `yup.string().max(100)`          | `z.string().max(100)`           |
| `yup.string().matches(/regex/)`  | `z.string().regex(/regex/)`     |
| `yup.string().oneOf(['a', 'b'])` | `z.enum(['a', 'b'])`            |
| `yup.number().required()`        | `z.number()`                    |
| `yup.number().min(0)`            | `z.number().min(0)`             |
| `yup.number().max(100)`          | `z.number().max(100)`           |
| `yup.number().positive()`        | `z.number().positive()`         |
| `yup.number().integer()`         | `z.number().int()`              |
| `yup.boolean()`                  | `z.boolean()`                   |
| `yup.array().of(schema)`         | `z.array(schema)`               |
| `yup.array().min(1)`             | `z.array(schema).min(1)`        |
| `yup.object().shape({})`         | `z.object({})`                  |
| `.nullable()`                    | `.nullable()`                   |
| `.optional()`                    | `.optional()`                   |
| `.default(value)`                | `.default(value)`               |
| `.when('field', ...)`            | `.refine((data) => ...)`        |
| `.test('name', msg, fn)`         | `.refine(fn, { message: msg })` |

#### Step 2.2: Update Imports

Replace Formik imports:

```diff
- import { useFormik } from 'formik'
- import * as Yup from 'yup'  // Remove if present
+ import { revalidateLogic, useStore } from '@tanstack/react-form'
+ import { useAppForm } from '~/hooks/forms/useAppform'
```

Add validation schema import:

```typescript
import { <formName>ValidationSchema } from './<formName>/validationSchema'
```

Remove unused Formik-related imports like `TextInputField` with `formikProps`.

#### Step 2.3: Replace useFormik with useAppForm

**Before (Formik):**

```typescript
const formikProps = useFormik<FormValues>({
  initialValues: { name: '', ... },
  validateOnMount: true,
  enableReinitialize: true,
  validationSchema: someSchema,
  onSubmit: async (values) => { ... }
})
```

**After (TanStack Form):**

```typescript
const form = useAppForm({
  defaultValues: {
    name: existingData?.name || '',
    // ... other fields
  },
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: <formName>ValidationSchema,
  },
  onSubmit: async ({ value }) => {
    const { field1, field2, ...rest } = value
    // ... submit logic
  },
})
```

#### Step 2.4: Subscribe to Form State (if needed)

For accessing form values outside of field components:

```typescript
const someField = useStore(form.store, (state) => state.values.someField)
```

#### Step 2.5: Update Field Components

**Text Input Field:**

```diff
- <TextInputField
-   name="fieldName"
-   label={translate('...')}
-   formikProps={formikProps}
- />
+ <form.AppField name="fieldName">
+   {(field) => (
+     <field.TextInputField
+       label={translate('...')}
+     />
+   )}
+ </form.AppField>
```

**Other field types follow the same pattern:**

- `field.ComboBoxField`
- `field.TextInputField`
- `field.CheckboxField`
- etc.

#### Step 2.6: Update Form Submission

**Wrap content in a form element:**

```typescript
const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault()
  form.handleSubmit()
}

return (
  <form onSubmit={handleSubmit}>
    {/* form content */}
  </form>
)
```

**Replace submit button:**

```diff
- <Button
-   onClick={formikProps.submitForm}
-   disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
- >
+ <form.AppForm>
+   <form.SubmitButton disabled={externalLoadingState}>
      {submitButtonText}
+   </form.SubmitButton>
+ </form.AppForm>
```

Note: `form.SubmitButton` handles `canSubmit` (validity + dirty state) automatically.

#### Step 2.7: Update Field Value Changes

**Before:**

```typescript
formikProps.setFieldValue('fieldName', newValue)
```

**After:**

```typescript
form.setFieldValue('fieldName', newValue)
```

#### Step 2.8: Update Value Access

**Before:**

```typescript
formikProps.values.fieldName
```

**After (in field render):**

```typescript
field.state.value
```

**After (outside field, using useStore):**

```typescript
const fieldValue = useStore(form.store, (state) => state.values.fieldName)
```

---

### Phase 3: Verification

#### Step 3.1: Validate Migration Against Plan

Go back to your Validation Migration Plan and verify:

- [ ] All field validations are implemented in Zod schema
- [ ] All cross-field validations use `.refine()`
- [ ] All conditional validations are handled
- [ ] All custom error messages are preserved
- [ ] Validation timing matches original (onChange, onBlur, onMount)

#### Step 3.2: Test Validation Behavior

Manually test each validation case:

1. **Required fields**: Leave empty, verify error appears
2. **Format validations**: Enter invalid email/URL/etc, verify error
3. **Range validations**: Enter out-of-range values, verify error
4. **Cross-field validations**: Test dependent field combinations
5. **Conditional validations**: Toggle conditions, verify validation changes

---

## Advanced Patterns (Complex Forms)

For complex forms with multiple sections or sub-components, use these additional patterns.

### Reference: CreateCustomer Form

Study these files for complex form patterns:

- `src/pages/createCustomers/CreateCustomer.tsx`
- `src/pages/createCustomers/formInitialization/validationSchema.ts`
- `src/pages/createCustomers/customerInformation/CustomerInformation.tsx`

### Pattern 1: withForm HOC for Sub-Components

When splitting a form into multiple sub-components, use the `withForm` HOC:

```typescript
import { withForm } from '~/hooks/forms/useAppform'
import { emptyCreateCustomerDefaultValues } from './formInitialization/validationSchema'

// Define props interface
interface CustomerInformationProps {
  isEdition: boolean
  customer?: CustomerDetails
}

// Default props for the HOC
const defaultProps: CustomerInformationProps = {
  isEdition: false,
}

// Create the component using withForm
const CustomerInformation = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  render: function Render({ form, isEdition, customer }) {
    return (
      <div>
        <form.AppField name="name">
          {(field) => (
            <field.TextInputField label="Name" />
          )}
        </form.AppField>
        {/* More fields... */}
      </div>
    )
  },
})

export default CustomerInformation
```

**Usage in parent form:**

```typescript
<CustomerInformation form={form} isEdition={isEdition} customer={customer} />
```

### Pattern 2: Complex Zod Schemas with Refinements

For complex validation with cross-field dependencies:

```typescript
import { z } from 'zod'

// Nested object schema
const addressSchema = z.object({
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  zipcode: z.string().optional(),
  country: z.string().optional(),
})

// Main schema with refinements
export const customerValidationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    externalId: z.string().min(1, 'External ID is required'),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    billingConfiguration: z.object({
      documentLocale: z.string().optional(),
    }),
    shippingAddress: addressSchema,
    // ... more fields
  })
  .refine(
    (data) => {
      // Cross-field validation
      if (data.someCondition) {
        return data.relatedField !== undefined
      }
      return true
    },
    {
      message: 'Related field is required when condition is true',
      path: ['relatedField'],
    },
  )

// Export empty default values for typing
export const emptyDefaultValues: z.infer<typeof customerValidationSchema> = {
  name: '',
  externalId: '',
  currency: undefined,
  // ... all fields with default values
}
```

### Pattern 3: Mappers for API ↔ Form Data

Separate concerns with mapper functions:

```typescript
// mappers.ts
import type { CustomerFragment } from '~/generated/graphql'

import type { CustomerFormValues } from './validationSchema'

export const mapFromApiToForm = (customer: CustomerFragment): CustomerFormValues => ({
  name: customer.name || '',
  externalId: customer.externalId || '',
  currency: customer.currency || undefined,
  billingConfiguration: {
    documentLocale: customer.billingConfiguration?.documentLocale || undefined,
  },
  // ... transform nested objects
})

export const mapFromFormToApi = (values: CustomerFormValues): CreateCustomerInput => ({
  name: values.name,
  externalId: values.externalId,
  currency: values.currency || null,
  billingConfiguration: {
    documentLocale: values.billingConfiguration.documentLocale || null,
  },
  // ... transform back to API format
})
```

**Usage:**

```typescript
const form = useAppForm({
  defaultValues: customer ? mapFromApiToForm(customer) : emptyDefaultValues,
  // ...
  onSubmit: async ({ value }) => {
    const input = mapFromFormToApi(value)
    await createCustomer({ variables: { input } })
  },
})
```

### Pattern 4: Error Handling with setErrorMap

Handle server-side validation errors:

```typescript
const form = useAppForm({
  // ...
  onSubmit: async ({ value, formApi }) => {
    try {
      await createCustomer({ variables: { input: value } })
    } catch (error) {
      if (error instanceof ApolloError) {
        const serverErrors = parseServerErrors(error)

        // Set errors on specific fields
        formApi.setErrorMap({
          onSubmit: {
            fields: {
              externalId: serverErrors.externalId,
              email: serverErrors.email,
            },
          },
        })
      }
    }
  },
})
```

### Pattern 5: Scroll to First Error on Invalid Submit

Use `onSubmitInvalid` to improve UX:

```typescript
const form = useAppForm({
  // ...
  onSubmitInvalid: ({ formApi }) => {
    // Get the first field with an error
    const firstErrorField = Object.keys(formApi.state.fieldMeta).find(
      (key) => formApi.state.fieldMeta[key]?.errors?.length > 0,
    )

    if (firstErrorField) {
      // Scroll to the error field
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
})
```

### Pattern 6: Conditional Field Rendering

Show/hide fields based on other field values:

```typescript
const showBillingFields = useStore(
  form.store,
  (state) => state.values.customerType === 'business'
)

return (
  <>
    <form.AppField name="customerType">
      {(field) => <field.ComboBoxField options={customerTypes} />}
    </form.AppField>

    {showBillingFields && (
      <form.AppField name="vatNumber">
        {(field) => <field.TextInputField label="VAT Number" />}
      </form.AppField>
    )}
  </>
)
```

---

### Phase 4: Test Migration

**CRITICAL: This phase is mandatory. Never skip test migration/creation.**

After completing Phases 1-3 and verifying the form migration works correctly, invoke the `/make-tests` skill with the **local branch name**:

```
/make-tests <local-branch-name>
```

**Example:**

```
/make-tests feature/migrate-customer-form-to-tanstack
```

The `/make-tests` skill will automatically:

- Fetch the diff against `main` branch
- Identify all modified component files
- Add `data-test` attributes to the components
- Create or migrate tests following project conventions

## Checklist

### Phase 1: Pre-Migration Analysis

- [ ] Read target form file completely
- [ ] Identify all form fields and types
- [ ] **Validation Analysis (CRITICAL):**
  - [ ] Locate Yup schema / validate function / field-level validations
  - [ ] Create Validation Mapping Table (Field → Yup → Zod)
  - [ ] Document cross-field validations (`.when()`, `.test()`)
  - [ ] Document conditional validations
  - [ ] Note all custom error messages
  - [ ] Check for async validations
  - [ ] Document submit button disabled logic
  - [ ] Note validation timing (onChange, onBlur, onMount)
- [ ] Create Validation Migration Plan document

### Phase 2: Implementation

- [ ] Create validation schema file with ALL validations from plan
- [ ] Verify Zod schema matches Yup validation behavior
- [ ] Update imports (remove Formik/Yup, add TanStack)
- [ ] Replace `useFormik` with `useAppForm`
- [ ] Add `useStore` for form state subscriptions (if needed)
- [ ] Wrap content in `<form>` element with `onSubmit`
- [ ] Update each field to use `form.AppField` pattern
- [ ] Replace submit button with `form.SubmitButton`
- [ ] Update `setFieldValue` calls

### Phase 2b: Complex Forms (if applicable)

- [ ] Create mappers for API ↔ Form data transformation
- [ ] Update sub-components to use `withForm` HOC
- [ ] Add `.refine()` validations for cross-field dependencies
- [ ] Implement `onSubmitInvalid` for error scrolling
- [ ] Add `formApi.setErrorMap` for server-side errors

### Phase 3: Verification

- [ ] **Validation Verification:**
  - [ ] Test all required field validations
  - [ ] Test all format validations (email, URL, etc.)
  - [ ] Test all range validations (min, max)
  - [ ] Test all cross-field validations
  - [ ] Test all conditional validations
  - [ ] Verify error messages match original
- [ ] Run `pnpm prettier --write <file>`
- [ ] Run `pnpm eslint <file>`
- [ ] Run `pnpm tsc --noEmit`

### Phase 4: Test Migration

- [ ] Invoke `/make-tests <local-branch-name>` skill
- [ ] Follow the make-tests skill workflow to completion

## Common Issues

### Basic Issues

1. **Form not submitting**: Ensure `<form onSubmit={handleSubmit}>` wraps content
2. **Submit button always disabled**: Check `form.SubmitButton` is inside `form.AppForm`
3. **Values not updating**: Use `useStore` to subscribe to values outside field components
4. **TypeScript errors**: Ensure validation schema matches form field types

### Complex Form Issues

5. **Sub-component not receiving form**: Pass `form={form}` prop explicitly to sub-components using `withForm`
6. **Nested validation not working**: Ensure nested Zod schemas are properly composed (not just referenced)
7. **Server errors not displaying**: Use `formApi.setErrorMap` with the correct field paths
8. **Refine validation failing silently**: Check that the `path` option in `.refine()` matches the actual field name
9. **Default values type mismatch**: Export and use `emptyDefaultValues` from validation schema for consistent typing
10. **Form dirty state incorrect with mappers**: Ensure mapper output structure exactly matches `defaultValues` structure

## Usage

Invoke this skill with:

```
/migrate-formik-to-tanstack <path-to-formik-form>
```

Where `<path-to-formik-form>` is the path to the existing Formik form file that needs to be migrated to TanStack Form.

Example:

```
/migrate-formik-to-tanstack src/pages/settings/SomeForm.tsx
```
