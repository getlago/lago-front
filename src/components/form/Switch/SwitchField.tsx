import { FormikProps } from 'formik'

import { Switch, SwitchProps } from './Switch'

interface SwitchFieldFormProps extends SwitchProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const SwitchField = ({ name, formikProps, ...props }: SwitchFieldFormProps) => {
  return (
    <Switch
      name={name}
      checked={!!formikProps.values[name]}
      onChange={(value) => {
        formikProps.setFieldValue(name, value)
      }}
      {...props}
    />
  )
}

SwitchField.displayName = 'SwitchField'
