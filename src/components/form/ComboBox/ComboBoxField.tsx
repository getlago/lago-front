import { FormikProps } from 'formik'
import _get from 'lodash/get'
import _isEqual from 'lodash/isEqual'
import { memo } from 'react'

import { ComboBox } from './ComboBox'
import { BasicComboBoxData, ComboboxDataGrouped, ComboBoxProps } from './types'

interface ComboBoxFieldProps extends Omit<ComboBoxProps, 'onChange' | 'value' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  isEmptyNull?: Boolean // If false, on field reset the combobox will return an empty string
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
    { formikProps: nextformikProps, name: nextName, ...next },
  ) => {
    return (
      _isEqual(prev, next) &&
      prevName === nextName &&
      _get(prevFormikProps.values, prevName) === _get(nextformikProps.values, nextName) &&
      _get(prevFormikProps.errors, prevName) === _get(nextformikProps.errors, nextName) &&
      _get(prevFormikProps.touched, prevName) === _get(nextformikProps.touched, nextName)
    )
  },
)

ComboBoxField.displayName = 'ComboBoxField'
