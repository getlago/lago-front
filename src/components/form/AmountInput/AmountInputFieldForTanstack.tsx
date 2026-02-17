import { useStore } from '@tanstack/react-form'
import { forwardRef } from 'react'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'

import { AmountInput, AmountInputProps } from './AmountInput'

interface AmountInputFieldProps extends Omit<
  AmountInputProps,
  'name' | 'value' | 'onChange' | 'onBlur' | 'error'
> {
  silentError?: boolean
  displayErrorText?: boolean
}

const AmountInputField = forwardRef<HTMLDivElement, AmountInputFieldProps>(
  ({ silentError = false, displayErrorText = true, ...props }, ref) => {
    const field = useFieldContext<string | number | undefined>()
    const { translate } = useInternationalization()

    const errorMap = useStore(field.store, (state) => state.meta.errorMap)
    const allErrors = useStore(field.store, (state) => state.meta.errors)
      .map((e) => e.message)
      .filter(Boolean)

    const translatedError = allErrors.map((errorKey) => translate(errorKey as string)).join('\n')

    const finalError = getErrorToDisplay({
      error: translatedError,
      errorMap,
      silentError,
      displayErrorText,
    })

    return (
      <AmountInput
        ref={ref}
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        error={finalError}
      />
    )
  },
)

AmountInputField.displayName = 'AmountInputField'

export default AmountInputField
