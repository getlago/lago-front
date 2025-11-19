import { createFormHook } from '@tanstack/react-form'
import { lazy } from 'react'

import { fieldContext, formContext } from './formContext.ts'

/**
 * TODO: lazy import them once the routing is fixed.
 * We currently have a strange Suspense recursively called in RouteWrapper.tsx line 53
 */
const CheckboxField = lazy(() => import('~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'))
const ComboBoxField = lazy(() => import('~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'))
const SubmitButton = lazy(() => import('~/components/form/SubmitButton/SubmitButtonField.tsx'))
const SwitchField = lazy(() => import('~/components/form/Switch/SwitchFieldForTanstack.tsx'))
const TextInputField = lazy(
  () => import('~/components/form/TextInput/TextInputFieldForTanstack.tsx'),
)

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextInputField,
    ComboBoxField,
    SwitchField,
    CheckboxField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
