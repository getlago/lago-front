---
name: lago-forms
description: 'How to build a NEW form in lago-front — useAppForm + a colocated zod schema, the submit-first validation contract, and the stored value shape of every registered field component. TRIGGER — read BEFORE writing the code whenever the task adds a form, a form section or a single field, or writes a validation schema; whenever the diff mentions useAppForm, form.AppField, form.AppForm, form.SubmitButton, revalidateLogic, validationLogic, onDynamic, validationSchema.ts, zodCustoms, withForm, withFieldGroup, setErrorMap, setFieldMeta or scrollToFirstInputError; and whenever the report is a submit button stuck disabled with no visible error, a schema that never fires, an error showing before the first submit, or a raw "Invalid input" / untranslated message in a field.'
---

# Forms (new TanStack forms)

Every new form is `useAppForm` (`~/hooks/forms/useAppform`) over a zod schema. Formik +
yup is migration debt: never start a new form there, even next to one.

- Converting an existing Formik form → `migrate-formik-to-tanstack` (owns the yup→zod
  mapping and the parity audit).
- The form lives in a drawer or dialog → also read `lago-drawers` / `lago-dialogs`, which
  own the surrounding hook.

Everything below is on top of `.agents/docs/typescript-conventions.md`, which a form hits
constantly: explicit return types, no nested ternaries, and a `renderX()` helper above the
return instead of conditionals nested inside the JSX.

## The skeleton

The schema file carries the schema, the inferred type, the default values and the
form→API mapper (`approveQuote/validationSchema.ts` is the shortest complete example):

```typescript
// src/pages/<feature>/validationSchema.ts
export const featureValidationSchema = z.object({
  name: z.string().min(1, { message: 'text_<key>' }),
  email: zodRequiredEmail,
})

export type FeatureFormValues = z.infer<typeof featureValidationSchema>

export const featureDefaultValues: FeatureFormValues = { name: '', email: '' }

export const buildFeatureInput = (values: FeatureFormValues): FeatureInput => ({ ... })
```

```tsx
const FEATURE_FORM_ID = 'feature-form'

const form = useAppForm({
  defaultValues: existing ? mapFromApi(existing) : featureDefaultValues,
  validationLogic: revalidateLogic(),
  validators: { onDynamic: featureValidationSchema },
  onSubmit: async ({ value }) => {
    await mutate({ variables: { input: buildFeatureInput(value) } })
  },
  onSubmitInvalid({ formApi }) {
    scrollToFirstInputError(FEATURE_FORM_ID, formApi.state.errorMap.onDynamic || {})
  },
})

const handleSubmit = (event: React.FormEvent): void => {
  event.preventDefault()
  form.handleSubmit()
}

return (
  <form id={FEATURE_FORM_ID} onSubmit={handleSubmit}>
    <form.AppField name="name">
      {(field) => <field.TextInputField label={translate('text_<key>')} />}
    </form.AppField>

    <form.AppForm>
      <form.SubmitButton>{translate('text_<key>')}</form.SubmitButton>
    </form.AppForm>
  </form>
)
```

## Non-negotiables

| Rule | Why |
| ---- | --- |
| Always pass `validationLogic: revalidateLogic()` | Omitted, TanStack falls back to `defaultValidationLogic`, which never runs `onDynamic` — the schema is silently skipped and every value passes |
| **Submit-first**: the form is never invalid before the first submit attempt | `revalidateLogic()` is `mode: 'submit'` + `modeAfterSubmission: 'change'`. Submit stays enabled until then, whatever the field type |
| A field component publishes the value; the **schema** decides if it is acceptable | A component that withholds a rejected value leaves the input and the form state disagreeing — the ING-634 bug. Only a value with no representation at all (unparseable date) may be withheld |
| Bare `<form.SubmitButton>` inside `<form.AppForm>` | It subscribes to `canSubmit` + `isSubmitting` and gets the spinner for free. `canSubmit` excludes `isDirty` **by design** — never add a `!isDirty` gate |
| `await` every async call inside `onSubmit` | `isSubmitting` flips back when `onSubmit`'s own promise resolves, so a dropped promise kills the spinner before the mutation settles |
| `useStore(form.store, (s) => …)` for anything read in the render | `form.state.*` is a passive read: no subscription, no re-render. It is fine inside event handlers, which only need a snapshot. Import `useStore` from `@tanstack/react-form` |
| `id` on the `<form>` + `onSubmitInvalid` → `scrollToFirstInputError` | The helper queries `#${formId} input`. Wire it whenever the form can be taller than the viewport |
| Side-effect on a value change → `listeners={{ onChange }}` on `form.AppField` | Not `useStore` + `useEffect`. `useStore` is for reading a value, not reacting to it |
| Set a whole array, never a bracket index on a possibly-undefined one | `form.setFieldValue('rules[0]', x)` on an `undefined` base builds `{0: x}`, not an array |

## Fields: what each component stores

`form.AppField` + the registered `field.*` components only — never a raw input, never a
hand-wired `<Button type="submit">`. **Write the schema against the stored shape below**,
not against the payload the API wants: a mismatch fails silently, leaving submit disabled
with no error and no request (the BIL-410 regression).

| Component | Stored value |
| --------- | ------------ |
| `TextInputField` | `string` — **unless** `beforeChangeFormatter` includes `'int'`, which stores `number \| ''` |
| `AmountInputField` | `string \| number \| undefined` — `'int'` is auto-pushed for 0-decimal currencies (JPY, KRW…), so an amount flips shape with the currency |
| `ComboBoxField` | `string \| undefined` |
| `MultipleComboBoxField` | whole options, `{ value, label, … }[]` — schema `z.array(z.looseObject({ value: z.string() }))`, map to ids in `onSubmit`, seed defaults as options |
| `CurrencyPickerField` | `CurrencyEnum \| undefined` |
| `DatePickerField` | ISO `string \| undefined` |
| `SwitchField`, `CheckboxField` | `boolean` |
| `RadioField` | `string` |
| `RadioGroupField` | `string \| number \| boolean` |
| `ButtonSelectorField` | the option's own value type |

`name` + `code` fields → `NameAndCodeGroup` (`~/components/form/NameAndCodeGroup`), which
auto-derives the code until the user edits it. Loading an edit form → `FormLoadingSkeleton`
(`~/styles/mainObjectsForm`).

No registered component fits → add a `<Input>FieldForTanstack.tsx` next to the design-system
input and register it in `useAppform.ts`, rather than wiring the raw input into the form. The
wrapper reads its field through `useFieldContext<StoredType>()` and its message through
`useFieldError()`, so the stored shape becomes explicit and every consumer inherits the same
error behaviour.

## Schema

- **Reuse before writing**: `src/formValidation/zodCustoms.ts` (`zodRequiredEmail`,
  `zodRequiredUrl`, `zodRequiredPassword`, `zodOptionalUrl`, `zodHost`,
  `zodMultipleEmails`…). Keep the shared validator even when its message differs from the
  one the design asks for — consistent copy across the app wins. A validator that
  generalises beyond this form belongs in `zodCustoms.ts`.
- **Location**: colocated `validationSchema.ts` next to the form. `src/formValidation/`
  is for schemas two or more forms share (`subscriptionFormSchema`, `planFormSchema`,
  `chargeSchema`, `metadataSchema`).
- **Messages are translation keys.** Every issue without an explicit message falls back to
  `DEFAULT_ZOD_ERROR_MESSAGE` (`initializeZod.ts`), so never write `message: ''` — Zod v4
  replaces it with its own "Invalid input", which then renders raw. Wrappers translate the
  key **without variables**: for `{{min}}`-style copy, emit the key and let the component
  translate it through `errorOverride`.
- **Dates**: `addUnsupportedDateIssue(ctx, value, path, floor?)` from `zodCustoms` rejects
  anything below the 1970 floor (`MIN_SUPPORTED_DATE`). It returns whether it added an
  issue, so a following rule can `return` instead of stacking a second message. Skip it
  only where an existing rule already rejects the floor with better copy (must-be-future).
- **`superRefine` must never throw**: guard with `Array.isArray` and optional chains. A
  throw inside validation lands after `isSubmitting = true` and the button spins forever —
  infinite spinner + zero errors + no request means a throwing validator.

## Errors

Field display knobs (`useFieldError`): `silentError` hides the message, `displayErrorText:
false` keeps only the red state, `showOnlyErrors` allowlists messages (`TextInputField`),
and `errorOverride` takes full control — a string replaces the message, `false` suppresses
it (`TextInputField`, `AmountInputField`, `DatePickerField`).

Server and GraphQL errors are set imperatively, in two shapes that are **not**
interchangeable:

```typescript
// One field, from a mutation result — the errorMap is keyed by field path
form.setFieldMeta('code', (meta) => ({
  ...meta,
  errorMap: { ...meta.errorMap, onDynamic: { message: 'text_<key>' } },
}))

// Several fields at once — nested under `fields`, each value an OBJECT, never a string
formApi.setErrorMap({
  onDynamic: { fields: { email: { message: translate('text_<key>'), path: ['email'] } } },
})
```

Clear the error when the user edits the field, or submit stays disabled. A duplicate
`code` rejection has a helper that does both: `applyExistingCodeError(formApi)`
(`~/core/form/existingCodeError`).

Validator-produced errors live directly on `errorMap.onDynamic` keyed by field path; the
`.fields` sub-shape exists only for errors set manually. Reading section validity for
**unmounted** fields therefore goes through the form error map, not `fieldMeta`.

## Splitting a form

| | `withForm` | `withFieldGroup` |
| --- | --- | --- |
| For | a section of one specific form | a field group reused across forms |
| Receives | `form` | `group` |
| Call | `<Section form={form} />` | `<NameAndCodeGroup group={form} />` |

Both come from `~/hooks/forms/useAppform` and take `{ defaultValues, props, render }`.
A form inside a dialog is independent of its parent form: its own `useAppForm`, values
flowing out through a callback, wired with `dialogFormProps(FORM_ID, form)`.

## Tests

Run `/make-tests` for the suite itself. Two rules specific to forms:

- One **select-then-submit** case per combobox / multi-select asserting the mutation
  variables — that is what catches a schema written against the wrong stored shape.
- Unit-test the schema directly when it carries cross-field or conditional rules; a
  `validationSchema.test.ts` next to it is the convention.

A test rendering a form inside a drawer or dialog needs the `import.meta` mock — see
`lago-drawers` / `lago-dialogs`.

## Reference implementations

`CreateSubscription.tsx` + `SubscriptionInformationFormSection.tsx` (multi-section,
`withForm`), `CreateCoupon.tsx` (conditional sections, server error on `code`),
`EditFeeBillingPeriod.tsx` (small form in a `FormDialog`),
`approveQuote/validationSchema.ts` (schema + type + defaults + mapper),
`src/components/wallets/tanstackForm/` (drawer forms), `CreatePricingUnit.tsx`
(`scrollToFirstInputError`).
