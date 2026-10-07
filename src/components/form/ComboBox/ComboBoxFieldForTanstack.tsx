import { useFieldContext } from '~/hooks/forms/formContext'
import { useFieldError } from '~/hooks/forms/useFieldError'

import { BasicComboBoxData, ComboBox, ComboboxDataGrouped, ComboBoxProps } from './'

const ComboBoxField = ({
  data,
  renderGroupHeader,
  displayErrorText = true,
  errorOverride,
  ...props
}: Omit<ComboBoxProps, 'name' | 'onChange' | 'value' | 'error'> & {
  dataTest?: string
  displayErrorText?: boolean
  errorOverride?: string | boolean
}) => {
  const field = useFieldContext<string | undefined>()

  // Messages are translation keys, as in the sibling wrappers.
  const finalError = useFieldError({ displayErrorText, translateErrors: true })

  const onChange = (value: string) => {
    if (value === '') {
      return field.handleChange(undefined)
    }

    return field.handleChange(value)
  }

  return renderGroupHeader ? (
    <ComboBox
      {...props}
      data={data as ComboboxDataGrouped[]}
      renderGroupHeader={renderGroupHeader}
      name={field.name}
      onChange={(value) => {
        onChange(value)
      }}
      value={field.state.value}
      error={errorOverride ?? finalError}
      data-test={props.dataTest}
    />
  ) : (
    <ComboBox
      {...props}
      data={data as BasicComboBoxData[]}
      name={field.name}
      onChange={(value) => {
        onChange(value)
      }}
      value={field.state.value}
      error={errorOverride ?? finalError}
      data-test={props.dataTest}
    />
  )
}

export default ComboBoxField
