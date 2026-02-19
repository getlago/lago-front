import { createFormHook } from '@tanstack/react-form'

import CheckboxField from '~/components/form/Checkbox/CheckboxFieldForTanstack'
import ComboBoxField from '~/components/form/ComboBox/ComboBoxFieldForTanstack'
import MultipleComboBoxField from '~/components/form/MultipleComboBox/MultipleComboBoxFieldForTanstack'
import RadioField from '~/components/form/Radio/RadioFieldForTanstack'
import SubmitButton from '~/components/form/SubmitButton/SubmitButtonField'
import SwitchField from '~/components/form/Switch/SwitchFieldForTanstack'
import TextInputField from '~/components/form/TextInput/TextInputFieldForTanstack'

import { fieldContext, formContext } from './formContext.ts'

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextInputField,
    ComboBoxField,
    MultipleComboBoxField,
    SwitchField,
    CheckboxField,
    RadioField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
