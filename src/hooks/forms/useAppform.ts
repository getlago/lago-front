import { createFormHook } from '@tanstack/react-form'

/**
 * TODO: lazy import them once the routing is fixed.
 * We currently have a strange Suspense recursively called in RouteWrapper.tsx line 53
 */
import CheckboxField from '~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'
import ComboBoxField from '~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'
import SubmitButton from '~/components/form/SubmitButton/SubmitButtonField.tsx'
import SwitchField from '~/components/form/Switch/SwitchFieldForTanstack.tsx'
import TextInputField from '~/components/form/TextInput/TextInputFieldForTanstack.tsx'

import { fieldContext, formContext } from './formContext.ts'

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
