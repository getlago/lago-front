import { memo } from 'react'
import { FormikProps } from 'formik'
import _isEqual from 'lodash/isEqual'
import _get from 'lodash/get'

import { DatePicker, DatePickerProps } from './DatePicker'

interface DatePickerFieldFormProps extends Omit<DatePickerProps, 'name' | 'onChange' | 'onError'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const DatePickerField = memo(
  ({ name, formikProps, ...props }: DatePickerFieldFormProps) => {
    const { values, errors, touched, handleBlur, setFieldValue, setFieldError } = formikProps

    return (
      <DatePicker
        name={name}
        onBlur={handleBlur}
        value={_get(values, name)}
        error={touched[name] ? (errors[name] as string) : undefined}
        onError={(err) => setFieldError(name, err)}
        onChange={(value: string | null | undefined) => {
          setFieldValue(name, value)
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

DatePickerField.displayName = 'DatePickerField'
