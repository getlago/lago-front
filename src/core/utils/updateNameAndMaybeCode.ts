import { FormikProps } from 'formik'

const formatCodeFromName = (name: string) => {
  return name.toLowerCase().replace(/ /g, '_')
}

export const updateNameAndMaybeCode = <T extends { name?: string | null; code?: string | null }>({
  name,
  formikProps,
}: {
  name: string
  formikProps: FormikProps<T>
}) => {
  const hasCodeBeenTouched = !!formikProps.touched.code
  const hadInitialCode = !!formikProps.initialValues.code

  formikProps.setValues({
    ...(formikProps.values as T),
    name,
    code: hasCodeBeenTouched || hadInitialCode ? formikProps.values.code : formatCodeFromName(name),
  })
}
