/* eslint-disable react/prop-types */
import { forwardRef } from 'react'
import { FormikProps } from 'formik'

import { TextInput, TextInputProps } from './TextInput'

interface TextInputFieldProps extends Omit<TextInputProps, 'onChange' | 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  silentError?: boolean
}

export const TextInputField = forwardRef<HTMLDivElement, TextInputFieldProps>(
  (
    { name, cleanable = false, silentError = false, formikProps, ...props }: TextInputFieldProps,
    ref
  ) => {
    const { values, errors, touched, handleBlur, setFieldValue } = formikProps

    return (
      <TextInput
        name={name}
        // @ts-ignore
        value={values[name]}
        ref={ref}
        onBlur={handleBlur}
        cleanable={cleanable}
        error={touched[name] && !silentError ? (errors[name] as string) : undefined}
        onChange={(value: string | number | undefined) => {
          setFieldValue(name, value)
        }}
        {...props}
      />
    )
  }
)

TextInputField.displayName = 'TextInputField'
