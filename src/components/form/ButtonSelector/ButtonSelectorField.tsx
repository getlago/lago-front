import { FormikProps } from 'formik'

import { ButtonSelector, ButtonSelectorProps } from './ButtonSelector'

interface ButtonSelectorFieldProps extends Omit<ButtonSelectorProps, 'onChange'> {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formikProps: FormikProps<any>
}

export const ButtonSelectorField = ({ name, formikProps, ...props }: ButtonSelectorFieldProps) => {
  const { values, touched, errors, setFieldValue } = formikProps

  return (
    <ButtonSelector
      value={values[name]}
      onChange={(newValue) => setFieldValue(name, newValue)}
      error={touched[name] ? (errors[name] as string) : undefined}
      {...props}
    />
  )
}
