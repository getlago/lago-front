import { useFieldContext } from '~/hooks/forms/formContext'

import { Switch, SwitchProps } from './Switch'

const SwitchField = (props: Omit<SwitchProps, 'name' | 'checked' | 'onChange'>) => {
  const field = useFieldContext<boolean>()

  return (
    <Switch
      {...props}
      name={field.name}
      checked={field.state.value}
      onChange={(value) => field.handleChange(value)}
    />
  )
}

export default SwitchField
