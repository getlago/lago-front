import { FormikProps } from 'formik'
import { forwardRef } from 'react'

import { Radio, RadioProps } from './Radio'

export interface RadioFieldProps extends Omit<RadioProps, 'checked' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const RadioField = forwardRef<HTMLElement, RadioFieldProps>(
  /* eslint-disable react/prop-types */
  ({ name, value, formikProps, ...props }: RadioFieldProps, ref) => {
    const { values, setFieldValue, errors, touched } = formikProps

    return (
      <Radio
        {...props}
        ref={ref}
        value={value}
        checked={values[name] === value}
        onChange={() => setFieldValue(name, value)}
        name={name}
        error={touched[name] ? (errors[name] as string) : undefined}
      />
    )
  }
)

RadioField.displayName = 'RadioField'
