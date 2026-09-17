---
name: lago-dialogs
description: 'The three sanctioned dialog hooks in lago-front — useFormDialog, useCentralizedDialog and useFormDialogOpeningDialog, all NiceModal-backed — the removed forwardRef + Dialog pattern that must not come back, and the jest mock every dialog test needs. TRIGGER — read BEFORE writing the code whenever the task adds, edits or tests a dialog, modal, confirmation, warning or destructive prompt; whenever the diff mentions useFormDialog, useCentralizedDialog, useFormDialogOpeningDialog, WarningDialog, DialogRef or src/core/overlays/registeredDialogs.ts; and whenever a test renders a component that opens one, since jest cannot parse import.meta without the mock.'
---

# Dialogs

All dialogs are hook-based, backed by NiceModal. New code must use one of three hooks
depending on the shape of the flow — the legacy imperative `forwardRef` + `Dialog` /
`WarningDialog` pattern is gone, do not reintroduce it.

| Hook | Use for | Signature |
| ---- | ------- | --------- |
| `useFormDialog` | Form + submit button | `open({ title, form: { id, submit }, mainAction, children, ... })` |
| `useCentralizedDialog` | Confirmation / warning (no form) | `open({ title, description, actionText, colorVariant, onAction })` |
| `useFormDialogOpeningDialog` | Edit form that can open a secondary destructive confirm | same as `useFormDialog` + a nested `open-other-dialog` return |

## The canonical pattern

Write a hook named `use<Feature>Dialog` that owns the form and returns
`{ openDialog }` (or an equivalent `open<Feature>Dialog` verb). Keep the dialog body
inline or in its own component. Consumers just call the hook — no ref, no rendered
dialog element.

```tsx
// src/.../useFeatureDialog.tsx
const FEATURE_FORM_ID = 'feature-dialog-form'

export const useFeatureDialog = ({ onSave }: UseFeatureDialogProps) => {
  const { translate } = useInternationalization()
  const formDialog = useFormDialog()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: featureValidationSchema },
    onSubmit: async ({ value }) => {
      await onSave(value)
    },
  })

  const openFeatureDialog = (values?: TFeature): void => {
    form.reset({ ...DEFAULT_VALUES, ...values }, { keepDefaultValues: true })

    formDialog.open({
      title: translate('...'),
      form: { id: FEATURE_FORM_ID, submit: form.handleSubmit },
      onEntered: focusFirstInput,
      children: <FeatureDialogContent form={form} />,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="feature-dialog-save">
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openFeatureDialog }
}
```

The consumer just calls the hook — no `useRef`, no dialog element in its JSX:

```tsx
// ✅ Correct
const { openFeatureDialog } = useFeatureDialog({ onSave })
return <Button onClick={() => openFeatureDialog(existingValue)}>Edit</Button>

// ❌ Wrong — phantom component + imperative ref (removed pattern)
const dialogRef = useRef<FeatureDialogRef>(null)
return (
  <>
    <Button onClick={() => dialogRef.current?.openDialog()}>Edit</Button>
    <FeatureDialog ref={dialogRef} onSave={onSave} />
  </>
)
```

Notes:

- Confirmation-only flows (delete / revoke / danger prompts) use
  `useCentralizedDialog` with `colorVariant: 'danger'` — no form, no `mainAction`,
  just a single `onAction` callback.
- `useFormDialogOpeningDialog` is only for the compound "edit + delete-from-within"
  case; do not reach for it otherwise.
- Every dialog hook is registered globally in `src/core/overlays/registeredDialogs.ts` —
  no need to render the dialog element in the tree; NiceModal mounts it on `open()`.
- Reference sites: `useCreateInviteDialog`, `useEditInviteRoleDialog`,
  `useRevokeInviteDialog`, `useApplyTaxDialog`, `useAddEditSuccessRedirectUrlDialog`.

## Testing dialogs

Same rule as drawers: the dialog stack uses `import.meta`, unsupported by jest, so
**every** test touching a dialog must mock the module:

```typescript
jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({ open: mockOpen, close: mockClose }),
}))
jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: jest.fn(), close: jest.fn() }),
}))
```

- **Testing a consumer** → mock the `use<Feature>Dialog` hook itself and assert
  `openDialog` was called with the right seed.
- **Testing the dialog itself** → host the hook in a throwaway component to capture
  `open()`'s payload, then render the captured `children` (with `open` mocked, the body
  never mounts on its own). The same object exposes `form.submit`, `onEntered`, etc.,
  so those are asserted directly rather than through the DOM.
