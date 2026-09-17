---
name: lago-drawers
description: 'The only sanctioned drawer pattern in lago-front — a use<Feature>Drawer hook built on useFormDrawer / useDrawer returning { openDrawer } — plus the two legacy generations that must never be copied and the jest mock every drawer test needs. TRIGGER — read BEFORE writing the code whenever the task creates, edits, opens or tests a drawer, side panel or slide-over; whenever the diff mentions useFormDrawer, useDrawer, DrawerRef, ~/components/designSystem/Drawer, ~/components/drawers/useDrawer, openDrawer, closeDrawer, shouldPromptOnClose or closeOnSubmitSuccess; and whenever a test renders a component that opens one, since jest cannot parse import.meta without the mock.'
---

# Drawers

Three generations coexist in the codebase. **Only the hook pattern is allowed in new
code** — the other two are migration debt, and their presence is not permission to copy
them.

| Generation | Shape | Status |
| ---------- | ----- | ------ |
| `use<Feature>Drawer()` hook returning `{ openDrawer }`, built on `useFormDrawer` / `useDrawer` (NiceModal) | no ref, no rendered element | ✅ **canonical** |
| `useFormDrawer` wrapped in a `forwardRef` + `useImperativeHandle` component that `return null` | parent holds a ref | ⚠️ legacy, migrate on touch |
| `~/components/designSystem/Drawer` + `DrawerRef` (`openDrawer`/`closeDrawer`) | parent holds a ref to a rendered `<Drawer>` | ⛔ legacy, never for new code |

## The canonical pattern

Write a hook named `use<Feature>Drawer` that owns the form and returns `{ openDrawer }`.
Keep the drawer body in its own component. Use `useFormDrawer` for drawers with a form
and a save button, `useDrawer` (CentralizedDrawer) for read-only or non-form content.

```tsx
// src/.../useFeatureDrawer.tsx
const FEATURE_FORM_ID = 'feature-drawer-form'

export const useFeatureDrawer = ({ onSave }: UseFeatureDrawerProps): UseFeatureDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: featureValidationSchema },
    onSubmit: async ({ value }) => {
      await onSave(value)
      drawer.close()
    },
  })

  // Seed + open in one step: no values = create, values = edit
  const openDrawer = (values?: TFeature): void => {
    form.reset({ ...DEFAULT_VALUES, ...values }, { keepDefaultValues: true })

    drawer.open({
      title: translate('...'),
      form: { id: FEATURE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: focusFirstInput,
      children: <FeatureDrawerContent form={form} />,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="feature-drawer-save">
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
```

The consumer just calls the hook — no `useRef`, no drawer element in its JSX:

```tsx
// ✅ Correct
const { openDrawer } = useFeatureDrawer({ onSave })
return <Button onClick={() => openDrawer(existingValue)}>Edit</Button>

// ❌ Wrong — phantom component + imperative ref
const drawerRef = useRef<FeatureDrawerRef>(null)
return (
  <>
    <Button onClick={() => drawerRef.current?.openDrawer()}>Edit</Button>
    <FeatureDrawer ref={drawerRef} onSave={onSave} />
  </>
)
```

Notes:

- `drawer.close()` belongs inside the hook (in `onSubmit`); do not expose a `closeDrawer`
  unless a consumer actually calls it. In practice they never do.
- `shouldPromptOnClose: () => form.state.isDirty` gives the unsaved-changes prompt;
  `closeOnSubmitSuccess: false` lets `onSubmit` decide when to close.
- Drawer-local draft: the value only reaches the parent form in `onSave`, so cancelling
  must not mutate parent state.
- Reference sites: `usePlanSettingsDrawer`, `useSubscriptionInformationDrawer`,
  `useCreditsDrawer`, `useRecurringRuleDrawer`.

## Testing drawers

The drawer stack uses `import.meta`, unsupported by jest, so **every** test touching a
drawer must mock the module:

```typescript
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))
```

- **Testing a consumer** → mock the `use<Feature>Drawer` hook itself and assert
  `openDrawer` was called with the right seed:
  ```typescript
  useFeatureDrawer: (props) => {
    capturedProps.current = props
    return { openDrawer: mockOpenDrawer }
  }
  ```
- **Testing the drawer itself** → host the hook in a throwaway component to capture
  `openDrawer`, call it, then render the captured `children` (with `open` mocked, the body
  never mounts on its own):
  ```tsx
  const opened = mockOpen.mock.calls.at(-1)?.[0]
  render(<>{opened.children}</>)
  ```
  The same object exposes `form.submit`, `shouldPromptOnClose`, `onClose` and `onEntered`,
  so those are asserted directly rather than through the DOM.
