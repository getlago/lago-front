/* eslint-disable react/prop-types */
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'
import { forwardRef, memo } from 'react'
import styled, { css } from 'styled-components'

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

      return (
        <StyledTextInput
          $displayErrorText={displayErrorText}
          name={name}
          value={_get(values, name)}
          ref={ref}
          onBlur={handleBlur}
          cleanable={cleanable}
          error={
            !silentError
              ? displayErrorText
                ? _get(touched, name) && (_get(errors, name) as string)
                : !!_get(errors, name)
              : undefined
          }
          onChange={(value: string | number | undefined) => {
            setFieldValue(name, value)
          }}
          {...props}
        />
      )
    },
  ),
  (
    { formikProps: prevFormikProps, name: prevName, ...prev },
    { formikProps: nextformikProps, name: nextName, ...next },
  ) => {
    return (
      _isEqual(prev, next) &&
      prevName === nextName &&
      _get(prevFormikProps.values, prevName) === _get(nextformikProps.values, nextName) &&
      _get(prevFormikProps.errors, prevName) === _get(nextformikProps.errors, nextName) &&
      _get(prevFormikProps.touched, prevName) === _get(nextformikProps.touched, nextName)
    )
  },
)

TextInputField.displayName = 'TextInputField'

const StyledTextInput = styled(TextInput)<{ $displayErrorText?: boolean }>`
  ${({ $displayErrorText }) =>
    !$displayErrorText &&
    css`
      .MuiTextField-root {
        margin-bottom: 0 !important;
      }
    `}
`
