import { FormikProps } from 'formik'
import { forwardRef, memo } from 'react'
import _isEqual from 'lodash/isEqual'
import _get from 'lodash/get'

import { Radio, RadioProps } from './Radio'

export interface RadioFieldProps extends Omit<RadioProps, 'checked' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const RadioField = memo(
  forwardRef<HTMLInputElement, RadioFieldProps>(
    /* eslint-disable react/prop-types */
    ({ name, value, formikProps, ...props }: RadioFieldProps, ref) => {
      const { values, setFieldValue } = formikProps

      return (
        <Radio
          {...props}
          ref={ref}
          value={value}
          checked={values[name] === value}
          onChange={() => setFieldValue(name, value)}
          name={name}
        />
      )
    }
  ),
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

RadioField.displayName = 'RadioField'
