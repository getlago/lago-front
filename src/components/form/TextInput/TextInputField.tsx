import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { forwardRef, memo } from 'react'

import { formikFieldPropsAreEqual } from '~/components/form/formikFieldPropsAreEqual'

import { TextInput, TextInputProps } from './TextInput'

interface TextInputFieldProps extends Omit<TextInputProps, 'onChange' | 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  silentError?: boolean
  displayErrorText?: boolean
}

export const TextInputField = memo(
  forwardRef<HTMLDivElement, TextInputFieldProps>(
    (
      {
        name,
        cleanable = false,
        silentError = false,
        formikProps,
        displayErrorText = true,
        ...props
      }: TextInputFieldProps,
      ref,
    ) => {
      const { values, errors, touched, handleBlur, setFieldValue } = formikProps

      let error = undefined

      if (!silentError) {
        if (displayErrorText) {
          error = _get(touched, name) && (_get(errors, name) as string)
        } else {
          error = !!_get(errors, name)
        }
      }

      return (
        <TextInput
          name={name}
          value={_get(values, name)}
          ref={ref}
          onBlur={handleBlur}
          cleanable={cleanable}
          error={error}
          onChange={(value: string) => {
            setFieldValue(name, value)
          }}
          {...props}
        />
      )
    },
  ),
  formikFieldPropsAreEqual,
)

TextInputField.displayName = 'TextInputField'
