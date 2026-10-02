import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { forwardRef, memo } from 'react'

import { formikFieldPropsAreEqual } from '~/components/form/formikFieldPropsAreEqual'
import { CurrencyEnum } from '~/generated/graphql'

import { AmountInput, AmountInputProps } from './AmountInput'
import { getAmountInputError } from './utils'

interface AmountInputFieldProps extends AmountInputProps {
  currency: CurrencyEnum
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  name: string
  silentError?: boolean
  displayErrorText?: boolean
}

export const AmountInputField = memo(
  forwardRef<HTMLDivElement, AmountInputFieldProps>(
    (
      {
        name,
        cleanable = false,
        silentError = false,
        formikProps,
        displayErrorText = true,
        inputProps,
        ...props
      }: AmountInputFieldProps,
      ref,
    ) => {
      const { values, errors, touched, handleBlur, setFieldValue } = formikProps

      return (
        <AmountInput
          name={name}
          value={_get(values, name)}
          ref={ref}
          onBlur={handleBlur}
          cleanable={cleanable}
          inputProps={inputProps}
          error={getAmountInputError(silentError, displayErrorText, touched, errors, name)}
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

AmountInputField.displayName = 'AmountInputField'
