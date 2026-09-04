import { FormikProps } from 'formik'
import _get from 'lodash/get'
import { memo } from 'react'

import { formikFieldPropsAreEqual } from '~/components/form/formikFieldPropsAreEqual'

import { MultipleComboBox } from './MultipleComboBox'
import {
  BasicMultipleComboBoxData,
  MultipleComboBoxDataGrouped,
  MultipleComboBoxProps,
} from './types'

interface MultipleComboBoxFieldProps extends Omit<
  MultipleComboBoxProps,
  'onChange' | 'value' | 'name'
> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  isEmptyNull?: boolean // If false, on field reset the Multiplecombobox will return an empty string
}

export const MultipleComboBoxField = memo(
  ({
    name,
    isEmptyNull = true,
    formikProps,
    renderGroupHeader,
    data,
    ...props
  }: MultipleComboBoxFieldProps) => {
    const { setFieldValue, values, errors, touched } = formikProps

    return renderGroupHeader ? (
      <MultipleComboBox
        name={name}
        data={data as MultipleComboBoxDataGrouped[]}
        renderGroupHeader={renderGroupHeader}
        value={_get(values, name)}
        error={touched[name] ? (errors[name] as string) : undefined}
        onChange={(newValue) => setFieldValue(name, newValue || (isEmptyNull ? null : ''))}
        {...props}
      />
    ) : (
      <MultipleComboBox
        data={data as BasicMultipleComboBoxData[]}
        name={name}
        value={_get(values, name)}
        error={touched[name] ? (errors[name] as string) : undefined}
        onChange={(newValue) => setFieldValue(name, newValue || (isEmptyNull ? null : ''))}
        {...props}
      />
    )
  },
  formikFieldPropsAreEqual,
)

MultipleComboBoxField.displayName = 'MultipleComboBoxField'
