import { createFormHook } from '@tanstack/react-form'

import { lazyComponent } from '~/core/utils/lazyComponent'

import { fieldContext, formContext } from './formContext.ts'

const CheckboxField = lazyComponent(
  () => import('~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'),
)
const ComboBoxField = lazyComponent(
  () => import('~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'),
)
const SwitchField = lazyComponent(
  () => import('~/components/form/Switch/SwitchFieldForTanstack.tsx'),
)
const TextInputField = lazyComponent(
  () => import('~/components/form/TextInput/TextInputFieldForTanstack.tsx'),
)
const SubmitButton = lazyComponent(
  () => import('~/components/form/SubmitButton/SubmitButtonField.tsx'),
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
