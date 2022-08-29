import { memo } from 'react'
import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'

import { ComboBox } from './ComboBox'
import { ComboBoxProps, BasicComboBoxData, ComboboxDataGrouped } from './types'

interface ComboBoxFieldProps extends Omit<ComboBoxProps, 'onChange' | 'value' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  isEmptyNull?: Boolean // If false, on field reset the combobox will return an empty string
  onChange?: (value: string) => unknown
}

export const ComboBoxField = memo(
  ({
    name,
    isEmptyNull = true,
    formikProps,
    renderGroupHeader,
    data,
    ...props
  }: ComboBoxFieldProps) => {
    const { setFieldValue, values, errors, touched } = formikProps

    return renderGroupHeader ? (
      <ComboBox
        name={name}
        data={data as ComboboxDataGrouped[]}
        renderGroupHeader={renderGroupHeader}
        value={_get(values, name)}
        error={touched[name] ? (errors[name] as string) : undefined}
        onChange={(newValue) => setFieldValue(name, newValue || (isEmptyNull ? null : ''))}
        {...props}
      />
    ) : (
      <ComboBox
        data={data as BasicComboBoxData[]}
        name={name}
        value={_get(values, name)}
        error={touched[name] ? (errors[name] as string) : undefined}
        onChange={(newValue) => setFieldValue(name, newValue || (isEmptyNull ? null : ''))}
        {...props}
      />
    )
  },
  (
    { formikProps: prevFormikProps, name: prevName, ...prev },
    { formikProps: nextformikProps, name: nextName, ...next }
  ) => {
    return (
      _isEqual(prev, next) &&
      prevName === nextName &&
      prevFormikProps.values[prevName] === nextformikProps.values[nextName] &&
      prevFormikProps.errors[prevName] === nextformikProps.errors[nextName] &&
      prevFormikProps.touched[prevName] === nextformikProps.touched[nextName]
    )
  }
)

ComboBoxField.displayName = 'ComboBoxField'
