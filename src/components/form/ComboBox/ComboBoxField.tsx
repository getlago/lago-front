import { FormikProps } from 'formik'
import _get from 'lodash/get'

import { ComboBox } from './ComboBox'
import { ComboBoxProps } from './types'

interface ComboBoxFieldProps extends Omit<ComboBoxProps, 'onChange' | 'value' | 'name'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
  onChange?: (value: string) => unknown
}

export const ComboBoxField = ({ name, formikProps, ...props }: ComboBoxFieldProps) => {
  const { setFieldValue, values } = formikProps

  return (
    <ComboBox
      name={name}
      value={_get(values, name)}
      onChange={(newValue) => setFieldValue(name, newValue || null)}
      {...props}
    />
  )
}
