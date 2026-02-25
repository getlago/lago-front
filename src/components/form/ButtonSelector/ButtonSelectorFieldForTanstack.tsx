import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useFieldContext } from '~/hooks/forms/formContext'

import { ButtonSelector, ButtonSelectorProps } from './ButtonSelector'

type ValueType = string | number | boolean

const ButtonSelectorField = (props: Omit<ButtonSelectorProps, 'value' | 'onChange' | 'error'>) => {
  const field = useFieldContext<ValueType>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)

  const finalError = getErrorToDisplay({
    error,
    errorMap,
  })

  return (
    <ButtonSelector
      {...props}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      error={typeof finalError === 'string' ? finalError : undefined}
    />
  )
}

export default ButtonSelectorField
