import { createFormHook } from '@tanstack/react-form'

import { lazyComponent } from '~/core/utils/lazyComponent.tsx'

import { fieldContext, formContext } from './formContext.ts'

const CheckboxField = lazyComponent(
  () => import('~/components/form/Checkbox/CheckboxFieldForTanstack.tsx'),
  null,
)
const ComboBoxField = lazyComponent(
  () => import('~/components/form/ComboBox/ComboBoxFieldForTanstack.tsx'),
  null,
)
const SwitchField = lazyComponent(
  () => import('~/components/form/Switch/SwitchFieldForTanstack.tsx'),
  null,
)
const TextInputField = lazyComponent(
  () => import('~/components/form/TextInput/TextInputFieldForTanstack.tsx'),
  null,
)
const SubmitButton = lazyComponent(
  () => import('~/components/form/SubmitButton/SubmitButtonField.tsx'),
  null,
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
