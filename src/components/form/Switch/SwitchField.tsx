import { memo } from 'react'
import { FormikProps } from 'formik'
import _isEqual from 'lodash/isEqual'
import _get from 'lodash/get'

import { Switch, SwitchProps } from './Switch'

interface SwitchFieldFormProps extends Omit<SwitchProps, 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const SwitchField = memo(
  ({ name, formikProps, ...props }: SwitchFieldFormProps) => {
    return (
      <Switch
        name={name}
        checked={!!_get(formikProps.values, name)}
        onChange={(value) => {
          formikProps.setFieldValue(name, value)
        }}
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

SwitchField.displayName = 'SwitchField'
