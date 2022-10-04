import { memo } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

import { JsonEditor, JsonEditorProps } from './JsonEditor'

interface JsonEditorFieldProps extends Omit<JsonEditorProps, 'onChange' | 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
}

export const JsonEditorField = memo(
  ({ name, formikProps, ...props }: JsonEditorFieldProps) => {
    const { values, errors, touched, setFieldValue, setFieldError, setFieldTouched } = formikProps

    return (
      <JsonEditor
        name={name}
        value={_get(values, name)}
        error={_get(touched, name) ? (_get(errors, name) as string) : undefined}
        onError={(err) => {
          setFieldError(name, err)
        }}
        onChange={(value: string) => {
          setFieldValue(name, value)
        }}
        onBlur={() => setFieldTouched(name, true, false)}
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

JsonEditorField.displayName = 'JsonEditorField'
