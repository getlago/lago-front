import { memo } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

import { ComboBox } from './ComboBox'
import { ComboBoxProps } from './types'

interface ComboBoxFieldProps extends Omit<ComboBoxProps, 'onChange' | 'value' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  onChange?: (value: string) => unknown
}

export const ComboBoxField = memo(
  ({ name, formikProps, ...props }: ComboBoxFieldProps) => {
    const { setFieldValue, values } = formikProps

    return (
      <ComboBox
        name={name}
        value={_get(values, name)}
        onChange={(newValue) => setFieldValue(name, newValue || null)}
        {...props}
      />
    )
  },
  (
    { formikProps: prevFormikProps, name: prevName, ...prev },
    { formikProps: nextformikProps, name: nextName, ...next }
  ) => {
    return (
      _isEqual(prev, next) &&
      prevName === nextName &&
      prevFormikProps.values[prevName] === nextformikProps.values[nextName] &&
      prevFormikProps.errors[prevName] === nextformikProps.errors[nextName] &&
      prevFormikProps.touched[prevName] === nextformikProps.touched[nextName]
    )
  }
)

ComboBoxField.displayName = 'ComboBoxField'
