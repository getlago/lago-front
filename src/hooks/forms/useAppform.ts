import { createFormHook } from '@tanstack/react-form'

import { dynamicImport } from '~/core/utils/dynamicImport.tsx'

import { fieldContext, formContext } from './formContext.ts'

const CheckboxField = dynamicImport(
  () => import('~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'),
)
const ComboBoxField = dynamicImport(
  () => import('~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'),
)
const SubmitButton = dynamicImport(
  () => import('~/components/form/SubmitButton/SubmitButtonField.tsx'),
)
const SwitchField = dynamicImport(
  () => import('~/components/form/Switch/SwitchFieldForTanstack.tsx'),
)
const TextInputField = dynamicImport(
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
