# Migration Example: ApiKeysForm

This example shows the complete migration of `ApiKeysForm` from Formik to TanStack Form.

## Validation Schema (NEW FILE)

**File: `src/pages/developers/apiKeysForm/validationSchema.ts`**

```typescript
import { z } from 'zod'

import { ApiKeysPermissionsEnum } from '~/generated/graphql'

const apiKeyPermissionSchema = z.object({
  id: z.nativeEnum(ApiKeysPermissionsEnum),
  canRead: z.boolean(),
  canWrite: z.boolean(),
})

export const apiKeysFormValidationSchema = z.object({
  name: z.string(),
  permissions: z.array(apiKeyPermissionSchema),
})

export type ApiKeysFormValues = z.infer<typeof apiKeysFormValidationSchema>
```

---

## Imports

### BEFORE
```typescript
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Icon } from 'lago-design-system'

import { Checkbox, TextInputField } from '~/components/form'
```

### AFTER
```typescript
import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'

import { Checkbox } from '~/components/form'
import { useAppForm } from '~/hooks/forms/useAppform'

import { apiKeysFormValidationSchema } from './apiKeysForm/validationSchema'
```

---

## Form Hook

### BEFORE
```typescript
const formikProps = useFormik<
  Omit<CreateApiKeyInput | UpdateApiKeyInput, 'id' | 'permissions'> & {
    permissions: ApiKeyPermissions[]
  }
>({
  initialValues: {
    name: apiKey?.name || '',
    permissions: transformApiPermissionsForForm(apiKey?.permissions || DEFAULT_PERMISSIONS),
  },
  validateOnMount: true,
  enableReinitialize: true,
  onSubmit: async ({ permissions, ...values }) => {
    // submit logic
  },
})
```

### AFTER
```typescript
const form = useAppForm({
  defaultValues: {
    name: apiKey?.name || '',
    permissions: transformApiPermissionsForForm(apiKey?.permissions || DEFAULT_PERMISSIONS),
  },
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: apiKeysFormValidationSchema,
  },
  onSubmit: async ({ value }) => {
    const { permissions, ...values } = value
    // submit logic
  },
})

// Subscribe to form values for use outside field components
const permissions = useStore(form.store, (state) => state.values.permissions)
```

---

## Form Wrapper

### BEFORE
```tsx
return (
  <>
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        {/* header content */}
      </CenteredPage.Header>
      <CenteredPage.Container>
        {/* form content */}
      </CenteredPage.Container>
      <CenteredPage.StickyFooter>
        {/* footer content */}
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  </>
)
```

### AFTER
```tsx
const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault()
  form.handleSubmit()
}

return (
  <>
    <CenteredPage.Wrapper>
      <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
        <CenteredPage.Header>
          {/* header content */}
        </CenteredPage.Header>
        <CenteredPage.Container>
          {/* form content */}
        </CenteredPage.Container>
        <CenteredPage.StickyFooter>
          {/* footer content */}
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  </>
)
```

---

## Text Input Field

### BEFORE
```tsx
<TextInputField
  autoFocus
  name="name"
  label={translate('text_xxx')}
  placeholder={translate('text_yyy')}
  formikProps={formikProps}
/>
```

### AFTER
```tsx
<form.AppField name="name">
  {(field) => (
    <field.TextInputField
      autoFocus
      label={translate('text_xxx')}
      placeholder={translate('text_yyy')}
    />
  )}
</form.AppField>
```

---

## Accessing Field Values (e.g., in Table)

### BEFORE
```tsx
<Table
  data={formikProps.values.permissions}
  // ...
/>
```

### AFTER
```tsx
// At component level:
const permissions = useStore(form.store, (state) => state.values.permissions)

// In JSX:
<Table
  data={permissions}
  // ...
/>
```

---

## Updating Field Values

### BEFORE
```typescript
formikProps.setFieldValue(
  'permissions',
  formikProps.values.permissions.map((permission) => ({
    ...permission,
    canRead: nextValue,
  })),
)
```

### AFTER
```typescript
form.setFieldValue(
  'permissions',
  permissions.map((permission) => ({
    ...permission,
    canRead: nextValue,
  })),
)
```

---

## Submit Button

### BEFORE
```tsx
<CenteredPage.StickyFooter>
  <Button variant="quaternary" onClick={() => onClose()}>
    {translate('text_cancel')}
  </Button>
  <Button
    variant="primary"
    onClick={formikProps.submitForm}
    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty) || apiKeyLoading}
  >
    {translate(isEdition ? 'text_update' : 'text_create')}
  </Button>
</CenteredPage.StickyFooter>
```

### AFTER
```tsx
<CenteredPage.StickyFooter>
  <Button variant="quaternary" onClick={() => onClose()}>
    {translate('text_cancel')}
  </Button>
  <form.AppForm>
    <form.SubmitButton disabled={apiKeyLoading}>
      {translate(isEdition ? 'text_update' : 'text_create')}
    </form.SubmitButton>
  </form.AppForm>
</CenteredPage.StickyFooter>
```

**Note:** `form.SubmitButton` automatically handles:
- Form validity (`isValid`)
- Dirty state check
- Submit on click
- `type="submit"` attribute

---

## Key Differences Summary

| Aspect | Formik | TanStack Form |
|--------|--------|---------------|
| Hook | `useFormik` | `useAppForm` |
| Initial values | `initialValues` | `defaultValues` |
| Validation | `validationSchema` (Yup) | `validators.onDynamic` (Zod) |
| Submit handler | `onSubmit: (values) => {}` | `onSubmit: ({ value }) => {}` |
| Field component | `formikProps` prop | `form.AppField` + `field.Component` |
| Value access | `formikProps.values.x` | `useStore(form.store, s => s.values.x)` |
| Set value | `formikProps.setFieldValue` | `form.setFieldValue` |
| Submit button | Manual `onClick` + disabled | `form.SubmitButton` auto-handles |
| Form wrapper | Not required | `<form onSubmit={handleSubmit}>` |
