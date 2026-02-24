import { useFieldContext } from '~/hooks/forms/formContext'

import { ButtonSelector, ButtonSelectorProps } from './ButtonSelector'

type ValueType = string | number | boolean

const ButtonSelectorField = (props: Omit<ButtonSelectorProps, 'value' | 'onChange'>) => {
  const field = useFieldContext<ValueType>()

  return (
    <ButtonSelector
      {...props}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
    />
  )
}

export default ButtonSelectorField
