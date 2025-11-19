import { useStore } from '@tanstack/react-form'

import { useFieldContext } from '~/hooks/forms/formContext'

import { Checkbox, CheckboxProps } from './Checkbox'

const CheckboxField = (props: Omit<CheckboxProps, 'name' | 'value' | 'onChange' | 'error'>) => {
  const field = useFieldContext<boolean>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)
  const errorsFromMap = Object.values(errorMap).filter(Boolean).join('')

  const finalError = errorsFromMap || error

  return (
    <Checkbox
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(_, newValue) => field.handleChange(newValue)}
      error={finalError}
    />
  )
}

export default CheckboxField
