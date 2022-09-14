import { memo } from 'react'
import { FormikProps } from 'formik'
import _isEqual from 'lodash/isEqual'
import _get from 'lodash/get'

import { ButtonSelector, ButtonSelectorProps } from './ButtonSelector'

interface ButtonSelectorFieldProps extends Omit<ButtonSelectorProps, 'onChange'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const ButtonSelectorField = memo(
  ({ name, formikProps, ...props }: ButtonSelectorFieldProps) => {
    const { values, touched, errors, setFieldValue } = formikProps

    return (
      <ButtonSelector
        value={_get(values, name)}
        onChange={(newValue) => setFieldValue(name, newValue)}
        error={touched[name] ? (errors[name] as string) : undefined}
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
      _get(prevFormikProps.values, prevName) === _get(nextformikProps.values, nextName) &&
      _get(prevFormikProps.errors, prevName) === _get(nextformikProps.errors, nextName) &&
      _get(prevFormikProps.touched, prevName) === _get(nextformikProps.touched, nextName)
    )
  }
)

ButtonSelectorField.displayName = 'ButtonSelectorField'
