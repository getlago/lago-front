---
name: migrate-dialog
description: Migrate a dialog component from the legacy imperative ref-based Dialog system to the new hook-based NiceModal dialog system (FormDialog or CentralizedDialog). Use this skill when the user wants to migrate an old dialog to the new system.
user-invocable: true
argument-hint: '<path-to-dialog>'
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, AskUserQuestion
---

# Dialog Migration Skill

**Target dialog to migrate:** `$ARGUMENTS`

> **Important:** If no path was provided above (empty or missing), use the AskUserQuestion tool to ask the user for the path to the dialog they want to migrate before proceeding.

This skill guides the migration of dialog components from the legacy imperative ref-based system (`forwardRef` + `useImperativeHandle` + `Dialog` from design system) to the new hook-based NiceModal system (`useFormDialog` / `useCentralizedDialog`).

## Prerequisites

Before starting, gather context by reading these reference files:

### New Dialog System

1. **FormDialog**: `src/components/dialogs/FormDialog.tsx` - Dialog with form support
2. **CentralizedDialog**: `src/components/dialogs/CentralizedDialog.tsx` - Simple action/confirmation dialog
3. **BaseDialog**: `src/components/dialogs/BaseDialog.tsx` - Underlying dialog component
4. **Dialog Types**: `src/components/dialogs/types.ts` - `DialogResult`, `HookDialogReturnType`, `FormProps`
5. **Dialog Constants**: `src/components/dialogs/const.ts` - Dialog names and test IDs
6. **Registered Dialogs**: `src/core/dialogs/registeredDialogs.ts` - NiceModal registration

### Migration Examples

7. **FormDialog Example**: `src/pages/settings/teamAndSecurity/members/dialogs/CreateInviteDialog.tsx` - Hook-based FormDialog
8. **FormDialog Example 2**: `src/pages/settings/teamAndSecurity/members/dialogs/EditInviteRoleDialog.tsx` - Hook-based FormDialog (simpler)
9. **CentralizedDialog Example**: `src/pages/settings/teamAndSecurity/members/dialogs/CopyInviteLink.tsx` - Used within CentralizedDialog

### Test Examples

10. **FormDialog Test**: `src/components/dialogs/__tests__/FormDialog.test.tsx` - NiceModal test setup pattern
11. **Hook-based Dialog Test**: `src/pages/settings/teamAndSecurity/members/dialogs/__tests__/EditInviteRoleDialog.test.tsx` - Testing a hook-based dialog

---

## Migration Steps

### Phase 1: Pre-Migration Analysis

#### Step 1.1: Analyze the Current Dialog

1. Read the target dialog file completely
2. Identify:
   - Whether it's a **form dialog** (has form fields + submit) or a **simple dialog** (just actions/display)
   - The imperative ref interface (`openDialog`, `closeDialog`)
   - Internal state managed via `useState` (typically `localData`)
   - Form setup (if any): `useAppForm`, validation schema, `onSubmit` handler
   - What data is passed via `openDialog(data)`
   - The dialog's JSX content (children)
   - The dialog's actions (submit button, cancel button)

#### Step 1.2: Determine Target Dialog Type

| Old Dialog Pattern | New Dialog Type | When to Use |
| --- | --- | --- |
| Has form fields + submit button | `useFormDialog` | Dialog contains a form with validation |
| Has a single action button (confirm/copy/etc.) | `useCentralizedDialog` | Dialog is for confirmation or simple action |
| Chains to another dialog after success | Both | Use FormDialog for the form, chain to CentralizedDialog |

#### Step 1.3: Find All Usages

Search for all places where the dialog is used:

```bash
grep -r "DialogName\|DialogNameRef" src/ --include="*.tsx" --include="*.ts"
```

Identify:
- Parent components that create refs and render the dialog
- How `openDialog` is called and what data is passed
- Any test files that reference the dialog

---

### Phase 2: Implementation

#### Step 2.1: Rewrite the Dialog as a Custom Hook

**Old Pattern (imperative ref-based):**

```typescript
export interface MyDialogRef {
  openDialog: (data: MyDialogData) => unknown
  closeDialog: () => unknown
}

export const MyDialog = forwardRef<MyDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<MyDialogData | null>(null)

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog ref={dialogRef} title={...} actions={...} formId={...} formSubmit={...}>
      {/* content using localData */}
    </Dialog>
  )
})
```

**New Pattern (hook-based with FormDialog):**

```typescript
export const useMyDialog = () => {
  const formDialog = useFormDialog()
  const { translate } = useInternationalization()
  // ... other hooks (mutations, etc.)
  const dataRef = useRef<MyData | null>(null)
  const successRef = useRef(false)

  const form = useAppForm({
    defaultValues: initialValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: validationSchema },
    onSubmit: async ({ value }) => {
      const result = await myMutation({
        variables: { input: { ...value, id: dataRef.current?.id as string } },
      })

      if (result.data?.myMutation) {
        successRef.current = true
      }
    },
  })

  const handleSubmit = async (): Promise<DialogResult> => {
    successRef.current = false
    await form.handleSubmit()

    if (!successRef.current) {
      throw new Error('Submit failed')
    }

    return { reason: 'success' }
  }

  const openMyDialog = (data: MyData) => {
    dataRef.current = data
    form.reset()
    // Set form values from data if editing
    form.setFieldValue('fieldName', data.fieldValue || '')

    formDialog
      .open({
        title: translate('...'),
        children: (
          <div className="...">
            {/* Dialog content */}
          </div>
        ),
        closeOnError: false,
        mainAction: (
          <form.AppForm>
            <form.SubmitButton>{translate('...')}</form.SubmitButton>
          </form.AppForm>
        ),
        form: {
          id: MY_FORM_ID,
          submit: handleSubmit,
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          form.reset()
          dataRef.current = null
        }
      })
  }

  return { openMyDialog }
}
```

**New Pattern (hook-based with CentralizedDialog):**

```typescript
export const useMyDialog = () => {
  const centralizedDialog = useCentralizedDialog()
  const { translate } = useInternationalization()

  const openMyDialog = (data: MyData) => {
    centralizedDialog
      .open({
        title: translate('...'),
        description: translate('...'),
        actionText: translate('...'),
        children: <MyDialogContent data={data} />,
        onAction: () => {
          // Perform action (e.g., copy to clipboard, confirm delete)
        },
      })
      .then((response) => {
        if (response.reason === 'close') {
          // Cleanup if needed
        }
      })
  }

  return { openMyDialog }
}
```

#### Step 2.2: Key Migration Decisions

**Handling `localData` state:**
- Old: `useState` to store data passed via `openDialog`
- New: Use a `useRef` to store data passed to the hook's open function. The ref is captured in closures for `onSubmit` and `children`.

**Handling form initial values when editing:**
- Old: `initialValues` depended on `localData` state, re-rendered on state change
- New: Call `form.reset()` then `form.setFieldValue(...)` before opening the dialog. The form values are set synchronously before `formDialog.open()` is called.

**Handling form submission:**
- Old: `handleSubmit` called `e.preventDefault()` + `form.handleSubmit()`; dialog closed by calling `dialogRef.current?.closeDialog()` inside `onSubmit`
- New: `handleSubmit` returns a `Promise<DialogResult>`. Use a `successRef` to track whether the mutation succeeded. The dialog auto-closes on success (when the promise resolves). Throw an error to keep the dialog open on failure.

**Handling dialog close/cleanup:**
- Old: `onClose` callback reset the form
- New: Use `.then()` on the promise returned by `formDialog.open()`. Check `response.reason === 'close'` to reset form and clear refs.

#### Step 2.3: Update Imports in the Dialog File

Remove:
```typescript
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
```

Add:
```typescript
import { useRef } from 'react'
import { useFormDialog } from '~/components/dialogs/FormDialog'
import { DialogResult } from '~/components/dialogs/types'
```

Or for CentralizedDialog:
```typescript
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
```

#### Step 2.4: Remove Old Exports

Remove:
```typescript
export interface MyDialogRef {
  openDialog: (data: ...) => unknown
  closeDialog: () => unknown
}
export const MyDialog = forwardRef<MyDialogRef>(...)
MyDialog.displayName = 'forwardRef'
```

Replace with:
```typescript
export const useMyDialog = () => { ... }
```

#### Step 2.5: Update Parent Components

**Old usage:**
```typescript
import { MyDialog, MyDialogRef } from './dialogs/MyDialog'

const parentComponent = () => {
  const myDialogRef = useRef<MyDialogRef>(null)

  const handleAction = () => {
    myDialogRef.current?.openDialog({ /* data */ })
  }

  return (
    <>
      {/* ... */}
      <MyDialog ref={myDialogRef} />
    </>
  )
}
```

**New usage:**
```typescript
import { useMyDialog } from './dialogs/MyDialog'

const parentComponent = () => {
  const { openMyDialog } = useMyDialog()

  const handleAction = () => {
    openMyDialog(/* data */)
  }

  return (
    <>
      {/* ... */}
      {/* No need to render MyDialog in JSX anymore */}
    </>
  )
}
```

Key changes in parent:
1. Remove `useRef<MyDialogRef>` import and usage
2. Import the new hook instead of the component + ref type
3. Call the hook's open function directly (no `.current?.openDialog()`)
4. Remove `<MyDialog ref={...} />` from JSX (the dialog is now rendered via NiceModal)
5. Clean up `useRef` import from React if no longer needed

---

### Phase 3: Update Tests

#### Step 3.1: Update Dialog Unit Tests

The old test pattern uses `createRef<MyDialogRef>()` and renders the dialog component directly. The new pattern needs:

1. **NiceModal registration** at the test file top level
2. **NiceModal.Provider wrapper** around test components
3. **A test wrapper component** that uses the hook and provides a button to trigger it

**Test setup pattern:**

```typescript
import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { render, TestMocksType } from '~/test-utils'

import { useMyDialog } from '../MyDialog'

// Register the dialog with NiceModal
NiceModal.register(FORM_DIALOG_NAME, FormDialog)

// NiceModal provider wrapper
const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

// Test component that uses the hook
const TestComponent = () => {
  const { openMyDialog } = useMyDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() => openMyDialog({ /* test data */ })}
    >
      Open Dialog
    </button>
  )
}

async function prepare({ mocks = [/* default mocks */] }: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent />
      </NiceModalWrapper>,
      { mocks },
    ),
  )
}

describe('MyDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('opens the dialog when the hook function is called', async () => {
    await prepare()

    expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

    await act(async () => {
      screen.getByTestId('open-dialog').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })
  })
})
```

For CentralizedDialog tests, register `CENTRALIZED_DIALOG_NAME` with `CentralizedDialog` instead.

#### Step 3.2: Update Parent Component Tests

The parent component test mocks need to change from ref-based to hook-based:

**Old mock:**
```typescript
jest.mock('../dialogs/MyDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)
  MockDialog.displayName = 'MyDialog'
  return { MyDialog: MockDialog }
})
```

**New mock:**
```typescript
jest.mock('../dialogs/MyDialog', () => ({
  useMyDialog: () => ({
    openMyDialog: jest.fn(),
  }),
}))
```

#### Step 3.3: Delete Old Snapshot Files

If the old dialog had snapshot tests, delete the snapshot file as it will be invalid:

```bash
rm src/path/to/__tests__/__snapshots__/MyDialog.test.tsx.snap
```

---

### Phase 4: Verification

#### Step 4.1: Type Check

```bash
npx tsc --noEmit
```

#### Step 4.2: Lint

```bash
pnpm lint
```

#### Step 4.3: Run Tests

```bash
npx jest --config jest.config.ts "MyDialog"
npx jest --config jest.config.ts "ParentComponent"
```

---

## Dialog Type Reference

### DialogResult (discriminated union)

```typescript
type DialogResult =
  | { reason: 'close' }
  | { reason: 'open-other-dialog'; otherDialog: Promise<DialogResult> }
  | { reason: 'success'; params?: unknown }
  | { reason: 'error'; error: Error }
```

### FormDialogProps

```typescript
type FormDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  cancelOrCloseText?: 'close' | 'cancel'
  closeOnError?: boolean
  onError?: (error: Error) => void
  form: FormProps  // { id: string; submit: (e: React.FormEvent) => void }
}
```

### CentralizedDialogProps

```typescript
type CentralizedDialogProps = {
  title: ReactNode
  description?: ReactNode
  headerContent?: ReactNode
  children?: ReactNode
  onAction: () => DialogResult | Promise<DialogResult> | void
  actionText: string
  colorVariant?: 'info' | 'danger'
  disableOnContinue?: boolean
  cancelOrCloseText?: 'close' | 'cancel'
  closeOnError?: boolean
  onError?: (error: Error) => void
}
```

---

## Checklist

### Phase 1: Analysis
- [ ] Read the target dialog file completely
- [ ] Determine dialog type (FormDialog vs CentralizedDialog)
- [ ] Find all usages of the dialog (parent components, tests)
- [ ] Identify data passed via `openDialog`

### Phase 2: Implementation
- [ ] Convert `forwardRef` component to custom hook (`useMyDialog`)
- [ ] Replace `useState(localData)` with `useRef`
- [ ] Replace `Dialog` component with `useFormDialog()` or `useCentralizedDialog()`
- [ ] Implement `handleSubmit` returning `Promise<DialogResult>` (for FormDialog)
- [ ] Handle form reset and cleanup in `.then()` callback
- [ ] Remove old exports (`forwardRef`, `DialogRef` interface, `displayName`)
- [ ] Update parent components (replace ref with hook, remove JSX rendering)

### Phase 3: Tests
- [ ] Update dialog tests (add NiceModal registration + Provider wrapper)
- [ ] Create test wrapper component that uses the hook
- [ ] Update parent component test mocks (hook mock instead of forwardRef mock)
- [ ] Delete old snapshot files

### Phase 4: Verification
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`pnpm lint`)
- [ ] All tests pass

## Usage

Invoke this skill with:

```
/migrate-dialog <path-to-dialog>
```

Where `<path-to-dialog>` is the path to the existing imperative ref-based dialog file.

Example:

```
/migrate-dialog src/pages/settings/teamAndSecurity/members/dialogs/RevokeMembershipDialog.tsx
```
