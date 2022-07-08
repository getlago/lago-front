/* eslint-disable react/prop-types */
import { forwardRef, memo } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

import { TextInput, TextInputProps } from './TextInput'

interface TextInputFieldProps extends Omit<TextInputProps, 'onChange' | 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  silentError?: boolean
}

export const TextInputField = memo(
  forwardRef<HTMLDivElement, TextInputFieldProps>(
    (
      { name, cleanable = false, silentError = false, formikProps, ...props }: TextInputFieldProps,
      ref
    ) => {
      const { values, errors, touched, handleBlur, setFieldValue } = formikProps

      return (
        <TextInput
          name={name}
          value={_get(values, name)}
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

TextInputField.displayName = 'TextInputField'
