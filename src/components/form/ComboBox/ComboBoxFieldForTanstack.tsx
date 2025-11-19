import { useStore } from '@tanstack/react-form'

import { useFieldContext } from '~/hooks/forms/formContext'

import { BasicComboBoxData, ComboBox, ComboboxDataGrouped, ComboBoxProps } from './'

const ComboBoxField = ({
  data,
  renderGroupHeader,
  ...props
}: Omit<ComboBoxProps, 'name' | 'onChange' | 'value' | 'error'>) => {
  const field = useFieldContext<string>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)
  const errorsFromMap = Object.values(errorMap).filter(Boolean).join('')

  const finalError = errorsFromMap || error

  return renderGroupHeader ? (
    <ComboBox
      {...props}
      data={data as ComboboxDataGrouped[]}
      renderGroupHeader={renderGroupHeader}
      name={field.name}
      onChange={(value) => {
        field.handleChange(value)
      }}
      value={field.state.value}
      error={finalError}
    />
  ) : (
    <ComboBox
      data={data as BasicComboBoxData[]}
      name={field.name}
      onChange={(value) => {
        field.handleChange(value)
      }}
      value={field.state.value}
      error={finalError}
      {...props}
    />
  )
}

export default ComboBoxField
