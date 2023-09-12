import { FormikProps } from 'formik'
import _isEqual from 'lodash/isEqual'
import { forwardRef, memo } from 'react'

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
      prevFormikProps.values[prevName] === nextformikProps.values[nextName] &&
      prevFormikProps.errors[prevName] === nextformikProps.errors[nextName] &&
      prevFormikProps.touched[prevName] === nextformikProps.touched[nextName]
    )
  }
)

RadioField.displayName = 'RadioField'
