/* eslint-disable react/prop-types */
import { FormikProps } from 'formik'
import { forwardRef } from 'react'

import { AmountInput, AmountInputProps } from './AmountInput'

interface AmountFieldProps extends Omit<AmountInputProps, 'onChange' | 'name' | 'value'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  silentError?: boolean
}

export const AmountField = forwardRef<HTMLDivElement, AmountFieldProps>(
  ({ name, silentError = false, formikProps, ...props }: AmountFieldProps, ref) => {
    const { values, errors, touched, handleBlur, setFieldValue } = formikProps

    return (
      <AmountInput
        name={name}
        // @ts-ignore
        value={values[name]}
        ref={ref}
        onBlur={handleBlur}
        error={touched[name] && !silentError ? (errors[name] as string) : undefined}
        onChange={(value: string | number | undefined) => {
          setFieldValue(name, value)
        }}
        {...props}
      />
    )
  }
)

AmountField.displayName = 'AmountField'
