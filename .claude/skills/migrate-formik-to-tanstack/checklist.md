# Migration Checklist: {{formName}}

## Phase 1: Pre-Migration Analysis

### 1.1 Form Location
- [ ] Form file location: `{{formFilePath}}`
- [ ] Validation schema location: `{{validationSchemaPath}}`
- [ ] Test file location: `{{testFilePath}}`
- [ ] Form complexity: [ ] Simple | [ ] Complex (has sub-components)

### 1.2 Form Fields Identified
| Field Name | Type | Current Validation | Notes |
|------------|------|-------------------|-------|
| | | | |

### 1.3 Validation Analysis (CRITICAL)

#### Validation Source
- [ ] Yup validationSchema: `{{yupSchemaPath}}`
- [ ] Inline validate function: line ____
- [ ] Field-level validations: lines ____
- [ ] No explicit validation found

#### Field Validations Mapping
| Field | Yup Validation | Zod Equivalent | Custom Error Message |
|-------|---------------|----------------|---------------------|
| | | | |
| | | | |
| | | | |

#### Cross-Field Validations
| Fields Involved | Yup Logic (.when/.test) | Zod .refine() Implementation |
|-----------------|------------------------|------------------------------|
| | | |

#### Conditional Validations
| Condition | Affected Fields | Zod Implementation |
|-----------|-----------------|-------------------|
| | | |

#### Async Validations
| Field | Current Implementation | TanStack Approach |
|-------|----------------------|-------------------|
| | | |

#### Submit Button Logic
- Current disabled condition: `{{currentDisabledLogic}}`
- External loading states to preserve: ____

#### Validation Timing
- [ ] validateOnMount: ____
- [ ] validateOnChange: ____
- [ ] validateOnBlur: ____

### 1.4 Sub-Components Identified (Complex Forms Only)
| Component | File Path | Fields Managed |
|-----------|-----------|----------------|
| | | |

---

## Phase 2: Migration Tasks

### 2.1 Create Validation Schema
- [ ] Create directory: `{{formDirectory}}`
- [ ] Create `validationSchema.ts`
- [ ] Implement ALL field validations from mapping table
- [ ] Implement cross-field validations with `.refine()`
- [ ] Implement conditional validations with `.refine()`
- [ ] Preserve all custom error messages
- [ ] Export type
- [ ] (Complex) Export `emptyDefaultValues` for typing

### 2.2 Create Mappers (Complex Forms Only)
- [ ] Create `mappers.ts`
- [ ] Define `mapFromApiToForm` function
- [ ] Define `mapFromFormToApi` function

### 2.3 Update Imports
- [ ] Remove `useFormik` from formik
- [ ] Remove `* as Yup from 'yup'` if present
- [ ] Add `revalidateLogic, useStore` from @tanstack/react-form
- [ ] Add `useAppForm` from ~/hooks/forms/useAppform
- [ ] Import validation schema
- [ ] Remove unused Formik imports
- [ ] (Complex) Add `withForm` import for sub-components

### 2.4 Replace Form Hook
- [ ] Replace `useFormik` with `useAppForm`
- [ ] Update `initialValues` to `defaultValues`
- [ ] Add `validationLogic: revalidateLogic()`
- [ ] Add `validators: { onDynamic: schema }`
- [ ] Update `onSubmit` to use `{ value, formApi }` parameter
- [ ] (Complex) Use mappers for default values
- [ ] (Complex) Add `onSubmitInvalid` for error scrolling

### 2.5 Update Form State Access
- [ ] Add `useStore` for values accessed outside fields
- [ ] Update `formikProps.values.x` to subscribed values

### 2.6 Update Form Structure
- [ ] Add `<form>` wrapper with `onSubmit`
- [ ] Create `handleSubmit` function

### 2.7 Update Fields
- [ ] Field 1: ____________________
- [ ] Field 2: ____________________
- [ ] Field 3: ____________________
(Add more as needed)

### 2.8 Update Submit Button
- [ ] Wrap in `<form.AppForm>`
- [ ] Replace Button with `<form.SubmitButton>`
- [ ] Remove manual disabled logic (handled by SubmitButton)
- [ ] Keep only external loading states in disabled prop

### 2.9 Update setFieldValue Calls
- [ ] Location 1: ____________________
- [ ] Location 2: ____________________
(Add more as needed)

### 2.10 Migrate Sub-Components (Complex Forms Only)
- [ ] Sub-component 1: ____________________
  - [ ] Import `withForm` from `~/hooks/forms/useAppform`
  - [ ] Define props interface
  - [ ] Create component using `withForm` HOC
  - [ ] Update field components to use `form.AppField`
- [ ] Sub-component 2: ____________________
  - [ ] (same steps)
(Add more as needed)

### 2.11 Error Handling (Complex Forms Only)
- [ ] Add `formApi.setErrorMap` for server-side errors
- [ ] Map API error codes to field paths
- [ ] Add toast notifications for generic errors

---

## Phase 3: Verification

### 3.1 Validation Verification (CRITICAL)
Go through your Validation Mapping Table and verify each:

- [ ] All required field validations work
- [ ] All format validations work (email, URL, regex, etc.)
- [ ] All range validations work (min, max, positive, etc.)
- [ ] All cross-field validations work
- [ ] All conditional validations work
- [ ] All custom error messages display correctly
- [ ] Validation timing matches original behavior

### 3.2 Code Quality
- [ ] `pnpm prettier --write {{formFilePath}}`
- [ ] `pnpm eslint {{formFilePath}} {{validationSchemaPath}}`
- [ ] `pnpm tsc --noEmit`

### 3.3 Tests
- [ ] Create/update test file
- [ ] Add tests for each validation case
- [ ] Run tests: `pnpm test {{testFilePath}}`
- [ ] Update snapshots if needed

### 3.4 Manual Testing
- [ ] Create mode works
- [ ] Edit mode loads data
- [ ] All validations work as expected
- [ ] Submit works
- [ ] Cancel/close works
- [ ] Error handling works
- [ ] (Complex) Sub-components receive form correctly
- [ ] (Complex) Server errors display on correct fields
- [ ] (Complex) Scroll to error works on invalid submit

---

## Notes
<!-- Add any migration-specific notes here -->

## Validation Issues Found During Testing
<!-- Document any validation discrepancies here -->
| Issue | Expected Behavior | Actual Behavior | Resolution |
|-------|------------------|-----------------|------------|
| | | | |
