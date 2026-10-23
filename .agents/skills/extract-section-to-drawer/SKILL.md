---
name: extract-section-to-drawer
description: Extract a Formik form section into a TanStack Form drawer with Zod validation, following the plan form migration pattern. Use this skill when the user wants to extract a plan form section (or similar Formik section) into an independent TanStack Form drawer.
user-invocable: true
argument-hint: '<path-to-section-component>'
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, AskUserQuestion
---

# Extract Formik Section to TanStack Drawer Skill

**Target section to extract:** `$ARGUMENTS`

> **Important:** If no path was provided above (empty or missing), use the AskUserQuestion tool to ask the user for the path to the section component they want to extract into a drawer.

This skill extracts a Formik-based form section into an independent TanStack Form inside a `use<SectionName>Drawer` hook, bridging data back to the parent Formik form via a callback. Both the existing Formik section and the new drawer coexist during migration.

## Reference Files

Before starting, read these files to understand existing patterns:

### TanStack Form Infrastructure
1. **useAppForm hook**: `src/hooks/forms/useAppForm.ts` — registered field components
2. **Field context**: `src/hooks/forms/formContext.ts` — `useFieldContext` for TanStack fields
3. **Zod validation example**: `src/pages/settings/teamAndSecurity/members/dialogs/CreateInviteDialog.tsx`

### Drawer Pattern
4. **Drawers reference**: `.agents/skills/lago-frontend-patterns/references/drawers.md`: the canonical `use<Feature>Drawer` hook built on `useFormDrawer`. The ref-based `~/components/designSystem/Drawer` + `DrawerRef` is legacy and fails `lago/use-design-system`.

### Existing Implementation (reference)
5. **usePlanSettingsDrawer**: `src/components/plans/drawers/planSettings/usePlanSettingsDrawer.tsx`: a plan drawer built as a hook
6. **SubscriptionFeeDrawer**: `src/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer.tsx`: the first completed extraction, still a `forwardRef` wrapper. Read it for the Formik bridge, not for its shape
7. **PlanFormContext**: `src/contexts/PlanFormContext.tsx` — shared read-only context for currency/interval

### TanStack Field Components
8. **TextInputField**: `src/components/form/TextInput/TextInputFieldForTanstack.tsx`
9. **AmountInputField**: `src/components/form/AmountInput/AmountInputFieldForTanstack.tsx`
10. **SwitchField**: `src/components/form/Switch/SwitchFieldForTanstack.tsx`
11. **RadioGroupField**: `src/components/form/Radio/RadioGroupFieldForTanstack.tsx`

## Migration Steps

### Phase 1: Analyze the Section

1. Read the target section component completely
2. Identify:
   - All form fields and their Formik names/types
   - Which fields are editable vs read-only/disabled
   - Any shared context needed (currency, interval, etc.)
   - The parent component(s) that render this section

### Phase 2: Define the Form Values Type

Create an interface for the drawer's form values. The field names **must match** the Formik field names exactly so the parent can spread them back with `setValues`:

```ts
interface SectionNameFormValues {
  fieldA: string
  fieldB: boolean
  fieldC: number | null
}
```

**Critical rule:** The keys in this type must be a subset of the parent Formik form's type (`PlanFormInput` or equivalent). This enables the spread pattern:

```ts
formikProps.setValues({ ...formikProps.values, ...drawerValues })
```

### Phase 3: Create the Zod Schema

Define a Zod schema that validates exactly the form values shape:

```ts
const sectionNameSchema = z.object({
  fieldA: z.string().min(1, 'text_translationKeyForError'),
  fieldB: z.boolean(),
  fieldC: z.number().positive().nullable(),
})
```

**Important:**
- Use `z.enum(MyEnum)` for GraphQL/TS string enums. `z.nativeEnum()` is deprecated in Zod v4.
- Pass **translation keys** (not translated strings) as Zod error messages. The TanStack field components translate them via `useInternationalization`.

### Phase 4: Create the Drawer Hook

Create `src/components/plans/drawers/sectionName/useSectionNameDrawer.tsx`, with the drawer body in its own `SectionNameDrawerContent` component. Follow the canonical pattern in `.agents/skills/lago-frontend-patterns/references/drawers.md`: a hook that owns the form, opens `useFormDrawer`, and returns `{ openDrawer }`. It holds no ref and renders nothing. Copy the `drawer.open({ ... })` options (`form`, `closeOnSubmitSuccess`, `shouldPromptOnClose`, `onClose`, `mainAction`) from that reference.

What this migration adds to the reference:

```tsx
interface UseSectionNameDrawerProps {
  onSave: (values: SectionNameFormValues) => void
}

export const useSectionNameDrawer = ({
  onSave,
}: UseSectionNameDrawerProps): { openDrawer: (values: SectionNameFormValues) => void } => {
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: sectionNameSchema },
    onSubmit: async ({ value }) => {
      onSave(value)
      drawer.close()
    },
  })

  const openDrawer = (values: SectionNameFormValues): void => {
    form.reset(values, { keepDefaultValues: true })
    drawer.open({
      // ...options as in the drawers reference
      children: <SectionNameDrawerContent form={form} />,
    })
  }

  return { openDrawer }
}
```

### Key patterns:

- **`onSubmit` on useAppForm**: The save logic lives in the form's `onSubmit` config, not in a manual handler. This ensures Zod validation runs via `form.handleSubmit()` before saving.
- **`reset(values, { keepDefaultValues: true })`**: On `openDrawer`, reset the form to the provided values while keeping `DEFAULT_VALUES` as the internal defaultValues. This prevents the React adapter's `formApi.update()` from overwriting values on re-render, without needing a `useState` workaround.
- **`openDrawer(values)`** accepts initial values from Formik, not just `openDrawer()`.
- **onSave callback**: Does NOT write to Formik directly. The parent handles that via the callback.

### Phase 5: Integrate into the Section Component

1. Add an `onDrawerSave` prop (required, not optional) to the section's props interface
2. Call `const { openDrawer } = useSectionNameDrawer({ onSave: onDrawerSave })` inside the section component
3. Add a trigger element (e.g., `Selector` component) that calls `openDrawer(currentValues)`

```tsx
interface SectionProps {
  formikProps: FormikProps<PlanFormInput>
  onDrawerSave: (values: SectionNameFormValues) => void
  // ... other existing props
}
```

#### One Drawer Hook for List/Loop Sections

**Critical rule for sections that render items in a loop** (e.g., fixed charges, usage charges, where each charge is an accordion item): call the hook **once** at the section level and pass `openDrawer` down. Calling it inside each item creates one form per item.

```tsx
// ✅ Correct: one hook at the section level, openDrawer passed to items
const ChargesSection = ({ formikProps, onDrawerSave }: ChargesSectionProps) => {
  const { openDrawer } = useChargeDrawer({ onSave: onDrawerSave })

  return formikProps.values.charges.map((charge) => (
    <ChargeAccordionItem key={charge.id} charge={charge} openDrawer={openDrawer} />
  ))
}

const ChargeAccordionItem = ({ charge, openDrawer }: ChargeAccordionItemProps) => (
  <Selector onClick={() => openDrawer(charge)} /* ... */ />
)
```

### Phase 6: Wire Up the Parent Page

In the parent page (e.g., `CreatePlan.tsx`, `CreateSubscription.tsx`):

1. Pass `onDrawerSave` using the spread pattern:

```tsx
<SectionComponent
  formikProps={formikProps}
  onDrawerSave={(values) => {
    formikProps.setValues({ ...formikProps.values, ...values })
  }}
/>
```

2. Ensure `PlanFormProvider` wraps the section (provides currency/interval to the drawer):

```tsx
<PlanFormProvider
  currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
  interval={formikProps.values.interval || PlanInterval.Monthly}
>
  {/* ... section components ... */}
</PlanFormProvider>
```

### Phase 7: Check for Missing TanStack Field Components

If the section uses a Formik field component that doesn't have a TanStack equivalent yet:

1. Check `src/hooks/forms/useAppForm.ts` for the `fieldComponents` map
2. If missing, create a `*ForTanstack.tsx` file following the pattern of existing ones (e.g., `SwitchFieldForTanstack.tsx`)
3. Register it in `useAppForm.ts`

The TanStack field pattern:
```tsx
const FieldName = (props: Omit<OriginalProps, 'name' | 'value' | 'onChange'>) => {
  const field = useFieldContext<FieldType>()
  return (
    <OriginalComponent
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
    />
  )
}
```

### Phase 8: Add Translation Keys

**Never manually create translation keys.** Always use the script to generate properly formatted keys:

```bash
pnpm translations:add <count>
```

This generates `<count>` keys with the format `text_<timestamp><random>` and appends them with empty values to `translations/base.json`. Then fill in the values for each generated key.

For example, if you need 2 new strings ("Pricing settings" and "Open drawer"):
1. Run `pnpm translations:add 2`
2. Find the new empty keys at the bottom of `translations/base.json`
3. Fill in the values: `"text_1771963033466...": "Pricing settings"`
4. Use the generated keys in code: `translate('text_1771963033466...')`

## Verification Checklist

After completing the extraction:

1. **TypeScript**: Run `pnpm tsc --noEmit` — zero errors
2. **Lint**: Run `pnpm eslint` on changed files — zero new errors
3. **Existing section**: The original Formik-based accordion/section still works unchanged
4. **Drawer trigger**: Clicking the trigger opens the drawer with current Formik values pre-filled
5. **Field rendering**: All TanStack fields render correctly with proper labels and validation
6. **Save flow**: Saving copies values back to Formik (verify in the existing section's display)
7. **Dirty detection**: Closing the drawer with unsaved changes shows a warning dialog
8. **All parent pages**: Every page that renders the section passes `onDrawerSave` and is wrapped with `PlanFormProvider`

## Common Pitfalls

- **Missing `<form>` wrapper**: Always wrap drawer content in a `<form>` element. Without it, `form.handleSubmit()` won't trigger the validation → submit lifecycle, and Zod validation is never enforced.
- **Manual value reading instead of `form.handleSubmit()`**: Never read `form.state.values` directly and pass to `onSave`. Always use `form.handleSubmit()` which runs validation first, then calls the `onSubmit` handler only if valid.
- **`useState` for defaultValues**: Don't use `useState` to track defaultValues. Use `form.reset(values, { keepDefaultValues: true })` instead — this prevents the React adapter's `formApi.update()` from overwriting values while keeping `isDirty` correct.
- **`z.nativeEnum()` usage**: Deprecated in Zod v4. Use `z.enum(MyEnum)` for GraphQL/TS string enums.
- **Optional `onDrawerSave`**: Keep it required. If a parent doesn't need the drawer, it still passes a handler. This avoids conditional rendering bugs.
- **Field name mismatch**: The drawer's form values type keys MUST match Formik field names exactly for the spread pattern to work.
- **Missing PlanFormProvider**: The drawer uses `usePlanFormContext()` for currency/interval. Every parent that renders the section must be wrapped.
- **Import path**: `useAppForm` is imported from `~/hooks/forms/useAppform` (lowercase 'f').
- **Revalidation logic**: Always pass `validationLogic: revalidateLogic()` from `@tanstack/react-form`.
- **Drawer in a loop**: When the section renders items in a loop (charges, thresholds, etc.), call the drawer hook **once** at the section level and pass `openDrawer` to each item. Never call it inside each loop iteration.
- **Manual translation keys**: Never hand-craft translation keys. Always run `pnpm translations:add <count>` to generate them with the correct format.
- **TanStack field error handling**: Ensure all TanStack field wrappers (`*ForTanstack.tsx`) wire up error state via `useStore(field.store, (state) => state.meta.errors)` and `getErrorToDisplay()`. If the underlying component accepts an `error` prop, it must be connected.
