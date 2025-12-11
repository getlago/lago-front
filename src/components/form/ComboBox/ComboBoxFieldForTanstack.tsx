import { useStore } from '@tanstack/react-form'

import { getErrorToDisplay } from '~/core/form/getErrorToDisplay'
import { useFieldContext } from '~/hooks/forms/formContext'

import { BasicComboBoxData, ComboBox, ComboboxDataGrouped, ComboBoxProps } from './'

const ComboBoxField = ({
  data,
  renderGroupHeader,
  ...props
}: Omit<ComboBoxProps, 'name' | 'onChange' | 'value' | 'error'> & { dataTest?: string }) => {
  const field = useFieldContext<string>()

  const error = useStore(field.store, (state) => state.meta.errors)
    .map((e) => e.message)
    .join('')

  const errorMap = useStore(field.store, (state) => state.meta.errorMap)

  const finalError = getErrorToDisplay({
    error,
    errorMap,
  })

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
      data-test={props.dataTest}
    />
  ) : (
    <ComboBox
      {...props}
      data={data as BasicComboBoxData[]}
      name={field.name}
      onChange={(value) => {
        field.handleChange(value)
      }}
      value={field.state.value}
      error={finalError}
      data-test={props.dataTest}
    />
  )
}

export default ComboBoxField
